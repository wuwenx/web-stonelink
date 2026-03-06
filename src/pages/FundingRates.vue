<template>
  <div class="funding-page">
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">
            资金费率
          </h1>
          <el-tag type="info" size="small">
            合约
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header table-card-header">
          <span class="card-title">多交易所资金费率</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="downloadAllData">
              下载全部数据
            </el-button>
            <el-button type="primary" size="small" :loading="loading" @click="fetchData">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="table-wrap">
        <table class="funding-table">
          <thead>
            <tr>
              <th class="col-coin">
                币种
              </th>
              <th
                v-for="ex in exchangeColumns"
                :key="ex.id"
                class="col-exchange sortable"
                :class="{ sorted: sortColumn === ex.id, [sortOrder]: sortColumn === ex.id }"
                @click="handleSort(ex.id)"
              >
                {{ ex.name }}
                <span class="sort-icon" :class="{ active: sortColumn === ex.id }">
                  {{ sortColumn === ex.id ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅' }}
                </span>
              </th>
              <th
                v-if="showDiffColumn"
                class="col-exchange col-diff sortable"
                :class="{ sorted: sortColumn === 'diff', [sortOrder]: sortColumn === 'diff' }"
                @click="handleSort('diff')"
              >
                差值(Toobit-Binance)
                <span class="sort-icon" :class="{ active: sortColumn === 'diff' }">
                  {{ sortColumn === 'diff' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="base in displayRows" :key="base">
              <tr class="data-row">
                <td class="col-coin">
                  <span class="coin-label">{{ base }}</span>
                </td>
                <td v-for="ex in exchangeColumns" :key="ex.id" class="col-rate">
                  <span :class="rateCellClass(getRate(base, ex.id))">{{ formatRate(getRate(base, ex.id)) }}</span>
                </td>
                <td v-if="showDiffColumn" class="col-rate">
                  <span :class="rateCellClass(getDiff(base))">{{ formatRate(getDiff(base)) }}</span>
                </td>
              </tr>
              <tr v-if="hasPredictedRow(base)" class="predicted-row">
                <td class="col-coin sub-label">
                  预测费率
                </td>
                <td v-for="ex in exchangeColumns" :key="ex.id" class="col-rate">
                  <span :class="rateCellClass(getNextRate(base, ex.id))">{{ formatRate(getNextRate(base, ex.id)) }}</span>
                </td>
                <td v-if="showDiffColumn" class="col-rate">
                  <span :class="rateCellClass(getNextDiff(base))">{{ formatRate(getNextDiff(base)) }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!loading && symbolRows.length === 0" class="empty-tip">
          暂无数据
        </div>
        <div v-if="!loading && symbolRows.length > 0 && displayCount < symbolRows.length" class="load-more-wrap">
          <span class="count-tip">已展示 {{ displayCount }} / {{ symbolRows.length }} 条</span>
          <el-button type="primary" size="large" class="load-more-btn" @click="loadMore">
            加载更多
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getFundingRates, SUPPORTED_EXCHANGES } from '../services/fundingRatesApi';
import { useSymbolStore } from '../stores/symbol';

const symbolStore = useSymbolStore();

const EXCHANGE_LABELS = {
  binance_usdm: 'Binance',
  toobit: 'Toobit',
  okx: 'OKX',
  bybit: 'Bybit',
  gateio: 'Gate',
  bitget: 'Bitget',
};

/** 从 store 取合约币种列表时使用的交易所（币种顺序以此为准） */
const SYMBOLS_EXCHANGE = 'toobit';

const BINANCE_ID = 'binance_usdm';
const TOOBIT_ID = 'toobit';

/** 是否有币安和 Toobit，用于显示差值列 */
const showDiffColumn = computed(() =>
  SUPPORTED_EXCHANGES.includes(BINANCE_ID) && SUPPORTED_EXCHANGES.includes(TOOBIT_ID)
);

const loading = ref(false);
const rawData = ref({}); // { exchangeId: [ { symbol, funding_rate, next_funding_rate, ... } ] }

const exchangeColumns = computed(() => {
  return SUPPORTED_EXCHANGES.map(id => ({ id, name: EXCHANGE_LABELS[id] || id }));
});

/** 仅匹配 "xxx/USDT:USDT" 格式的永续合约，带后缀的如 BTC/USDT:USDT-260626 忽略 */
function isUsdtPerpSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  return /^[^/]+\/USDT:USDT$/i.test(symbol.trim());
}

/** 统一解析 base，供 symbols 与资金费率两边匹配用
 *  - symbols: BTC-SWAP-USDT -> BTC
 *  - 资费:    IP/USDT:USDT -> IP，BTC/USDT:USDT -> BTC，BTCUSDT -> BTC
 */
function parseBase(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  const s = symbol.trim().toUpperCase();
  if (!s) return '';
  if (s.includes('-SWAP-')) return s.split('-SWAP-')[0].trim() || '';
  const part = s.split(':')[0].trim();
  if (!part) return '';
  const slash = part.indexOf('/');
  if (slash > 0) return part.slice(0, slash).trim();
  const quotes = ['USDT', 'USDC', 'BUSD', 'USD', 'TUSD'];
  for (const q of quotes) {
    if (part.endsWith(q) && part.length > q.length) return part.slice(0, -q.length).trim();
  }
  return part;
}

/** 币种排序：常用在前，其余按字母 */
function sortBases(bases) {
  const order = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'MATIC'];
  return [...bases].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

/** 按交易所汇总：exchangeId -> Map(base -> item)，仅纳入 xxx/USDT:USDT 格式的资费 */
const byExchangeBase = computed(() => {
  const out = {};
  for (const exId of SUPPORTED_EXCHANGES) {
    out[exId] = new Map();
    const list = rawData.value[exId] || [];
    for (const item of list) {
      if (!isUsdtPerpSymbol(item.symbol)) continue;
      const base = parseBase(item.symbol);
      if (base) out[exId].set(base, item);
    }
  }
  return out;
});

/** 表格行：优先用 store 里该交易所合约 symbol 解析出的 base 列表，否则回退为资金费率里出现过的 base */
const symbolRows = computed(() => {
  const list = symbolStore.getSymbolsByExchangeAndType(SYMBOLS_EXCHANGE, 'contract') || [];
  const set = new Set();
  for (const s of list) {
    const sym = s.symbol || s.id || s.base;
    const base = sym ? parseBase(sym) : (s.base || '').toString().toUpperCase();
    if (base) set.add(base);
  }
  if (set.size > 0) return sortBases([...set]);
  for (const exId of SUPPORTED_EXCHANGES) {
    const rateList = rawData.value[exId] || [];
    for (const item of rateList) {
      if (!isUsdtPerpSymbol(item.symbol)) continue;
      const base = parseBase(item.symbol);
      if (base) set.add(base);
    }
  }
  return sortBases([...set]);
});

/** 默认展示条数 */
const DEFAULT_PAGE_SIZE = 50;
/** 当前展示条数 */
const displayCount = ref(DEFAULT_PAGE_SIZE);

/** 排序列：交易所 id 或 'diff'，null 表示不排序（保持 symbolRows 原序） */
const sortColumn = ref(null);
/** 排序方向 */
const sortOrder = ref('asc');

/** 根据当前排序列与方向排序后的币种列表 */
const sortedRows = computed(() => {
  const rows = symbolRows.value;
  const col = sortColumn.value;
  const order = sortOrder.value;
  if (!col || !rows.length) return rows;
  const isAsc = order === 'asc';
  const getValue = col === 'diff' ? base => getDiff(base) : base => getRate(base, col);
  return [...rows].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    const na = va != null ? Number(va) : NaN;
    const nb = vb != null ? Number(vb) : NaN;
    const aNull = Number.isNaN(na);
    const bNull = Number.isNaN(nb);
    if (aNull && bNull) return 0;
    if (aNull) return isAsc ? 1 : 1;
    if (bNull) return isAsc ? -1 : -1;
    if (na !== nb) return isAsc ? na - nb : nb - na;
    return a.localeCompare(b);
  });
});

/** 当前页展示的币种（排序后取前 displayCount 条） */
const displayRows = computed(() => sortedRows.value.slice(0, displayCount.value));

function handleSort(column) {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortOrder.value = 'asc';
  }
}

