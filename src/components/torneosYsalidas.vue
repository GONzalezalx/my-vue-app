<script>
export default {
  name: "TorneosYsalidasComponent",
};
</script>

<script setup>
import HeaderComponent from './cabecera.vue';
import '../stylecomponents.css';
import { ref, onMounted, onUpdated, onUnmounted, watch } from 'vue';
import { categorias, nombres } from '../stores/acudienteStore.js';

const tableData = ref([]);

// Load saved data
try {
  const saved = localStorage.getItem('torneosYsalidas.tableData');
  if (saved) tableData.value = JSON.parse(saved);
} catch (e) { void 0; }

// Load saved nombres from localStorage if present (keep same key used elsewhere)
try {
  const savedNombres = localStorage.getItem('informacionJugador.nombres');
  if (savedNombres) nombres.value = JSON.parse(savedNombres);
} catch (e) { void 0; }

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

const currentSection = ref(0);
const sections = [
  ['nombre', 'torneo'],
  ['horario', 'categoria']
];

const columnLabels = {
  nombre: 'Nombre',
  torneo: 'Torneo',
  horario: 'Horario',
  categoria: 'Categoria'
};

const isMobileOrTablet = ref(window.innerWidth <= 1266);
function handleResize() { isMobileOrTablet.value = window.innerWidth <= 1266; }

function getColumnsToDisplay() {
  const totalColumns = sections.flat().length;
  if (!isMobileOrTablet.value) return totalColumns;
  // show 2 at a time on narrow screens
  return Math.min(2, totalColumns);
}

function nextSection() {
  const columnsToDisplay = getColumnsToDisplay();
  currentSection.value = (currentSection.value + columnsToDisplay) % sections.flat().length;
}

function prevSection() {
  const columnsToDisplay = getColumnsToDisplay();
  currentSection.value = (currentSection.value - columnsToDisplay + sections.flat().length) % sections.flat().length;
}

function makeDefaultRow() {
  return { torneo: '', horario: '', categoria: '' };
}

function addRow() {
  const idx = tableData.value.length;
  const newRow = makeDefaultRow();
  try {
    if (nombres && typeof nombres.value[idx] !== 'undefined' && nombres.value[idx] !== '') {
      // nombre is displayed from shared `nombres`, not stored in this row
    }
    if (categorias && typeof categorias.value[idx] !== 'undefined' && categorias.value[idx] !== '') {
      newRow.categoria = categorias.value[idx];
    }
  } catch (e) { void 0; }

  tableData.value.push(newRow);

  // Ensure shared arrays have placeholders if missing
  try {
    if (!nombres.value) nombres.value = [];
    if (typeof nombres.value[idx] === 'undefined') nombres.value.push('');

    if (!categorias.value) categorias.value = [];
    if (typeof categorias.value[idx] === 'undefined') categorias.value.push(newRow.categoria || '');
  } catch (e) { void 0; }

  requestAnimationFrame(() => applyAutoResize());
}

function removeRow(index) {
  if (index < 0 || index >= tableData.value.length) return;
  // Do not trim shared arrays here to avoid deleting data created elsewhere
  tableData.value.splice(index, 1);
  requestAnimationFrame(() => applyAutoResize());
}

onMounted(() => {
  const textareas = document.querySelectorAll('.editable-cell');
  textareas.forEach(textarea => textarea.addEventListener('input', autoResizeTextarea));
  applyAutoResize();
  handleResize();
  window.addEventListener('resize', handleResize);
  window.addEventListener('resize', applyAutoResize);

  // Ensure shared arrays have at least as many entries as our rows (do not trim)
  try {
    if (!nombres.value) nombres.value = [];
    while (nombres.value.length < tableData.value.length) nombres.value.push('');
    if (!categorias.value) categorias.value = [];
    while (categorias.value.length < tableData.value.length) categorias.value.push('');
  } catch (e) { void 0; }
});

onUpdated(() => applyAutoResize());
onUnmounted(() => { window.removeEventListener('resize', handleResize); window.removeEventListener('resize', applyAutoResize); });

// Persist changes
watch(tableData, (val) => { try { localStorage.setItem('torneosYsalidas.tableData', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });

// Persist shared nombres/categorias using the same keys used elsewhere
watch(nombres, (val) => { try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });
watch(categorias, (val) => { try { localStorage.setItem('informacionJugador.categorias', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });
</script>

<template>

<HeaderComponent />

<div class="row my-3">
  <div class="lg-12">
    <div id="cabeza">

      <h1 class="text-center text-white">torneos</h1>

      <div class="table-container">
        <div id="cuerpo">
          <div class="table-top-actions">
            <div v-if="isMobileOrTablet" class="arrow-btn-container">
              <button class="arrow-btn" @click="prevSection">Anterior</button>
              <button class="arrow-btn" @click="nextSection">Siguiente</button>
            </div>
            <div class="add-action-wrap">
              <button @click="addRow" class="arrow-btn add-btn">Agregar</button>
            </div>
          </div>

          <table class="info-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="col in (isMobileOrTablet ? sections.flat().slice(currentSection, currentSection + getColumnsToDisplay()) : sections.flat())" :key="col">{{ columnLabels[col] }}</th>
                <th class="actions-col">acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in tableData" :key="index">
                <td><span class="user-icon">👤</span></td>
                <td v-for="col in (isMobileOrTablet ? sections.flat().slice(currentSection, currentSection + getColumnsToDisplay()) : sections.flat())" :key="col">
                  <textarea v-if="col === 'nombre'" v-model="nombres[index]" readonly class="editable-cell read-only"></textarea>
                  <textarea v-else-if="col === 'categoria'" v-model="categorias[index]" readonly class="editable-cell read-only"></textarea>
                  <textarea v-else-if="col === 'torneo'" v-model="row.torneo" class="editable-cell"></textarea>
                  <textarea v-else-if="col === 'horario'" v-model="row.horario" class="editable-cell"></textarea>
                </td>
                <td>
                  <button @click="removeRow(index)" class="remove-row-btn">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</div>

</template>
