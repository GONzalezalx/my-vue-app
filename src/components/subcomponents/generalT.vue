<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';

export default {
  name: "GeneralUComponent",
  props: {
    reset: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const currentColumnSection = ref(0);
    const sections = [
      ['nombre', 'torneos'],
      ['horario', 'categoría']
    ];

    const isMobileOrTablet = ref(window.innerWidth <= 1266);

    function handleResize() {
      isMobileOrTablet.value = window.innerWidth <= 1266;
    }

    function getColumnsToDisplay() {
      const totalColumns = sections.flat().length; // Consider all columns across all rows
      if (!isMobileOrTablet.value) return totalColumns; // Show all columns on larger screens
      if (totalColumns === 4) return 2;
      if (totalColumns === 6) return 3;
      if (totalColumns === 8) return 4;
      return totalColumns; // Default to all columns
    }

    function nextColumnSection() {
      const columnsToDisplay = getColumnsToDisplay();
      currentColumnSection.value = (currentColumnSection.value + columnsToDisplay) % sections.flat().length;
    }

    function prevColumnSection() {
      const columnsToDisplay = getColumnsToDisplay();
      currentColumnSection.value = (currentColumnSection.value - columnsToDisplay + sections.flat().length) % sections.flat().length;
    }

    watch(() => props.reset, (newVal) => {
      if (newVal) {
        currentColumnSection.value = 0; // Reset to the first section
      }
    });

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });

    return {
      currentColumnSection,
      sections,
      nextColumnSection,
      prevColumnSection,
      isMobileOrTablet,
      getColumnsToDisplay
    };
  }
};
</script>

<template>
  <div id="cuerpo">
    <div class="table-top-actions">
      <div v-if="isMobileOrTablet" class="arrow-btn-container">
        <button class="arrow-btn" @click="prevColumnSection">Anterior</button>
        <button class="arrow-btn" @click="nextColumnSection">Siguiente</button>
      </div>
      <div class="add-action-wrap">
        <button class="arrow-btn add-btn" style="visibility:hidden; pointer-events:none;">Agregar</button>
      </div>
    </div>
    <table class="info-table">
      <thead>
        <tr>
          <th></th>
          <th v-for="col in isMobileOrTablet ? sections.flat().slice(currentColumnSection, currentColumnSection + getColumnsToDisplay()) : sections.flat()" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in 4" :key="`row-${rowIndex}`">
          <td><span class="user-icon">👤</span></td>
          <td v-for="col in isMobileOrTablet ? sections.flat().slice(currentColumnSection, currentColumnSection + getColumnsToDisplay()) : sections.flat()" :key="col">{{ col }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
