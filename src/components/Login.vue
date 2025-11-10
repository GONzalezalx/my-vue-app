<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label>Username</label>
        <input v-model="username" />
      </div>
      <div>
        <label>Password</label>
        <input type="password" v-model="password" />
      </div>
      <div>
        <button type="submit">Login</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="demo">Demo: demo / demo123</div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginView',
  setup() {
    const username = ref('');
    const password = ref('');
    const error = ref(null);
    const auth = useAuthStore();
    const router = useRouter();

    async function onSubmit() {
      error.value = null;
      try {
        await auth.login({ username: username.value, password: password.value });
        router.push('/');
      } catch (e) {
        // try forced local fallback
        try {
          const res = await window.electronAPI.apiRequest({ method: 'POST', url: '/api/auth/login/', body: { username: username.value, password: password.value } });
          // if remote failed, our apiRequest will have ok:false
          if (res && res.ok === false) {
            // call local login helper
            const localRes = await (await import('@/api/axios')).default.post('/api/auth/login/', { username: username.value, password: password.value });
            if (localRes && localRes.status === 200) {
              router.push('/');
              return;
            }
          }
        } catch (e2) {
          // ignore
        }
        error.value = 'Login failed';
      }
    }

    return { username, password, error, onSubmit };
  }
}
</script>

<style scoped>
.login-container { max-width: 400px; margin: 2rem auto; }
.error { color: red; margin-top: 0.5rem; }
.demo { margin-top: 0.5rem; color: #666; }
</style>
