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
      </div>
    </div>
    <div class="chart-wrap">
      <div class="chart-legend">
        {{ legendText }}
      </div>
      <div ref="chartContainer" class="kline-chart-container" />
      <div ref="tooltipRef" class="kline-tooltip" />
    </div>
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
import { getKlineWebSocketService } from '@/services/KlineWebSocketService';
import { getKlines, toCcxtFuturesSymbol, toCcxtSpotSymbol } from '@/services/ohlcvApi';
import { Loading } from '@element-plus/icons-vue';
import { createChart } from 'lightweight-charts';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

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
const tooltipRef = ref(null);
const loading = ref(false);
const error = ref('');
const exchange = 'toobit'; // 固定 Toobit，不可选择
const interval = ref('1h');

const legendText = computed(() => {
  const sym = props.symbol || '--';
  const ccxt = props.isFutures ? toCcxtFuturesSymbol(sym) : toCcxtSpotSymbol(sym);
  return `${ccxt} · ${interval.value} · Toobit`;
});

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
let unsubscribeCrosshair = null;
let klineWs = null;

function formatTooltipTime(t) {
  if (typeof t === 'number') {
    const d = new Date(t * 1000);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(t);
}

function formatPrice(p) {
  if (p == null || isNaN(p)) return '--';
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

/** 将 API/WS 数据转为 lightweight-charts 格式 */
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

/** 单条 K 线转图表格式 */
function toChartBar(data) {
  if (!data) return null;
  return {
    time: Math.floor((data.timestamp || data[0]) / 1000),
    open: data.open ?? data[1],
    high: data.high ?? data[2],
    low: data.low ?? data[3],
    close: data.close ?? data[4],
  };
}

function selectInterval(val) {
  interval.value = val;
  unsubscribeKlineWs();
  fetchData();
}

function subscribeKlineWs() {
  unsubscribeKlineWs();
  if (!candlestickSeries || !props.symbol) return;

  const ccxtSymbol = props.isFutures
    ? toCcxtFuturesSymbol(props.symbol)
    : toCcxtSpotSymbol(props.symbol);

  klineWs = getKlineWebSocketService();
  klineWs.onKline = msg => {
    if (!candlestickSeries || !msg?.data) return;
    const bar = toChartBar(msg.data);
    if (bar) {
      candlestickSeries.update(bar);
    }
  };
  klineWs.subscribe({
    exchange,
    symbol: ccxtSymbol,
    interval: interval.value,
  });
  klineWs.connect();
}

function unsubscribeKlineWs() {
  if (klineWs) {
    klineWs.unsubscribe();
    klineWs.disconnect();
    klineWs.onKline = null;
    klineWs = null;
  }
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
      limit: 1000,
    });

    const chartData = toChartData(data);

    if (candlestickSeries) {
      candlestickSeries.setData(chartData);
      subscribeKlineWs();
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
    localization: {
      locale: 'zh-CN',
      dateFormat: 'yyyy/MM/dd',
      timeFormatter: (time) => {
        let d;
        if (typeof time === 'number') {
          d = new Date(time * 1000);
        } else if (typeof time === 'string') {
          d = /^\d+$/.test(time) ? new Date(parseInt(time, 10) * 1000) : new Date(time);
        } else {
          return String(time);
        }
        return d.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      },
    },
    layout: {
      background: { color: 'transparent' },
      textColor: '#9ca3af',
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
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

  // 高开低收 Tooltip
  if (tooltipRef.value) {
    const container = chartContainer.value;
    unsubscribeCrosshair = chart.subscribeCrosshairMove(param => {
      const tooltip = tooltipRef.value;
      if (!tooltip || !param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.display = 'none';
        return;
      }
      if (param.point.x > container.clientWidth || param.point.y > container.clientHeight) {
        tooltip.style.display = 'none';
        return;
      }
      const data = param.seriesData.get(candlestickSeries);
      if (!data || data.open === undefined) {
        tooltip.style.display = 'none';
        return;
      }
      const timeStr = formatTooltipTime(param.time);
      tooltip.innerHTML = `
        <div class="tooltip-time">${timeStr}</div>
        <div class="tooltip-row"><span>开</span> ${formatPrice(data.open)}</div>
        <div class="tooltip-row"><span>高</span> ${formatPrice(data.high)}</div>
        <div class="tooltip-row"><span>低</span> ${formatPrice(data.low)}</div>
        <div class="tooltip-row"><span>收</span> ${formatPrice(data.close)}</div>
      `;
      const margin = 12;
      let left = param.point.x + margin;
      let top = param.point.y + margin;
      if (left + 140 > chartContainer.value.clientWidth) {
        left = param.point.x - 140 - margin;
      }
      if (top + 110 > chartContainer.value.clientHeight) {
        top = param.point.y - 110 - margin;
      }
      tooltip.style.left = Math.max(margin, left) + 'px';
      tooltip.style.top = Math.max(margin, top) + 'px';
      tooltip.style.display = 'block';
    });
  }

  resizeObserver = new ResizeObserver(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({ width: chartContainer.value.clientWidth });
    }
  });
  resizeObserver.observe(chartContainer.value);
}

function destroyChart() {
  unsubscribeKlineWs();
  if (unsubscribeCrosshair) {
    unsubscribeCrosshair();
    unsubscribeCrosshair = null;
  }
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
      unsubscribeKlineWs();
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
  min-height: 520px;
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

.chart-wrap {
  position: relative;
  width: 100%;
}

.chart-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
  pointer-events: none;
}

.kline-chart-container {
  width: 100%;
  height: 520px;
}

.kline-tooltip {
  position: absolute;
  display: none;
  padding: 10px 12px;
  min-width: 120px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: #e4e8f0;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.kline-tooltip .tooltip-time {
  color: #00d4ff;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.kline-tooltip .tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}

.kline-tooltip .tooltip-row span {
  color: #9ca3af;
  min-width: 16px;
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
