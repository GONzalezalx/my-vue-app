<script>
export default {
    name: "CategoriasComponent",
};
</script>

<script setup>
import { computed, onMounted, onUpdated, watch, ref } from 'vue';
import HeaderComponent from './cabecera.vue';
import '../stylecomponents.css';
import { categoryData, selectedCategoryIndex, categorias, nombres } from '../stores/acudienteStore.js';

const categories = computed(() => Object.keys(categoryData.value || {}));
const index = selectedCategoryIndex; // shared index
const currentCategory = computed(() => (categories.value[index.value] || ''));

// Count how many rows in informacionJugador have selected this category (only count those with a name)
const categoryCount = computed(() => {
    try {
        const cat = currentCategory.value;
        if (!cat || !categorias || !Array.isArray(categorias.value)) return 0;
        const cats = categorias.value;
        const names = (nombres && nombres.value) ? nombres.value : [];
        // try to parse persisted tableData once as a source of truth for names
        let persistedTable = null;
        try {
            const raw = localStorage.getItem('informacionJugador.tableData');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) persistedTable = parsed;
            }
        } catch (e) { persistedTable = null; }

        let cnt = 0;
        for (let i = 0; i < cats.length; i++) {
            if (cats[i] !== cat) continue;
            const name = String(names[i] || (persistedTable && persistedTable[i] && persistedTable[i].nombre) || '').trim();
            if (name) cnt++;
        }
        return cnt;
    } catch (e) { return 0; }
});

// Attendance map: { [categoryName]: { [globalIndex]: "YYYY-MM-DD" } }
const attendance = ref({});

// helper: today's date key (YYYY-MM-DD)
function todayKey() { return new Date().toISOString().slice(0,10); }

// helpers to toggle/check attendance
function toggleAttendance(cat, idx, value) {
    // store ISO date when checked, remove entry when unchecked
    const day = todayKey();
    const nextMap = { ...(attendance.value || {}) };
    if (!nextMap[cat]) nextMap[cat] = { ...(nextMap[cat] || {}) };
    if (value) {
        nextMap[cat][idx] = day;
    } else {
        try { delete nextMap[cat][idx]; } catch(e){ void 0; }
        // if category map empty, remove it
        if (nextMap[cat] && Object.keys(nextMap[cat]).length === 0) delete nextMap[cat];
    }
    attendance.value = nextMap;
}

function isAttended(cat, idx) {
    try {
        const day = todayKey();
        return !!(attendance.value && attendance.value[cat] && attendance.value[cat][idx] === day);
    } catch (e) { return false; }
}

function prev() {
    index.value = (index.value - 1 + categories.value.length) % categories.value.length;
}

function next() {
    index.value = (index.value + 1) % categories.value.length;
}

// Build displayedRows from the shared categorias + nombres arrays so we only
// show entries that were assigned in InformacionJugador (avoid showing
// static/default rows in categoryData).
const displayedRows = computed(() => {
    try {
        const cat = currentCategory.value || '';
        if (!cat) return [];
        const res = [];
        const cats = (categorias && categorias.value) ? categorias.value : [];
        const names = (nombres && nombres.value) ? nombres.value : [];
        const dataArr = (categoryData && categoryData.value && categoryData.value[cat]) ? categoryData.value[cat] : [];

        // try to parse persisted tableData once as a source of truth for fechas
        let persistedTable = null;
        try {
            const raw = localStorage.getItem('informacionJugador.tableData');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) persistedTable = parsed;
            }
        } catch (e) { persistedTable = null; }

        for (let i = 0; i < cats.length; i++) {
            if (cats[i] !== cat) continue;
            // prefer name from shared nombres, fallback to persisted tableData
            const nombreRaw = names[i] || (persistedTable && persistedTable[i] && persistedTable[i].nombre) || '';
            const nombre = String(nombreRaw || '').trim();
            if (!nombre) continue; // skip empty-name entries
            // prefer fecha from persisted tableData (same index), fallback to categoryData
            let fecha = '';
            if (persistedTable && persistedTable[i] && persistedTable[i].fecha) {
                fecha = String(persistedTable[i].fecha || '');
            } else {
                const found = dataArr.find(e => String(e.nombre || '') === nombre) || {};
                fecha = String(found.fecha || '');
            }
            // include global index so we can track attendance by player
            res.push({ nombre: nombre, fecha: fecha, idx: i });
        }
        return res;
    } catch (e) { return []; }
});

