import { defineStore } from 'pinia';
import api from '@/api/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false }),
  getters: { isAuthenticated: (state) => !!state.user },
  actions: {
    async fetchMe() {
      try {
        const { data } = await api.get('/api/auth/me/');
        this.user = data;
      } catch (e) {
        this.user = null;
      } finally {
        this.ready = true;
      }
    },
    async login(credentials) {
      try {
        await api.post('/api/auth/login/', credentials);
        await this.fetchMe();
        // store credentials securely for offline
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.secure && window.electronAPI.secure.setCredential) {
          await window.electronAPI.secure.setCredential('my-vue-app', credentials.username || credentials.email, credentials.password);
        }
      } catch (e) {
        // If backend unreachable, attempt offline login using keytar
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.secure && window.electronAPI.secure.getCredential) {
          const stored = await window.electronAPI.secure.getCredential('my-vue-app', credentials.username || credentials.email);
          if (stored && stored === credentials.password) {
            // fake a user object from stored profile
            const profile = (window.electronAPI.localStore && await window.electronAPI.localStore.get('user_profile')) || { username: credentials.username || credentials.email };
            this.user = profile;
            this.ready = true;
            return;
          }
        }
        throw e; // rethrow if cannot login offline
      }
    },
    async logout() {
      try {
        await api.post('/api/auth/logout/');
      } catch (e) {
        // ignore
      }
      // remove local credentials
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.secure && window.electronAPI.secure.deleteCredential) {
        await window.electronAPI.secure.deleteCredential('my-vue-app', this.user ? this.user.username : '');
      }
      this.user = null;
    }
  }
});
