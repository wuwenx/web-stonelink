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
        <div class="header-right">
          <el-button type="primary" size="small" :loading="marketStore.loading" @click="refresh">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header table-card-header">
          <div class="table-header-left">
            <span class="card-title">24h 行情</span>
            <span class="exchange-label">交易所: {{ marketStore.exchange }}</span>
          </div>
          <div class="quote-toggle">
            <span
              v-for="q in ['USDT', 'USDC']"
              :key="q"
              :class="['quote-tab', { active: quoteSuffix === q }]"
              @click="quoteSuffix = q"
            >
              {{ q }}
            </span>
          </div>
        </div>
      </template>

      <div class="table-wrap" :class="{ loading: marketStore.loading }">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              :columns="columns"
              :data="tableData"
              :width="width"
              :height="height"
              :row-height="44"
              :sort-by="sortBy"
              fixed
              class="ticker-table-v2"
              @column-sort="onColumnSort"
            >
              <template #empty>
                <div class="table-empty">
                  <el-icon v-if="marketStore.loading" class="is-loading" :size="28">
                    <Loading />
                  </el-icon>
                  <span v-else>暂无数据</span>
                </div>
              </template>
            </el-table-v2>
          </template>
        </el-auto-resizer>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue';
import { TableV2SortOrder } from 'element-plus';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useDepthStore } from '../stores/depth';
import { useMarketStore } from '../stores/market';

const depthStore = useDepthStore();
const marketStore = useMarketStore();

// 头部现货/合约切换 → API type：futures→contract，spot→spot
const apiType = computed(() =>
  depthStore.config.exchangeType === 'futures' ? 'contract' : 'spot'
);
const quoteSuffix = ref('USDT'); // 'USDT' | 'USDC'

// 列排序状态，默认按成交额降序（交易对列不参与排序）
const sortBy = ref({ key: 'qv', order: TableV2SortOrder.DESC });

// 按 s 后缀过滤：合约格式 XXX-USDT，现货格式 XXXUSDT
const filteredTickers = computed(() => {
  const list = marketStore.tickerList || [];
  const suffix = quoteSuffix.value;
  return list.filter(row => {
    const s = (row.s || '').toUpperCase();
    if (s.endsWith(`-${suffix}`)) return true; // 合约格式
    if (s.endsWith(suffix) && !s.includes('-')) return true; // 现货格式
    return false;
  });
});

// 虚拟表格要求每行有 id；先不排序
const filteredTableData = computed(() =>
  (filteredTickers.value || []).map(row => ({ ...row, id: row.s }))
);

// 按当前 sortBy 排序后的表格数据
const tableData = computed(() => {
  const list = filteredTableData.value ?? [];
  const { key, order } = sortBy.value;
  if (!key) return list;
  return [...list].sort((a, b) => {
    const va = Number(a[key]) ?? 0;
    const vb = Number(b[key]) ?? 0;
    const cmp = va - vb;
    return order === TableV2SortOrder.DESC ? -cmp : cmp;
  });
});

function onColumnSort(next) {
  sortBy.value = next;
}

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

// 涨跌颜色：涨=绿、跌=红，用内联样式保证在 table-v2 内生效
function priceChangeStyle(row) {
  const pcp = row.pcp != null && row.pcp !== '' ? Number(row.pcp) : 0;
  if (pcp > 0) return { color: '#00ff88', fontWeight: 600 };
  if (pcp < 0) return { color: '#ff4757', fontWeight: 600 };
  return {};
}

const columns = [
  {
    key: 's',
    dataKey: 's',
    title: '交易对',
    width: 160,
    align: 'left',
    fixed: true,
    cellRenderer: ({ cellData, rowData }) =>
      h(RouterLink, { to: `/symbol/${rowData.s}`, class: 'symbol-link' }, () => cellData ?? rowData.s),
  },
  {
    key: 'c',
    dataKey: 'c',
    title: '最新价',
    width: 120,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData, rowData }) =>
      h('span', { class: 'num-text', style: priceChangeStyle(rowData) }, formatNum(cellData ?? rowData.c)),
  },
  {
    key: 'o',
    dataKey: 'o',
    title: '开盘价',
    width: 120,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData }) => h('span', { class: 'num-text' }, formatNum(cellData)),
  },
  {
    key: 'h',
    dataKey: 'h',
    title: '最高价',
    width: 120,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData }) => h('span', { class: 'num-text up' }, formatNum(cellData)),
  },
  {
    key: 'l',
    dataKey: 'l',
    title: '最低价',
    width: 200,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData }) => h('span', { class: 'num-text down' }, formatNum(cellData)),
  },
  {
    key: 'v',
    dataKey: 'v',
    title: '成交量',
    width: 140,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData }) => h('span', { class: 'num-text' }, formatVol(cellData)),
  },
  {
    key: 'qv',
    dataKey: 'qv',
    title: '成交额',
    width: 140,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData }) => h('span', { class: 'num-text' }, formatVol(cellData)),
  },
  {
    key: 'pc',
    dataKey: 'pc',
    title: '涨跌额',
    width: 120,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData, rowData }) =>
      h('span', { class: 'num-text', style: priceChangeStyle(rowData) }, formatNum(cellData ?? rowData.pc)),
  },
  {
    key: 'pcp',
    dataKey: 'pcp',
    title: '涨跌幅',
    width: 100,
    align: 'right',
    sortable: true,
    cellRenderer: ({ cellData, rowData }) => {
      const style = { ...priceChangeStyle(rowData), padding: '2px 6px', borderRadius: '4px' };
      if (style.color === '#00ff88') style.backgroundColor = 'rgba(0, 255, 136, 0.08)';
      if (style.color === '#ff4757') style.backgroundColor = 'rgba(255, 71, 87, 0.08)';
      return h('span', { class: 'num-text', style }, formatPcp(cellData ?? rowData.pcp));
    },
  },
];

async function refresh() {
  await marketStore.fetchTicker24hr(marketStore.exchange, apiType.value);
}

onMounted(async() => {
  await marketStore.fetchTicker24hr(marketStore.exchange, apiType.value);
  marketStore.initWs();
});

// 监听头部现货/合约切换，自动拉取对应接口
watch(() => depthStore.config.exchangeType, async() => {
  await marketStore.fetchTicker24hr(marketStore.exchange, apiType.value);
  marketStore.initWs();
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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quote-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quote-tab {
  padding: 6px 14px;
  font-size: 13px;
  color: #a0aec0;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.quote-tab:hover {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.08);
}

.quote-tab.active {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.15);
  font-weight: 600;
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
  height: 800px;
  min-height: 400px;
  position: relative;
}

.table-wrap.loading {
  pointer-events: none;
  opacity: 0.7;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #a0aec0;
  gap: 12px;
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

/* 涨：绿 */
.num-text.up {
  color: #00ff88;
  font-weight: 600;
}

/* 跌：红 */
.num-text.down {
  color: #ff4757;
  font-weight: 600;
}

/* 涨跌幅列加强标识 */
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

:deep(.ticker-table-v2) {
  --el-table-border-color: rgba(0, 212, 255, 0.1);
}

:deep(.el-table-v2__header-cell) {
  background: rgba(0, 0, 0, 0.3) !important;
  color: #a0aec0 !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

:deep(.el-table-v2__row-cell) {
  border-bottom: 1px solid rgba(0, 212, 255, 0.05);
}

:deep(.el-table-v2__row:hover .el-table-v2__row-cell) {
  background: rgba(0, 212, 255, 0.05);
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
