<template>
  <div class="kline-chart-wrapper">
    <div class="kline-chart-header">
      <div class="chart-controls">
        <span class="exchange-label">Toobit</span>
        <div class="interval-btns">
          <button
            v-for="opt in intervalOptions"
            :key="opt.value"
            type="button"
            class="interval-btn"
            :class="{ active: interval === opt.value }"
            @click="selectInterval(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <el-button size="small" :loading="loading" @click="fetchData">
          刷新
        </el-button>
      </div>
    </div>
    <div ref="chartContainer" class="kline-chart-container" />
    <div v-if="loading" class="chart-loading-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="error" class="chart-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { getKlines, toCcxtFuturesSymbol, toCcxtSpotSymbol } from '@/services/ohlcvApi';
import { Loading } from '@element-plus/icons-vue';
import { createChart } from 'lightweight-charts';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  /** 交易对，如 BTCUSDT */
  symbol: {
    type: String,
    required: true,
  },
  /** 是否合约，决定 symbol 格式 */
  isFutures: {
    type: Boolean,
    default: false,
  },
});

const chartContainer = ref(null);
const loading = ref(false);
const error = ref('');
const exchange = 'toobit'; // 固定 Toobit，不可选择
const interval = ref('1h');

const intervalOptions = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
  { label: '1w', value: '1w' },
];

let chart = null;
let candlestickSeries = null;
let resizeObserver = null;

/** 将 API 数据转为 lightweight-charts 格式 */
function toChartData(apiData) {
  if (!Array.isArray(apiData)) return [];
  return apiData.map(item => ({
    time: Math.floor((item.timestamp || item[0]) / 1000),
    open: item.open ?? item[1],
    high: item.high ?? item[2],
    low: item.low ?? item[3],
    close: item.close ?? item[4],
  }));
}

function selectInterval(val) {
  interval.value = val;
  fetchData();
}

async function fetchData() {
  if (!props.symbol) return;

  const ccxtSymbol = props.isFutures
    ? toCcxtFuturesSymbol(props.symbol)
    : toCcxtSpotSymbol(props.symbol);

  loading.value = true;
  error.value = '';

  try {
    const data = await getKlines({
      exchange,
      symbol: ccxtSymbol,
      interval: interval.value,
      limit: 500,
    });

    const chartData = toChartData(data);

    if (candlestickSeries) {
      candlestickSeries.setData(chartData);
    }
  } catch (err) {
    error.value = err.message || '加载 K 线失败';
    if (candlestickSeries) {
      candlestickSeries.setData([]);
    }
  } finally {
    loading.value = false;
  }
}

function initChart() {
  if (!chartContainer.value) return;

  chart = createChart(chartContainer.value, {
    layout: {
      background: { color: 'transparent' },
      textColor: '#9ca3af',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.05)' },
      horzLines: { color: 'rgba(255,255,255,0.05)' },
    },
    crosshair: {
      mode: 1,
      vertLine: {
        color: '#00d4ff',
        width: 1,
        style: 2,
      },
      horzLine: {
        color: '#00d4ff',
        width: 1,
        style: 2,
      },
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.1)',
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    },
    timeScale: {
      borderColor: 'rgba(255,255,255,0.1)',
      timeVisible: true,
      secondsVisible: false,
    },
  });

  candlestickSeries = chart.addCandlestickSeries({
    upColor: '#00ff88',
    downColor: '#ff4757',
    borderUpColor: '#00ff88',
    borderDownColor: '#ff4757',
    wickUpColor: '#00ff88',
    wickDownColor: '#ff4757',
  });

  fetchData();

  resizeObserver = new ResizeObserver(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({ width: chartContainer.value.clientWidth });
    }
  });
  resizeObserver.observe(chartContainer.value);
}

function destroyChart() {
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value);
    resizeObserver = null;
  }
  if (chart) {
    chart.remove();
    chart = null;
    candlestickSeries = null;
  }
}

watch(
  () => [props.symbol, props.isFutures],
  () => {
    if (chart && candlestickSeries) {
      fetchData();
    }
  },
  { deep: true }
);

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  destroyChart();
});
</script>

<style scoped>
.kline-chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 400px;
}

.kline-chart-header {
  margin-bottom: 12px;
}

.chart-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.exchange-label {
  font-size: 14px;
  font-weight: 600;
  color: #00d4aa;
  padding: 4px 12px;
  background: rgba(0, 212, 170, 0.15);
  border-radius: 6px;
}

.interval-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.interval-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.interval-btn:hover {
  color: #00d4ff;
  border-color: rgba(0, 212, 255, 0.4);
  background: rgba(0, 212, 255, 0.1);
}

.interval-btn.active {
  color: #00d4ff;
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.2);
}

.kline-chart-container {
  width: 100%;
  height: 400px;
}

.chart-loading-overlay {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  color: #9ca3af;
}

.chart-error {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4757;
  font-size: 14px;
}
</style>
