<script>
export default {
    name: "PagosMensualesComponent",
};
</script>

<script setup>
import { ref, computed, onMounted, onUpdated, onUnmounted } from 'vue';
import HeaderComponent from './cabecera.vue';
import '../stylecomponents.css';

const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const currentMonthIndex = ref(0);
const visibleMonths = computed(() => months.slice(currentMonthIndex.value, currentMonthIndex.value + 3));

const data = ref([
  { id: 1, name: 'nombre1', estrato: 'x1', monthValues: { ENE: 'dato1', FEB: 'dato2', MAR: 'dato3', ABR: 'dato4', MAY: 'dato5', JUN: 'dato6', JUL: 'dato7', AGO: 'dato8', SEP: 'dato9', OCT: 'dato10', NOV: 'dato11', DIC: 'dato12' } },
  { id: 2, name: 'nombre2', estrato: 'x2', monthValues: { ENE: 'dato13', FEB: 'dato14', MAR: 'dato15', ABR: 'dato16', MAY: 'dato17', JUN: 'dato18', JUL: 'dato19', AGO: 'dato20', SEP: 'dato21', OCT: 'dato22', NOV: 'dato23', DIC: 'dato24' } },
  { id: 3, name: 'nombre3', estrato: 'x3', monthValues: { ENE: 'dato25', FEB: 'dato26', MAR: 'dato27', ABR: 'dato28', MAY: 'dato29', JUN: 'dato30', JUL: 'dato31', AGO: 'dato32', SEP: 'dato33', OCT: 'dato34', NOV: 'dato35', DIC: 'dato36' } },
  { id: 4, name: 'nombre4', estrato: 'x4', monthValues: { ENE: 'dato37', FEB: 'dato38', MAR: 'dato39', ABR: 'dato40', MAY: 'dato41', JUN: 'dato42', JUL: 'dato43', AGO: 'dato44', SEP: 'dato45', OCT: 'dato46', NOV: 'dato47', DIC: 'dato48' } },
]);

function prevMonth() {
  currentMonthIndex.value = (currentMonthIndex.value - 3 + months.length) % months.length;
}

function nextMonth() {
  currentMonthIndex.value = (currentMonthIndex.value + 3) % months.length;
}

// Auto-resize logic for month textareas
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
  // attach input listeners
  const textareas = document.querySelectorAll('.editable-cell');
  textareas.forEach(t => t.addEventListener('input', autoResizeTextarea));
  applyAutoResize();
  window.addEventListener('resize', applyAutoResize);
});

onUpdated(() => {
  applyAutoResize();
});

onUnmounted(() => {
  const textareas = document.querySelectorAll('.editable-cell');
  textareas.forEach(t => t.removeEventListener('input', autoResizeTextarea));
  window.removeEventListener('resize', applyAutoResize);
});
</script>

