<template>
  <div class="kline-page">
    <el-card class="header-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h1 class="page-title">
              K 线图表
            </h1>
            <el-select
              v-model="selectedSymbol"
              placeholder="选择交易对"
              size="large"
              filterable
              class="symbol-select"
              @change="handleSymbolChange"
            >
              <el-option
                v-for="sym in symbolOptions"
                :key="sym"
                :label="sym"
                :value="sym"
              />
            </el-select>
          </div>
        </div>
      </template>
    </el-card>

    <el-card class="chart-card" shadow="hover">
      <KlineChart
        :key="chartKey"
        :symbol="selectedSymbol"
        :is-futures="exchangeType === 'futures'"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import KlineChart from '../components/KlineChart.vue';
import { SYMBOLS } from '../config/exchanges';
import { useDepthStore } from '../stores/depth';
import { useSymbolStore } from '../stores/symbol';

const depthStore = useDepthStore();
const symbolStore = useSymbolStore();

const selectedSymbol = ref('BTCUSDT');
const chartKey = ref(0);

/** 现货/合约由头部统一切换，所有页面统一从 depthStore 读取 */
const exchangeType = computed(() => depthStore.config.exchangeType || 'futures');

const symbolOptions = computed(() => {
  const list = symbolStore.symbolList;
  if (list && list.length > 0) {
    return list;
  }
  return SYMBOLS;
});

function handleSymbolChange() {
  chartKey.value += 1;
}

onMounted(() => {
  if (symbolStore.symbolList?.length > 0 && !symbolStore.symbolList.includes(selectedSymbol.value)) {
    selectedSymbol.value = symbolStore.symbolList[0];
  }
});

// 头部切换现货/合约时刷新图表
watch(
  () => depthStore.config.exchangeType,
  () => {
    chartKey.value += 1;
  }
);
</script>

<style scoped>
.kline-page {
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.chart-card {
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.symbol-select {
  min-width: 160px;
}

:deep(.el-card__body) {
  padding: 24px !important;
}
</style>