function loadMore() {
  displayCount.value = Math.min(displayCount.value + DEFAULT_PAGE_SIZE, symbolRows.value.length);
}

function getRate(base, exchangeId) {
  const map = byExchangeBase.value[exchangeId];
  if (!map) return null;
  const item = map.get(base);
  return item?.funding_rate != null ? item.funding_rate : null;
}

function getNextRate(base, exchangeId) {
  const map = byExchangeBase.value[exchangeId];
  if (!map) return null;
  const item = map.get(base);
  return item?.next_funding_rate != null ? item.next_funding_rate : null;
}

/** 差值 = Toobit - Binance（当前费率） */
function getDiff(base) {
  const toobit = getRate(base, TOOBIT_ID);
  const binance = getRate(base, BINANCE_ID);
  if (toobit == null && binance == null) return null;
  const t = Number(toobit);
  const b = Number(binance);
  if (Number.isNaN(t) && Number.isNaN(b)) return null;
  return (Number.isNaN(t) ? 0 : t) - (Number.isNaN(b) ? 0 : b);
}

/** 预测费率差值 = Toobit - Binance */
function getNextDiff(base) {
  const toobit = getNextRate(base, TOOBIT_ID);
  const binance = getNextRate(base, BINANCE_ID);
  if (toobit == null && binance == null) return null;
  const t = Number(toobit);
  const b = Number(binance);
  if (Number.isNaN(t) && Number.isNaN(b)) return null;
  return (Number.isNaN(t) ? 0 : t) - (Number.isNaN(b) ? 0 : b);
}

function hasPredictedRow(base) {
  return exchangeColumns.value.some(ex => getNextRate(base, ex.id) != null);
}

