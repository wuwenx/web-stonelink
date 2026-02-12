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

    <!-- 涨跌幅、成交额排行 -->
    <el-card class="rankings-card" shadow="hover">
      <template #header>
        <div class="card-header rankings-card-header">
          <span class="card-title">排行</span>
          <span class="exchange-label">交易所: toobit · {{ apiType === 'contract' ? '合约' : '现货' }}</span>
        </div>
      </template>
      <div v-loading="rankingsLoading" class="rankings-grid">
        <div class="rank-column">
          <h4 class="rank-title gainers-title">涨幅榜</h4>
          <ul class="rank-list">
            <li v-for="(row, i) in rankings.gainers" :key="row.s + i" class="rank-item">
              <router-link :to="`/symbol/${symbolIdForLink(row.s)}`" class="rank-symbol">{{ row.s }}</router-link>
              <span class="rank-price" :style="priceChangeStyle(row)">{{ formatNum(row.c, getPrecisionForRow(row).min_price) }}</span>
              <span class="rank-pcp up">{{ formatPcpForRank(row.pcp) }}</span>
            </li>
            <li v-if="!rankings.gainers.length" class="rank-item empty">暂无</li>
          </ul>
        </div>
        <div class="rank-column">
          <h4 class="rank-title losers-title">跌幅榜</h4>
          <ul class="rank-list">
            <li v-for="(row, i) in rankings.losers" :key="row.s + i" class="rank-item">
              <router-link :to="`/symbol/${symbolIdForLink(row.s)}`" class="rank-symbol">{{ row.s }}</router-link>
              <span class="rank-price" :style="priceChangeStyle(row)">{{ formatNum(row.c, getPrecisionForRow(row).min_price) }}</span>
              <span class="rank-pcp down">{{ formatPcpForRank(row.pcp) }}</span>
            </li>
            <li v-if="!rankings.losers.length" class="rank-item empty">暂无</li>
          </ul>
        </div>
        <div class="rank-column">
          <h4 class="rank-title volume-title">成交额榜</h4>
          <ul class="rank-list">
            <li v-for="(row, i) in rankings.by_volume" :key="row.s + i" class="rank-item">
              <router-link :to="`/symbol/${symbolIdForLink(row.s)}`" class="rank-symbol">{{ row.s }}</router-link>
              <span class="rank-price">{{ formatNum(row.c, getPrecisionForRow(row).min_price) }}</span>
              <span class="rank-qv">{{ formatVol(row.qv, getPrecisionForRow(row).min_qty) }}</span>
            </li>
            <li v-if="!rankings.by_volume.length" class="rank-item empty">暂无</li>
          </ul>
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
                {{ row.id || row.symbol }}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column prop="c" label="最新价" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text" :style="priceChangeStyle(row)">{{ formatNum(row.c, getPrecisionForRow(row).min_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="o" label="开盘价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatNum(row.o, getPrecisionForRow(row).min_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="h" label="最高价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text up">{{ formatNum(row.h, getPrecisionForRow(row).min_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="l" label="最低价" min-width="110" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text down">{{ formatNum(row.l, getPrecisionForRow(row).min_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="v" label="成交量" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatVol(row.v, getPrecisionForRow(row).min_qty) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="qv" label="成交额" min-width="120" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text">{{ formatVol(row.qv, getPrecisionForRow(row).min_qty) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pc" label="涨跌额" min-width="100" align="right" sortable>
            <template #default="{ row }">
              <span class="num-text" :style="priceChangeStyle(row)">{{ formatNum(row.pc, getPrecisionForRow(row).min_price) }}</span>
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
import BigNumber from 'bignumber.js';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { toStandardSymbol } from '../config/exchanges';
import { getSymbolsCcxtContracts } from '../services/symbolApi';
import { getTicker24hr, getTickerRankings } from '../services/tickerApi';
import { useDepthStore } from '../stores/depth';
import { useMarketStore } from '../stores/market';
import { useSymbolStore } from '../stores/symbol';

const depthStore = useDepthStore();
const marketStore = useMarketStore();
const symbolStore = useSymbolStore();

const apiType = computed(() =>
  depthStore.config.exchangeType === 'futures' ? 'contract' : 'spot'
);

const page = ref(1);
const pageSize = ref(20);
const symbolItems = ref([]);
const total = ref(0);
const loadingSymbols = ref(false);

const loading = computed(() => loadingSymbols.value);

const exchange = 'toobit';

// 排行数据
const rankings = ref({ gainers: [], losers: [], by_volume: [] });
const rankingsLoading = ref(false);
let rankingsFirstLoad = true;

/** 排行接口：exchange, type(spot/contract), limit(1~20) */
async function fetchRankings() {
  if (rankingsFirstLoad) {
    rankingsLoading.value = true;
    rankingsFirstLoad = false;
  }
  try {
    const data = await getTickerRankings({
      exchange,
      type: apiType.value,
      limit: 5,
    });
    rankings.value = data;
  } catch (e) {
    rankings.value = { gainers: [], losers: [], by_volume: [] };
  } finally {
    rankingsLoading.value = false;
  }
}

/** 跳转详情页的 symbol 使用后端返回的 s，若为 SWAP 可转标准格式 */
function symbolIdForLink(s) {
  if (!s) return '';
  const swapMatch = String(s).match(/^([A-Z0-9-]+)-SWAP-([A-Z]+)$/i);
  if (swapMatch) return `${swapMatch[1]}${swapMatch[2]}`;
  return s.replace(/-/g, '');
}

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

/** 拉取 24hr 全量并写入 store，用于表格首屏展示，避免等 WS 才有数据 */
async function fillTickersFrom24hr() {
  try {
    const list = await getTicker24hr({
      exchange,
      type: apiType.value === 'contract' ? undefined : 'spot',
    });
    marketStore.setInitialTickersFrom24hr(Array.isArray(list) ? list : []);
  } catch (e) {
    marketStore.setInitialTickersFrom24hr([]);
  }
}

/** 当前展示页的 symbol 列表（CCXT 格式如 ETH/USDT），用于 WS 订阅 */
function currentPageSymbols() {
  const list = symbolItems.value || [];
  return list.map(row => row.symbol || row.id).filter(Boolean);
}

function mergeTicker(row) {
  const rowKey = toStandardSymbol((row.id || row.symbol || '').toUpperCase());
  const ticker = (marketStore.tickerList || []).find(
    t => toStandardSymbol((t.s || '').toUpperCase()) === rowKey || (t.s || '').toUpperCase() === (row.id || '').toUpperCase()
  );
  return ticker ? { ...row, ...ticker } : { ...row };
}

const tableData = computed(() => {
  const list = symbolItems.value || [];
  const merged = list.map(row => mergeTicker(row));
  return [...merged].sort((a, b) => {
    const qvB = new BigNumber(b.qv || 0);
    const qvA = new BigNumber(a.qv || 0);
    return qvB.comparedTo(qvA);
  });
});

/** 从 store 的 api/v1/symbols 数据中取当前行的精度（min_price, min_qty）；表格行用 symbol/id，排行行用 s */
function getPrecisionForRow(row) {
  const list = symbolStore.getSymbolsByExchangeAndType(exchange, apiType.value) || [];
  const sym = row.symbol || row.id || row.s || '';
  const key = toStandardSymbol(String(sym).toUpperCase());
  const found = list.find(
    s => toStandardSymbol(String(s.symbol || s.id || '').toUpperCase()) === key || (s.symbol || s.id || '') === sym
  );
  return found ? { min_price: found.min_price, min_qty: found.min_qty } : {};
}

/** 去掉小数尾部多余的 0（如 1.200 -> 1.2） */
function stripTrailingZeros(str) {
  if (str == null || typeof str !== 'string') return str;
  return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/** 根据最小单位（如 0.1、0.001）计算小数位数 */
function decimalPlacesFromMin(minVal) {
  if (minVal == null || minVal === '') return null;
  const bn = new BigNumber(minVal);
  if (!bn.isFinite() || bn.lte(0)) return null;
  if (bn.gte(1)) return 0;
  const str = bn.toFixed();
  const i = str.indexOf('.');
  return i === -1 ? 0 : str.length - i - 1;
}

/** 价格：有 min_price 时按精度，否则沿用原逻辑；去掉尾部多余 0 */
function formatNum(val, minPrice) {
  if (val == null || val === '' || val === undefined) return '--';
  const bn = new BigNumber(val);
  if (!bn.isFinite()) return String(val);
  const dp = minPrice != null && minPrice !== '' ? decimalPlacesFromMin(minPrice) : null;
  if (bn.gte(1e8)) return stripTrailingZeros(bn.div(1e8).toFixed(2)) + '亿';
  if (bn.gte(1e4)) return stripTrailingZeros(dp != null ? bn.toFixed(dp) : bn.toFormat(4, BigNumber.ROUND_DOWN));
  const decimals = dp != null ? dp : 8;
  return stripTrailingZeros(bn.toFormat(decimals, BigNumber.ROUND_DOWN, { groupSeparator: ',', decimalSeparator: '.' }));
}

/** 成交量/成交额：有 min_qty 时按精度，否则沿用原逻辑；去掉尾部多余 0 */
function formatVol(val, minQty) {
  if (val == null || val === '' || val === undefined) return '--';
  const bn = new BigNumber(val);
  if (!bn.isFinite()) return String(val);
  const dp = minQty != null && minQty !== '' ? decimalPlacesFromMin(minQty) : null;
  if (bn.gte(1e8)) return stripTrailingZeros(bn.div(1e8).toFixed(2)) + '亿';
  if (bn.gte(1e4)) return stripTrailingZeros(bn.div(1e4).toFixed(dp != null ? dp : 2)) + '万';
  return stripTrailingZeros(bn.toFormat(dp != null ? dp : 4, BigNumber.ROUND_DOWN, { groupSeparator: ',', decimalSeparator: '.' }));
}

function formatPcp(val) {
  if (val == null || val === '' || val === undefined) return '--';
  const bn = new BigNumber(val);
  if (!bn.isFinite()) return String(val);
  const p = stripTrailingZeros(bn.times(100).toFixed(2));
  return (bn.gte(0) ? '+' : '') + p + '%';
}

/** 排行用：后端返回小数比例（如 0.155=15.5%、1.4424=144.24%），统一乘 100 再展示；去掉尾部多余 0 */
function formatPcpForRank(val) {
  if (val == null || val === '' || val === undefined) return '--';
  const bn = new BigNumber(val);
  if (!bn.isFinite()) return String(val);
  const p = stripTrailingZeros(bn.times(100).toFixed(2));
  return (bn.gte(0) ? '+' : '') + p + '%';
}

function priceChangeStyle(row) {
  const pcp = row.pcp != null && row.pcp !== '' ? new BigNumber(row.pcp) : new BigNumber(0);
  if (pcp.gt(0)) return { color: '#00ff88', fontWeight: 600 };
  if (pcp.lt(0)) return { color: '#ff4757', fontWeight: 600 };
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

let rankingsTimer = null;

onMounted(async() => {
  // 拉取 api/v1/symbols 以得到 min_price/min_qty，供表格精度展示
  // symbolStore.fetchSymbols({ exchange, type: apiType.value }).catch(() => {});
  fetchRankings();
  await fetchSymbolsPage();
  await fillTickersFrom24hr();
  marketStore.startTickers(exchange, apiType.value, currentPageSymbols());
  rankingsTimer = setInterval(fetchRankings, 10000);
});

watch(() => depthStore.config.exchangeType, async() => {
  page.value = 1;
  // symbolStore.fetchSymbols({ exchange, type: apiType.value }).catch(() => {});
  fetchRankings();
  await fetchSymbolsPage();
  await fillTickersFrom24hr();
  marketStore.startTickers(exchange, apiType.value, currentPageSymbols());
});

onUnmounted(() => {
  if (rankingsTimer) {
    clearInterval(rankingsTimer);
    rankingsTimer = null;
  }
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

/* 排行卡片 */
.rankings-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.rankings-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.rankings-card-header {
  flex-wrap: wrap;
  gap: 12px;
}

.rankings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.rank-column {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.rank-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #a0aec0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.gainers-title { color: #00ff88; }
.losers-title { color: #ff4757; }
.volume-title { color: #00d4ff; }

.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-item.empty {
  color: #718096;
  justify-content: center;
}

.rank-symbol {
  flex: 1;
  min-width: 0;
  color: #00d4ff;
  text-decoration: none;
  font-weight: 600;
}

.rank-symbol:hover {
  text-decoration: underline;
}

.rank-price {
  font-variant-numeric: tabular-nums;
  color: #e4e8f0;
}

.rank-pcp {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  min-width: 64px;
  text-align: right;
}

.rank-pcp.up { color: #00ff88; }
.rank-pcp.down { color: #ff4757; }

.rank-qv {
  font-variant-numeric: tabular-nums;
  color: #a0aec0;
  font-size: 12px;
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

  .rankings-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-card-header,
  .rankings-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
