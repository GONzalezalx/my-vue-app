<script>
import { ref, onMounted, onUpdated, onUnmounted, watch, nextTick } from 'vue';
import { acudientes, nombres } from '../../stores/acudienteStore.js';
import { usePlayersStore } from '@/stores/players';

export default {
  name: "InformacionAcudienteComponent",
  setup() {
    const playersStore = usePlayersStore();
    const tableData = ref([]);

    // per-row status and helpers (mirror the pattern used in informacionJugador)
    const rowStatus = ref([]);
    const suppressAcudientesWatch = ref(false);

    // simple removeRow implementation (call backend if needed)
    async function removeRow(index) {
      if (index < 0 || index >= tableData.value.length) return;
      const row = tableData.value[index];
      try {
        // if this row exists on the backend, delete it there
        if (row && row.id) {
          try { await playersStore.deleteAcudiente(row.id); } catch(e) { /* ignore backend delete errors */ }
        }
      } catch (e) { void 0; }
      // clear shared arrays at index and notify other components
      try {
        // suppress local watcher while mutating
        suppressAcudientesWatch.value = true;
        if (nombres && nombres.value && typeof nombres.value[index] !== 'undefined') nombres.value.splice(index, 1);
        if (acudientes && acudientes.value && typeof acudientes.value[index] !== 'undefined') acudientes.value.splice(index, 1);
        // notify others (informacionJugador listens for this event)
        try { window.dispatchEvent(new CustomEvent('row-deleted', { detail: { index, origin: 'acudiente' } })); } catch(e){ void 0; }
      } catch (e) { void 0; } finally { try { suppressAcudientesWatch.value = false; } catch(e){ void 0; } }
      tableData.value.splice(index, 1);
      try { rowStatus.value.splice(index, 1); } catch(e){ void 0; }
      requestAnimationFrame(() => applyAutoResize());
    }

    // Load saved tableData from localStorage if present
    try {
      const savedTable = localStorage.getItem('informacionAcudiente.tableData');
      if (savedTable) {
        const parsed = JSON.parse(savedTable);
        if (Array.isArray(parsed)) {
          tableData.value = parsed.map(r => ({ nombre: r.nombre || '', documento: r.documento || '', correo: r.correo || '', telefono: r.telefono || '', Direccion: r.Direccion || '', Profesion: r.Profesion || '', id: r.id || null }));
        }
      }
    } catch (e) { void 0; }

    // Load saved acudientes from localStorage if present
    try {
      const savedAcud = localStorage.getItem('acudientes');
      if (savedAcud) acudientes.value = JSON.parse(savedAcud);
    } catch (e) { void 0; }

    const currentSection = ref(0);
    const sections = [
      ['nombre', 'documento', 'correo'],
      ['telefono', 'Direccion', 'Profesion']
    ];

    const columnLabels = {
      nombre: 'Nombre',
      documento: 'Documento',
      correo: 'Correo electrónico',
      telefono: 'Teléfono',
      Direccion: 'Dirección',
      Profesion: 'Profesión'
    };

    const isMobileOrTablet = ref(window.innerWidth <= 1266);
    function handleResize() { isMobileOrTablet.value = window.innerWidth <= 1266; }

    function getColumnsToDisplay() {
      const totalColumns = sections.flat().length;
      if (!isMobileOrTablet.value) return totalColumns;
      if (totalColumns === 5) return 3; // show 3 at a time on narrow screens
      return Math.min(3, totalColumns);
    }

    function nextSection() {
      const columnsToDisplay = getColumnsToDisplay();
      currentSection.value = (currentSection.value + columnsToDisplay) % sections.flat().length;
    }

    function prevSection() {
      const columnsToDisplay = getColumnsToDisplay();
      currentSection.value = (currentSection.value - columnsToDisplay + sections.flat().length) % sections.flat().length;
    }

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

    function makeDefaultRow() {
      return { nombre: '', documento: '', correo: '', telefono: '', Direccion: '', Profesion: '', id: null, _unsaved: false };
    }

    async function addRow() {
      const idx = tableData.value.length;
      const newRow = makeDefaultRow();
      newRow._unsaved = true;
      try {
        // prevent the acudientes watcher from removing the newly added row
        suppressAcudientesWatch.value = true;
        if (!acudientes.value) acudientes.value = [];
        if (typeof acudientes.value[idx] === 'undefined') acudientes.value.push('');
        if (!nombres.value) nombres.value = [];
        if (typeof nombres.value[idx] === 'undefined') nombres.value.push('');
      } catch (e) { void 0; }

      tableData.value.push(newRow);

      try {
        // wait one render so watchers have settled before releasing suppression
        await nextTick();
      } catch (e) { void 0; } finally { try { suppressAcudientesWatch.value = false; } catch (e) { void 0; } }

      requestAnimationFrame(() => applyAutoResize());
    }

    // Per-row save/cancel removed: parent InformacionPersonal manages creates/updates/cancels via
    // getPendingChanges(), commitResult() and discardPending().

    function removeUnsavedRows() {
      try {
        for (let i = tableData.value.length - 1; i >= 0; i--) {
          const r = tableData.value[i];
          if (r && r._unsaved) {
            try { if (nombres && nombres.value && typeof nombres.value[i] !== 'undefined') nombres.value[i] = ''; } catch(e){ void 0; }
            try { if (acudientes && acudientes.value && typeof acudientes.value[i] !== 'undefined') acudientes.value[i] = ''; } catch(e){ void 0; }
            tableData.value.splice(i,1);
            try { rowStatus.value.splice(i,1); } catch(e){ void 0; }
          }
        }
        // persist trimmed state
        try { localStorage.setItem('informacionAcudiente.tableData', JSON.stringify((tableData.value||[]).filter(r => !r._unsaved))); } catch (e) { void 0; }
        try { localStorage.setItem('acudientes', JSON.stringify(acudientes.value || [])); } catch (e) { void 0; }
      } catch(e){ void 0; }
    }

    onMounted(() => {
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => textarea.addEventListener('input', autoResizeTextarea));
      applyAutoResize();

      // fetch acudientes from backend and hydrate table
      (async () => {
        try {
          const remote = await playersStore.fetchAcudientes();
          if (Array.isArray(remote) && remote.length > 0) {
            tableData.value = remote.map(a => ({ id: a.id, nombre: a.nombre || '', documento: a.documento || '', correo: a.correo || '', telefono: a.telefono || '', Direccion: a.direccion || '', Profesion: a.profesion || '', _unsaved: false }));
            while (acudientes.value.length < tableData.value.length) acudientes.value.push('');
            tableData.value.forEach((r,i)=> { acudientes.value[i] = r.nombre || ''; if (!nombres.value[i]) nombres.value[i] = r.nombre || ''; });
          }
        } catch(e){ void 0; }
      })();

      handleResize(); // Ensure initial check
      window.addEventListener('resize', handleResize);
      window.addEventListener('resize', applyAutoResize); // Recalculate height on window resize
      window.addEventListener('beforeunload', removeUnsavedRows);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') removeUnsavedRows(); });
    });

    onUpdated(() => applyAutoResize());
    onUnmounted(() => { window.removeEventListener('resize', handleResize); window.removeEventListener('resize', applyAutoResize); });

    // Persist changes to localStorage (do not persist transient unsaved rows)
    watch(tableData, (val) => {
      try {
        const toPersist = (val || []).filter(r => !r._unsaved).map(r => ({ ...r }));
        localStorage.setItem('informacionAcudiente.tableData', JSON.stringify(toPersist));
      } catch (e) { void 0; }
    }, { deep: true });
    watch(acudientes, (val) => { try { localStorage.setItem('acudientes', JSON.stringify(val)); } catch (e) { void 0; } }, { deep: true });

    // note: parent component handles route navigation; consumer can also call removeUnsavedRows if needed

    // Sync shared acudientes -> tableData.nombre
    watch(acudientes, async (val) => {
      try {
        const arr = val || [];

        if (suppressAcudientesWatch.value) { return; }

        // If the shared array has more entries than current rows, create new _unsaved rows so names are visible
        if (arr.length > tableData.value.length) {
          try {
            for (let k = tableData.value.length; k < arr.length; k++) {
              // create minimal row matching shape used elsewhere
              const newRow = { nombre: arr[k] || '', documento: '', correo: '', telefono: '', Direccion: '', Profesion: '', id: null, _unsaved: true };
              tableData.value.push(newRow);
              try { if (rowStatus.value) rowStatus.value.push('idle'); } catch(e) { void 0; }
            }
            // wait a tick so DOM and other watchers observe the new rows
            try { await nextTick(); } catch(e){ void 0; }
            requestAnimationFrame(() => applyAutoResize());
          } catch(e) { /* ignore creation errors */ }
        }

        // Synchronize names into existing rows (including any newly created above)
        arr.forEach((v, i) => {
          try {
            const newName = v || '';
            if (tableData.value[i]) {
              if (tableData.value[i].nombre !== newName) {
                tableData.value[i].nombre = newName;
              }
            }
          } catch (e) { void 0; }
        });

        // If shared array is shorter than tableData, ensure it has explicit empty entries for missing indices
        if (arr.length < tableData.value.length) {
          try {
            for (let j = arr.length; j < tableData.value.length; j++) {
              if (typeof acudientes.value[j] === 'undefined') acudientes.value[j] = '';
            }
          } catch (e) { void 0; }
        }
      } catch (e) { void 0; }
    }, { deep: true });

    // When nombres shortens/clears we already delete rows above; ensure we also delete players if they exist
    watch(nombres, (val) => {
      try {
        const arr = val || [];
        // If nombres became shorter than our rows, remove trailing acudiente rows (and delete corresponding players)
        if (arr.length < tableData.value.length) {
          for (let j = tableData.value.length - 1; j >= arr.length; j--) {
            try { if (acudientes && acudientes.value && typeof acudientes.value[j] !== 'undefined') acudientes.value[j] = ''; } catch (e) { void 0; }
            try { const maybeRow = tableData.value[j]; if (maybeRow && maybeRow.id) { (async () => { try { await playersStore.deleteAcudiente(maybeRow.id); } catch(e){ void 0; } })(); } } catch(e){ void 0; }
            tableData.value.splice(j, 1);
            try { rowStatus.value.splice(j, 1); } catch(e){ void 0; }
            // attempt to delete player with index j if exists in players store by matching name in shared nombres
            try { const playerName = (nombres && nombres.value && typeof nombres.value[j] !== 'undefined') ? String(nombres.value[j] || '').trim() : ''; if (playerName) { /* The players store deletes are handled in jugador watcher; nothing to do here */ } } catch(e){ void 0; }
          }
        }
      } catch (e) { void 0; }
    }, { deep: true });

    // Sync tableData -> acudientes
    watch(tableData, (newVal) => {
      try {
        (newVal || []).forEach((row, i) => {
          if (!acudientes.value) acudientes.value = [];
          if (typeof acudientes.value[i] === 'undefined' || acudientes.value[i] !== row.nombre) acudientes.value[i] = row.nombre || '';
        });
        if (acudientes.value.length > (newVal || []).length) acudientes.value.splice((newVal || []).length);
      } catch (e) { void 0; }
    }, { deep: true });

    // Keep tableData.nombre synced into the shared acudientes store so changes here
    // are reflected in InformacionJugador's "acudiente" column.
    watch(tableData, (val) => {
      try {
        const rows = val || [];
        if (!acudientes.value) acudientes.value = [];
        rows.forEach((row, i) => {
          if (typeof acudientes.value[i] === 'undefined' || acudientes.value[i] !== (row.nombre || '')) {
            acudientes.value[i] = row.nombre || '';
          }
        });
        // Trim extra entries in the store if rows were removed
        if (acudientes.value.length > rows.length) {
          acudientes.value.splice(rows.length);
        }
      } catch (e) { void 0; }
    }, { deep: true });

    // expose pending-change helpers for parent batch commit
    function getPendingChanges() {
      const creates = [];
      const updates = [];
      const deletes = [];
      tableData.value.forEach((r, i) => {
        if (r._unsaved && !r.id) {
          // require both nombre and shared acudientes[index] to be present
          const nombreOk = r.nombre && String(r.nombre).trim();
          const acudienteOk = (acudientes && acudientes.value && String(acudientes.value[i] || '').trim());
          if (nombreOk && acudienteOk) {
            creates.push({ index: i, payload: { nombre: r.nombre || '', documento: r.documento || '', correo: r.correo || '', telefono: r.telefono || '', direccion: r.Direccion || '', profesion: r.Profesion || '' } });
          } else {
            // skip invalid create; parent can call hasInvalidPendingChanges() to detect
          }
        } else if (r._deleted && r.id) {
          deletes.push({ index: i, id: r.id });
        } else if (r.id && r._dirty) {
          updates.push({ index: i, id: r.id, payload: { nombre: r.nombre || '', documento: r.documento || '', correo: r.correo || '', telefono: r.telefono || '', direccion: r.Direccion || '', profesion: r.Profesion || '' } });
        }
      });
      return { creates, updates, deletes };
    }

    // Return true if there are pending creates that are invalid (missing nombre or shared acudiente entry)
    function hasInvalidPendingChanges() {
      try {
        for (let i = 0; i < tableData.value.length; i++) {
          const r = tableData.value[i];
          if (!r) continue;
          if (r._unsaved && !r.id) {
            const nombreOk = r.nombre && String(r.nombre).trim();
            const acudienteOk = (acudientes && acudientes.value && String(acudientes.value[i] || '').trim());
            if (!nombreOk || !acudienteOk) return true;
          }
        }
      } catch (e) { void 0; }
      return false;
    }

    // Return details about invalid pending creates in acudiente
    function getInvalidPendingDetails() {
      const details = [];
      try {
        for (let i = 0; i < tableData.value.length; i++) {
          const r = tableData.value[i];
          if (!r) continue;
          if (r._unsaved && !r.id) {
            const nombreOk = !!(r.nombre && String(r.nombre).trim());
            const jugadorNamePresent = (nombres && nombres.value && typeof nombres.value[i] !== 'undefined' && String(nombres.value[i] || '').trim());
            details.push({ index: i, nombreOk, jugadorNamePresent });
          }
        }
      } catch (e) { void 0; }
      return details;
    }

    function commitResult(results) {
      try {
        // apply created
        (results.created || []).forEach(item => {
          const idx = item.index;
          const res = item.res;
          if (tableData.value[idx]) {
            if (res && typeof res === 'object') {
              // merge returned fields so telefono and others appear locally
              tableData.value[idx] = { ...tableData.value[idx], ...res, _unsaved: false, _dirty: false };
            } else {
              tableData.value[idx].id = res && res.id ? res.id : tableData.value[idx].id;
              tableData.value[idx]._unsaved = false;
              tableData.value[idx]._dirty = false;
            }
          }
        });
        // apply updated
        (results.updated || []).forEach(item => {
          const idx = item.index;
          const res = item.res;
          if (tableData.value[idx]) {
            tableData.value[idx] = { ...tableData.value[idx], ...res, _dirty: false };
          }
        });
        // apply deleted
        (results.deleted || []).forEach(item => {
          const idx = item.index;
          // if still in table, remove it
          if (typeof idx === 'number' && tableData.value[idx]) tableData.value.splice(idx, 1);
        });
      } catch(e){ void 0; }
    }

    function discardPending() {
      try {
        // reload from localStorage/last saved
        const saved = localStorage.getItem('informacionAcudiente.tableData');
        if (saved) {
          const parsed = JSON.parse(saved);
          tableData.value = parsed.map(r => ({ nombre: r.nombre || '', documento: r.documento || '', correo: r.correo || '', telefono: r.telefono || '', Direccion: r.Direccion || '', Profesion: r.Profesion || '', id: r.id || null, _unsaved: false, _dirty: false }));
        } else {
          tableData.value = [];
        }
      } catch(e){ void 0; }
    }

    // save debounce timers per-row (keyed by index if no id, otherwise by id)
    const editTimers = new Map();
    // per-row status: 'idle' | 'saving' | 'error'
    // ensureRowStatusLength ensures rowStatus array length matches table rows
    function ensureRowStatusLength(n){ while(rowStatus.value.length < n) rowStatus.value.push('idle'); }

    function scheduleSave(key, fn, delay = 800){
      try {
        if (editTimers.has(key)) clearTimeout(editTimers.get(key));
        editTimers.set(key, setTimeout(() => { try { fn(); } catch(e){ void 0; } finally { editTimers.delete(key); } }, delay));
      } catch(e){ void 0; }
    }

    // perform save for a given row index (only for existing rows with id)
    async function saveRowByIndex(index){
      try {
        const row = tableData.value[index];
        if (!row || !row.id) return;
        ensureRowStatusLength(index + 1);
        if (rowStatus.value[index] === 'saving') return;
        rowStatus.value[index] = 'saving';
        const payload = {
          nombre: row.nombre || '',
          documento: row.documento || '',
          correo: row.correo || '',
          telefono: row.telefono || '',
          direccion: row.Direccion || '',
          profesion: row.Profesion || ''
        };
        try {
          const res = await playersStore.updateAcudiente(row.id, payload);
          // merge returned fields into row
          if (res && typeof res === 'object') {
            tableData.value[index] = { ...tableData.value[index], ...res, _dirty: false };
          } else {
            tableData.value[index]._dirty = false;
          }
          rowStatus.value[index] = 'idle';
        } catch (e) {
          rowStatus.value[index] = 'error';
          setTimeout(() => { try { if (rowStatus.value[index] === 'error') rowStatus.value[index] = 'idle'; } catch(e){ void 0; } }, 2500);
        }
      } catch(e){ void 0; }
    }

    // markDirty: set dirty flag and schedule auto-save for existing rows
    function markDirty(index) {
      try {
        if (tableData.value[index]) tableData.value[index]._dirty = true;
        const row = tableData.value[index];
        // Only auto-save if this row already exists on backend (has id) and is not a transient _unsaved
        if (row && row.id && !row._unsaved) {
          const key = `acudiente:id:${row.id}`;
          scheduleSave(key, () => saveRowByIndex(index));
        }
      } catch (e) { void 0; }
    }

    return {
      tableData,
      currentSection,
      sections,
      nextSection,
      prevSection,
      isMobileOrTablet,
      getColumnsToDisplay,
      addRow,
      removeRow,
      columnLabels,
      acudientes,
      getPendingChanges,
      commitResult,
      discardPending
      ,hasInvalidPendingChanges,
      getInvalidPendingDetails,
      markDirty
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
        <tr v-for="(row, index) in tableData" :key="index">
          <td><span class="user-icon">👤</span></td>
          <td v-for="col in (isMobileOrTablet ? sections.flat().slice(currentSection, currentSection + getColumnsToDisplay()) : sections.flat())" :key="col">
            <textarea v-if="col === 'nombre'" v-model="acudientes[index]" class="editable-cell" @input="() => markDirty(index)"></textarea>
            <textarea v-else v-model="row[col]" class="editable-cell" @input="() => markDirty(index)"></textarea>
          </td>
          <td>
            <!-- Per-row Save/Cancel removed. Parent InformacionPersonal handles commit/cancel globally -->
            <button @click="removeRow(index)" class="remove-row-btn">Eliminar</button>
          
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Styles for InformacionAcudiente moved to ../stylecomponents.css */
</style>
