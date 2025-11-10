<script>
export default {
  name: "InformacionPersonalComponent",
};
</script>

<script setup>
import HeaderComponent from './cabecera.vue';
import InformacionJugadorComponent from './subcomponents/informacionJugador.vue';
import InformacionAcudienteComponent from './subcomponents/informacionAcudiente.vue';
import { ref, nextTick } from 'vue';
import { usePlayersStore } from '@/stores/players';
import { acudientes, nombres } from '../stores/acudienteStore.js';
import '../stylecomponents.css';

const currentSection = ref('Jugador');

// refs to child components for batch operations
const jugadorRef = ref(null);
const acudienteRef = ref(null);
const savingAll = ref(false);
const playersStore = usePlayersStore();

// allow switching visible section from template
function showSection(section) { currentSection.value = section; }

// modal for invalid pending changes
const showInvalidModal = ref(false);
const invalidMessage = ref('');

function closeModal() { showInvalidModal.value = false; invalidMessage.value = ''; }

async function confirmAll() {
  // gather pending changes from both children
  try {
    savingAll.value = true;
    // validate children pending state: prevent save if any child reports invalid pending changes
    const problems = [];
    try { if (jugadorRef.value && jugadorRef.value.hasInvalidPendingChanges && jugadorRef.value.hasInvalidPendingChanges()) problems.push('Jugador'); } catch(e){ void 0; }
    try { if (acudienteRef.value && acudienteRef.value.hasInvalidPendingChanges && acudienteRef.value.hasInvalidPendingChanges()) problems.push('Acudiente'); } catch(e){ void 0; }
    if (problems.length > 0) {
      // Build detailed message
      const parts = [];
      try {
        if (jugadorRef.value && jugadorRef.value.getInvalidPendingDetails) {
          const details = jugadorRef.value.getInvalidPendingDetails();
          details.forEach(d => {
            const missing = [];
            if (!d.nombreOk) missing.push('Nombre');
            if (!d.fechaOk) missing.push('Fecha');
            if (!d.acudientePresent) {
              // check if acudiente has a create at same index
              const acuHas = (acudienteRef.value && acudienteRef.value.getInvalidPendingDetails) ? acudienteRef.value.getInvalidPendingDetails().some(x => x.index === d.index) : false;
              if (!acuHas) missing.push('Falta crear fila en Información del acudiente (Nombre)');
              else missing.push('Nombre del acudiente no completado');
            }
            if (missing.length) parts.push(`Fila Jugador ${d.index + 1}: ${missing.join(' y ')}`);
          });
        }
      } catch(e){ void 0; }
      try {
        if (acudienteRef.value && acudienteRef.value.getInvalidPendingDetails) {
          const details = acudienteRef.value.getInvalidPendingDetails();
          details.forEach(d => {
            const missing = [];
            if (!d.nombreOk) {
              // check if jugador has create at same index
              const jugHas = (jugadorRef.value && jugadorRef.value.getInvalidPendingDetails) ? jugadorRef.value.getInvalidPendingDetails().some(x => x.index === d.index) : false;
              if (!jugHas) missing.push('Falta crear fila en Información del jugador (Nombre y Fecha)');
              else missing.push('Nombre del jugador no completado');
            }
            if (missing.length) parts.push(`Fila Acudiente ${d.index + 1}: ${missing.join(' y ')}`);
          });
        }
      } catch(e){ void 0; }
      invalidMessage.value = `Hay filas incompletas:\n${parts.join('\n')}`;
      showInvalidModal.value = true;
      savingAll.value = false;
      return;
    }

    // First collect acudiente pending changes and process them
    const acuPend = acudienteRef.value ? await acudienteRef.value.getPendingChanges() : { creates: [], updates: [], deletes: [] };

    const acuResults = { created: [], updated: [], deleted: [] };
    // create acu
    for (const c of acuPend.creates) {
      try {
        const res = await playersStore.createAcudiente(c.payload);
        acuResults.created.push({ index: c.index, res });
      } catch (e) {
        // record failure as null result; child will keep _unsaved and show error state
        acuResults.created.push({ index: c.index, res: null });
      }
    }
    // updates
    for (const u of acuPend.updates) {
      try {
        const res = await playersStore.updateAcudiente(u.id, u.payload);
        acuResults.updated.push({ index: u.index, res });
      } catch (e) { acuResults.updated.push({ index: u.index, res: null }); }
    }
    // deletes
    for (const d of acuPend.deletes) {
      try { await playersStore.deleteAcudiente(d.id); acuResults.deleted.push({ index: d.index, id: d.id }); } catch (e) { /* ignore */ }
    }

    // Recompute jugador pending changes now that acudientes have been created/updated
    const jugPend = jugadorRef.value ? await jugadorRef.value.getPendingChanges() : { creates: [], updates: [], deletes: [] };

    // Process jugadores using the recomputed pending changes
    const jugResults = { created: [], updated: [], deleted: [] };
    for (const c of jugPend.creates) {
      try {
        const res = await playersStore.createPlayer(c.payload);
        jugResults.created.push({ index: c.index, res });
      } catch (e) { jugResults.created.push({ index: c.index, res: null }); }
    }
    for (const u of jugPend.updates) {
      try { const res = await playersStore.updatePlayer(u.id, u.payload); jugResults.updated.push({ index: u.index, res }); } catch (e) { jugResults.updated.push({ index: u.index, res: null }); }
    }
    for (const d of jugPend.deletes) {
      try { await playersStore.deletePlayer(d.id); jugResults.deleted.push({ index: d.index, id: d.id }); } catch (e) { /* ignore */ }
    }

    // Commit results back to children so they can clear flags and update ids
    if (acudienteRef.value && acudienteRef.value.commitResult) acudienteRef.value.commitResult(acuResults);
    if (jugadorRef.value && jugadorRef.value.commitResult) jugadorRef.value.commitResult(jugResults);

    // Optionally refresh stores
    try { await playersStore.fetchPlayers(); } catch(e){ void 0; }
    try { await playersStore.fetchAcudientes(); } catch(e){ void 0; }
  } catch (e) {
    console.error('confirmAll error', e);
  } finally {
    savingAll.value = false;
  }
}

