<script>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { nombres, categorias, acudientes } from '../../stores/acudienteStore.js';

export default {
  name: "GeneralIPComponent",
  props: {
    reset: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const currentColumnSection = ref(0);
    const sections = [
      // include 'categoria' so the table shows the player's category as well
      ['nombre', 'categoria', 'fecha de nacimiento', 'cumpleaños', 'número de documento'],
      ['acudiente', 'estrato', 'jornada', 'sede']
    ];

    const isMobileOrTablet = ref(window.innerWidth <= 1266);

    function handleResize() {
      isMobileOrTablet.value = window.innerWidth <= 1266;
    }

    function getColumnsToDisplay() {
      const totalColumns = sections.flat().length; // Consider all columns across all rows
      if (!isMobileOrTablet.value) return totalColumns; // Show all columns on larger screens
      // On mobile we show a whole section at a time, so number of columns is determined by that section
      const sec = sections[currentColumnSection.value] || [];
      return sec.length || 1;
    }

    function nextColumnSection() {
      // advance to next section (wrap)
      currentColumnSection.value = (currentColumnSection.value + 1) % sections.length;
    }

    function prevColumnSection() {
      // go to previous section (wrap)
      currentColumnSection.value = (currentColumnSection.value - 1 + sections.length) % sections.length;
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

    // Compute the flattened list of column labels
    const cols = computed(() => sections.flat());

    // columns currently visible (respects mobile slice)
    const columnsToShow = computed(() => {
      if (!isMobileOrTablet.value) return cols.value;
      // show the current section's columns on mobile
      return sections[currentColumnSection.value] || [];
    });

    // Helper to read persisted informacionJugador.tableData and use as source for extra fields
    function loadPersistedTable() {
      try {
        const raw = localStorage.getItem('informacionJugador.tableData');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        return parsed;
      } catch (e) {
        return null;
      }
    }

    // Helper to pick a value from a persisted row using several possible keys
    function pickField(obj, candidates) {
      if (!obj || typeof obj !== 'object') return '';
      for (const k of candidates) {
        if (k in obj && obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
      }
      return '';
    }

    // Build rows: one row per index in shared nombres where a non-empty nombre exists
    const displayedRows = computed(() => {
      try {
        const namesArr = (nombres && nombres.value) ? nombres.value : [];
        const catsArr = (categorias && categorias.value) ? categorias.value : [];
        const acudientesArr = (acudientes && acudientes.value) ? acudientes.value : [];
        const persisted = loadPersistedTable();

        const res = [];
        for (let i = 0; i < namesArr.length; i++) {
          const rawName = namesArr[i] || '';
          const name = String(rawName || '').trim();
          if (!name) continue;

          const persistedRow = (persisted && persisted[i]) ? persisted[i] : {};

          const fecha = pickField(persistedRow, ['fecha', 'fecha de nacimiento', 'fecha_nacimiento']);
          const cumple = pickField(persistedRow, ['cumpleanos', 'cumpleaños', 'cumple']);
          const documento = pickField(persistedRow, ['numero_de_documento', 'número de documento', 'documento', 'numeroDocumento']);
          const acud = String(acudientesArr[i] || pickField(persistedRow, ['acudiente', 'representante']) || '').trim();
          const estrato = pickField(persistedRow, ['estrato']);
          const jornada = pickField(persistedRow, ['jornada']);
          const sede = pickField(persistedRow, ['sede']);

          res.push({
            idx: i,
            nombre: name,
            'fecha de nacimiento': fecha,
            'cumpleaños': cumple,
            'número de documento': documento,
            'acudiente': acud,
            'estrato': estrato,
            'jornada': jornada,
            'sede': sede,
            categoria: catsArr[i] || ''
          });
        }
        return res;
      } catch (e) {
        return [];
      }
    });

    return {
      currentColumnSection,
      sections,
      nextColumnSection,
      prevColumnSection,
      isMobileOrTablet,
      getColumnsToDisplay,
      columnsToShow,
      displayedRows
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
        <!-- invisible placeholder to preserve right alignment and exact sizing as informacionJugador -->
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
        <tr v-for="row in displayedRows" :key="`row-${row.idx}`">
          <td><span class="user-icon">👤</span></td>
          <td v-for="col in isMobileOrTablet ? sections.flat().slice(currentColumnSection, currentColumnSection + getColumnsToDisplay()) : sections.flat()" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