/** 资金费率：原始值为小数，×100 后加 %；极小非零值用科学计数法避免显示成 0.0000% */
function formatRate(rate) {
  if (rate == null || rate === '') return '--';
  const n = Number(rate);
  if (Number.isNaN(n)) return '--';
  const pct = n * 100;
  // if (pct !== 0 && Math.abs(pct) < 1e-4) return pct.toExponential(2) + '%';
  return pct.toFixed(6) + '%';
}

function rateCellClass(rate) {
  if (rate == null) return 'rate-cell';
  const n = Number(rate);
  if (n > 0) return 'rate-cell up';
  if (n < 0) return 'rate-cell down';
  return 'rate-cell';
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await getFundingRates({ exchange: SUPPORTED_EXCHANGES.join(',') });
    rawData.value = data || {};
    displayCount.value = DEFAULT_PAGE_SIZE;
  } catch (e) {
    rawData.value = {};
  } finally {
    loading.value = false;
  }
}

/** 下载全部数据为 CSV（含币种、各交易所费率、差值）；数值前加 \t 让 Excel 按文本显示，避免折叠/科学计数法 */
function downloadAllData() {
  const rows = symbolRows.value;
  if (!rows.length) return;
  const binanceLabel = EXCHANGE_LABELS[BINANCE_ID] || BINANCE_ID;
  const toobitLabel = EXCHANGE_LABELS[TOOBIT_ID] || TOOBIT_ID;
  const headers = showDiffColumn.value
    ? ['币种', binanceLabel, toobitLabel, '差值(Toobit-Binance)']
    : ['币种', ...exchangeColumns.value.map(ex => ex.name)];
  const escapeCsv = v => {
    const s = v == null ? '' : String(v);
    return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  /** 费率单元格前加制表符，Excel 会当文本显示，完整展开不折叠 */
  const escapeCsvRate = v => escapeCsv(v == null ? '' : '\t' + String(v));
  const lines = [headers.map(escapeCsv).join(',')];
  for (const base of rows) {
    const binanceRate = getRate(base, BINANCE_ID);
    const toobitRate = getRate(base, TOOBIT_ID);
    const binanceStr = formatRate(binanceRate);
    const toobitStr = formatRate(toobitRate);
    if (showDiffColumn.value) {
      const diff = getDiff(base);
      lines.push([base, binanceStr, toobitStr, formatRate(diff)].map((s, i) => (i === 0 ? escapeCsv(s) : escapeCsvRate(s))).join(','));
    } else {
      const cells = [base, ...exchangeColumns.value.map(ex => formatRate(getRate(base, ex.id)))];
      lines.push(cells.map((s, i) => (i === 0 ? escapeCsv(s) : escapeCsvRate(s))).join(','));
    }
  }
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `资金费率-${new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  // symbolStore.fetchSymbols({ exchange: SYMBOLS_EXCHANGE, type: 'contract' }).catch(() => {});
  fetchData();
});
</script>

<style scoped>
.funding-page {
  padding: 32px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

.header-card,
.table-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.header-card:hover,
.table-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 212, 255, 0.1) !important;
  padding: 16px 24px !important;
}

:deep(.el-card__body) {
  padding: 20px 24px !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-card-header {
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #e4e8f0;
}

.table-wrap {
  min-height: 200px;
  overflow-x: auto;
}

.funding-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.funding-table th,
.funding-table td {
  padding: 12px 16px;
  text-align: right;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.funding-table th {
  background: rgba(0, 0, 0, 0.4);
  color: #a0aec0;
  font-weight: 600;
}

.funding-table thead th.col-coin {
  background: rgba(0, 0, 0, 0.5);
}

.funding-table .col-coin {
  text-align: left;
  min-width: 100px;
  position: sticky;
  left: 0;
  background: rgba(26, 31, 46, 0.95);
  z-index: 1;
}

.funding-table .col-exchange {
  min-width: 120px;
}

.funding-table .col-diff {
  min-width: 140px;
  color: #00d4ff;
}

.funding-table th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.funding-table th.sortable:hover {
  color: #00d4ff;
}

.funding-table th.sortable .sort-icon {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.6;
}

.funding-table th.sortable .sort-icon.active {
  opacity: 1;
  color: #00d4ff;
}

.data-row .col-coin {
  background: rgba(26, 31, 46, 0.98);
}

.predicted-row .col-coin {
  background: rgba(13, 17, 23, 0.98);
}

.sub-label {
  font-size: 12px;
  color: #718096;
  padding-left: 24px;
}

.coin-label {
  font-weight: 600;
  color: #e4e8f0;
}

.rate-cell {
  font-variant-numeric: tabular-nums;
  color: #e4e8f0;
}

.rate-cell.up {
  color: #00ff88;
  font-weight: 600;
}

.rate-cell.down {
  color: #ff4757;
  font-weight: 600;
}

.empty-tip {
  text-align: center;
  padding: 48px;
  color: #718096;
}

.load-more-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.load-more-wrap .count-tip {
  font-size: 14px;
  color: #a0aec0;
}

.load-more-wrap .load-more-btn {
  min-width: 160px;
  font-size: 15px;
}

@media (max-width: 768px) {
  .funding-page {
    padding: 16px;
  }
}
</style>
