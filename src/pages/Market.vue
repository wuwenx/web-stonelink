<template>
  <div class="market-page">
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">
            市场行情
          </h1>
          <el-tag v-if="marketStore.wsStatus === 'connected'" type="success" size="small">
            实时
          </el-tag>
          <el-tag v-else type="info" size="small">
            已断开
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header table-card-header">
          <div class="table-header-left">
            <span class="card-title">24h 行情</span>
            <span class="exchange-label">交易所: toobit</span>
          </div>
        </div>
      </template>

      <div class="table-wrap" :class="{ loading }">
        <el-table
          v-loading="loading"
          :data="tableData"
          stripe
          border
          class="market-table"
          empty-text="暂无数据"
        >
          <el-table-column label="交易对" min-width="140" fixed>
            <template #default="{ row }">
              <router-link :to="`/symbol/${row.id}`" class="symbol-link">
                {{ row.symbol || row.id }}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column prop="c" label="最新价" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text" :style="priceChangeStyle(row)">{{ formatNum(row.c) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="o" label="开盘价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatNum(row.o) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="h" label="最高价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text up">{{ formatNum(row.h) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="l" label="最低价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text down">{{ formatNum(row.l) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="v" label="成交量" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatVol(row.v) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="qv" label="成交额" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatVol(row.qv) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pc" label="涨跌额" min-width="100" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text" :style="priceChangeStyle(row)">{{ formatNum(row.pc) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pcp" label="涨跌幅" min-width="100" align="right" sortable>
            <template #default="{ row }">
              <span
                class="num-text pcp-cell"
                :style="pcpCellStyle(row)"
              >{{ formatPcp(row.pcp) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { toStandardSymbol } from '../config/exchanges';
import { getSymbolsCcxtContracts } from '../services/symbolApi';
import { useDepthStore } from '../stores/depth';
import { useMarketStore } from '../stores/market';

const depthStore = useDepthStore();
const marketStore = useMarketStore();

const apiType = computed(() =>
  depthStore.config.exchangeType === 'futures' ? 'contract' : 'spot'
);

const page = ref(1);
const pageSize = ref(50);
const symbolItems = ref([]);
const total = ref(0);
const loadingSymbols = ref(false);

const loading = computed(() => loadingSymbols.value);

const exchange = 'toobit';

async function fetchSymbolsPage() {
  loadingSymbols.value = true;
  try {
    const res = await getSymbolsCcxtContracts({
      exchange,
      market_type: apiType.value,
      page: page.value,
      page_size: pageSize.value,
    });
    symbolItems.value = res.items || [];
    total.value = res.total ?? 0;
    return symbolItems.value;
  } catch (e) {
    symbolItems.value = [];
    total.value = 0;
    return [];
  } finally {
    loadingSymbols.value = false;
  }
}

/** 当前展示页的 symbol 列表（CCXT 格式如 ETH/USDT），用于 WS 订阅 */
function currentPageSymbols() {
  const list = symbolItems.value || [];
  return list.map(row => row.symbol || row.id).filter(Boolean);
}

function mergeTicker(row) {
  const ticker = (marketStore.tickerList || []).find(
    t => toStandardSymbol((t.s || '').toUpperCase()) === (row.id || '').toUpperCase() || (t.s || '').toUpperCase() === (row.id || '').toUpperCase()
  );
  return ticker ? { ...row, ...ticker } : { ...row };
}

const tableData = computed(() => {
  const list = symbolItems.value || [];
  const merged = list.map(row => mergeTicker(row));
  return [...merged].sort((a, b) => (Number(b.qv) || 0) - (Number(a.qv) || 0));
});

function formatNum(val) {
  if (val == null || val === '' || val === undefined) return '--';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
}

function formatVol(val) {
  if (val == null || val === '' || val === undefined) return '--';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatPcp(val) {
  if (val == null || val === '' || val === undefined) return '--';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  const p = (n * 100).toFixed(2);
  return (Number(p) >= 0 ? '+' : '') + p + '%';
}

function priceChangeStyle(row) {
  const pcp = row.pcp != null && row.pcp !== '' ? Number(row.pcp) : 0;
  if (pcp > 0) return { color: '#00ff88', fontWeight: 600 };
  if (pcp < 0) return { color: '#ff4757', fontWeight: 600 };
  return {};
}

function pcpCellStyle(row) {
  const style = { ...priceChangeStyle(row), padding: '2px 6px', borderRadius: '4px' };
  if (style.color === '#00ff88') style.backgroundColor = 'rgba(0, 255, 136, 0.08)';
  if (style.color === '#ff4757') style.backgroundColor = 'rgba(255, 71, 87, 0.08)';
  return style;
}

function onPageChange(p) {
  page.value = p;
  fetchSymbolsPage().then(() => {
    marketStore.updateTickerSymbols(currentPageSymbols());
  });
}

function onSizeChange(size) {
  pageSize.value = size;
  page.value = 1;
  fetchSymbolsPage().then(() => {
    marketStore.updateTickerSymbols(currentPageSymbols());
  });
}

onMounted(async() => {
  await fetchSymbolsPage();
  marketStore.startTickers(exchange, apiType.value, currentPageSymbols());
});

watch(() => depthStore.config.exchangeType, async() => {
  page.value = 1;
  await fetchSymbolsPage();
  marketStore.startTickers(exchange, apiType.value, currentPageSymbols());
});

onUnmounted(() => {
  marketStore.stopWs();
});
</script>

<style scoped>
.market-page {
  padding: 32px 40px;
  max-width: 1400px;
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

.table-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.exchange-label {
  font-size: 14px;
  color: #a0aec0;
}

.table-wrap {
  min-height: 400px;
  position: relative;
}

.table-wrap.loading {
  pointer-events: none;
  opacity: 0.7;
}

.symbol-link {
  color: #00d4ff;
  text-decoration: none;
}

.symbol-link:hover {
  text-decoration: underline;
}

.num-text {
  font-variant-numeric: tabular-nums;
}

.num-text.up {
  color: #00ff88;
  font-weight: 600;
}

.num-text.down {
  color: #ff4757;
  font-weight: 600;
}

.num-text.pcp-cell.up {
  color: #00ff88;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 255, 136, 0.08);
}

.num-text.pcp-cell.down {
  color: #ff4757;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 71, 87, 0.08);
}

:deep(.market-table) {
  --el-table-border-color: rgba(0, 212, 255, 0.1);
  --el-table-header-bg-color: rgba(0, 0, 0, 0.3);
  --el-table-row-hover-bg-color: rgba(0, 212, 255, 0.05);
}

:deep(.market-table .el-table__header th) {
  background: rgba(0, 0, 0, 0.3) !important;
  color: #a0aec0 !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

:deep(.market-table .el-table__body td) {
  border-bottom: 1px solid rgba(0, 212, 255, 0.05);
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.pagination-wrap .el-pagination) {
  --el-pagination-button-bg-color: rgba(0, 0, 0, 0.3);
  --el-pagination-hover-color: #00d4ff;
}

:deep(.pagination-wrap .el-pagination .el-pager li.is-active) {
  background: rgba(0, 212, 255, 0.3) !important;
}

@media (max-width: 768px) {
  .market-page {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