function cancelAll() {
  if (jugadorRef.value && jugadorRef.value.discardPending) jugadorRef.value.discardPending();
  if (acudienteRef.value && acudienteRef.value.discardPending) acudienteRef.value.discardPending();
}

// Combined export: include both Jugador and Acudiente data into one CSV
function exportCombined() {
  try {
    const jugRows = (jugadorRef.value && jugadorRef.value.tableData) ? (jugadorRef.value.tableData || []) : [];
    const acuRows = (acudienteRef.value && acudienteRef.value.tableData) ? (acudienteRef.value.tableData || []) : [];
    const nombresShared = (jugadorRef.value && jugadorRef.value.nombres) ? (jugadorRef.value.nombres || []) : [];
    const acudientesShared = (jugadorRef.value && jugadorRef.value.acudientes) ? (jugadorRef.value.acudientes || []) : [];

    const maxLen = Math.max(jugRows.length, acuRows.length, nombresShared.length, acudientesShared.length);
    // Use header names compatible with the importer so exported CSV can be re-imported
    const headers = [
      'fila',
      'nombre','fecha','cumpleanos','documento','acudiente','estrato','jornada','sede','categoria',
      'nombre_acudiente','documento_acudiente','correo_acudiente','direccion_acudiente','profesion_acudiente'
    ];
    const esc = (v) => {
      if (v === null || typeof v === 'undefined') return '';
      let s = String(v);
      s = s.replace(/"/g, '""');
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) s = '"' + s + '"';
      return s;
    };
    const lines = [headers.join(',')];
    for (let i = 0; i < maxLen; i++) {
      const j = jugRows[i] || {};
      const a = acuRows[i] || {};
      const nombreJugador = (j.nombre !== undefined ? j.nombre : (nombresShared[i] || '')) || '';
      const fecha = j.fecha || '';
      const cumple = j.cumpleanos || '';
      const docJug = j.documento || '';
      const acuSharedName = (acudientesShared[i] !== undefined ? acudientesShared[i] : (j.acudiente || '')) || '';
      const estrato = j.estrato || '';
      const jornada = j.jornada || '';
      const sede = j.sede || '';
      const categoria = j.categorias || '';

      const nombreAcu = a.nombre || '';
      const docAcu = a.documento || '';
      const correoAcu = a.correo || '';
      const direccionAcu = a.Direccion || a.direccion || '';
      const profesionAcu = a.Profesion || a.profesion || '';

      const row = [
        i + 1,
        nombreJugador, fecha, cumple, docJug, acuSharedName, estrato, jornada, sede, categoria,
        nombreAcu, docAcu, correoAcu, direccionAcu, profesionAcu
      ];
      lines.push(row.map(esc).join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0,10);
    a.download = `informacion_personal_export_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { void 0; } }, 1000);
  } catch (e) { try { console.error('exportCombined error', e); } catch (ee) { void 0; } }
}

// keep existing exportJugadores name but call combined export to preserve UI
function exportJugadores() { try { exportCombined(); } catch(e) { void 0; } }

// Flexible date parsing helpers (module scope to satisfy ESLint)
const parseExcelSerial = (serial) => {
  try {
    const s = Number(serial);
    if (!Number.isFinite(s)) return null;
    const epoch = new Date(Date.UTC(1899, 11, 30));
    let days = Math.floor(s);
    if (days > 59) days -= 1; // Excel leap year bug adjustment
    const dt = new Date(epoch.getTime() + days * 24 * 3600 * 1000);
    return Number.isNaN(dt.getTime()) ? null : dt;
  } catch (e) { return null; }
};
const toDdMmYyyy = (dt) => {
  try {
    if (!dt || Number.isNaN(dt.getTime())) return null;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dt.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) { return null; }
};
const parseFlexibleDate = (s) => {
  try {
    if (!s && s !== 0) return null;
    let v = String(s).trim();
    if (!v) return null;
    // Excel serial (integer) -> convert
    if (/^\d+$/.test(v)) {
      const n = parseInt(v, 10);
      if (n > 31) {
        const dt = parseExcelSerial(n);
        const out = dt ? toDdMmYyyy(dt) : null;
        if (out) return out;
      }
    }
    // ISO yyyy-mm-dd
    const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${String(iso[3]).padStart(2,'0')}/${String(iso[2]).padStart(2,'0')}/${iso[1]}`;
    // common delimited formats: dd/mm/yyyy or dd-mm-yyyy or mm/dd/yyyy
    const parts = new RegExp('^(\\d{1,2})(?:/|-)(\\d{1,2})(?:/|-)(\\d{2,4})$').exec(v);
    if (parts) {
      let p1 = parseInt(parts[1],10), p2 = parseInt(parts[2],10), py = parts[3];
      if (py.length === 2) py = (Number(py) > 50 ? '19' + py : '20' + py);
      if (p1 > 12) {
        return `${String(p1).padStart(2,'0')}/${String(p2).padStart(2,'0')}/${String(py).padStart(4,'0')}`;
      }
      if (p2 > 12) {
        return `${String(p2).padStart(2,'0')}/${String(p1).padStart(2,'0')}/${String(py).padStart(4,'0')}`;
      }
      return `${String(p1).padStart(2,'0')}/${String(p2).padStart(2,'0')}/${String(py).padStart(4,'0')}`;
    }
    // Last resort: try Date parsing
    const dt = new Date(v);
    if (!Number.isNaN(dt.getTime())) return toDdMmYyyy(dt);
    return null;
  } catch (e) { return null; }
};

function handleImportFile(evt) {
  try {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        // Simple CSV parse: split lines, handle quoted values roughly
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.replace(/(^\s+|\s+$|^"|"$)/g, '').toLowerCase());
        const rows = lines.slice(1).map(l => {
          // naive split, not robust for embedded commas — acceptable for simple imports
          const parts = l.split(',').map(p => p.replace(/^\s*"?|"?\s*$/g, ''));
          const obj = {};
          headers.forEach((h,i) => obj[h] = parts[i] || '');
          return obj;
        });

        const importErrors = [];
        // Validate each CSV row: jugador.nombre AND jugador.fecha required; do NOT require acudiente or categoria from CSV
        rows.forEach((r, idx) => {
          const nombre = getCsvValue(r, ['nombre', 'nombre_jugador', 'jugador']) || '';
          const fechaRaw = getCsvValue(r, ['fecha_nacimiento', 'fecha', 'dob']) || '';
          const fecha = parseFlexibleDate(fechaRaw);
          const errs = [];
          if (!String(nombre).trim()) errs.push('Falta nombre del jugador');
          if (!fecha) errs.push('Fecha inválida o faltante');
          if (errs.length) importErrors.push({ row: idx + 2, reasons: errs, raw: r }); // +2 accounts for header + 0-based
        });

        if (importErrors.length > 0) {
          const parts = importErrors.map(it => `Linea ${it.row}: ${it.reasons.join('; ')}`);
          alert('Errores en archivo importado:\n' + parts.join('\n'));
          return; // abort import on validation errors
        }

        // All rows valid -> map into children
        const jugRows = [];
        const acuRows = [];
        const nombresShared = [];
        const acudientesShared = [];
        const categoriasShared = []; // keep empty so categories are computed by jugador component
        rows.forEach(r => {
          const nombre = getCsvValue(r, ['nombre', 'nombre_jugador', 'jugador']) || '';
          const fechaRaw = getCsvValue(r, ['fecha_nacimiento', 'fecha', 'dob']) || '';
          const fecha = parseFlexibleDate(fechaRaw) || '';

          // build acudiente value from possible explicit acudiente-name columns
          const nombreAcu = pickFirstNonEmpty(r, ['nombre_acudiente', 'acudiente_nombre', 'acudiente_nombre_shared', 'acudiente nombre', 'tutor', 'padre', 'madre', 'responsable']);

          // For jugador rows, set acudiente to the parsed acudiente-name (from specific columns),
          // but DO NOT read the plain 'acudiente' column to avoid empty-overwrite mistakes.
          // For jugador rows we must NOT trust a CSV 'categoria' column because
          // categories are derived from edad (fecha). Ensure we leave categorias
          // empty so the jugador component computes it from fecha.
          const categoryFromCsv = '';

          jugRows.push({ nombre: nombre, fecha: fecha, documento: (r['documento']||''), acudiente: nombreAcu, estrato: (r['estrato']||''), jornada: (r['jornada']||''), sede: (r['sede']||''), categorias: categoryFromCsv, _unsaved: true, id: null, _localKey: Date.now().toString(36) + '-' + Math.floor(Math.random()*1e6).toString(36) });
          nombresShared.push(nombre);
          categoriasShared.push(''); // keep empty so child computes categoryFromAge

          // build acudiente rows from acu-specific columns (if present)
          acuRows.push({ nombre: nombreAcu, documento: (r['documento_acudiente']||''), correo: (r['correo_acudiente']||''), direccion: (r['direccion_acudiente']||''), profesion: (r['profesion_acudiente']||''), _unsaved: true, id: null, _localKey: Date.now().toString(36) + '-' + Math.floor(Math.random()*1e6).toString(36) });
          acudientesShared.push(nombreAcu);
        });

        // set shared arrays on components
        try {
          // Prefer updating the central store refs so both children (which import the store) see the change
          try { if (nombres && Object.prototype.hasOwnProperty.call(nombres, 'value')) { nombres.value = nombresShared; } }
          catch(e) { /* ignore */ }
          try { if (acudientes && Object.prototype.hasOwnProperty.call(acudientes, 'value')) { acudientes.value = acudientesShared; } }
          catch(e) { /* ignore */ }

          // persist so components that read localStorage at mount will also see values
          try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(nombresShared)); } catch(e){ /* ignore */ }
          try { localStorage.setItem('acudientes', JSON.stringify(acudientesShared)); } catch(e){ /* ignore */ }

          // Assign tableData to children after updating store so their watchers can pick up shared arrays
          if (jugadorRef.value && jugadorRef.value.tableData !== undefined) {
            try { jugadorRef.value.tableData = jugRows; } catch(e){ /* ignore */ }
            if (jugadorRef.value.ensureRowStatusLength) jugadorRef.value.ensureRowStatusLength(jugRows.length);
            if (jugadorRef.value.recomputeDerivedFields) jugadorRef.value.recomputeDerivedFields();
          }

          if (acudienteRef.value && acudienteRef.value.tableData !== undefined) {
            try { acudienteRef.value.tableData = acuRows; } catch(e){ /* ignore */ }
            if (acudienteRef.value.ensureRowStatusLength) acudienteRef.value.ensureRowStatusLength(acuRows.length);
          }

          // allow Vue to update DOM
          await nextTick();

          // trigger recompute on children
          try { if (jugadorRef.value && jugadorRef.value.recomputeDerivedFields) jugadorRef.value.recomputeDerivedFields(); } catch(e){ /* ignore */ }
          try { if (acudienteRef.value && acudienteRef.value.recomputeDerivedFields) acudienteRef.value.recomputeDerivedFields(); } catch(e){ /* ignore */ }
        } catch(e){ /* ignore */ }

        // For acudiente child, create tableData if present (additional safety assignment)
        try {
          if (acudienteRef.value && acudienteRef.value.tableData !== undefined) {
            try { acudienteRef.value.tableData = acuRows; } catch(e){ /* ignore */ }
            if (acudienteRef.value.ensureRowStatusLength) acudienteRef.value.ensureRowStatusLength(acuRows.length);
            try {
              if (acudienteRef.value.nombres) {
                if (Object.prototype.hasOwnProperty.call(acudienteRef.value.nombres, 'value')) { acudienteRef.value.nombres.value = nombresShared; }
                else { acudienteRef.value.nombres = nombresShared; }
              }
            } catch(e){ /* ignore */ }
            try {
              if (acudienteRef.value.acudientes) {
                if (Object.prototype.hasOwnProperty.call(acudienteRef.value.acudientes, 'value')) { acudienteRef.value.acudientes.value = acudientesShared; }
                else { acudienteRef.value.acudientes = acudientesShared; }
              }
            } catch(e){ /* ignore */ }
            try {
              if (acudienteRef.value.categorias) {
                if (Object.prototype.hasOwnProperty.call(acudienteRef.value.categorias, 'value')) { acudienteRef.value.categorias.value = categoriasShared; }
                else { acudienteRef.value.categorias = categoriasShared; }
              }
            } catch(e){ /* ignore */ }
            if (acudienteRef.value.recomputeDerivedFields) try { acudienteRef.value.recomputeDerivedFields(); } catch(e){ /* ignore */ }
          }
        } catch(e){ /* ignore */ }

        alert('Importación válida cargada en memoria. Revisa las filas y luego confirma todo para crear en backend.');
      } catch (e) { alert('Error al leer el archivo'); }
    };
    reader.readAsText(file, 'UTF-8');
  } catch (e) { /* ignore */ }
}

