<template>
  <div class="container mx-auto p-5">
    <h1 class="text-2xl font-bold mb-4">
      深度数据Store测试
    </h1>
    
    <!-- 配置控制 -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">
        配置控制
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">交易对:</label>
          <select v-model="selectedSymbol" class="w-full p-2 border rounded">
            <option value="BTCUSDT">
              BTC/USDT
            </option>
            <option value="ETHUSDT">
              ETH/USDT
            </option>
            <option value="BNBUSDT">
              BNB/USDT
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">交易所:</label>
          <select v-model="selectedExchange" class="w-full p-2 border rounded">
            <option value="binance">
              币安
            </option>
            <option value="okx">
              OKX
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">交易所类型:</label>
          <select v-model="exchangeType" class="w-full p-2 border rounded">
            <option value="futures">
              U本位合约
            </option>
            <option value="spot">
              现货
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">深度档位:</label>
          <select v-model="depthLevels" class="w-full p-2 border rounded">
            <option :value="50">
              5档
            </option>
            <option :value="100">
              100档
            </option>
            <option :value="250">
              250档
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 连接状态 -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">
        连接状态
      </h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-sm font-medium">
            币安
          </div>
          <div :class="getStatusClass(depthStore.getConnectionStatus('binance'))" class="mx-auto mb-1" />
          <div class="text-xs">
            {{ getStatusText(depthStore.getConnectionStatus('binance')) }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium">
            OKX
          </div>
          <div :class="getStatusClass(depthStore.getConnectionStatus('okx'))" class="mx-auto mb-1" />
          <div class="text-xs">
            {{ getStatusText(depthStore.getConnectionStatus('okx')) }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium">
            Toobit
          </div>
          <div :class="getStatusClass(depthStore.getConnectionStatus('toobit'))" class="mx-auto mb-1" />
          <div class="text-xs">
            {{ getStatusText(depthStore.getConnectionStatus('toobit')) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 深度数据展示 -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">
        深度数据
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <!-- 当前交易所数据 -->
        <div>
          <h3 class="font-medium mb-2">
            {{ getExchangeDisplayName(selectedExchange) }}
          </h3>
          <div class="text-sm space-y-1">
            <div>最佳买价: {{ formatPrice(currentExchangeData.bestBid) }}</div>
            <div>最佳卖价: {{ formatPrice(currentExchangeData.bestAsk) }}</div>
            <div>买盘档位: {{ currentExchangeData.bids.length }}</div>
            <div>卖盘档位: {{ currentExchangeData.asks.length }}</div>
            <div>最后更新: {{ currentExchangeData.lastUpdate }}</div>
          </div>
        </div>
        
        <!-- Toobit数据 -->
        <div>
          <h3 class="font-medium mb-2">
            Toobit
          </h3>
          <div class="text-sm space-y-1">
            <div>最佳买价: {{ formatPrice(toobitData.bestBid) }}</div>
            <div>最佳卖价: {{ formatPrice(toobitData.bestAsk) }}</div>
            <div>买盘档位: {{ toobitData.bids.length }}</div>
            <div>卖盘档位: {{ toobitData.asks.length }}</div>
            <div>最后更新: {{ toobitData.lastUpdate }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Store Getters测试 -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">
        Store Getters测试
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium mb-2">
            价差计算
          </h3>
          <div class="text-sm space-y-1">
            <div>价差: {{ formatPrice(depthStore.priceDifference) }}</div>
            <div>是否有数据: {{ depthStore.hasData ? '是' : '否' }}</div>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">
            深度对比数据
          </h3>
          <div class="text-sm space-y-1">
            <div v-for="item in depthStore.depthComparisonData" :key="item.symbol">
              <div>{{ item.symbol }} - {{ getExchangeDisplayName(selectedExchange) }}: {{ formatDepthValue(item.selectedExchangeValue) }}</div>
              <div>{{ item.symbol }} - Toobit: {{ formatDepthValue(item.toobitValue) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标记价格信息（仅币安） -->
    <div v-if="selectedExchange === 'binance'" class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">
        标记价格信息
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-sm space-y-1">
          <div>标记价格: {{ formatPrice(depthStore.markPriceInfo.markPrice) }}</div>
          <div>指数价格: {{ formatPrice(depthStore.markPriceInfo.indexPrice) }}</div>
        </div>
        <div class="text-sm space-y-1">
          <div>资金费率: {{ formatFundingRate(depthStore.markPriceInfo.fundingRate) }}</div>
          <div>下次资金时间: {{ formatTimestamp(depthStore.markPriceInfo.nextFundingTime) }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">
        操作
      </h2>
      <div class="space-x-2">
        <button 
          :disabled="depthStore.isLoading" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          @click="connectWebSockets"
        >
          {{ depthStore.isLoading ? '连接中...' : '连接WebSocket' }}
        </button>
        <button 
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" 
          @click="disconnectAll"
        >
          断开所有连接
        </button>
        <button 
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" 
          @click="clearData"
        >
          清空数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { DepthDataProcessor } from '../services/WebSocketService.js';
import { useDepthStore } from '../stores/depth.js';

// 使用深度store
const depthStore = useDepthStore();

// 响应式数据
const selectedSymbol = computed({
  get: () => depthStore.config.selectedSymbol,
  set: value => depthStore.updateConfig({ selectedSymbol: value })
});

const selectedExchange = computed({
  get: () => depthStore.config.selectedExchange,
  set: value => depthStore.updateConfig({ selectedExchange: value })
});

const exchangeType = computed({
  get: () => depthStore.config.exchangeType,
  set: value => depthStore.updateConfig({ exchangeType: value })
});

const depthLevels = computed({
  get: () => depthStore.config.depthLevels,
  set: value => depthStore.updateConfig({ depthLevels: value })
});

// 计算属性
const currentExchangeData = computed(() => depthStore.getDepthDataByExchange(selectedExchange.value));
const toobitData = computed(() => depthStore.getDepthDataByExchange('toobit'));

// 辅助方法
const getStatusText = status => {
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '错误',
  };
  return statusMap[status] || '未知';
};

const getStatusClass = status => {
  const statusClasses = {
    connected: 'w-3 h-3 bg-green-500 rounded-full animate-pulse',
    connecting: 'w-3 h-3 bg-yellow-500 rounded-full animate-bounce',
    disconnected: 'w-3 h-3 bg-red-500 rounded-full',
    error: 'w-3 h-3 bg-red-500 rounded-full animate-pulse',
  };
  return statusClasses[status] || 'w-3 h-3 bg-gray-500 rounded-full';
};

const getExchangeDisplayName = exchange => {
  const exchangeNames = {
    binance: '币安',
    okx: 'OKX',
    toobit: 'Toobit'
  };
  return exchangeNames[exchange] || exchange;
};

const formatPrice = price => {
  return DepthDataProcessor.formatPrice(price);
};

const formatDepthValue = value => {
  if (!value || value === 0) return '0.0 K';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} K`;
  } else {
    return `${value.toFixed(2)}`;
  }
};

const formatFundingRate = fundingRate => {
  return DepthDataProcessor.formatFundingRate(fundingRate);
};

const formatTimestamp = timestamp => {
  return DepthDataProcessor.formatTimestamp(timestamp);
};

// 操作方法
const connectWebSockets = async() => {
  await depthStore.connectWebSockets();
};

const disconnectAll = () => {
  depthStore.disconnectAll();
};

const clearData = () => {
  depthStore.clearAllData();
};

// 生命周期
onMounted(async() => {
  console.log('测试页面挂载，初始化WebSocket');
  await depthStore.connectWebSockets();
});

onUnmounted(() => {
  console.log('测试页面卸载，关闭WebSocket');
  depthStore.disconnectAll();
});
</script>
