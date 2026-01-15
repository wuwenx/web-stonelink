<template>
  <div class="orderbook-container">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">实时订单簿</h1>
          <span class="current-symbol">{{ selectedSymbol }}</span>
          <el-tag type="success" size="small" v-if="isConnected">
            <span class="live-dot" /> 实时更新
          </el-tag>
        </div>
        <div class="header-right">
          <div class="symbol-selector">
            <span class="selector-label">交易对</span>
            <el-select
              v-model="selectedSymbol"
              placeholder="选择交易对"
              size="large"
              @change="handleSymbolChange"
              popper-class="symbol-select-dropdown"
            >
              <el-option
                v-for="sym in symbols"
                :key="sym"
                :label="sym"
                :value="sym"
              />
            </el-select>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 交易所选择 -->
    <el-card class="exchange-card" shadow="hover">
      <div class="exchange-tabs">
        <div
          v-for="exchange in exchanges"
          :key="exchange.id"
          class="exchange-tab"
          :class="{ active: selectedExchange === exchange.id }"
          @click="selectedExchange = exchange.id"
        >
          <span class="exchange-name">{{ exchange.name }}</span>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：深度图 -->
      <el-card class="depth-chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">深度图表</span>
            <div class="price-info">
              <span class="best-bid">买一: {{ formatPrice(currentData.bestBid) }}</span>
              <span class="spread">价差: {{ formatSpread(currentData.spreadPercent) }}</span>
              <span class="best-ask">卖一: {{ formatPrice(currentData.bestAsk) }}</span>
            </div>
          </div>
        </template>

        <div class="depth-chart">
          <!-- 买卖压力指示器 -->
          <div class="pressure-indicator">
            <div class="pressure-bar">
              <div class="bid-pressure" :style="{ width: bidPressure + '%' }">
                <span class="pressure-label">{{ bidPressure.toFixed(1) }}%</span>
              </div>
              <div class="ask-pressure" :style="{ width: askPressure + '%' }">
                <span class="pressure-label">{{ askPressure.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="pressure-labels">
              <span class="bid-label">买盘压力</span>
              <span class="ask-label">卖盘压力</span>
            </div>
          </div>

          <!-- 深度图可视化 -->
          <div class="depth-visualization">
            <!-- 买盘深度（左侧，绿色） -->
            <div class="depth-side bids-side">
              <div class="depth-title">买盘深度</div>
              <div class="depth-bars">
                <div
                  v-for="(level, index) in depthLevels"
                  :key="'bid-' + index"
                  class="depth-bar-row"
                >
                  <span class="depth-label">{{ level.label }}</span>
                  <div class="bar-container">
                    <div
                      class="depth-bar bid-bar"
                      :style="{ width: getBidBarWidth(level.value) + '%' }"
                    >
                      <span class="bar-value">{{ formatQuantity(getBidDepth(level.value)) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 卖盘深度（右侧，红色） -->
            <div class="depth-side asks-side">
              <div class="depth-title">卖盘深度</div>
              <div class="depth-bars">
                <div
                  v-for="(level, index) in depthLevels"
                  :key="'ask-' + index"
                  class="depth-bar-row"
                >
                  <span class="depth-label">{{ level.label }}</span>
                  <div class="bar-container">
                    <div
                      class="depth-bar ask-bar"
                      :style="{ width: getAskBarWidth(level.value) + '%' }"
                    >
                      <span class="bar-value">{{ formatQuantity(getAskDepth(level.value)) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 右侧：订单簿列表 -->
      <el-card class="orderbook-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">订单簿详情</span>
            <span class="update-time">{{ lastUpdateTime }}</span>
          </div>
        </template>

        <div class="orderbook-content">
          <!-- 卖盘列表（上方） -->
          <div class="orderbook-side asks">
            <div class="orderbook-header">
              <span>价格</span>
              <span>数量</span>
              <span>累计</span>
            </div>
            <div ref="asksScrollRef" class="orderbook-rows asks-rows">
              <div
                v-for="(ask, index) in displayAsks"
                :key="'ask-' + index"
                class="orderbook-row ask-row"
                :class="{ 'large-order': isLargeOrder(ask.quantity) }"
              >
                <div class="row-bg" :style="{ width: getRowWidth(ask.total, maxAskTotal) + '%' }" />
                <span class="price">{{ formatPrice(ask.price) }}</span>
                <span class="quantity" :class="{ highlight: isLargeOrder(ask.quantity) }">
                  {{ formatQuantity(ask.quantity) }}
                  <span v-if="isLargeOrder(ask.quantity)" class="whale-icon">🐋</span>
                </span>
                <span class="total">{{ formatQuantity(ask.total) }}</span>
              </div>
            </div>
          </div>

          <!-- 中间价格 -->
          <div class="mid-price">
            <span class="current-price" :class="priceDirection">
              {{ formatPrice(currentData.bestBid) }}
            </span>
            <span class="spread-info">
              价差: {{ formatSpread(currentData.spreadPercent) }}
            </span>
          </div>

          <!-- 买盘列表（下方） -->
          <div class="orderbook-side bids">
            <div class="orderbook-rows">
              <div
                v-for="(bid, index) in displayBids"
                :key="'bid-' + index"
                class="orderbook-row bid-row"
                :class="{ 'large-order': isLargeOrder(bid.quantity) }"
              >
                <div class="row-bg" :style="{ width: getRowWidth(bid.total, maxBidTotal) + '%' }" />
                <span class="price">{{ formatPrice(bid.price) }}</span>
                <span class="quantity" :class="{ highlight: isLargeOrder(bid.quantity) }">
                  {{ formatQuantity(bid.quantity) }}
                  <span v-if="isLargeOrder(bid.quantity)" class="whale-icon">🐋</span>
                </span>
                <span class="total">{{ formatQuantity(bid.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <el-card class="stats-card" shadow="hover">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">买盘总量</span>
          <span class="stat-value bid-value">{{ formatQuantity(totalBidQuantity) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">卖盘总量</span>
          <span class="stat-value ask-value">{{ formatQuantity(totalAskQuantity) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">买卖比</span>
          <span class="stat-value" :class="bidAskRatio > 1 ? 'bid-value' : 'ask-value'">
            {{ bidAskRatio.toFixed(2) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">大单数量</span>
          <span class="stat-value highlight-value">{{ largeOrderCount }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { getExchangeName, SYMBOLS } from '../config/exchanges';
import { useDepthStore } from '../stores/depth';

const depthStore = useDepthStore();

// 响应式数据
const selectedSymbol = ref('BTCUSDT');
const selectedExchange = ref('');
const lastUpdateTime = ref('--:--:--');
const priceDirection = ref('');
const prevPrice = ref(0);

// 卖盘滚动区域 ref
const asksScrollRef = ref(null);

// 从统一配置获取币对列表
const symbols = SYMBOLS;

// 深度级别
const depthLevels = [
  { label: '0.01%', value: 0.0001 },
  { label: '0.05%', value: 0.0005 },
  { label: '0.1%', value: 0.001 },
  { label: '0.5%', value: 0.005 },
  { label: '1%', value: 0.01 },
  { label: '2%', value: 0.02 },
];

// 计算属性
const exchanges = computed(() => {
  const type = depthStore.config.exchangeType;
  return depthStore.compareExchanges.map(id => ({
    id,
    name: getExchangeName(id, type),
  }));
});

const isConnected = computed(() => depthStore.isConnected);

// 初始化默认交易所
watch(exchanges, newExchanges => {
  if (newExchanges.length > 0 && !selectedExchange.value) {
    selectedExchange.value = newExchanges[0].id;
  }
}, { immediate: true });

// 当前深度数据
const currentData = computed(() => {
  return depthStore.getDepthData(selectedSymbol.value, selectedExchange.value);
});

// 显示的买盘（前20档）
const displayBids = computed(() => {
  const bids = currentData.value?.bids || [];
  return bids.slice(0, 20);
});

// 显示的卖盘（前20档，倒序显示）
const displayAsks = computed(() => {
  const asks = currentData.value?.asks || [];
  return asks.slice(0, 20).reverse();
});

// 最大买盘累计
const maxBidTotal = computed(() => {
  const bids = displayBids.value;
  return bids.length > 0 ? bids[bids.length - 1].total : 1;
});

// 最大卖盘累计
const maxAskTotal = computed(() => {
  const asks = currentData.value?.asks || [];
  const displayed = asks.slice(0, 20);
  return displayed.length > 0 ? displayed[displayed.length - 1].total : 1;
});

// 总买盘数量
const totalBidQuantity = computed(() => {
  const bids = currentData.value?.bids || [];
  return bids.reduce((sum, b) => sum + b.quantity, 0);
});

// 总卖盘数量
const totalAskQuantity = computed(() => {
  const asks = currentData.value?.asks || [];
  return asks.reduce((sum, a) => sum + a.quantity, 0);
});

// 买卖比
const bidAskRatio = computed(() => {
  if (totalAskQuantity.value === 0) return 0;
  return totalBidQuantity.value / totalAskQuantity.value;
});

// 买盘压力
const bidPressure = computed(() => {
  const total = totalBidQuantity.value + totalAskQuantity.value;
  if (total === 0) return 50;
  return (totalBidQuantity.value / total) * 100;
});

// 卖盘压力
const askPressure = computed(() => {
  return 100 - bidPressure.value;
});

// 大单阈值（动态计算）
const largeOrderThreshold = computed(() => {
  const bids = currentData.value?.bids || [];
  const asks = currentData.value?.asks || [];
  const all = [...bids, ...asks].map(o => o.quantity);
  if (all.length === 0) return 10;
  // 取前20%分位数作为大单阈值
  all.sort((a, b) => b - a);
  const idx = Math.floor(all.length * 0.1);
  return all[idx] || 10;
});

// 大单数量
const largeOrderCount = computed(() => {
  const bids = currentData.value?.bids || [];
  const asks = currentData.value?.asks || [];
  const threshold = largeOrderThreshold.value;
  return [...bids, ...asks].filter(o => o.quantity >= threshold).length;
});

// 获取买盘深度
const getBidDepth = pct => {
  const stats = currentData.value?.depthStats;
  if (!stats) return 0;
  return stats[`${pct}`]?.bidDepth || 0;
};

// 获取卖盘深度
const getAskDepth = pct => {
  const stats = currentData.value?.depthStats;
  if (!stats) return 0;
  return stats[`${pct}`]?.askDepth || 0;
};

// 最大深度（用于计算柱状图宽度）
const maxDepth = computed(() => {
  let max = 0;
  for (const level of depthLevels) {
    max = Math.max(max, getBidDepth(level.value), getAskDepth(level.value));
  }
  return max || 1;
});

// 获取买盘柱状图宽度
const getBidBarWidth = pct => {
  return (getBidDepth(pct) / maxDepth.value) * 100;
};

// 获取卖盘柱状图宽度
const getAskBarWidth = pct => {
  return (getAskDepth(pct) / maxDepth.value) * 100;
};

// 获取行背景宽度
const getRowWidth = (total, maxTotal) => {
  if (maxTotal === 0) return 0;
  return (total / maxTotal) * 100;
};

// 判断是否大单
const isLargeOrder = quantity => {
  return quantity >= largeOrderThreshold.value;
};

// 格式化价格
const formatPrice = price => {
  if (!price || price === 0) return '----.--';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 格式化数量
const formatQuantity = quantity => {
  if (!quantity || quantity === 0) return '0';
  if (quantity >= 1000000) {
    return (quantity / 1000000).toFixed(2) + 'M';
  } else if (quantity >= 1000) {
    return (quantity / 1000).toFixed(2) + 'K';
  } else if (quantity >= 1) {
    return quantity.toFixed(2);
  } else {
    return quantity.toFixed(4);
  }
};

// 格式化价差
const formatSpread = spreadPercent => {
  if (!spreadPercent) return '0.0000%';
  return spreadPercent.toFixed(4) + '%';
};

// 处理交易对变化
const handleSymbolChange = () => {
  // 数据会自动更新
};

// 更新时间
const updateTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString();
  
  // 更新价格方向
  const newPrice = currentData.value?.bestBid || 0;
  if (newPrice > prevPrice.value) {
    priceDirection.value = 'price-up';
  } else if (newPrice < prevPrice.value) {
    priceDirection.value = 'price-down';
  }
  prevPrice.value = newPrice;
};

// 定时更新
let timer = null;

onMounted(() => {
  if (!depthStore.isConnected) {
    depthStore.connect();
  }
  timer = setInterval(updateTime, 500);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 监听数据变化
watch(() => currentData.value, () => {
  updateTime();
}, { deep: true });

// 滚动卖盘到底部
const scrollAsksToBottom = () => {
  nextTick(() => {
    if (asksScrollRef.value) {
      asksScrollRef.value.scrollTop = asksScrollRef.value.scrollHeight;
    }
  });
};

// 首次加载数据后滚动到底部（只执行一次）
let hasScrolled = false;
watch(displayAsks, () => {
  if (!hasScrolled && displayAsks.value.length > 0) {
    hasScrolled = true;
    scrollAsksToBottom();
  }
}, { immediate: true });
</script>

<style scoped>
/* ============================================
   金融科技风格 - 订单簿可视化
   ============================================ */

.orderbook-container {
  padding: 32px 40px;
  max-width: 1800px;
  margin: 0 auto;
}

/* 卡片通用样式 */
.header-card,
.exchange-card,
.depth-chart-card,
.orderbook-card,
.stats-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
  transition: all 0.3s ease;
}

.header-card:hover,
.exchange-card:hover,
.depth-chart-card:hover,
.orderbook-card:hover,
.stats-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
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

.header-left {
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

.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.current-symbol {
  font-size: 18px;
  font-weight: 700;
  color: #00d4ff;
  padding: 6px 16px;
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
}

/* 币对选择器 */
.symbol-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selector-label {
  font-size: 14px;
  color: #a0aec0;
}

/* Select 下拉框样式 */
:deep(.el-select) {
  width: 160px;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  box-shadow: none !important;
  border-radius: 8px;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: rgba(0, 212, 255, 0.5) !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #00d4ff !important;
  box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.2) !important;
}

:deep(.el-select .el-input__inner) {
  color: #00d4ff !important;
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-select .el-input__suffix) {
  color: #00d4ff;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #e4e8f0;
}

.update-time {
  font-size: 12px;
  color: #718096;
  font-family: 'JetBrains Mono', monospace;
}

/* 交易所选择 */
.exchange-tabs {
  display: flex;
  gap: 12px;
}

.exchange-tab {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exchange-tab:hover {
  border-color: rgba(0, 212, 255, 0.4);
  background: rgba(0, 212, 255, 0.1);
}

.exchange-tab.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(138, 43, 226, 0.2));
  border-color: #00d4ff;
}

.exchange-name {
  font-size: 14px;
  font-weight: 600;
  color: #e4e8f0;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

/* 价格信息 */
.price-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
}

.best-bid {
  color: #00ff88;
}

.best-ask {
  color: #ff4757;
}

.spread {
  color: #a0aec0;
}

/* 深度图 */
.depth-chart {
  padding: 16px 0;
}

/* 压力指示器 */
.pressure-indicator {
  margin-bottom: 32px;
}

.pressure-bar {
  display: flex;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.bid-pressure {
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  transition: width 0.5s ease;
}

.ask-pressure {
  background: linear-gradient(90deg, #ff6b6b, #ff4757);
  display: flex;
  align-items: center;
  padding-left: 12px;
  transition: width 0.5s ease;
}

.pressure-label {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.pressure-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.bid-label {
  color: #00ff88;
  font-size: 12px;
}

.ask-label {
  color: #ff4757;
  font-size: 12px;
}

/* 深度可视化 */
.depth-visualization {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.depth-side {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.depth-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.bids-side .depth-title {
  color: #00ff88;
}

.asks-side .depth-title {
  color: #ff4757;
}

.depth-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.depth-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.depth-label {
  width: 50px;
  font-size: 12px;
  color: #a0aec0;
  text-align: right;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.depth-bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 8px;
  transition: width 0.3s ease;
  min-width: fit-content;
}

.bid-bar {
  background: linear-gradient(90deg, rgba(0, 255, 136, 0.3), rgba(0, 255, 136, 0.6));
  border-right: 2px solid #00ff88;
}

.ask-bar {
  background: linear-gradient(90deg, rgba(255, 71, 87, 0.3), rgba(255, 71, 87, 0.6));
  border-right: 2px solid #ff4757;
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

/* 订单簿列表 */
.orderbook-content {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.orderbook-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.orderbook-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 8px 12px;
  font-size: 11px;
  color: #718096;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.orderbook-rows {
  overflow-y: auto;
  max-height: 240px;
  padding-right: 4px;
}

/* 卖盘滚动区域 - 确保滚动条可见 */
.asks-rows {
  display: flex;
  flex-direction: column;
}

/* 自定义滚动条样式 */
.orderbook-rows::-webkit-scrollbar {
  width: 6px;
}

.orderbook-rows::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.orderbook-rows::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.4);
  border-radius: 3px;
}

.orderbook-rows::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.6);
}

.orderbook-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 6px 12px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
  transition: background 0.2s ease;
}

.orderbook-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.row-bg {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.bid-row .row-bg {
  background: rgba(0, 255, 136, 0.1);
}

.ask-row .row-bg {
  background: rgba(255, 71, 87, 0.1);
}

.bid-row .price {
  color: #00ff88;
}

.ask-row .price {
  color: #ff4757;
}

.quantity {
  color: #e4e8f0;
  position: relative;
  z-index: 1;
}

.quantity.highlight {
  color: #fbbf24;
  font-weight: 700;
}

.total {
  color: #718096;
  position: relative;
  z-index: 1;
}

.whale-icon {
  margin-left: 4px;
}

.large-order {
  background: rgba(251, 191, 36, 0.1) !important;
}

/* 中间价格 */
.mid-price {
  padding: 16px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #e4e8f0;
  transition: color 0.3s ease;
}

.current-price.price-up {
  color: #00ff88;
}

.current-price.price-down {
  color: #ff4757;
}

.spread-info {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #718096;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #718096;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.bid-value {
  color: #00ff88;
}

.ask-value {
  color: #ff4757;
}

.highlight-value {
  color: #fbbf24;
}

/* Tag 样式 */
:deep(.el-tag--success) {
  background: rgba(0, 255, 136, 0.15) !important;
  border: none !important;
  color: #00ff88 !important;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .orderbook-card {
    order: -1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .orderbook-container {
    padding: 16px;
  }

  .depth-visualization {
    grid-template-columns: 1fr;
  }

  .exchange-tabs {
    flex-wrap: wrap;
  }

  .price-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
