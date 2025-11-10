<script>
export default {
  name: "UniformesComponent",
};
</script>

<script setup>
import HeaderComponent from './cabecera.vue';
import UniformeJComponent from './subcomponents/uniformeJ.vue';
import UniformePComponent from './subcomponents/uniformeP.vue';
import UniformeBSPComponent from './subcomponents/uniformeBSP.vue';
import { ref } from 'vue';
import '../stylecomponents.css';

const currentSection = ref('J');

function showSection(section) {
  currentSection.value = section;
}
</script>

<template>
  <HeaderComponent />
  <div class="row my-3">
    <div class="lg-12">
      <div id="cabeza">
        <h1 class="text-center text-white">Uniformes</h1>
        <div class="general-buttons">
          <button class="btn-general" @click="showSection('J')">Uniformes de Juego</button>
          <button class="btn-general" @click="showSection('P')">Camisetas de Presentación</button>
          <button class="btn-general" @click="showSection('B')">Buso y Sudadera de Presentación</button>
        </div>
        <div class="table-container">
          <UniformeJComponent v-if="currentSection === 'J'" />
          <UniformePComponent v-if="currentSection === 'P'" />
          <UniformeBSPComponent v-if="currentSection === 'B'" />
        </div>
      </div>
    </div>
  </div>
</template>