// helper to robustly find CSV column values by several possible header names
function normalizeKeyForLookup(k) { return String(k || '').trim().toLowerCase().replace(/[_\s-]+/g, ''); }
function getCsvValue(row, candidates) {
  try {
    // build normalized map of keys -> value
    const norm = {};
    Object.keys(row || {}).forEach(k => { norm[normalizeKeyForLookup(k)] = row[k]; });
    for (let c of (candidates || [])) {
      const nc = normalizeKeyForLookup(c);
      if (Object.prototype.hasOwnProperty.call(norm, nc)) return String(norm[nc] || '').trim();
    }
    // fallback: partial match (contains)
    for (let key of Object.keys(row || {})) {
      const nk = normalizeKeyForLookup(key);
      for (let c of (candidates || [])) {
        const nc = normalizeKeyForLookup(c);
        if (nk.indexOf(nc) !== -1) return String(row[key] || '').trim();
      }
    }
  } catch (e) { /* ignore */ }
  return '';
}

// helper: choose first non-empty value from possible keys in parsed row
function pickFirstNonEmpty(rowObj, candidates) {
  try {
    for (let i = 0; i < candidates.length; i++) {
      const k = candidates[i];
      if (!k) continue;
      const v = rowObj[k];
      if (typeof v !== 'undefined' && v !== null) {
        const s = String(v).trim();
        if (s !== '') return s;
      }
    }
  } catch (e) { void 0; }
  return '';
}

