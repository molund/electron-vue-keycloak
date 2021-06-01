import djangoAPI from "@/plugins/axios";

const data = {
  // null or promise
  authLoading: null,
  keycloakReady: false,
  isAuthenticated: null,
  // Keycloak user details
  keycloakAccessToken: null,
  keycloakIdToken: null,
  keycloakRefreshToken: null,
  keycloakUserInfo: null,

  // Backend permissions
  userId: null,
  canAccessAllAgencies: null,
  accessibleAgencyIds: [],
  // array of { action, subject }
  permissions: [],
  permissionsLoaded: false,
  // null or promise
  permissionsLoading: null
};

const getters = {
  isAuthenticated(state) {
    return state.isAuthenticated;
  },

  keycloakReady(state) {
    return state.keycloakReady;
  },

  keycloakAccessToken(state) {
    return state.keycloakAccessToken;
  },

  keycloakIdToken(state) {
    return state.keycloakIdToken;
  },

  keycloakRefreshToken(state) {
    return state.keycloakRefreshToken;
  },

  keycloakUserInfo(state) {
    return state.keycloakUserInfo;
  },

  userEmail(state) {
    if (!state.keycloakUserInfo) {
      return "";
    }
    return state.keycloakUserInfo.email;
  },

  userName(state) {
    if (!state.keycloakUserInfo) {
      return "";
    }
    return state.keycloakUserInfo.name;
  },

  authLoading(state) {
    return state.authLoading;
  },
  userId(state) {
    return state.userId;
  },
  canAccessAllAgencies(state) {
    return state.canAccessAllAgencies;
  },
  accessibleAgencyIds(state) {
    return state.accessibleAgencyIds;
  },
  permissions(state) {
    return state.permissions;
  },
  permissionsLoading(state) {
    return state.permissionsLoading;
  },
  permissionsLoaded(state) {
    return state.permissionsLoaded;
  }
};

const mutations = {
  setKeycloakReady(state, ready) {
    state.keycloakReady = ready;
  },
  setKeycloakAccessToken(state, token) {
    state.keycloakAccessToken = token;
  },
  setKeycloakIdToken(state, token) {
    state.keycloakIdToken = token;
  },
  setKeycloakRefreshToken(state, token) {
    state.keycloakRefreshToken = token;
  },
  setKeycloakUserInfo(state, payload) {
    state.keycloakUserInfo = payload;
  },
  setIsAuthenticated(state, payload) {
    state.isAuthenticated = payload;
  },
  setAuthLoading(state, payload) {
    state.setAuthLoading = payload;
  },
  setUserId(state, payload) {
    state.userId = payload;
  },
  setPermissions(
    state,
    { canAccessAllAgencies, accessibleAgencyIds, permissions }
  ) {
    state.canAccessAllAgencies = canAccessAllAgencies;
    state.accessibleAgencyIds = accessibleAgencyIds;
    state.permissions = permissions;
    state.permissionsLoaded = true;
    state.permissionsLoading = null;
  },
  clearPermissions(state) {
    state.canAccessAllAgencies = null;
    state.accessibleAgencyIds = [];
    state.permissions = [];
    state.permissionsLoading = null;
    state.permissionsLoaded = false;
  },
  setPermissionsLoading(state, permissionsLoading) {
    state.permissionsLoading = permissionsLoading;
  }
};

const actions = {
  async loadPermissions({ state, commit }) {
    if (state.permissionsLoading) {
      return state.permissionsLoading;
    }

    const permissionsLoading = djangoAPI.get("/api/account/permissions");
    commit("setPermissionsLoading", permissionsLoading);

    try {
      const response = await permissionsLoading;
      commit("setUserId", response.data.user_id);
      commit("setPermissions", {
        permissions: response.data.permissions,
        canAccessAllAgencies: response.data.can_access_all_agencies,
        accessibleAgencyIds: response.data.agency_ids
      });

      return response;
    } catch (err) {
      commit("setPermissionsLoading", null);
      throw err;
    }
  }
};

export default {
  state: data,
  getters,
  mutations,
  actions
};