<template>

    <HeaderComponent />

    <div class="row my-3">
        <div class="lg-12">
            <div id="cabeza">
                <div class="header-controls">
                    <button class="arrow-btn left" @click="prevMonth">&lt;</button>
                    <h1 class="text-center text-white">mensualidad {{ visibleMonths[0] }} - {{ visibleMonths[visibleMonths.length - 1] }}</h1>
                    <button class="arrow-btn right" @click="nextMonth">&gt;</button>
                </div>

                <div class="mensualidad-wrapper">
                    <div class="table-wrap">
                        <div class="pill">categoria xxxxxxx</div>

                        <table class="mensualidad-table">
                            <thead>
                                <tr>
                                    <th class="num-col">#</th>
                                    <th class="name-col">nombre</th>
                                    <th class="estrato-col">estrato</th>
                                    <th class="month-col" v-for="month in visibleMonths" :key="month">{{ month }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in data" :key="row.id">
                                    <td class="num-col">{{ row.id }}</td>
                                    <td class="name-col">{{ row.name }}</td>
                                    <td class="estrato-col">{{ row.estrato }}</td>
                                    <td class="month-col mark" v-for="month in visibleMonths" :key="month">
                                      <textarea class="editable-cell" v-model="row.monthValues[month]" rows="1"></textarea>
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

<style scoped>
.header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.arrow-btn {
  background: #7f78b2;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 600;
  margin:auto;
  cursor: pointer;
}

.arrow-btn:hover {
  background: #6b6076;
}

.mensualidad-wrapper {
    padding: 12px;
}

.table-wrap {
    background: #dfe1ef;
    margin-top: 12px;
    padding: 10px;
    /* reducido */
    border-radius: 8px;
    border: 6px solid rgba(111, 106, 130, 0.14);
}

.pill {
    display: inline-block;
    background: #7f78b2;
    color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-weight: 600;
}

.mensualidad-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.mensualidad-table thead th {
    color: #6b6076;
    font-weight: 700;
    padding: 4px 6px;
    text-align: left;
}

.mensualidad-table tbody td {
    padding: 4px 6px;
    color: #6b6076;
    vertical-align: middle;
}

/* Column widths: reducir nombre y meses para acercar estrato */
.num-col {
    width: 20px;
}

.name-col {
    width: 20px;
}

.estrato-col {
    width: 50px;
    text-align: center;
}

.month-col {
    width: 60px;
    text-align: center;
}

/* vertical separators for months */
.mensualidad-table thead th.month-col,
.mensualidad-table tbody td.month-col {
    border-left: 1px solid rgba(111, 106, 130, 0.18);
}

/* shade months area */
.mensualidad-table tbody td.mark {
    background: #fff5d6;
}

/* center headers for estrato and months */
.mensualidad-table thead th.estrato-col,
.mensualidad-table thead th.month-col {
    text-align: center;
}

/* remove heavy borders */
.mensualidad-table thead th:first-child {
    border-left: none;
}

.mensualidad-table thead th {
    border-bottom: none;
}

.mensualidad-table tbody tr {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

/* New styles for editable cells */
.editable-cell {
  width: 100%;
  border: none;
  background: transparent;
  color: #6b6076;
  font-size: 14px;
  resize: none;
  overflow: hidden;
  padding: 2px 4px;
  border-radius: 4px;
}

.editable-cell:focus {
  outline: none;
  background: #f0f0f0;
}

/* Media queries */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: row;
    justify-content: space-between;
  }

  .arrow-btn {
    width: auto;
  }

  .mensualidad-wrapper {
    padding: 8px;
  }

  .table-wrap {
    padding: 8px;
    border-width: 4px;
  }

  .pill {
    font-size: 14px;
    padding: 4px 8px;
  }

  .mensualidad-table {
    font-size: 12px;
  }

  .mensualidad-table thead th {
    padding: 2px 4px;
  }

  .mensualidad-table tbody td {
    padding: 2px 4px;
  }

  .num-col {
    width: 15px;
  }

  .name-col {
    width: 80px;
  }

  .estrato-col {
    width: 40px;
  }

  .month-col {
    width: 50px;
  }
}

@media (max-width: 480px) {
  .header-controls {
    flex-direction: row;
    justify-content: space-between;
  }

  .arrow-btn {
    font-size: 12px;
    padding: 4px 8px;
    width: auto;
  }

  .mensualidad-wrapper {
    padding: 6px;
  }

  .table-wrap {
    padding: 6px;
    border-width: 3px;
  }

  .pill {
    font-size: 12px;
    padding: 3px 6px;
  }

  .mensualidad-table {
    font-size: 10px;
  }

  .mensualidad-table thead th {
    padding: 1px 2px;
  }

  .mensualidad-table tbody td {
    padding: 1px 2px;
  }

  .num-col {
    width: 10px;
  }

  .name-col {
    width: 60px;
  }

  .estrato-col {
    width: 30px;
  }

  .month-col {
    width: 40px;
  }
}
</style>
