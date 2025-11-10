import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/bootstrap.min.css'
import './assets/js/bootstrap.bundle.min.js'
import router from './router.js'
import './style.css'
import { createPinia } from 'pinia';

const pinia = createPinia();

const app = createApp(App)

app.use(pinia)
app.use(router).mount("#app")