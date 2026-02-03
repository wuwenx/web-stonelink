<template>
  <div class="orderbook-container">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">
            实时订单簿
          </h1>
          <span class="current-symbol">{{ selectedSymbol }}</span>
          <el-tag v-if="isConnected" type="success" size="small">
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
              filterable
              popper-class="symbol-select-dropdown"
              @change="handleSymbolChange"
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
          <!-- 视图切换 -->
          <div class="view-toggle">
            <el-radio-group v-model="chartView" size="small">
              <el-radio-button label="bars">
                柱状图
              </el-radio-button>
              <el-radio-button label="heatmap">
                热力图
              </el-radio-button>
            </el-radio-group>
          </div>

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

          <!-- 深度热力图 -->
          <div v-if="chartView === 'heatmap'" class="heatmap-container">
            <canvas ref="heatmapCanvas" class="heatmap-canvas" />
            <div class="heatmap-legend">
              <span class="legend-label">流动性强度</span>
              <div class="legend-gradient" />
              <div class="legend-labels">
                <span>低</span>
                <span>高</span>
              </div>
            </div>
          </div>

          <!-- 深度图可视化 -->
          <div v-if="chartView === 'bars'" class="depth-visualization">
            <!-- 买盘深度（左侧，绿色） -->
            <div class="depth-side bids-side">
              <div class="depth-title">
                买盘深度
              </div>
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
              <div class="depth-title">
                卖盘深度
              </div>
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
        <div class="stat-item">
          <span class="stat-label">不平衡度</span>
          <span class="stat-value" :class="getImbalanceClass(imbalanceRatio)">
            {{ formatImbalanceRatio(imbalanceRatio) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">压力指数</span>
          <span class="stat-value" :class="getPressureIndexClass(pressureIndex)">
            {{ pressureIndex.toFixed(2) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 深度预警系统 -->
    <el-card class="alert-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">深度预警</span>
          <el-switch
            v-model="alertEnabled"
            active-text="启用"
            inactive-text="禁用"
            size="small"
          />
        </div>
      </template>
      
      <div class="alert-config">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="alert-item">
              <label>深度下降预警</label>
              <el-input-number
                v-model="alertConfig.depthDropPercent"
                :min="10"
                :max="90"
                :step="5"
                size="small"
              />
              <span class="unit">%</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="alert-item">
              <label>价差异常预警</label>
              <el-input-number
                v-model="alertConfig.spreadPercent"
                :min="0.01"
                :max="1"
                :step="0.01"
                :precision="2"
                size="small"
              />
              <span class="unit">%</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="alert-item">
              <label>不平衡度预警</label>
              <el-input-number
                v-model="alertConfig.imbalanceRatio"
                :min="1.5"
                :max="5"
                :step="0.1"
                :precision="1"
                size="small"
              />
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="alert-status">
        <el-tag
          v-for="alert in activeAlerts"
          :key="alert.id"
          :type="alert.type"
          size="small"
          class="alert-tag"
        >
          {{ alert.message }}
        </el-tag>
        <span v-if="activeAlerts.length === 0" class="no-alerts">暂无预警</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import BigNumber from 'bignumber.js';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { getExchangeName } from '../config/exchanges';
import { useDepthStore } from '../stores/depth';
import { useSymbolStore } from '../stores/symbol';
import { getPrecisionDecimals } from '../utils/precision';

// 配置 BigNumber：不使用指数表示法，截取模式
BigNumber.config({
  EXPONENTIAL_AT: [-20, 20],
  ROUNDING_MODE: BigNumber.ROUND_DOWN, // 截取，不四舍五入
});

const depthStore = useDepthStore();
const symbolStore = useSymbolStore();

// 响应式数据
const selectedSymbol = ref('BTCUSDT');
const selectedExchange = ref('');
const lastUpdateTime = ref('--:--:--');
const priceDirection = ref('');
const prevPrice = ref(0);
const chartView = ref('bars'); // 'bars' 或 'heatmap'

// 卖盘滚动区域 ref
const asksScrollRef = ref(null);
const heatmapCanvas = ref(null);

// 预警系统
const alertEnabled = ref(false);
const alertConfig = ref({
  depthDropPercent: 30, // 深度下降30%触发预警
  spreadPercent: 0.1, // 价差超过0.1%触发预警
  imbalanceRatio: 2.0, // 不平衡度超过2.0触发预警
});
const activeAlerts = ref([]);
const prevDepthStats = ref({});
const notificationPermission = ref(false);

// 请求通知权限
const requestNotificationPermission = async() => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    notificationPermission.value = permission === 'granted';
  } else if ('Notification' in window && Notification.permission === 'granted') {
    notificationPermission.value = true;
  }
};

// 从 store 获取币对列表
const symbols = computed(() => symbolStore.symbolList);

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

// 订单簿不平衡度分析
const imbalanceRatio = computed(() => {
  if (totalAskQuantity.value === 0) return 1;
  const ratio = totalBidQuantity.value / totalAskQuantity.value;
  // 返回不平衡度：>1表示买盘强，<1表示卖盘强，越接近1越平衡
  return ratio > 1 ? ratio : 1 / ratio;
});

// 压力指数（-1到1，-1表示卖压大，1表示买压大）
const pressureIndex = computed(() => {
  const total = totalBidQuantity.value + totalAskQuantity.value;
  if (total === 0) return 0;
  return (totalBidQuantity.value - totalAskQuantity.value) / total;
});

// 格式化不平衡度
const formatImbalanceRatio = ratio => {
  if (ratio === 1) return '1.00 (平衡)';
  return ratio.toFixed(2);
};

// 获取不平衡度样式类
const getImbalanceClass = ratio => {
  if (ratio < 1.2) return 'bid-value'; // 相对平衡
  if (ratio < 2.0) return 'highlight-value'; // 中等不平衡
  return 'ask-value'; // 严重不平衡
};

// 获取压力指数样式类
const getPressureIndexClass = index => {
  if (index > 0.3) return 'bid-value'; // 买压大
  if (index < -0.3) return 'ask-value'; // 卖压大
  return 'highlight-value'; // 相对平衡
};

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

// 当前币对精度（从币对接口：价格取 quote_precision，数量取 base_asset_precision）
const currentSymbolInfo = computed(() => symbolStore.getSymbolInfo(selectedSymbol.value));
const priceDecimals = computed(() =>
  getPrecisionDecimals(currentSymbolInfo.value?.quote_precision, 2));
const quantityDecimals = computed(() =>
  getPrecisionDecimals(currentSymbolInfo.value?.base_asset_precision, 5));

// 格式化价格（按 quote_precision）
const formatPrice = price => {
  if (!price || price === 0) return '----.--';
  const d = priceDecimals.value;
  return Number(price).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

// 格式化数量（按 base_asset_precision，使用 BigNumber 截取不四舍五入）
const formatQuantity = quantity => {
  if (!quantity || quantity === 0) return '0';
  const bn = new BigNumber(quantity);
  return bn.decimalPlaces(quantityDecimals.value, BigNumber.ROUND_DOWN).toString();
};

// 格式化价差
const formatSpread = spreadPercent => {
  if (!spreadPercent) return '0.0000%';
  return spreadPercent.toFixed(4) + '%';
};

// 处理交易对变化：确保当前选中的交易对已订阅
const handleSymbolChange = () => {
  depthStore.subscribeSymbol(selectedSymbol.value);
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

// 监听窗口大小变化
let resizeObserver = null;

onMounted(async() => {
  // 如果列表不为空，设置默认选中的交易对
  if (symbolStore.symbolList.length > 0) {
    if (!symbolStore.symbolList.includes(selectedSymbol.value)) {
      selectedSymbol.value = symbolStore.symbolList[0];
    }
  }
  
  if (!depthStore.isConnected) {
    depthStore.connect();
  }
  timer = setInterval(updateTime, 500);
  requestNotificationPermission();
  
  // 设置 ResizeObserver（用 requestAnimationFrame 包裹，避免 ResizeObserver loop 报错）
  if (heatmapCanvas.value) {
    resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (chartView.value === 'heatmap' && heatmapCanvas.value) {
          const canvas = heatmapCanvas.value;
          const container = canvas.parentElement;
          if (container) {
            canvas.width = container.clientWidth - 32; // 减去padding
            canvas.height = 500 - 32; // 减去padding
            drawHeatmap();
          }
        }
      });
    });
    
    resizeObserver.observe(heatmapCanvas.value.parentElement);
  }
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// 监听数据变化
watch(() => currentData.value, () => {
  updateTime();
  checkAlerts();
}, { deep: true });

// 监听交易对列表变化，更新选中的交易对
watch(() => symbolStore.symbolList, newList => {
  if (newList.length > 0) {
    const currentSymbol = selectedSymbol.value;
    if (newList.includes(currentSymbol)) {
      // 如果当前交易对在新列表中，保持选中
      selectedSymbol.value = currentSymbol;
    } else {
      // 否则选择第一个
      selectedSymbol.value = newList[0];
    }
  }
}, { immediate: true });

// 检查预警条件
const checkAlerts = () => {
  if (!alertEnabled.value) {
    activeAlerts.value = [];
    return;
  }
  
  const alerts = [];
  const data = currentData.value;
  
  if (!data || !data.depthStats) return;
  
  // 检查深度下降
  const currentDepth = data.depthStats['0.001']?.totalDepth || 0;
  const prevDepth = prevDepthStats.value.totalDepth || currentDepth;
  
  if (prevDepth > 0 && currentDepth < prevDepth * (1 - alertConfig.value.depthDropPercent / 100)) {
    const dropPercent = ((prevDepth - currentDepth) / prevDepth * 100).toFixed(1);
    alerts.push({
      id: 'depth-drop',
      type: 'warning',
      message: `深度下降 ${dropPercent}%`,
    });
    
    if (notificationPermission.value) {
      new Notification('深度预警', {
        body: `${selectedSymbol.value} 深度下降 ${dropPercent}%`,
        icon: '/favicon.ico',
      });
    }
  }
  
  // 检查价差异常
  if (data.spreadPercent > alertConfig.value.spreadPercent) {
    alerts.push({
      id: 'spread-high',
      type: 'danger',
      message: `价差异常: ${formatSpread(data.spreadPercent)}`,
    });
    
    if (notificationPermission.value) {
      new Notification('价差预警', {
        body: `${selectedSymbol.value} 价差 ${formatSpread(data.spreadPercent)}`,
        icon: '/favicon.ico',
      });
    }
  }
  
  // 检查不平衡度
  if (imbalanceRatio.value > alertConfig.value.imbalanceRatio) {
    alerts.push({
      id: 'imbalance-high',
      type: 'warning',
      message: `不平衡度: ${imbalanceRatio.value.toFixed(2)}`,
    });
    
    if (notificationPermission.value) {
      new Notification('不平衡度预警', {
        body: `${selectedSymbol.value} 不平衡度 ${imbalanceRatio.value.toFixed(2)}`,
        icon: '/favicon.ico',
      });
    }
  }
  
  activeAlerts.value = alerts;
  
  // 更新历史深度统计
  prevDepthStats.value = {
    totalDepth: currentDepth,
  };
};

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

// 绘制深度热力图
const drawHeatmap = () => {
  if (!heatmapCanvas.value || chartView.value !== 'heatmap') return;
  
  const canvas = heatmapCanvas.value;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  const bids = currentData.value?.bids || [];
  const asks = currentData.value?.asks || [];
  const bestBid = currentData.value?.bestBid || 0;
  const bestAsk = currentData.value?.bestAsk || 0;
  
  if (bids.length === 0 && asks.length === 0) return;
  
  // 显示前100档，让图表更连续
  const maxDisplayLevels = 100;
  const displayBids = bids.slice(0, maxDisplayLevels);
  const displayAsks = asks.slice(0, maxDisplayLevels);
  
  if (displayBids.length === 0 || displayAsks.length === 0) return;
  
  // 计算价格范围（显示最佳买卖价附近的价格）
  const spread = bestAsk - bestBid;
  const minBidPrice = displayBids[displayBids.length - 1]?.price || bestBid;
  const maxAskPrice = displayAsks[displayAsks.length - 1]?.price || bestAsk;
  const minPrice = minBidPrice;
  const maxPrice = maxAskPrice;
  const priceRange = maxPrice - minPrice;
  
  if (priceRange <= 0) return;
  
  // 计算最大累计深度（用于归一化）
  const maxBidTotal = displayBids[displayBids.length - 1]?.total || 0;
  const maxAskTotal = displayAsks[displayAsks.length - 1]?.total || 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);
  
  // 配置参数
  const padding = 60; // 左右边距（增加以容纳标签）
  const topPadding = 30;
  const bottomPadding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - topPadding - bottomPadding;
  const centerY = topPadding + chartHeight / 2;
  const bidHeight = chartHeight / 2;
  const askHeight = chartHeight / 2;
  
  // 绘制买盘热力图（下半部分，从中心线向左延伸）
  displayBids.forEach((order, index) => {
    const priceRatio = (order.price - minPrice) / priceRange;
    const x = padding + priceRatio * chartWidth;
    
    // 使用累计深度来计算条形长度
    const depthRatio = order.total / maxTotal;
    const barLength = depthRatio * chartWidth * 0.8; // 最大长度为图表宽度的80%
    
    // 计算条形高度（基于价格间距）
    let barHeight = 2;
    if (index < displayBids.length - 1) {
      const nextPrice = displayBids[index + 1].price;
      const priceDiff = Math.abs(order.price - nextPrice);
      const avgPriceDiff = priceRange / displayBids.length;
      barHeight = Math.max(2, (priceDiff / avgPriceDiff) * (chartHeight / displayBids.length));
    } else {
      barHeight = Math.max(2, chartHeight / displayBids.length);
    }
    
    // 绘制条形（从中心线向左延伸）
    const y = centerY + bidHeight - barHeight / 2;
    const intensity = Math.min(depthRatio, 1);
    const alpha = 0.5 + intensity * 0.5;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(x, y, x - barLength, y);
    gradient.addColorStop(0, `rgba(0, 255, 136, ${alpha})`);
    gradient.addColorStop(1, `rgba(0, 255, 136, ${alpha * 0.3})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - barLength, y, barLength, barHeight);
  });
  
  // 绘制卖盘热力图（上半部分，从中心线向右延伸）
  displayAsks.forEach((order, index) => {
    const priceRatio = (order.price - minPrice) / priceRange;
    const x = padding + priceRatio * chartWidth;
    
    // 使用累计深度来计算条形长度
    const depthRatio = order.total / maxTotal;
    const barLength = depthRatio * chartWidth * 0.8;
    
    // 计算条形高度
    let barHeight = 2;
    if (index < displayAsks.length - 1) {
      const nextPrice = displayAsks[index + 1].price;
      const priceDiff = Math.abs(order.price - nextPrice);
      const avgPriceDiff = priceRange / displayAsks.length;
      barHeight = Math.max(2, (priceDiff / avgPriceDiff) * (chartHeight / displayAsks.length));
    } else {
      barHeight = Math.max(2, chartHeight / displayAsks.length);
    }
    
    // 绘制条形（从中心线向右延伸）
    const y = centerY - askHeight + barHeight / 2;
    const intensity = Math.min(depthRatio, 1);
    const alpha = 0.5 + intensity * 0.5;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(x, y, x + barLength, y);
    gradient.addColorStop(0, `rgba(255, 71, 87, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 71, 87, ${alpha * 0.3})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barLength, barHeight);
  });
  
  // 绘制中心价格线（最佳买卖价中间）
  const midPrice = (bestBid + bestAsk) / 2;
  const midX = padding + ((midPrice - minPrice) / priceRange) * chartWidth;
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(midX, topPadding);
  ctx.lineTo(midX, height - bottomPadding);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 绘制水平分隔线
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(padding, centerY);
  ctx.lineTo(width - padding, centerY);
  ctx.stroke();
  
  // 绘制价格标签
  ctx.font = '12px monospace';
  ctx.textBaseline = 'middle';
  
  // 买一价标签（中心线下方）
  ctx.fillStyle = '#00ff88';
  ctx.textAlign = 'center';
  ctx.fillText(formatPrice(bestBid), midX, centerY + 15);
  
  // 卖一价标签（中心线上方）
  ctx.fillStyle = '#ff4757';
  ctx.fillText(formatPrice(bestAsk), midX, centerY - 15);
  
  // 价格范围标签（底部）
  ctx.fillStyle = '#718096';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(formatPrice(minPrice), padding, height - 10);
  
  ctx.textAlign = 'right';
  ctx.fillText(formatPrice(maxPrice), width - padding, height - 10);
  
  // 价差标签（顶部）
  ctx.fillStyle = '#a0aec0';
  ctx.textAlign = 'center';
  ctx.fillText(`价差: ${formatSpread(currentData.value?.spreadPercent || 0)}`, width / 2, 15);
};

// 监听数据变化，更新热力图
watch([() => currentData.value, chartView], () => {
  if (chartView.value === 'heatmap') {
    nextTick(() => {
      if (heatmapCanvas.value) {
        const canvas = heatmapCanvas.value;
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth - 32; // 减去padding
          canvas.height = 500 - 32; // 减去padding
        }
        drawHeatmap();
      }
    });
  }
}, { deep: true });

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

/* 视图切换 */
.view-toggle {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

/* 热力图容器 */
.heatmap-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  padding: 16px;
}

.heatmap-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.heatmap-legend {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.legend-label {
  display: block;
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 8px;
}

.legend-gradient {
  width: 200px;
  height: 12px;
  background: linear-gradient(to right, rgba(255, 71, 87, 0.3), rgba(255, 71, 87, 1), rgba(0, 255, 136, 1), rgba(0, 255, 136, 0.3));
  border-radius: 6px;
  margin-bottom: 4px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #718096;
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
  grid-template-columns: repeat(6, 1fr);
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

/* 预警卡片 */
.alert-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.alert-config {
  margin-bottom: 16px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-item label {
  font-size: 12px;
  color: #a0aec0;
  min-width: 80px;
}

.alert-item .unit {
  font-size: 12px;
  color: #718096;
}

.alert-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.alert-tag {
  margin-right: 8px;
}

.no-alerts {
  color: #718096;
  font-size: 12px;
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
    grid-template-columns: repeat(3, 1fr);
  }
  
  .alert-config .el-row {
    flex-direction: column;
  }
  
  .alert-config .el-col {
    width: 100%;
    margin-bottom: 12px;
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