</script>

<template>
  <HeaderComponent />
  <div class="row my-3">
    <div class="lg-12">
      <div id="cabeza">
        <h1 class="text-center text-white">información personal</h1>
        <div class="general-buttons">
          <button class="btn-general" @click="showSection('Jugador')">información del jugador</button>
          <button class="btn-general" @click="showSection('Acudiente')">información del acudiente</button>
        </div>
        <div class="table-container">
          <!-- Keep both components mounted so parent can call their exposed methods even when hidden -->
          <InformacionJugadorComponent ref="jugadorRef" v-show="currentSection === 'Jugador'" />
          <InformacionAcudienteComponent ref="acudienteRef" v-show="currentSection === 'Acudiente'" />
        </div>
        <div class="text-center">
          <!-- Button enabled so confirmAll can run and show modal when children have invalid pending rows -->
          <div class="action-buttons">
            <button class="btn-general" @click="confirmAll" :disabled="savingAll">Confirmar todo</button>
            <button class="btn-general" @click="cancelAll">Cancelar cambios</button>
            <button class="btn-general" @click="exportJugadores">Exportar CSV</button>
          </div>
        </div>
        <!-- New file input for CSV import -->
        <div class="text-center my-3">
          <input type="file" accept=".csv" @change="handleImportFile" style="display:none;" ref="importFileInput" />
          <button class="btn-general" @click="$refs.importFileInput.click()">Importar CSV</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Invalid pending changes modal -->
  <div v-if="showInvalidModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Campos incompletos</h3>
      <p>{{ invalidMessage }}</p>
      <div class="modal-actions">
        <button class="btn-confirmar" @click="closeModal">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* spacing for action buttons */
.action-buttons{display:inline-flex;gap:12px;align-items:center;justify-content:center;margin-top:14px}
.action-buttons .btn-general{margin:0}

/* simple modal styles */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:6000}
.modal-content{background:#fff;color:#222;padding:20px;border-radius:8px;max-width:480px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.2);} 
.modal-content h3{margin-top:0}
.modal-actions{display:flex;justify-content:flex-end;margin-top:12px}
</style>



