<script>
import { ref, onMounted, onUpdated, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { acudientes, categorias, nombres, categoryData } from '../../stores/acudienteStore.js';
import { usePlayersStore } from '@/stores/players';

export default {
  name: "InformacionJugadorComponent",
  setup() {
    const playersStore = usePlayersStore();
    const route = useRoute();

    // Start with empty table (no placeholder rows)
    const tableData = ref([]);

    // Helper to detect placeholder tokens like nombre1, fecha1, categorias1, acudiente1
    function isPlaceholderToken(v) {
      try {
        if (!v) return false;
        return /^(nombre|fecha|categorias|acudiente)\d+$/i.test(String(v).trim());
      } catch (e) { return false; }
    }

    // --- helpers to convert dates between UI (dd/mm/yyyy) and ISO (yyyy-mm-dd)
    function uiToIso(v) {
      if (!v) return null;
      const m = String(v).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      return `${m[3]}-${m[2]}-${m[1]}`;
    }
    function isoToUi(iso) {
      if (!iso) return '';
      const m = String(iso).split('-');
      if (m.length !== 3) return '';
      return `${m[2].padStart(2,'0')}/${m[1].padStart(2,'0')}/${m[0]}`;
    }

    // compute next birthday from a row object with row.fecha in dd/mm/yyyy format
    function computeNextBirthday(row) {
      try {
        if (!row || !row.fecha) { row.cumpleanos = ''; return; }
        const parts = String(row.fecha).split('/'); // expected dd/mm/yyyy
        if (parts.length !== 3) { row.cumpleanos = ''; return; }
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (Number.isNaN(day) || Number.isNaN(month)) { row.cumpleanos = ''; return; }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let year = now.getFullYear();
        const candidate = new Date(year, month - 1, day);
        if (candidate < today) year += 1;
        const nextB = new Date(year, month - 1, day);
        const dd = String(nextB.getDate()).padStart(2, '0');
        const mm = String(nextB.getMonth() + 1).padStart(2, '0');
        const yyyy = String(nextB.getFullYear());
        row.cumpleanos = `${dd}/${mm}/${yyyy}`;
      } catch (e) { void 0; }
      try { setCategoryForRow(row); } catch(e){ void 0; }
    }

    // derive age from a UI date string dd/mm/yyyy
    function ageFromDateString(dateStr) {
      try {
        if (!dateStr) return null;
        const m = String(dateStr).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        const dob = new Date(year, month - 1, day);
        if (Number.isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const mth = today.getMonth() - dob.getMonth();
        if (mth < 0 || (mth === 0 && today.getDate() < dob.getDate())) age--;
        return age;
      } catch (e) { return null; }
    }

    // map age to category label (U15..U21 for ages 15..21, MAYORES for 22+)
    function categoryFromAge(age) {
      try {
        if (age === null || typeof age === 'undefined') return '';
        if (age >= 4 && age <= 6) return 'ALEVIN';
        if (age >= 7 && age <= 8) return 'BENJAMIN';
        if (age >= 9 && age <= 10) return 'PRE-MINI';
        if (age >= 11 && age <= 12) return 'MINI';
        if (age >= 13 && age <= 14) return 'INFANTIL';
        if (age >= 15 && age <= 21) return `U${age}`;
        if (age >= 22) return 'MAYORES';
        return '';
      } catch (e) { return ''; }
    }

    // assign category to a row and keep shared categorias array in sync
    // accepts optional index to avoid searching; if not provided tries _localKey, id, then indexOf
    function setCategoryForRow(row, idxParam) {
      try {
        if (!row) return;
        const age = ageFromDateString(row.fecha);
        const cat = categoryFromAge(age);
        if (row.categorias !== cat) row.categorias = cat;
        // ensure category appears in categoryData so it's present in categoryOptions (select list)
        try {
          if (cat) {
            if (!categoryData.value) categoryData.value = {};
            if (!Object.prototype.hasOwnProperty.call(categoryData.value, cat)) {
              // replace object to ensure reactivity (computed Object.keys will update)
              categoryData.value = Object.assign({}, categoryData.value, { [cat]: [] });
            }
          }
        } catch (e) { void 0; }

        // update shared categorias array for the same index (use splice to trigger reactivity)
        try {
          let idx = (typeof idxParam === 'number') ? idxParam : -1;
          if (idx < 0) {
            // try to find by _localKey
            if (row._localKey) {
              idx = tableData.value.findIndex(r => r && r._localKey === row._localKey);
            }
            // fallback to id match
            if (idx < 0 && row.id) {
              idx = tableData.value.findIndex(r => r && r.id === row.id);
            }
            // final fallback to direct reference
            if (idx < 0) idx = tableData.value.indexOf(row);
          }
          if (typeof idx === 'number' && idx >= 0) {
            if (!categorias.value) categorias.value = [];
            // ensure length
            while (categorias.value.length < idx) categorias.value.push('');
            if (typeof categorias.value[idx] === 'undefined') categorias.value.splice(idx, 0, cat);
            else categorias.value.splice(idx, 1, cat);
          }
        } catch (e) { void 0; }
      } catch (e) { void 0; }
    }

    // normalize user input into dd/mm/yyyy while typing
    function formatDateInput(event, row, field, rowIndex) {
      let v = event.target.value.replace(/\D/g, '').slice(0,8);
      if (v.length >= 5) {
        v = v.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
      } else if (v.length >= 3) {
        v = v.replace(/(\d{2})(\d{0,2})/, '$1/$2');
      }
      row[field] = v;
      if (field === 'fecha' && v.replace(/\D/g, '').length === 8) {
        computeNextBirthday(row);
      }
      // mark dirty for existing rows
      try { if (typeof rowIndex === 'number') markDirty(rowIndex); } catch(e){ void 0; }
    }

    function onDateBlur(row, field) {
      if (!row || !row[field]) return;
      const v = String(row[field]).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        if (field === 'fecha') computeNextBirthday(row);
        return;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y,m,d] = v.split('-');
        row[field] = `${d}/${m}/${y}`;
        if (field === 'fecha') computeNextBirthday(row);
        return;
      }
      const digits = v.replace(/\D/g, '');
      if (digits.length === 8) {
        row[field] = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
        if (field === 'fecha') computeNextBirthday(row);
      } else if (digits.length === 6) {
        row[field] = `${digits.slice(0,2)}/${digits.slice(2,4)}/20${digits.slice(4,6)}`;
        if (field === 'fecha') computeNextBirthday(row);
      }
    }

    function generateLocalKey() { return `${Date.now().toString(36)}-${Math.floor(Math.random()*1e6).toString(36)}`; }

    // map backend player -> ui row
    function playerToRow(p){
      return {
        id: p.id,
        nombre: p.nombre || '',
        fecha: p.fecha_nacimiento ? isoToUi(p.fecha_nacimiento) : '',
        cumpleanos: p.fecha_nacimiento ? (function(){ const tmp={fecha: isoToUi(p.fecha_nacimiento)}; computeNextBirthday(tmp); return tmp.cumpleanos; })() : '',
        documento: p.documento || '',
        acudiente: p.acudiente || '',
        estrato: p.estrato || '',
        jornada: p.jornada || '',
        sede: p.sede || '',
        categorias: (p.categoria && p.categoria.name) ? p.categoria.name : '',
        _localKey: generateLocalKey()
      };
    }

    // map ui row -> payload for API
    // helper: avoid concurrent duplicate category creation
    const _categoryCreatePromises = {};

    // normalize category names for comparisons/keys (strip whitespace, lowercase)
    function normalizeCategoryKey(name) {
      try { return String(name || '').replace(/\s+/g, '').trim().toLowerCase(); } catch (e) { return String(name || '').toLowerCase(); }
    }
    // canonical display form for creating categories (no spaces, uppercase)
    function normalizeCategoryDisplay(name) {
      try { return String(name || '').replace(/\s+/g, '').trim().toUpperCase(); } catch (e) { return String(name || '').toUpperCase(); }
    }

    async function rowToPayload(row){
      const payload = {
        nombre: row.nombre || '',
        fecha_nacimiento: uiToIso(row.fecha) || null,
        documento: row.documento || '',
        acudiente: row.acudiente || '',
        estrato: row.estrato || '',
        jornada: row.jornada || '',
        sede: row.sede || ''
      };
      try {
        const rawCat = row.categorias;
        const catName = rawCat && String(rawCat).trim();
        if (catName) {
          // ensure we have current categories cached
          try { if (!playersStore.categories || playersStore.categories.length === 0) await playersStore.fetchCategories(); } catch(e){ /* ignore */ }
          const lower = normalizeCategoryKey(catName);
          // find existing by normalized match
          let found = (playersStore.categories || []).find(c => normalizeCategoryKey(c.name || '') === lower);
          if (found && found.id) {
            payload.categoria_id = found.id;
          } else {
            // If another creation for this category is already in-flight, await it
            try {
              if (!_categoryCreatePromises[lower]) {
                _categoryCreatePromises[lower] = (async () => {
                  // double-check cache in case another thread created while we awaited fetch
                  try { if (!playersStore.categories || playersStore.categories.length === 0) await playersStore.fetchCategories(); } catch(e){ /* ignore */ }
                  const existing = (playersStore.categories || []).find(c => normalizeCategoryKey(c.name || '') === lower);
                  if (existing && existing.id) return existing;
                  // create with canonical display name to avoid spaced variants
                  const created = await playersStore.createCategory({ name: normalizeCategoryDisplay(catName) });
                  // push to local cache if returned
                  if (created && created.id) {
                    try { if (!Array.isArray(playersStore.categories)) playersStore.categories = []; playersStore.categories.push(created); } catch(e){ void 0; }
                    return created;
                  }
                  return null;
                })();
              }
              const createdOrExisting = await _categoryCreatePromises[lower];
              if (createdOrExisting && createdOrExisting.id) payload.categoria_id = createdOrExisting.id;
            } catch(e){ /* ignore */ } finally { try { delete _categoryCreatePromises[lower]; } catch(e){ void 0; } }
          }
        } else {
          payload.categoria_id = null;
        }
      } catch(e){ /* ignore */ }
      return payload;
    }

    // --- Players sync helpers
    async function saveRowByIndex(index){
      const row = tableData.value[index];
      if (!row) return;
      ensureRowStatusLength(index + 1);
      // if already saving, skip scheduling another save
      if (rowStatus.value[index] === 'saving') return;
      rowStatus.value[index] = 'saving';
      try {
        // If this row exists on the backend but the user removed the name, delete it on backend
        if (row.id && (!row.nombre || !String(row.nombre).trim())) {
          try {
            await playersStore.deletePlayer(row.id);
          } catch(e) { /* ignore delete errors */ }
          // clear local id so it becomes a local-only empty row
          row.id = null;
          rowStatus.value[index] = 'idle';
          return;
        }

        // If this is a new unsaved row, require confirmation and validate required fields
        if (row._unsaved && !row.id) {
          const nombreOk = row.nombre && String(row.nombre).trim();
          const fechaIso = uiToIso(row.fecha);
          const fechaOk = !!fechaIso;
          // require corresponding acudiente entry in shared acudientes array (or row.acudiente)
          const acudienteVal = (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') ? String(acudientes.value[index]).trim() : (row.acudiente ? String(row.acudiente).trim() : '');
          const acudienteOk = !!acudienteVal;
          if (!nombreOk || !fechaOk || !acudienteOk) {
            rowStatus.value[index] = 'error';
            return;
          }
          // proceed to create
          const payload = await rowToPayload(row);
           const created = await playersStore.createPlayer(payload);
           if (created && created.id) {
             row.id = created.id;
             row._unsaved = false;
             // merge returned fields or fallback to payload
             try { row.estrato = (typeof created.estrato !== 'undefined' ? (created.estrato || '') : (payload && typeof payload.estrato !== 'undefined' ? (payload.estrato || '') : row.estrato)); } catch(e){ void 0; }
             try { if (!nombres.value) nombres.value = []; nombres.value[index] = row.nombre || ''; } catch(e){ void 0; }
             try { if (!acudientes.value) acudientes.value = []; acudientes.value[index] = row.acudiente || acudienteVal; } catch(e){ void 0; }
             try { if (!categorias.value) categorias.value = []; categorias.value[index] = row.categorias || ''; } catch(e){ void 0; }
           }
           rowStatus.value[index] = 'idle';
           return;
         }

        // existing row update
        // require corresponding acudiente entry before updating as well
        const acudienteValForUpdate = (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') ? String(acudientes.value[index]).trim() : (row.acudiente ? String(row.acudiente).trim() : '');
        const acudienteOkForUpdate = !!acudienteValForUpdate;
        if (row.id) {
          if (!acudienteOkForUpdate) {
            // do not perform update if acudiente name is missing
            rowStatus.value[index] = 'error';
            return;
          }
          const payload = await rowToPayload(row);
          // apply payload estrato locally immediately so UI shows it even if backend omits it in response
          try { if (payload && typeof payload.estrato !== 'undefined') row.estrato = payload.estrato || ''; } catch(e) { void 0; }
           // perform update and merge returned data into the local row so UI reflects saved values (e.g. estrato)
           const updated = await playersStore.updatePlayer(row.id, payload);
          

           if (updated) {
            // merge returned fields into the ui row
            try {
              row.nombre = typeof updated.nombre !== 'undefined' ? (updated.nombre || '') : row.nombre;
              row.fecha = updated.fecha_nacimiento ? isoToUi(updated.fecha_nacimiento) : row.fecha;
              // recompute cumpleanos from possibly-updated fecha
              if (row.fecha) { try { computeNextBirthday(row); } catch(e) { void 0; } }
              row.documento = typeof updated.documento !== 'undefined' ? (updated.documento || '') : row.documento;
              row.acudiente = typeof updated.acudiente !== 'undefined' ? (updated.acudiente || '') : row.acudiente;
              // prefer backend value, but fall back to payload if backend doesn't return estrato
              row.estrato = typeof updated.estrato !== 'undefined' ? (updated.estrato || '') : (payload && typeof payload.estrato !== 'undefined' ? (payload.estrato || '') : row.estrato);
              row.jornada = typeof updated.jornada !== 'undefined' ? (updated.jornada || '') : row.jornada;
              row.sede = typeof updated.sede !== 'undefined' ? (updated.sede || '') : row.sede;
              row.categorias = (updated.categoria && updated.categoria.name) ? updated.categoria.name : row.categorias;
              row._dirty = false;
              // keep shared arrays in sync
              try { if (!nombres.value) nombres.value = []; nombres.value[index] = row.nombre || ''; } catch(e){ void 0; }
              try { if (!acudientes.value) acudientes.value = []; acudientes.value[index] = row.acudiente || ''; } catch(e){ void 0; }
              try { if (!categorias.value) categorias.value = []; categorias.value[index] = row.categorias || ''; } catch(e){ void 0; }
            } catch(e) { void 0; }
          }
        }
        rowStatus.value[index] = 'idle';
      } catch (e) {
        // mark row as error and keep payload for potential retry
        rowStatus.value[index] = 'error';
        // transiently show error, then allow retry
        setTimeout(() => { try { if (rowStatus.value[index] === 'error') rowStatus.value[index] = 'idle'; } catch (e) { void 0; } }, 3000);
      }
    }

    // When removing a row, delete on backend if exists
    async function removeRow(index) {
      if (index < 0 || index >= tableData.value.length) return;
      // decide removal actions in a safe, atomic way
      try {
        const row = tableData.value[index];
        // If row exists on backend, delete on backend immediately
        if (row && row.id) {
          try {
            await playersStore.deletePlayer(row.id);
          } catch (e) { /* ignore backend delete errors */ }
        }

        // Suppress shared-array watchers while we update arrays and tableData
        try { suppressNombresWatch.value = true; suppressAcudientesWatch.value = true; } catch (e) { void 0; }

        // Clear shared entries for this index if present
        try { if (nombres && nombres.value && typeof nombres.value[index] !== 'undefined') nombres.value.splice(index, 1); } catch(e){ void 0; }
        try { if (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') acudientes.value.splice(index, 1); } catch(e){ void 0; }
        try { if (categorias && categorias.value && typeof categorias.value[index] !== 'undefined') categorias.value.splice(index, 1); } catch(e){ void 0; }

        // Remove the row locally
        try { tableData.value.splice(index, 1); } catch(e){ void 0; }
        try { rowStatus.value.splice(index, 1); } catch(e){ void 0; }

        try { suppressNombresWatch.value = false; suppressAcudientesWatch.value = false; } catch (e) { void 0; }

        requestAnimationFrame(() => applyAutoResize());
      } catch (e) { void 0; }
    }

    // addRow: keep previous behavior but mark as local until user fills nombre to create
    function makeDefaultRow() { return { nombre: '', fecha: '', cumpleanos: '', documento: '', acudiente: '', estrato: '', jornada: '', sede: '', categorias: '', id: null, _unsaved: false, _localKey: generateLocalKey() }; }
    const suppressAcudientesWatch = ref(false);
    const suppressNombresWatch = ref(false);
    // Prevent tableData watcher actions during programmatic restores
    const suppressTableDataWatch = ref(false);
    const COMPONENT_ID = generateLocalKey();

    // Snapshot of last persisted state (used to restore on discard)
    const persistedSnapshot = ref({ tableData: null, nombres: null, categorias: null, acudientes: null });

    async function onExternalRowDeleted(e) {
      try {
        const detail = e && e.detail;
        if (!detail) return;
        if (detail.origin === COMPONENT_ID) return; // ignore own events
        const idx = typeof detail.index === 'number' ? detail.index : null;
        if (idx === null) return;
        // if we still have a row at idx, delete backend player if present then remove locally
        if (tableData.value[idx]) {
          const maybeRow = tableData.value[idx];
          try {
            if (maybeRow && maybeRow.id) {
              try { await playersStore.deletePlayer(maybeRow.id); } catch(e){ void 0; }
            }
          } catch(e){ void 0; }

          try { suppressNombresWatch.value = true; suppressAcudientesWatch.value = true; } catch(e){ void 0; }
          try { if (nombres && nombres.value && typeof nombres.value[idx] !== 'undefined') nombres.value.splice(idx,1); } catch(e){ void 0; }
          try { if (acudientes && acudientes.value && typeof acudientes.value[idx] !== 'undefined') acudientes.value.splice(idx,1); } catch(e){ void 0; }
          try { if (categorias && categorias.value && typeof categorias.value[idx] !== 'undefined') categorias.value.splice(idx,1); } catch(e){ void 0; }
          try { tableData.value.splice(idx,1); } catch(e){ void 0; }
          try { rowStatus.value.splice(idx,1); } catch(e){ void 0; }
          try { suppressNombresWatch.value = false; suppressAcudientesWatch.value = false; } catch(e){ void 0; }
        }
      } catch(e){ void 0; }
    }

    // register global listener
    onMounted(() => {
      try { window.addEventListener('row-deleted', onExternalRowDeleted); } catch(e){ void 0; }
    });
    onUnmounted(() => { try { window.removeEventListener('row-deleted', onExternalRowDeleted); } catch(e){ void 0; } });

    async function addRow() {
      const idx = tableData.value.length;
      const newRow = makeDefaultRow();
      newRow._unsaved = true; // require explicit confirmation to save
      try {
        if (acudientes && typeof acudientes.value[idx] !== 'undefined' && acudientes.value[idx] !== '') newRow.acudiente = acudientes.value[idx];
        if (nombres && typeof nombres.value[idx] !== 'undefined' && nombres.value[idx] !== '') newRow.nombre = nombres.value[idx];
        if (categorias && typeof categorias.value[idx] !== 'undefined' && categorias.value[idx] !== '') newRow.categorias = categorias.value[idx];
      } catch(e) { void 0; }

      // Prepare shared arrays first so their watchers don't remove the row immediately
      try {
        suppressAcudientesWatch.value = true;
        suppressNombresWatch.value = true;
        if (!acudientes.value) acudientes.value = [];
        if (typeof acudientes.value[idx] === 'undefined') acudientes.value.push(newRow.acudiente || '');
        if (!categorias.value) categorias.value = [];
        if (typeof categorias.value[idx] === 'undefined') categorias.value.push(newRow.categorias || '');
        if (!nombres.value) nombres.value = [];
        if (typeof nombres.value[idx] === 'undefined') nombres.value.push(newRow.nombre || '');
      } catch(e) { void 0; }

      // push then force a shallow copy to ensure the reactivity system notices the change in all cases
      tableData.value.push(newRow);
      try { tableData.value = tableData.value.slice(); } catch(e){ void 0; }

      // ensure rowStatus stays aligned with tableData so UI indicators work for the new row
      try { ensureRowStatusLength(tableData.value.length); } catch(e){ void 0; }

      try {
        // wait next tick for DOM update
        await nextTick();
      } catch (e) { void 0; } finally { try { suppressAcudientesWatch.value = false; } catch(e){ void 0; } finally { try { suppressNombresWatch.value = false; } catch(e){ void 0; } } }

      requestAnimationFrame(() => applyAutoResize());
    }

    // (cancelNewRow removed) per-row cancel handled by informacionPersonal via discardPending

    function removeUnsavedRows() {
      try {
        for (let i = tableData.value.length - 1; i >= 0; i--) {
          const r = tableData.value[i];
          if (r && r._unsaved) {
            try { if (nombres && nombres.value && typeof nombres.value[i] !== 'undefined') nombres.value[i] = ''; } catch(e){ void 0; }
            try { if (acudientes && acudientes.value && typeof acudientes.value[i] !== 'undefined') acudientes.value[i] = ''; } catch(e){ void 0; }
            try { if (categorias && categorias.value && typeof categorias.value[i] !== 'undefined') categorias.value[i] = ''; } catch(e){ void 0; }
            tableData.value.splice(i,1);
            try { rowStatus.value.splice(i,1); } catch(e){ void 0; }
          }
        }
        // update persisted storage after removing transient rows
        try { localStorage.setItem('informacionJugador.tableData', JSON.stringify((tableData.value || []).filter(r => !r._unsaved))); } catch(e){ void 0; }
        try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(nombres.value || [])); } catch(e){ void 0; }
        try { localStorage.setItem('informacionJugador.categorias', JSON.stringify(categorias.value || [])); } catch(e){ void 0; }
        try { localStorage.setItem('acudientes', JSON.stringify(acudientes.value || [])); } catch(e){ void 0; }
      } catch(e){ void 0; }
    }

    // remove unsaved rows when route changes or page unloads
    watch(() => route.fullPath, (newPath, oldPath) => {
      if (newPath !== oldPath) removeUnsavedRows();
    });

    function onBeforeUnload() { removeUnsavedRows(); }
    function onVisibilityChange() { if (document.visibilityState === 'hidden') removeUnsavedRows(); }

    // Wire up listeners and initial sync with API
    onMounted(async () => {
      ensureRowStatusLength(tableData.value.length);
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => textarea.addEventListener('input', autoResizeTextarea));
      applyAutoResize();

      try { if (!acudientes.value) acudientes.value = []; while (acudientes.value.length < tableData.value.length) acudientes.value.push(''); } catch (e) { void 0; }
      try { (tableData.value || []).forEach(row => computeNextBirthday(row)); } catch (e) { void 0; }

      // fetch categories first (needed to map category names -> ids)
      try { await playersStore.fetchCategories(); } catch(e){ void 0; }

      // fetch from backend and hydrate tableData (overwrite only if backend has records)
      try {
        const remote = await playersStore.fetchPlayers();
        if (Array.isArray(remote) && remote.length > 0) {
          tableData.value = remote.map(playerToRow);
          // ensure each loaded row has a local key
          tableData.value.forEach(r => { if (!r._localKey) r._localKey = generateLocalKey(); });
          ensureRowStatusLength(tableData.value.length);
         // ensure shared arrays length
         try { while (nombres.value.length < tableData.value.length) nombres.value.push(''); while (acudientes.value.length < tableData.value.length) acudientes.value.push(''); while (categorias.value.length < tableData.value.length) categorias.value.push(''); } catch(e) { void 0; }
       }
      } catch (e) { void 0; }

      // initial categoryData sync if categories selected
      try {
        if (categorias && categorias.value && Array.isArray(categorias.value)) {
          categorias.value.forEach((cat, i) => {
            if (cat) {
              const nombreVal = (nombres && nombres.value && typeof nombres.value[i] !== 'undefined') ? nombres.value[i] : ((tableData.value[i] && tableData.value[i].nombre) ? tableData.value[i].nombre : '');
              const fechaVal = (tableData.value[i] && tableData.value[i].fecha) ? tableData.value[i].fecha : '';
              try { addToCategory(cat, nombreVal, fechaVal); } catch (e) { void 0; }
            }
          });
        }
      } catch (e) { void 0; }

      // Capture a snapshot of the persisted state so discardPending can restore it
      try {
        persistedSnapshot.value.tableData = (tableData.value || []).filter(r => !r._unsaved).map(r => ({ ...r }));
        persistedSnapshot.value.nombres = (nombres.value || []).slice();
        persistedSnapshot.value.categorias = (categorias.value || []).slice();
        persistedSnapshot.value.acudientes = (acudientes.value || []).slice();
      } catch (e) { void 0; }

      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('resize', applyAutoResize);
      window.addEventListener('beforeunload', onBeforeUnload);
      document.addEventListener('visibilitychange', onVisibilityChange);
    });

    onUpdated(() => applyAutoResize());
    onUnmounted(() => { 
      // remove any unsaved rows when navigating away
      try { removeUnsavedRows(); } catch(e){ void 0; }
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', handleResize); window.removeEventListener('resize', applyAutoResize); 
    });

    // Persist to localStorage similar to previous behavior
    watch(tableData, (val) => {
      try {
        // Do not persist transient unsaved rows to localStorage
        const toPersist = (val || []).filter(r => !r._unsaved).map(r => ({ ...r }));
        localStorage.setItem('informacionJugador.tableData', JSON.stringify(toPersist));
      } catch (e) { void 0; }
    }, { deep: true });
     watch(acudientes, (val) => { try { localStorage.setItem('acudientes', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });
     watch(categorias, (val) => { try { localStorage.setItem('informacionJugador.categorias', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });
     watch(nombres, (val) => { try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });

    // Sync shared arrays into tableData when they change
    watch(acudientes, (val) => {
      try {
        if (suppressAcudientesWatch.value) return;
        const arr = val || [];

        // Do not auto-delete table rows when shared acudientes changes.
        // Instead, just synchronize the acudiente value into each existing table row.
        // This allows both subcomponents to add rows freely. Validation will still
        // prevent saving (hasInvalidPendingChanges / rowErrorMessage) if the
        // relationship is missing.
        arr.forEach((v, i) => {
          try {
            const newAcud = v || '';
            if (tableData.value[i]) {
              if (tableData.value[i].acudiente !== newAcud) tableData.value[i].acudiente = newAcud;
            }
          } catch (e) { void 0; }
        });

        // If the shared array is shorter than tableData, ensure the shared array
        // has explicit empty entries for missing indexes so components stay aligned
        // instead of deleting rows here.
        if (arr.length < tableData.value.length) {
          try {
            for (let j = arr.length; j < tableData.value.length; j++) {
              if (typeof acudientes.value[j] === 'undefined') acudientes.value[j] = '';
            }
          } catch (e) { void 0; }
        }
      } catch(e){ void 0; }
    }, { deep: true });
    watch(categorias, (val) => { try { (val || []).forEach((v,i)=> { if (tableData.value[i] && tableData.value[i].categorias !== v) tableData.value[i].categorias = v; }); } catch(e){ void 0; } }, { deep: true });
    // Simple nombres watcher: synchronize name text into rows only. Do not
    // delete rows here; deletions should come from explicit removeRow actions
    // or from the 'row-deleted' global event emitted by the Acudiente component.
    watch(nombres, (val) => {
      try {
        if (suppressNombresWatch.value) return;
        const arr = val || [];
        for (let i = 0; i < arr.length && i < tableData.value.length; i++) {
          try {
            const newName = arr[i] || '';
            if (tableData.value[i] && tableData.value[i].nombre !== newName) tableData.value[i].nombre = newName;
          } catch(e){ void 0; }
        }
        // Ensure nombres length at least matches tableData (do not shorten here)
        if (arr.length < tableData.value.length) {
          try { while (nombres.value.length < tableData.value.length) nombres.value.push(''); } catch(e){ void 0; }
        }
      } catch(e){ void 0; }
    }, { deep: true });

    // When tableData changes, propagate to shared arrays and schedule backend save
    watch(tableData, (newVal) => {
      if (suppressTableDataWatch.value) return;
      try {
        (newVal || []).forEach((row, i) => {
          // mark dirty if user edits existing fields via watchers
          if (row && row.id) {
            if (!row._unsaved) row._dirty = row._dirty || false;
          }
          ensureRowStatusLength(newVal.length);
          if (!acudientes.value) acudientes.value = [];
          if (typeof acudientes.value[i] === 'undefined' || acudientes.value[i] !== (isPlaceholderToken(row.acudiente) ? '' : row.acudiente)) acudientes.value[i] = isPlaceholderToken(row.acudiente) ? '' : (row.acudiente || '');
          if (!categorias.value) categorias.value = [];
          if (typeof categorias.value[i] === 'undefined' || categorias.value[i] !== (isPlaceholderToken(row.categorias) ? '' : row.categorias)) categorias.value[i] = isPlaceholderToken(row.categorias) ? '' : (row.categorias || '');
          if (!nombres.value) nombres.value = [];
          if (typeof nombres.value[i] === 'undefined' || nombres.value[i] !== (isPlaceholderToken(row.nombre) ? '' : row.nombre)) nombres.value[i] = isPlaceholderToken(row.nombre) ? '' : (row.nombre || '');

          // schedule save for this row (use id if present else index key)
          const key = row.id ? `id:${row.id}` : `idx:${i}`;
          // only schedule saves for existing backend rows (row.id). New rows require explicit Save.
          const shouldSave = !!row.id;
          if (shouldSave) scheduleSave(key, () => saveRowByIndex(i));
        });
      } catch (e) { void 0; }
    }, { deep: true });

    // mark dirty when user edits programmatically
    function markDirty(index) {
      if (tableData.value[index]) tableData.value[index]._dirty = true;
      try {
        const row = tableData.value[index];
        if (row && row.id && !row._unsaved) {
          const key = row.id ? `id:${row.id}` : `idx:${index}`;
          scheduleSave(key, () => saveRowByIndex(index));
        }
      } catch (e) { void 0; }
    }

    // Expose pending changes for batch commit from parent
    async function getPendingChanges() {
      const creates = [];
      const updates = [];
      const deletes = [];
      for (let i = 0; i < tableData.value.length; i++) {
        const r = tableData.value[i];
        if (!r) continue;
        if (r._unsaved && !r.id) {
          // only include creates that have required fields
          const nombreOk = r.nombre && String(r.nombre).trim();
          const fechaIso = uiToIso(r.fecha);
          // require corresponding acudiente entry in shared acudientes array
          const acudienteVal = (acudientes && acudientes.value && typeof acudientes.value[i] !== 'undefined') ? String(acudientes.value[i]).trim() : (r.acudiente ? String(r.acudiente).trim() : '');
          const acudienteOk = !!acudienteVal;
          if (nombreOk && fechaIso && acudienteOk) {
            try {
              const payload = await rowToPayload(r);
              creates.push({ index: i, payload });
            } catch (e) {
              creates.push({ index: i, payload: { nombre: r.nombre || '' } });
            }
          } else {
            // skip invalid create; parent can call hasInvalidPendingChanges() to detect
          }
        } else if (r._deleted && r.id) {
          deletes.push({ index: i, id: r.id });
        } else if (r.id && r._dirty) {
          try {
            const payload = await rowToPayload(r);
            updates.push({ index: i, id: r.id, payload });
          } catch (e) {
            updates.push({ index: i, id: r.id, payload: { nombre: r.nombre || '' } });
          }
        }
      }
      return { creates, updates, deletes };
    }

    // Return true if there are pending creates that are invalid (missing required fields)
    function hasInvalidPendingChanges() {
      try {
        for (let i = 0; i < tableData.value.length; i++) {
          const r = tableData.value[i];
          if (!r) continue;
          if (r._unsaved && !r.id) {
            const nombreOk = r.nombre && String(r.nombre).trim();
            const fechaIso = uiToIso(r.fecha);
            const fechaOk = !!fechaIso;
            // require corresponding acudiente entry in shared acudientes array
            const acudienteVal = (acudientes && acudientes.value && typeof acudientes.value[i] !== 'undefined') ? String(acudientes.value[i]).trim() : (r.acudiente ? String(r.acudiente).trim() : '');
            const acudienteOk = !!acudienteVal;
            if (!nombreOk || !fechaOk || !acudienteOk) return true;
          }
        }
      } catch (e) { void 0; }
      return false;
    }

    // Return details about invalid pending creates in jugador
    function getInvalidPendingDetails() {
      const details = [];
      try {
        for (let i = 0; i < tableData.value.length; i++) {
          const r = tableData.value[i];
          if (!r) continue;
          if (r._unsaved && !r.id) {
            const nombreOk = !!(r.nombre && String(r.nombre).trim());
            const fechaOk = !!(uiToIso(r.fecha));
            const acudientePresent = (acudientes && acudientes.value && typeof acudientes.value[i] !== 'undefined' && String(acudientes.value[i] || '').trim());
            details.push({ index: i, nombreOk, fechaOk, acudientePresent });
          }
        }
      } catch (e) { void 0; }
      return details;
    }

    // Export current tableData as CSV (fields: id,nombre,fecha,cumpleanos,documento,acudiente,estrato,jornada,sede,categorias)
    function exportCsv() {
      try {
        const rows = tableData.value || [];
        const headers = ['id','nombre','fecha','cumpleanos','documento','acudiente','estrato','jornada','sede','categorias'];
        const esc = (v) => {
          if (v === null || typeof v === 'undefined') return '';
          let s = String(v);
          s = s.replace(/"/g, '""');
          if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) s = '"' + s + '"';
          return s;
        };
        const lines = [headers.join(',')];
        // use a sequential id based on row position so exported id always equals row number
        rows.forEach((r, i) => {
          const obj = {
            id: i + 1,
            nombre: r.nombre || '',
            fecha: r.fecha || '',
            cumpleanos: r.cumpleanos || '',
            documento: r.documento || '',
            acudiente: r.acudiente || '',
            estrato: r.estrato || '',
            jornada: r.jornada || '',
            sede: r.sede || '',
            categorias: r.categorias || ''
          };
          const line = headers.map(h => esc(obj[h])).join(',');
          lines.push(line);
        });
        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0,10);
        a.download = `jugadores_export_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { void 0; } }, 1000);
      } catch (e) { void 0; }
    }

    // add to categoryData helper (used during initial hydration)
    function addToCategory(cat, nombre, fecha) {
      try {
        if (!cat) return;
        if (!categoryData.value) categoryData.value = {};
        if (!Array.isArray(categoryData.value[cat])) categoryData.value[cat] = [];
        const entry = { nombre: nombre || '', fecha: fecha || '' };
        categoryData.value[cat].push(entry);
      } catch (e) { void 0; }
    }

    // recompute derived fields (cumpleanos, categorias) for all rows
    function recomputeDerivedFields() {
      try {
        for (let i = 0; i < tableData.value.length; i++) {
          const row = tableData.value[i];
          if (!row) continue;
          try { computeNextBirthday(row); } catch (e) { void 0; }
          try { setCategoryForRow(row, i); } catch (e) { void 0; }
        }
      } catch (e) { void 0; }
    }

    // Apply results from parent batch commit (created/updated/deleted)
    function commitResult(results) {
      try {
        // created
        (results.created || []).forEach(item => {
          const idx = item.index;
          const res = item.res || {};
          if (typeof idx === 'number' && tableData.value[idx]) {
            tableData.value[idx].id = res.id || tableData.value[idx].id || null;
            tableData.value[idx]._unsaved = false;
            tableData.value[idx]._dirty = false;
          }
        });
        // updated
        (results.updated || []).forEach(item => {
          const idx = item.index;
          const res = item.res || {};
          if (typeof idx === 'number' && tableData.value[idx]) {
            // merge returned fields into row
            tableData.value[idx] = { ...tableData.value[idx], ...res, _dirty: false };
          }
        });
        // deleted
        (results.deleted || []).forEach(item => {
          const idx = item.index;
          if (typeof idx === 'number' && tableData.value[idx]) {
            tableData.value.splice(idx, 1);
            try { if (rowStatus.value && typeof rowStatus.value[idx] !== 'undefined') rowStatus.value.splice(idx, 1); } catch(e){ void 0; }
            try { if (nombres && nombres.value && typeof nombres.value[idx] !== 'undefined') nombres.value.splice(idx, 1); } catch(e){ void 0; }
            try { if (acudientes && acudientes.value && typeof acudientes.value[idx] !== 'undefined') acudientes.value.splice(idx, 1); } catch(e){ void 0; }
            try { if (categorias && categorias.value && typeof categorias.value[idx] !== 'undefined') categorias.value.splice(idx, 1); } catch(e){ void 0; }
          }
        });
      } catch (e) { void 0; }
      // update persisted snapshot after applying remote results
      try {
        persistedSnapshot.value.tableData = (tableData.value || []).filter(r => !r._unsaved).map(r => ({ ...r }));
        persistedSnapshot.value.nombres = (nombres.value || []).slice();
        persistedSnapshot.value.categorias = (categorias.value || []).slice();
        persistedSnapshot.value.acudientes = (acudientes.value || []).slice();
        // ensure localStorage reflects persisted snapshot
        try { localStorage.setItem('informacionJugador.tableData', JSON.stringify(persistedSnapshot.value.tableData)); } catch (e) { void 0; }
        try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(persistedSnapshot.value.nombres)); } catch (e) { void 0; }
        try { localStorage.setItem('informacionJugador.categorias', JSON.stringify(persistedSnapshot.value.categorias)); } catch (e) { void 0; }
        try { localStorage.setItem('acudientes', JSON.stringify(persistedSnapshot.value.acudientes)); } catch (e) { void 0; }
      } catch (e) { void 0; }
    }

    // Discard pending unsaved rows and reload persisted state
    async function discardPending() {
      try {
        // Prefer restoring from in-memory persisted snapshot (avoids race where localStorage contains transient edits)
        const snap = persistedSnapshot.value && persistedSnapshot.value.tableData ? persistedSnapshot.value : null;
        if (snap) {
          try {
            // suppress shared-array watchers to avoid intermediate writes
            suppressAcudientesWatch.value = true;
            suppressNombresWatch.value = true;
            suppressTableDataWatch.value = true;
            // restore tableData rows (only persisted rows)
            tableData.value = (snap.tableData || []).map(r => ({
              nombre: (isPlaceholderToken(r.nombre) ? '' : (r.nombre || '')),
              fecha: (isPlaceholderToken(r.fecha) ? '' : (r.fecha || '')),
              cumpleanos: (isPlaceholderToken(r.cumpleanos) ? '' : (r.cumpleanos || '')),
              documento: (isPlaceholderToken(r.documento) ? '' : (r.documento || '')),
              acudiente: (isPlaceholderToken(r.acudiente) ? '' : (r.acudiente || '')),
              estrato: (r.estrato || ''),
              jornada: (r.jornada || ''),
              sede: (r.sede || ''),
              categorias: (isPlaceholderToken(r.categorias) ? '' : (r.categorias || '')),
              id: r.id || null,
              _unsaved: false,
              _dirty: false,
              _localKey: r._localKey || generateLocalKey()
            }));

            // restore shared arrays from snapshot
            nombres.value = (snap.nombres || []).slice();
            categorias.value = (snap.categorias || []).slice();
            acudientes.value = (snap.acudientes || []).slice();

            // persist restored snapshot back to localStorage so future reloads match
            try { localStorage.setItem('informacionJugador.tableData', JSON.stringify((tableData.value || []).filter(r => !r._unsaved))); } catch(e){ void 0; }
            try { localStorage.setItem('informacionJugador.nombres', JSON.stringify(nombres.value || [])); } catch(e){ void 0; }
            try { localStorage.setItem('informacionJugador.categorias', JSON.stringify(categorias.value || [])); } catch(e){ void 0; }
            try { localStorage.setItem('acudientes', JSON.stringify(acudientes.value || [])); } catch(e){ void 0; }
          } catch (e) { void 0; } finally {
            // allow watchers to resume after DOM updates
            try { await nextTick(); } catch(e) { void 0; }
            suppressAcudientesWatch.value = false;
            suppressNombresWatch.value = false;
            suppressTableDataWatch.value = false;
          }
          return;
        }

        // Fallback: previous behavior reading from localStorage
        const saved = localStorage.getItem('informacionJugador.tableData');
        if (saved) {
          const parsed = JSON.parse(saved);
          // suppress tableData watcher while restoring from storage
          suppressTableDataWatch.value = true;
          tableData.value = (Array.isArray(parsed) ? parsed : []).map(r => ({
            nombre: (isPlaceholderToken(r.nombre) ? '' : (r.nombre || '')),
            fecha: (isPlaceholderToken(r.fecha) ? '' : (r.fecha || '')),
            cumpleanos: (isPlaceholderToken(r.cumpleanos) ? '' : (r.cumpleanos || '')),
            documento: (isPlaceholderToken(r.documento) ? '' : (r.documento || '')),
            acudiente: (isPlaceholderToken(r.acudiente) ? '' : (r.acudiente || '')),
            estrato: (r.estrato || ''),
            jornada: (r.jornada || ''),
            sede: (r.sede || ''),
            categorias: (isPlaceholderToken(r.categorias) ? '' : (r.categorias || '')),
            id: r.id || null,
            _unsaved: false,
            _dirty: false,
            _localKey: r._localKey || generateLocalKey()
          }));
          try { await nextTick(); } catch(e) { void 0; }
          suppressTableDataWatch.value = false;
        } else {
          tableData.value = [];
        }
        // reload shared arrays
        try { const sn = localStorage.getItem('informacionJugador.nombres'); nombres.value = sn ? JSON.parse(sn) : (nombres.value || []); } catch(e){ void 0; }
        try { const sc = localStorage.getItem('informacionJugador.categorias'); categorias.value = sc ? JSON.parse(sc) : (categorias.value || []); } catch(e){ void 0; }
        try { const sa = localStorage.getItem('acudientes'); acudientes.value = sa ? JSON.parse(sa) : (acudientes.value || []); } catch(e){ void 0; }
      } catch (e) { void 0; }
    }

    // Provide human-readable row error messages shown in UI
    function rowErrorMessage(index) {
      try {
        const r = tableData.value[index];
        if (!r) return 'Fila inválida';
        // If it's a new unsaved row, list missing required fields
        if (r._unsaved && !r.id) {
          const missing = [];
          if (!(r.nombre && String(r.nombre).trim())) missing.push('Nombre');
          if (!uiToIso(r.fecha)) missing.push('Fecha');
          const acuVal = (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') ? String(acudientes.value[index]).trim() : (r.acudiente ? String(r.acudiente).trim() : '');
          if (!acuVal) missing.push('Acudiente');
          if (missing.length) return `Falta: ${missing.join(', ')}`;
          return 'Datos incompletos';
        }
        // For existing rows an error often means missing acudiente
        if (r.id) {
          const acuVal = (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') ? String(acudientes.value[index]).trim() : '';
          if (!acuVal) return 'Falta acudiente';
        }
      } catch (e) { void 0; }
      return 'Error';
    }

    // save debounce timers per-row (keyed by index if no id, otherwise by id)
    const editTimers = new Map();
    // per-row status: 'idle' | 'saving' | 'error'
    const rowStatus = ref([]);
    function ensureRowStatusLength(n){ while(rowStatus.value.length < n) rowStatus.value.push('idle'); }
    
    function scheduleSave(key, fn, delay = 800){
      if (editTimers.has(key)) clearTimeout(editTimers.get(key));
      editTimers.set(key, setTimeout(() => { try { fn(); } catch(e) { void 0; } finally { editTimers.delete(key); } }, delay));
    }

    // auto-resize helpers used by many places
    function autoResizeTextarea(event){ const textarea = event.target; textarea.style.height='auto'; textarea.style.height = `${textarea.scrollHeight}px`; }
    function applyAutoResize(){ const textareas = document.querySelectorAll('.editable-cell'); textareas.forEach(textarea => { textarea.style.height='auto'; textarea.style.height = `${textarea.scrollHeight}px`; }); }

    // responsive / section helpers
    const currentSection = ref(0);
    const sections = [ ['nombre','fecha','cumpleanos'], ['documento','acudiente','estrato'], ['jornada','sede','categorias'] ];
    const columnLabels = { nombre:'Nombre', fecha:'Fecha', cumpleanos:'Cumpleaños', documento:'Documento', acudiente:'Acudiente', estrato:'Estrato', jornada:'Jornada', sede:'Sede', categorias:'Categoria' };
    const isMobileOrTablet = ref(window.innerWidth <= 1266);
    function handleResize(){ isMobileOrTablet.value = window.innerWidth <= 1266; }
    function getColumnsToDisplay(){ const totalColumns = sections.flat().length; if(!isMobileOrTablet.value) return totalColumns; if(totalColumns===4) return 2; if(totalColumns===6) return 3; if(totalColumns===9) return 3; return totalColumns; }
    function nextSection(){ const columnsToDisplay = getColumnsToDisplay(); currentSection.value = (currentSection.value + columnsToDisplay) % sections.flat().length; }
    function prevSection(){ const columnsToDisplay = getColumnsToDisplay(); currentSection.value = (currentSection.value - columnsToDisplay + sections.flat().length) % sections.flat().length; }

    return {
      tableData,
      exportCsv,
      getPendingChanges,
      commitResult,
      discardPending,
      hasInvalidPendingChanges,
      getInvalidPendingDetails,
      markDirty,
      rowStatus,
      currentSection,
      sections,
      nextSection,
      prevSection,
      isMobileOrTablet,
      getColumnsToDisplay,
      columnLabels,
      acudientes,
      categorias,
      nombres,
      formatDateInput,
      onDateBlur,
      addRow,
      removeRow,
      rowErrorMessage,
      recomputeDerivedFields,
      // Note: save/cancel for new rows are handled by informacionPersonal via getPendingChanges/commitResult/discardPending
    };
  }
};
</script>

<template>
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
          <th class="actions-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in tableData" :key="row._localKey || index">
          <td><span class="user-icon">👤</span></td>
          <td v-for="col in (isMobileOrTablet ? sections.flat().slice(currentSection, currentSection + getColumnsToDisplay()) : sections.flat())" :key="col">
            <div v-if="col === 'acudiente'">
              <textarea v-model="acudientes[index]" readonly class="editable-cell read-only"></textarea>
            </div>
            <div v-else-if="col === 'categorias'">
              <!-- Category is derived from fecha (age); show read-only value instead of editable selector -->
              <input type="text" :value="row.categorias || ''" readonly class="editable-cell read-only" />
            </div>
            <div v-else-if="col === 'fecha' || col === 'cumpleanos'">
              <input type="text" v-model="row[col]" @input="(e) => formatDateInput(e, row, col, index)" @blur="() => onDateBlur(row, col)" inputmode="numeric" pattern="[0-9]*" maxlength="10" placeholder="dd/mm/yyyy" class="date-input" />
            </div>
            <div v-else-if="col === 'nombre'">
              <div class="row-status-indicator">
                <span v-if="rowStatus && rowStatus[index] === 'saving'" class="status-saving">Guardando…</span>
                <span v-else-if="rowStatus && rowStatus[index] === 'error'" class="status-error">{{ rowErrorMessage(index) }}</span>
              </div>
              <textarea v-model="nombres[index]" class="editable-cell" @input="() => markDirty(index)"></textarea>
            </div>
            <div v-else>
              <textarea v-model="row[col]" class="editable-cell" @input="() => markDirty(index)"></textarea>
            </div>
          </td>
          <td>
            <!-- Save/Cancel per-row hidden: global Confirm/Cancel in informacionPersonal handles commits -->
            <button @click="removeRow(index)" class="remove-row-btn">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<!-- removed component-scoped styles to rely on src/stylecomponents.css for responsive sizing -->
