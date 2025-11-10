<script>
export default {
  name: "GeneralComponent",
};
</script>

<script setup>
import HeaderComponent from './cabecera.vue';
import GeneralIPComponent from './subcomponents/generalIP.vue';
import GeneralTComponent from './subcomponents/generalT.vue';
import GeneralUComponent from './subcomponents/generalU.vue';
import { ref } from 'vue';
import '../stylecomponents.css';

const currentSection = ref('IP');

function showSection(section) {
  currentSection.value = section;
}
</script>

<template>

  <HeaderComponent />

  <div class="row my-3">
    <div class="lg-12">
      <div id="cabeza">

        <h1 class="text-center text-white">general</h1>

        <div class="general-buttons" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1rem;">
          <button class="btn-general" @click="showSection('IP')">información personal</button>
          <button class="btn-general" @click="showSection('U')">información de uniforme</button>
          <button class="btn-general" @click="showSection('T')">información de torneos</button>
        </div>

        <div class="table-container">
          <GeneralIPComponent v-if="currentSection == 'IP'"/>
          <GeneralUComponent v-if="currentSection === 'U'" />
          <GeneralTComponent v-if="currentSection === 'T'" />
        </div>
      </div>
    </div>
  </div>
</template>

