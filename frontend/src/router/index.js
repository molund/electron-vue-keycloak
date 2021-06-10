import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import store from "@/store";

Vue.use(VueRouter)

const routes = [
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    meta: { authenticated: true }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    alias: '/index.html',
    meta: { authenticated: true }
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

const authGuard = async (to, from, next) => {
  const authRequired = to.matched.some(
    record => record.meta.authenticated || record.meta.permissions
  );

  if (!authRequired) {
    next();
    return;
  }

  if (!store.getters["user/isAuthenticated"]) {
    await Vue.$keycloak.login({
      redirectUri: `${window.location.origin}${to.fullPath}`
    });
  }

  next();
};

router.onReady(() => { 
  // Electron messes up the app:// url after 302 redirect from Keycloak
  if (location.href.startsWith("app://./app:/")) {
    const tidyHref = location.href.replace("app://./app:/", "app://./");
    history.replaceState(window.history.state, null, tidyHref);
  }
})

router.beforeEach(authGuard);

export default router
