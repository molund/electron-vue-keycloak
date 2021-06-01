import Keycloak from "keycloak-js";

const KEYCLOAK_SERVER_OPTIONS = {
  url: process.env.VUE_APP_KEYCLOAK_URL,
  realm: process.env.VUE_APP_KEYCLOAK_REALM,
  clientId: process.env.VUE_APP_KEYCLOAK_CLIENT_ID
};
const KEYCLOAK_INIT_OPTIONS = {
  // Enable logging in some envs (dev)
  enableLogging: Boolean(process.env.VUE_APP_KEYCLOAK_ENABLE_LOGGING),
  // Skip timed iframe requests to see if we're still logged in; we have our own
  // timer, and these result in warnings in newer browsers
  checkLoginIframe: false,
  // Hosted iframe content for passing SSO data around
  silentCheckSsoRedirectUri: `${window.location.origin}/keycloak-check-sso.html`,
  // Turn on PKCE
  pkceMethod: "S256",
  // "check-sso" will log us in silently, if the user is already authenticated
  onLoad: "check-sso"
};

// Check for token expiry ever 10s
const KEYCLOAK_TOKEN_REFRESH_CHECK_INTERVAL = 10000;
// If our silent access check fails after 10s, redirect to keycloak
const KEYCLOAK_LOGIN_TIMEOUT = 10000;

// Global installed switch
let installed = false;

export default {
  install(Vue, { store, router }) {
    if (installed) {
      return;
    }
    installed = true;

    let refreshInterval = null;
    const keycloak = Keycloak(KEYCLOAK_SERVER_OPTIONS);

    /**
     * Returns the absolute URL given a Vue Router route object.
     * @param {Object} route - Vue Router route object
     * @returns {string} The absolute URL of the route's path
     */
    function uriFromRoute(route) {
      return `${window.location.origin}${route.fullPath}`;
    }

    function updateKeycloakData(isAuthenticated = false) {
      store.commit("user/setIsAuthenticated", isAuthenticated);
      store.commit("user/setKeycloakAccessToken", keycloak.token);
      store.commit("user/setKeycloakUserInfo", keycloak.tokenParsed);
      store.commit("user/setKeycloakIdToken", keycloak.idToken);
      store.commit("user/setKeycloakRefreshToken", keycloak.refreshToken);
    }

    keycloak.onReady = isAuthenticated => {
      updateKeycloakData(isAuthenticated);
      store.commit("user/setKeycloakReady", true);
    };

    keycloak.onAuthSuccess = isAuthenticated => {
      updateKeycloakData(isAuthenticated);
      refreshInterval = setInterval(
        () => keycloak.updateToken(60),
        KEYCLOAK_TOKEN_REFRESH_CHECK_INTERVAL
      );
    };

    keycloak.onAuthRefreshSuccess = () => updateKeycloakData(true);
    keycloak.onAuthRefreshError = () => {
      updateKeycloakData(false);
      keycloak.login({ redirectUri: uriFromRoute(router.currentRoute) });
    };
    keycloak.onAuthLogout = () => {
      updateKeycloakData(false);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };
    keycloak.onAuthError = () => {
      updateKeycloakData(false);
      keycloak.login({ redirectUri: uriFromRoute(router.currentRoute) });
    };
    keycloak.onTokenExpired = () => {
      // We shouldn't get to tokenExpired because to the timer, but if we do,
      // try to update.
      keycloak.updateToken(60);
    };

    // eslint-disable-next-line no-param-reassign
    const $keycloak = {
      /**
       * @param {Object} options - Login options. See https://www.keycloak.org/docs/latest/securing_apps/index.html#login-options.
       * @returns {Promise} A promise that resolves once Keycloak adapter is initialized.
       */
      async login(options) {
        // If already loading, then just return the existing promise
        if (store.getters["user/authLoading"]) {
          return store.getters["user/authLoading"];
        }

        // First, try "check-sso", which does some iframe request ...stuff.
        // See: https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter
        // If we're already logged in, it won't redirect the user.
        const initPromise = keycloak.init({ ...KEYCLOAK_INIT_OPTIONS });
        // Update our global is auth loading hook
        store.commit("user/setAuthLoading", initPromise);

        // Force redirect to login page. If adapter initialization fails,
        // the redirect will hand off error handling to Keycloak rather
        // silently failing with no indication of an error.
        const loginTimer = setTimeout(() => {
          // eslint-disable-next-line no-console
          console.warn("Keycloak SSO login timed out. Redirecting.");
          keycloak.login(options);
        }, KEYCLOAK_LOGIN_TIMEOUT);

        // Wait for keycloak
        await initPromise;

        clearInterval(loginTimer);

        // If we're not authenticated, login is required
        if (!store.getters["user/isAuthenticated"]) {
          await keycloak.login(options);
        }

        return this.initPromise;
      },
      logout(route) {
        let redirectUri = window.location.origin;
        if (route) {
          redirectUri = `${redirectUri}${route.fullPath}`;
        } else {
          redirectUri = `${redirectUri}/`;
        }

        return keycloak.logout({ redirectUri });
      },
      refresh() {
        return keycloak.updateToken(-1);
      },
      register(redirectUri) {
        keycloak.init({ ...KEYCLOAK_INIT_OPTIONS });
        return keycloak.register({ redirectUri });
      }
    };

    // Make custom keycloak adapter available on the Vue instance
    // through Vue.$keycloak.
    // eslint-disable-next-line no-param-reassign
    Vue.$keycloak = $keycloak;
    Object.defineProperties(Vue.prototype, {
      $keycloak: {
        get() {
          return $keycloak;
        }
      }
    });
  }
};