// Reapply autosize when displayedRows change
watch(displayedRows, () => requestAnimationFrame(() => applyAutoResize()));

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

    // Hydrate shared store from localStorage if needed so this view shows data
    try {
        // Try multiple possible keys for nombres (other files used different keys)
        const nombreKeys = ['informacionJugador.nombres', 'nombres'];
        for (const k of nombreKeys) {
            try {
                const raw = localStorage.getItem(k);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    nombres.value = parsed;
                    break;
                }
            } catch (e) { void 0; }
        }
        // categorias persisted under informacionJugador.categorias
        const categoriaKeys = ['informacionJugador.categorias', 'categorias'];
        for (const k of categoriaKeys) {
            try {
                const raw = localStorage.getItem(k);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    categorias.value = parsed;
                    break;
                }
            } catch (e) { void 0; }
        }
        // If still missing, try to read informacionJugador.tableData and derive names/categories
        if ((!nombres.value || nombres.value.length === 0) || (!categorias.value || categorias.value.length === 0)) {
            try {
                const rawTable = localStorage.getItem('informacionJugador.tableData');
                if (rawTable) {
                    const parsedTable = JSON.parse(rawTable);
                    if (Array.isArray(parsedTable)) {
                        if (!nombres.value || nombres.value.length === 0) {
                            nombres.value = parsedTable.map(r => r.nombre || '');
                        }
                        if (!categorias.value || categorias.value.length === 0) {
                            categorias.value = parsedTable.map(r => r.categorias || '');
                        }
                    }
                }
            } catch (e) { void 0; }
        }

        // categoryData persisted under categorias.categoryData
        const savedCategoryData = localStorage.getItem('categorias.categoryData');
        if (savedCategoryData) {
            try {
                const parsed = JSON.parse(savedCategoryData);
                if (parsed && !categoryData.value) categoryData.value = parsed;
                // merge keys if store has defaults but persisted has entries
                if (parsed && typeof parsed === 'object') {
                    categoryData.value = { ...(categoryData.value || {}), ...parsed };
                }
            } catch (e) { void 0; }
        }
    } catch (e) { void 0; }

    // Load attendance records persisted in localStorage
    try {
        const rawAtt = localStorage.getItem('categorias.attendance');
        if (rawAtt) {
            const parsed = JSON.parse(rawAtt);
            if (parsed && typeof parsed === 'object') {
                // prune entries older than today to avoid stale attendance showing
                const today = todayKey();
                const cleaned = {};
                for (const [cat, map] of Object.entries(parsed)) {
                    if (!map || typeof map !== 'object') continue;
                    for (const [k, v] of Object.entries(map)) {
                        if (String(v) === today) {
                            if (!cleaned[cat]) cleaned[cat] = {};
                            cleaned[cat][k] = v;
                        }
                    }
                }
                attendance.value = cleaned;
            }
        }
    } catch (e) { /* ignore */ }

    applyAutoResize();

    window.addEventListener('resize', applyAutoResize);
    // ensure autosize when switching categories
    watch(currentCategory, () => requestAnimationFrame(() => applyAutoResize()));
});

onUpdated(() => {
    applyAutoResize();
});

watch(categoryData, (val) => {
    try { localStorage.setItem('categorias.categoryData', JSON.stringify(val)); } catch (e) { void 0; }
}, { deep: true });

// Persist attendance map whenever it changes
watch(attendance, (val) => {
    try { localStorage.setItem('categorias.attendance', JSON.stringify(val)); } catch (e) { void 0; }
}, { deep: true });
</script>

<template>

    <HeaderComponent />

    <div class="row my-3">
        <div class="lg-12">
            <div id="cabeza">

                <h1 class="text-center text-white">categorias</h1>

                <div class="table-top-actions" style="align-items:center; justify-content:center; gap:1rem; margin-bottom:0.5rem;">
                    <div class="arrow-btn-container" style="display:flex; align-items:center; gap:0.5rem;">
                        <button class="arrow-btn" @click="prev">«</button>
                        <div class="category-name" style="font-weight:700; color:#fff;">
                            {{ currentCategory }} <span style="font-weight:400; opacity:0.9;">({{ categoryCount }})</span>
                        </div>
                        <button class="arrow-btn" @click="next">»</button>
                    </div>
                </div>

                <div id="cuerpo">
                    <table class="info-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Asistencia</th>
                                <th>Nombre</th>
                                <th>Fecha de Nacimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in displayedRows" :key="row.idx">
                                <td><span class="user-icon">👤</span></td>
                                <td style="text-align:center;">
                                    <input type="checkbox" :checked="isAttended(currentCategory, row.idx)" @change="(e) => toggleAttendance(currentCategory, row.idx, e.target.checked)" />
                                </td>
                                <td><textarea v-model="row.nombre" readonly class="editable-cell read-only"></textarea></td>
                                <td><textarea v-model="row.fecha" readonly class="editable-cell read-only"></textarea></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>

</template>
