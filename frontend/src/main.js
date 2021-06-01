import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import KeycloakPlugin from "./plugins/keycloak";

Vue.config.productionTip = false
Vue.use(KeycloakPlugin, { store, router });

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

setTimeout(function(){ 
  // Electron messes up the app:// url after 302 redirect from Keycloak
  if (location.href.startsWith("app://./app:/")) {
    const newUrl = location.href.replace("app://./app:/","app://./");
    history.replaceState({}, null, newUrl);
  }
}, 1000);
