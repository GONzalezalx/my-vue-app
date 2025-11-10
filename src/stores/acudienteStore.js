import { ref } from 'vue';

// Lista compartida de acudientes (cada índice corresponde a una fila)
export const acudientes = ref([]);

// Lista compartida de categorias (se usará para sincronizar con torneosYsalidas)
export const categorias = ref([]);

// Lista compartida de nombres para sincronizar 'nombre' entre componentes
export const nombres = ref([]);

// Estructura centralizada para los distintos grupos de categorias (ALEVIN, BENJAMIN, ...)
export const categoryData = ref({
  ALEVIN: [
    { nombre: 'Nombre Alevin 1', fecha: 'Fecha Alevin 1' },
    { nombre: 'Nombre Alevin 2', fecha: 'Fecha Alevin 2' }
  ],
  BENJAMIN: [
    { nombre: 'Nombre Benjamin 1', fecha: 'Fecha Benjamin 1' },
    { nombre: 'Nombre Benjamin 2', fecha: 'Fecha Benjamin 2' }
  ],
  'PRE-MINI': [
    { nombre: 'Nombre Pre-Mini 1', fecha: 'Fecha Pre-Mini 1' },
    { nombre: 'Nombre Pre-Mini 2', fecha: 'Fecha Pre-Mini 2' }
  ],
  MINI: [
    { nombre: 'Nombre Mini 1', fecha: 'Fecha Mini 1' },
    { nombre: 'Nombre Mini 2', fecha: 'Fecha Mini 2' }
  ],
  INFANTIL: [
    { nombre: 'Nombre Infantil 1', fecha: 'Fecha Infantil 1' },
    { nombre: 'Nombre Infantil 2', fecha: 'Fecha Infantil 2' }
  ],
  'U 15': [
    { nombre: 'Nombre U15 1', fecha: 'Fecha U15 1' },
    { nombre: 'Nombre U15 2', fecha: 'Fecha U15 2' }
  ],
  'U 16': [
    { nombre: 'Nombre U16 1', fecha: 'Fecha U16 1' },
    { nombre: 'Nombre U16 2', fecha: 'Fecha U16 2' }
  ],
  'U 17': [
    { nombre: 'Nombre U17 1', fecha: 'Fecha U17 1' },
    { nombre: 'Nombre U17 2', fecha: 'Fecha U17 2' }
  ],
  'U 18': [
    { nombre: 'Nombre U18 1', fecha: 'Fecha U18 1' },
    { nombre: 'Nombre U18 2', fecha: 'Fecha U18 2' }
  ],
  'U 19': [
    { nombre: 'Nombre U19 1', fecha: 'Fecha U19 1' },
    { nombre: 'Nombre U19 2', fecha: 'Fecha U19 2' }
  ],
  'U 20': [
    { nombre: 'Nombre U20 1', fecha: 'Fecha U20 1' },
    { nombre: 'Nombre U20 2', fecha: 'Fecha U20 2' }
  ],
  'U 21': [
    { nombre: 'Nombre U21 1', fecha: 'Fecha U21 1' },
    { nombre: 'Nombre U21 2', fecha: 'Fecha U21 2' }
  ],
  MAYORES: [
    { nombre: 'Nombre Mayores 1', fecha: 'Fecha Mayores 1' },
    { nombre: 'Nombre Mayores 2', fecha: 'Fecha Mayores 2' }
  ]
});

// Índice seleccionado globalmente para la categoría mostrada en el componente Categorias
export const selectedCategoryIndex = ref(0);

// Initialize shared arrays from localStorage if present so all components start from same persisted state
try {
  // try both possible keys used in different components
  const rawAcud = localStorage.getItem('acudientes') || localStorage.getItem('informacionJugador.acudientes');
  if (rawAcud) {
    const parsed = JSON.parse(rawAcud);
    if (Array.isArray(parsed)) acudientes.value = parsed;
  }
} catch (e) { void 0; }

try {
  const rawNombres = localStorage.getItem('informacionJugador.nombres') || localStorage.getItem('nombres');
  if (rawNombres) {
    const parsed = JSON.parse(rawNombres);
    if (Array.isArray(parsed)) nombres.value = parsed;
  }
} catch (e) { void 0; }

try {
  const rawCategorias = localStorage.getItem('informacionJugador.categorias') || localStorage.getItem('categorias');
  if (rawCategorias) {
    const parsed = JSON.parse(rawCategorias);
    if (Array.isArray(parsed)) categorias.value = parsed;
  }
} catch (e) { void 0; }

export default {
  acudientes,
  categorias,
  nombres,
  categoryData,
  selectedCategoryIndex
};