import { createRouter, createWebHistory } from 'vue-router'
import GeneralComponent from './components/general.vue'
import InformacionPersonalComponent from './components/informacionPersonal.vue'
import TorneosYsalidasComponent from './components/torneosYsalidas.vue'
import UniformesComponent from './components/uniformes.vue'
import CategoriasComponent from './components/categorias.vue'
import PagosMensualesComponent from './components/pagosMensuales.vue'
import { useAuthStore } from './stores/auth';
import Login from './components/Login.vue';


const router = createRouter({
    history: createWebHistory('#'),
    routes: [
        { path: '/', component: GeneralComponent},
        { path: '/informacionPersonal', component: InformacionPersonalComponent},
        { path: '/torneosYsalidas', component: TorneosYsalidasComponent, meta: { requiresAuth: true }},
        { path: '/uniformes', component: UniformesComponent, meta: { requiresAuth: true }},
        { path: '/categorias', component: CategoriasComponent, meta: { requiresAuth: true }},
         { path: '/pagosMensuales', component: PagosMensualesComponent, meta: { requiresAuth: true }},
         { path: '/login', component: Login, name: 'Login' },
    ]
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.fetchMe();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return next({ name: 'Login' });
  next();
});

export default router;