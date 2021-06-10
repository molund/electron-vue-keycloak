import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import store from "@/store";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    alias: '',
    meta: { authenticated: true }
  },
]

const router = new VueRouter({
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
      redirectUri: `${window.location.origin}/index.html`
    });
  }

  next();
};


router.beforeEach(authGuard);

export default router
