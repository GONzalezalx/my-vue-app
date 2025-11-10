import { defineStore } from 'pinia';
import api from '@/api/axios';

export const usePlayersStore = defineStore('players', {
  state: () => ({ items: [], categories: [], acudientes: [], loading: false }),
  actions: {
    async fetchPlayers() {
      this.loading = true;
      try {
        const { data } = await api.get('/api/players/');
        this.items = data;
        return data;
      } finally {
        this.loading = false;
      }
    },
    async createPlayer(payload) {
      const { data } = await api.post('/api/players/', payload);
      this.items.unshift(data);
      return data;
    },
    async updatePlayer(id, payload) {
      const { data } = await api.patch(`/api/players/${id}/`, payload);
      const idx = this.items.findIndex(i => i.id === data.id);
      if (idx !== -1) this.items.splice(idx, 1, data);
      return data;
    },
    async deletePlayer(id) {
      await api.delete(`/api/players/${id}/`);
      this.items = this.items.filter(i => i.id !== id);
    },

    // --- category endpoints
    async fetchCategories() {
      this.loading = true;
      try {
        const { data } = await api.get('/api/categories/');
        this.categories = data;
        return data;
      } finally {
        this.loading = false;
      }
    },
    async createCategory(payload) {
      // payload: { name: 'Categoria X' }
      const { data } = await api.post('/api/categories/', payload);
      this.categories.push(data);
      return data;
    },

    // --- acudiente endpoints
    async fetchAcudientes() {
      this.loading = true;
      try {
        const { data } = await api.get('/api/acudientes/');
        this.acudientes = data;
        return data;
      } finally { this.loading = false; }
    },
    async createAcudiente(payload) {
      const { data } = await api.post('/api/acudientes/', payload);
      this.acudientes.unshift(data);
      return data;
    },
    async updateAcudiente(id, payload) {
      const { data } = await api.patch(`/api/acudientes/${id}/`, payload);
      const idx = this.acudientes.findIndex(i => i.id === data.id);
      if (idx !== -1) this.acudientes.splice(idx, 1, data);
      return data;
    },
    async deleteAcudiente(id) {
      await api.delete(`/api/acudientes/${id}/`);
      this.acudientes = this.acudientes.filter(i => i.id !== id);
    }
  }
});
