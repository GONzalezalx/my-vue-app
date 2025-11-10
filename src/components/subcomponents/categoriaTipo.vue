<script setup>
import { ref, computed } from 'vue';
const categories = ['ALEVIN', 'BENJAMIN', 'PRE-MINI', 'MINI', 'INFANTIL', 'U 15', 'U 16', 'U 17', 'U 18', 'U 19', 'U 20', 'U 21', 'MAYORES'];
const index = ref(0);
const currentCategory = computed(() => categories[index.value]);
function prev() { index.value = (index.value - 1 + categories.length) % categories.length; }
function next() { index.value = (index.value + 1) % categories.length; }
</script>

<script>
export default {
  name: "CategoriaTipoComponent",
};
</script>

<template>
  <div class="category-controls" style="text-align:center; margin:0.5rem 0;">
    <button class="arrow-btn" @click="prev">«</button>
    <div class="category-name" style="display:inline-block; margin:0 0.5rem; color:#fff;">
      <div style="font-weight:700;">{{ currentCategory }}</div>
    </div>
    <button class="arrow-btn" @click="next">»</button>
  </div>
  <!-- divs por categoría (se muestran según la seleccion) -->
  <div v-if="currentCategory === 'ALEVIN'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'BENJAMIN'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'PRE-MINI'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'MINI'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'INFANTIL'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 15'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 16'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 17'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 18'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 19'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 20'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'U 21'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>
  <div v-if="currentCategory === 'MAYORES'" style="text-align:center; color:#fff; margin-top:6px;">
  </div>

</template>

<style scoped>

.arrow-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 1.05rem;
}

.arrow-btn:hover {
    background: rgba(255, 255, 255, 0.12);
}

.category-name div:first-child {
    font-size: 0.85rem;
}

.category-name div:last-child {
    font-weight: 700;
}
</style>