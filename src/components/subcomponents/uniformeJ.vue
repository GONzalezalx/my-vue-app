<script>
import { ref, onMounted, onUpdated, onUnmounted, watch } from 'vue';
import { nombres } from '../../stores/acudienteStore.js';

export default {
  name: "InformacionJugadorComponent",
  props: {
    reset: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const tableData = ref([]);

    // Load saved tableData from localStorage if present
    try {
      const saved = localStorage.getItem('uniformeJ.tableData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          tableData.value = parsed.map(r => ({ nombre: r.nombre || '', nombrec: r.nombrec || '', tallac: r.tallac || '', tallap: r.tallap || '', numero: r.numero || '', color: r.color || '' }));
        }
      }
    } catch (e) { void 0; }

    const currentColumnSection = ref(0);
    const sections = [
      ['nombre', 'nombrec', 'tallac'],
      ['tallap', 'numero', 'color']
    ];

    const columnLabels = {
      nombre: 'Nombre',
      nombrec: 'Nombre camiseta',
      tallac: 'Talla camiseta',
      tallap: 'Talla pantaloneta',
      numero: 'Número',
      color: 'Color'
    };

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
      if (newVal) currentColumnSection.value = 0;
    });

    function autoResizeTextarea(event) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    function applyAutoResize() {
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    }

    onMounted(() => {
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => {
        textarea.addEventListener('input', autoResizeTextarea);
      });
      applyAutoResize();

      handleResize(); // Ensure initial check
      window.addEventListener('resize', handleResize);
      window.addEventListener('resize', applyAutoResize); // Recalculate height on window resize
    });

    onUpdated(() => {
      applyAutoResize();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', applyAutoResize);
    });

    // Persist changes to localStorage
    watch(tableData, (val) => {
      try { localStorage.setItem('uniformeJ.tableData', JSON.stringify(val)); } catch (e) { void 0; }
    }, { deep: true });

    // Functions to add/remove rows
    function makeDefaultRow() {
      return { nombre: '', nombrec: '', tallac: '', tallap: '', numero: '', color: '' };
    }

    function addRow() {
      const idx = tableData.value.length;
      const newRow = makeDefaultRow();
      // Prefill nombre from shared nombres store if present (like informacionJugador)
      try {
        if (nombres && typeof nombres.value[idx] !== 'undefined' && nombres.value[idx] !== '') {
          newRow.nombre = nombres.value[idx];
        }
      } catch (e) { void 0; }

      tableData.value.push(newRow);
      // ensure localStorage placeholders exist if needed
      try { localStorage.setItem('uniformeJ.tableData', JSON.stringify(tableData.value)); } catch (e) { void 0; }
      requestAnimationFrame(() => applyAutoResize());
    }

    function removeRow(index) {
      if (index < 0 || index >= tableData.value.length) return;
      tableData.value.splice(index, 1);
      try { localStorage.setItem('uniformeJ.tableData', JSON.stringify(tableData.value)); } catch (e) { void 0; }
      requestAnimationFrame(() => applyAutoResize());
    }

    return {
      tableData,
      currentColumnSection,
      sections,
      nextColumnSection,
      prevColumnSection,
      isMobileOrTablet,
      getColumnsToDisplay,
      addRow,
      removeRow,
      columnLabels,
      nombres
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
      <!-- removed top add button to place it above the Actions column in the table header -->
    </div>
    <table class="info-table">
      <thead>
        <tr>
          <th></th>
          <th v-for="col in (isMobileOrTablet ? sections.flat().slice(currentColumnSection, currentColumnSection + getColumnsToDisplay()) : sections.flat())" :key="col">{{ columnLabels[col] }}</th>
          <th class="actions-col">
            <div class="add-action-th">
              <button @click="addRow" class="action-btn add-btn">Agregar</button>
            </div>
            <div>Acciones</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in tableData" :key="index">
          <td><span class="user-icon">👤</span></td>
          <td v-for="col in (isMobileOrTablet ? sections.flat().slice(currentColumnSection, currentColumnSection + getColumnsToDisplay()) : sections.flat())" :key="col">
            <textarea v-if="col === 'nombre'" :value="nombres[index] || ''" readonly class="editable-cell read-only"></textarea>
            <textarea v-else v-model="row[col]" class="editable-cell"></textarea>
          </td>
          <td>
            <button @click="removeRow(index)" class="remove-row-btn">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
