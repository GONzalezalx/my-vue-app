<template>
  <header class="header">
    <div class="container-fluid">
      <div class="row py-2">
        <div class="col-12">
          <div class="d-flex align-items-center">
            <button class="menu-button me-3" @click="toggleMenu">
              <img :src="Menu.img" alt="Menu Icon" class="menu-icon" />
            </button>

            <nav :class="['nav-menu', {'d-none': !isMenuVisible}]">
              <div class="menu-container">
                <router-link to="/"  class="nav-link active" > general</router-link>

                <!-- show the protected links only when authenticated -->
                <template v-if="isAuthenticated">
                  <router-link to="/informacionPersonal" class="nav-link">información personal</router-link>
                  <router-link to="/torneosYsalidas" class="nav-link">Torneos y salidas</router-link>
                  <router-link to="/uniformes" class="nav-link">uniformes</router-link>
                  <router-link to="/pagosMensuales" class="nav-link">pagos mensuales</router-link>
                  <router-link to="/categorias" class="nav-link">Categorias</router-link>
                </template>

                <!-- Login / Logout action on the right -->
                <div class="ms-auto d-flex align-items-center">
                  <button v-if="!isAuthenticated" class="nav-link action-btn" @click="goLogin">Login</button>
                  <button v-else class="nav-link action-btn" @click="doLogout">Logout</button>
                </div>

              </div>
            </nav>
          </div>
        </div>
      </div>
      <div class="row justify-content-center mt-2">
        <div class="col-auto">
          <img :src="Logo.img" alt="Logo" class="logo" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const Logo = { img: "logo.png" };
const Menu = { img: "menu.png" };
const isMenuVisible = ref(true);

function toggleMenu() {
  isMenuVisible.value = !isMenuVisible.value;
}

// auth
const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);
const router = useRouter();
function goLogin() {
  router.push({ name: 'Login' });
}
async function doLogout() {
  try {
    await auth.logout();
    router.push('/');
  } catch (e) {
    // ignore
  }
}
</script>

<script>
export default {
  name: "HeaderComponent",
};
</script>

<style scoped>
.header {
  background: #DDDFF1;;
  width: 100%;
}

.menu-button {
  background: none;
  border: 1px solid #6c757d;
  border-radius: 4px;
  padding: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon {
  height: 24px;
  width: 24px;
}

.nav-menu {
  flex: 1;
}

.menu-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  gap: 0;
}

.nav-link {
  text-decoration: none;
  color: #212529;
  transition: color 0.3s ease;
  font-size: 0.85rem;
  white-space: nowrap;
  text-align: center;
  padding: 2px 10px;
  border-radius: 0;
  background: transparent;
  margin: 0;
  border: none;
}

.nav-link.active, .nav-link.selected {
  background: transparent;
  border-radius: 0;
}

.nav-link:hover {
  color: #0056b3;
  background-color: #e9ecef;
  border-radius: 8px;
}

.logo {
  height: 100px;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

@media (max-width: 991px) {
  .nav-link {
    font-size: 0.7rem;
    padding: 2px 6px;
  }
}

@media (max-width: 576px) {
  .menu-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(0, 1fr);
    gap: 2px;
    justify-items: center;
    align-items: center;
    width: 100%;
  }
  .nav-link {
    font-size: 0.65rem;
    padding: 2px 3px;
    width: 100%;
    margin: 0;
    border-radius: 6px;
  }
}
</style>