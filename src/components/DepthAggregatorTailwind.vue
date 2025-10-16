<template>
  <div class="container mx-auto p-5 font-sans bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
    <!-- 页面标题 -->
    <div class="text-center mb-8 bg-gradient-to-r from-primary-500 to-purple-600 text-white p-8 rounded-lg shadow-lg">
      <h1 class="text-4xl font-light mb-2">
        深度聚合 - 实时对比
      </h1>
      <p class="text-lg opacity-90">
        实时展示交易所深度数据对比
      </p>
    </div>

    <!-- 控制面板 -->
    <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-5 flex-wrap gap-4 transition-colors duration-300">
      <div class="flex items-center gap-3">
        <label class="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">选择交易所：</label>
        <el-select
          v-model="selectedExchange"
          placeholder="请选择交易所"
          size="default"
          class="min-w-32"
          @change="onExchangeChange"
        >
          <el-option label="币安" value="binance" />
          <el-option label="OKX" value="okx" />
        </el-select>
      </div>

      <div class="flex items-center gap-3">
        <label class="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">选择交易所类型：</label>
        <el-select
          v-model="exchangeType"
          placeholder="请选择交易所类型"
          size="default"
          class="min-w-32"
          @change="onExchangeTypeChange"
        >
          <!-- <el-option label="现货交易" value="spot" /> -->
          <el-option label="U本位合约" value="futures" />
        </el-select>
      </div>

      <div class="flex items-center gap-3">
        <label class="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">选择交易对：</label>
        <el-select
          v-model="selectedSymbol"
          placeholder="请选择交易对"
          size="default"
          class="min-w-32"
          @change="onSymbolChange"
        >
          <el-option label="BTC/USDT" value="BTCUSDT" />
          <el-option label="ETH/USDT" value="ETHUSDT" />
          <el-option label="BNB/USDT" value="BNBUSDT" />
          <el-option label="ADA/USDT" value="ADAUSDT" />
          <el-option label="SOL/USDT" value="SOLUSDT" />
        </el-select>
      </div>

      <div class="flex items-center gap-3">
        <label class="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">深度档位：</label>
        <el-select
          v-model="depthLevels"
          placeholder="请选择深度档位"
          size="default"
          class="min-w-24"
          @change="onDepthLevelsChange"
        >
          <el-option label="5档" :value="5" />
          <el-option label="10档" :value="10" />
          <el-option label="20档" :value="20" />
        </el-select>
      </div>

      <div class="flex gap-8">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700 dark:text-gray-300">{{ getExchangeDisplayName(selectedExchange) }} :</span>
          <span :class="getStatusClass(selectedExchangeStatus)" />
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ getStatusText(selectedExchangeStatus) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700 dark:text-gray-300">Toobit :</span>
          <span :class="getStatusClass(toobitStatus)" />
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ getStatusText(toobitStatus) }}</span>
        </div>
      </div>
    </div>

    <!-- 深度数据展示区域 -->
    <div class="flex flex-col gap-5 mb-5">
      <!-- 卖盘对比区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300 relative">
        <div class="bg-gradient-to-r from-danger-500 to-red-600 text-white p-4 flex justify-between items-center">
          <h2 class="text-2xl font-light">
            卖盘对比 (Asks)
          </h2>
          <div class="text-sm opacity-90">
            {{ getExchangeDisplayName(selectedExchange) }}: {{ selectedExchangeLastUpdate }} | Toobit: {{ toobitLastUpdate }}
          </div>
        </div>
        <div class=" min-h-[150px] max-h-96 overflow-y-auto relative " v-loading="isLoadingData" element-loading-text="正在获取卖盘数据..." element-loading-background="rgba(255, 255, 255, 0.8)" element-loading-spinner="el-icon-loading" element-loading-svg-view-box="-10, -10, 50, 50">
          <div class="grid grid-cols-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 transition-colors duration-300">
            <div class="border-r border-gray-200 dark:border-gray-600 flex flex-col">
              <div class="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-center transition-colors duration-300">
                {{ getExchangeDisplayName(selectedExchange) }}
              </div>
              <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                <span>价格</span>
                <span>数量</span>
                <span>总计</span>
              </div>
            </div>
            <div class="flex flex-col">
              <div class="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-center transition-colors duration-300">
                Toobit
              </div>
              <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                <span>价格</span>
                <span>数量</span>
                <span>总计</span> 
              </div>
            </div>
          </div>
          <div v-for="(item, index) in Math.max(selectedExchangeAsks.length, toobitAsks.length)" :key="`ask-${index}`" class="grid grid-cols-2 border-b border-gray-100 dark:border-gray-600">
            <div class="border-r border-gray-200 dark:border-gray-600">
              <div
                v-if="selectedExchangeAsks[index]"
                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                :style="{ backgroundColor: `rgba(239, 68, 68, ${0.1 + (index / Math.max(selectedExchangeAsks.length, 1)) * 0.2})` }"
              >
                <span class="text-danger-600 dark:text-danger-400 font-semibold">{{ formatPrice(selectedExchangeAsks[index].price) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(selectedExchangeAsks[index].quantity) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(selectedExchangeAsks[index].total) }}</span>
              </div>
              <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 dark:text-gray-500 italic">
                <span>--</span>
                <span class="text-right">--</span>
                <span class="text-right">--</span>
              </div>
            </div>
            <div>
              <div
                v-if="toobitAsks[index]"
                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                :style="{ backgroundColor: `rgba(239, 68, 68, ${0.1 + (index / Math.max(toobitAsks.length, 1)) * 0.2})` }"
              >
                <span class="text-danger-600 dark:text-danger-400 font-semibold">{{ formatPrice(toobitAsks[index].price) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(toobitAsks[index].quantity) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(toobitAsks[index].total) }}</span>
              </div>
              <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 dark:text-gray-500 italic">
                <span>--</span>
                <span class="text-right">--</span>
                <span class="text-right">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 买盘对比区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300 relative">
        <div class="bg-gradient-to-r from-success-500 to-green-600 text-white p-4 flex justify-between items-center">
          <h2 class="text-2xl font-light">
            买盘对比 (Bids)
          </h2>
          <div class="text-sm opacity-90">
            {{ getExchangeDisplayName(selectedExchange) }}: {{ selectedExchangeLastUpdate }} | Toobit: {{ toobitLastUpdate }}
          </div>
        </div>
        <div class=" min-h-[150px] max-h-96 overflow-y-auto relative" v-loading="isLoadingData" element-loading-text="正在获取买盘数据..." element-loading-background="rgba(255, 255, 255, 0.8)" element-loading-spinner="el-icon-loading" element-loading-svg-view-box="-10, -10, 50, 50">
          <div class="grid grid-cols-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 transition-colors duration-300">
            <div class="border-r border-gray-200 dark:border-gray-600 flex flex-col">
              <div class="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-center transition-colors duration-300">
                {{ getExchangeDisplayName(selectedExchange) }}
              </div>
              <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                <span>价格</span>
                <span>数量</span>
                <span>总计</span>
              </div>
            </div>
            <div class="flex flex-col">
              <div class="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-center transition-colors duration-300">
                Toobit
              </div>
              <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                <span>价格</span>
                <span>数量</span>
                <span>总计</span>
              </div>
            </div>
          </div>
          <div v-for="(item, index) in Math.max(selectedExchangeBids.length, toobitBids.length)" :key="`bid-${index}`" class="grid grid-cols-2 border-b border-gray-100 dark:border-gray-600">
            <div class="border-r border-gray-200 dark:border-gray-600">
              <div
                v-if="selectedExchangeBids[index]"
                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                :style="{ backgroundColor: `rgba(34, 197, 94, ${0.1 + (index / Math.max(selectedExchangeBids.length, 1)) * 0.2})` }"
              >
                <span class="text-success-600 dark:text-success-400 font-semibold">{{ formatPrice(selectedExchangeBids[index].price) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(selectedExchangeBids[index].quantity) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(selectedExchangeBids[index].total) }}</span>
              </div>
              <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 dark:text-gray-500 italic">
                <span>--</span>
                <span class="text-right">--</span>
                <span class="text-right">--</span>
              </div>
            </div>
            <div>
              <div
                v-if="toobitBids[index]"
                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                :style="{ backgroundColor: `rgba(34, 197, 94, ${0.1 + (index / Math.max(toobitBids.length, 1)) * 0.2})` }"
              >
                <span class="text-success-600 dark:text-success-400 font-semibold">{{ formatPrice(toobitBids[index].price) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(toobitBids[index].quantity) }}</span>
                <span class="text-gray-600 dark:text-gray-300 text-right">{{ formatQuantity(toobitBids[index].total) }}</span>
              </div>
              <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 dark:text-gray-500 italic">
                <span>--</span>
                <span class="text-right">--</span>
                <span class="text-right">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标记价格信息 -->
    <div v-if="selectedExchange === 'binance' " class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-5 transition-colors duration-300">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
        <span class="w-3 h-3 bg-blue-500 rounded-full mr-2" />
        {{ getExchangeDisplayName(selectedExchange) }} 标记价格信息
        <span class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          ({{ selectedExchangeMarkPriceLastUpdate }})
        </span>
        <span :class="getStatusClass(selectedExchangeMarkPriceStatus)" class="ml-2" />
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-500 transition-colors duration-300">
          <span class="font-semibold text-gray-700 dark:text-gray-300">标记价格:</span>
          <span class="font-mono font-semibold text-blue-600 dark:text-blue-400">{{ formatMarkPrice(selectedExchangeMarkPrice) }}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md border-l-4 border-green-500 transition-colors duration-300">
          <span class="font-semibold text-gray-700 dark:text-gray-300">指数价格:</span>
          <span class="font-mono font-semibold text-green-600 dark:text-green-400">{{ formatMarkPrice(selectedExchangeIndexPrice) }}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border-l-4 border-purple-500 transition-colors duration-300">
          <span class="font-semibold text-gray-700 dark:text-gray-300">资金费率:</span>
          <span class="font-mono font-semibold text-purple-600 dark:text-purple-400">{{ formatFundingRate(selectedExchangeFundingRate) }}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border-l-4 border-orange-500 transition-colors duration-300">
          <span class="font-semibold text-gray-700 dark:text-gray-300">下次资金时间:</span>
          <span class="font-mono font-semibold text-orange-600 dark:text-orange-400">{{ formatTimestamp(selectedExchangeNextFundingTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transition-colors duration-300">
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-primary-500 transition-colors duration-300">
        <span class="font-semibold text-gray-700 dark:text-gray-300">{{ getExchangeDisplayName(selectedExchange) }} 最佳买价:</span>
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatPrice(selectedExchangeBestBid) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-primary-500 transition-colors duration-300">
        <span class="font-semibold text-gray-700 dark:text-gray-300">{{ getExchangeDisplayName(selectedExchange) }} 最佳卖价:</span>
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatPrice(selectedExchangeBestAsk) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-primary-500 transition-colors duration-300">
        <span class="font-semibold text-gray-700 dark:text-gray-300">Toobit 最佳买价:</span>
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatPrice(toobitBestBid) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-primary-500 transition-colors duration-300">
        <span class="font-semibold text-gray-700 dark:text-gray-300">Toobit 最佳卖价:</span>
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatPrice(toobitBestAsk) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-primary-500 transition-colors duration-300">
        <span class="font-semibold text-gray-700 dark:text-gray-300">价差 ({{ getExchangeDisplayName(selectedExchange) }} - Toobit):</span>
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatPrice(priceDifference) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { DepthDataProcessor, WebSocketService } from '../services/WebSocketService.js';

// 响应式数据
const selectedSymbol = ref('BTCUSDT');
const selectedExchange = ref('binance'); // 新增：选择的交易所
const exchangeType = ref('futures');
const depthLevels = ref(5);
const selectedExchangeStatus = ref('disconnected'); // 新增：选择的交易所状态
const toobitStatus = ref('disconnected');
const selectedExchangeMarkPriceStatus = ref('disconnected'); // 新增：选择的交易所标记价格状态
const isLoadingData = ref(false);
const selectedExchangeLastUpdate = ref('--'); // 新增：选择的交易所最后更新时间
const toobitLastUpdate = ref('--');
const selectedExchangeMarkPriceLastUpdate = ref('--'); // 新增：选择的交易所标记价格最后更新时间
const selectedExchangeAsks = ref([]); // 新增：选择的交易所卖盘数据
const selectedExchangeBids = ref([]); // 新增：选择的交易所买盘数据
const toobitAsks = ref([]);
const toobitBids = ref([]);
const selectedExchangeBestBid = ref(0); // 新增：选择的交易所最佳买价
const selectedExchangeBestAsk = ref(0); // 新增：选择的交易所最佳卖价
const toobitBestBid = ref(0);
const toobitBestAsk = ref(0);
const selectedExchangeMarkPrice = ref(0); // 新增：选择的交易所标记价格
const selectedExchangeIndexPrice = ref(0); // 新增：选择的交易所指数价格
const selectedExchangeFundingRate = ref(0); // 新增：选择的交易所资金费率
const selectedExchangeNextFundingTime = ref(0); // 新增：选择的交易所下次资金时间

// WebSocket服务实例
let wsService = null;
let reconnectTimer = null;

// 计算属性
const priceDifference = computed(() => {
  return selectedExchangeBestBid.value - toobitBestBid.value;
});

// 方法
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
    connected: 'w-3 h-3 bg-success-500 rounded-full animate-pulse',
    connecting: 'w-3 h-3 bg-yellow-500 rounded-full animate-bounce',
    disconnected: 'w-3 h-3 bg-danger-500 rounded-full',
    error: 'w-3 h-3 bg-danger-500 rounded-full animate-pulse',
  };
  return statusClasses[status] || 'w-3 h-3 bg-gray-500 rounded-full';
};

const formatPrice = price => {
  return DepthDataProcessor.formatPrice(price);
};

const formatQuantity = quantity => {
  return DepthDataProcessor.formatQuantity(quantity);
};

const formatMarkPrice = markPrice => {
  return DepthDataProcessor.formatMarkPrice(markPrice);
};

const formatFundingRate = fundingRate => {
  return DepthDataProcessor.formatFundingRate(fundingRate);
};

const formatTimestamp = timestamp => {
  return DepthDataProcessor.formatTimestamp(timestamp);
};

// 新增：获取交易所显示名称
const getExchangeDisplayName = exchange => {
  const exchangeNames = {
    binance: '币安',
    okx: 'OKX',
    toobit: 'Toobit'
  };
  return exchangeNames[exchange] || exchange;
};

// WebSocket连接管理
const initializeWebSockets = () => {
  wsService = new WebSocketService();
  connectSelectedExchange();
  connectToobit();
};

// 新增：连接选择的交易所
const connectSelectedExchange = () => {
  if (selectedExchange.value === 'binance') {
    connectBinance();
  } else if (selectedExchange.value === 'okx') {
    connectOKX();
  }
};

const connectBinance = () => {
  if (exchangeType.value === 'futures') {
    // 使用合并连接，同时获取深度数据和标记价格
    wsService.connectBinanceFuturesWithMarkPrice(
      selectedSymbol.value, 
      handleSelectedExchangeData, 
      handleSelectedExchangeMarkPriceData, 
      status => {
        selectedExchangeStatus.value = status;
        selectedExchangeMarkPriceStatus.value = status; // 标记价格状态与深度数据状态同步
        
        // 连接成功后隐藏 loading
        if (status === 'connected') {
          // 延迟隐藏 loading，确保数据已经加载
          setTimeout(() => {
            isLoadingData.value = false;
          }, 1000);
        }
      },
      depthLevels.value // 传递深度档位参数
    );
  } else {
    wsService.connectBinance(selectedSymbol.value, handleSelectedExchangeData, status => {
      selectedExchangeStatus.value = status;
      
      // 连接成功后隐藏 loading
      if (status === 'connected') {
        setTimeout(() => {
          isLoadingData.value = false;
        }, 1000);
      }
    });
  }
};

const connectOKX = () => {
  wsService.connectOKX(selectedSymbol.value, handleSelectedExchangeData, status => {
    selectedExchangeStatus.value = status;
    
    // 连接成功后隐藏 loading
    if (status === 'connected') {
      setTimeout(() => {
        isLoadingData.value = false;
      }, 1000);
    }
  });
};

const connectToobit = () => {
  wsService.connectToobit(selectedSymbol.value, handleToobitData, status => {
    toobitStatus.value = status;
  });
};

// 数据处理
const handleSelectedExchangeData = data => {
  if (data.e === 'depthUpdate' || (data.a && data.b)) {
    const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', depthLevels.value);
    const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', depthLevels.value);

    selectedExchangeAsks.value = processedAsks;
    selectedExchangeBids.value = processedBids;

    const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
    selectedExchangeBestBid.value = bestPrices.bestBid;
    selectedExchangeBestAsk.value = bestPrices.bestAsk;

    selectedExchangeLastUpdate.value = new Date().toLocaleTimeString();
    
    // 隐藏 loading 状态
    isLoadingData.value = false;
  } else {
  }
};

const handleToobitData = data => {

  // 检查数据格式是否正确
  if (!data || (!data.a && !data.b)) {
    return;
  }

  const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', depthLevels.value);
  const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', depthLevels.value);

  toobitAsks.value = processedAsks;
  toobitBids.value = processedBids;

  const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
  toobitBestBid.value = bestPrices.bestBid;
  toobitBestAsk.value = bestPrices.bestAsk;

  toobitLastUpdate.value = new Date().toLocaleTimeString();
  
  // 隐藏 loading 状态
  isLoadingData.value = false;
};

const handleSelectedExchangeMarkPriceData = data => {
  
  const processedData = DepthDataProcessor.processMarkPriceData(data);
  
  selectedExchangeMarkPrice.value = processedData.markPrice;
  selectedExchangeIndexPrice.value = processedData.indexPrice;
  selectedExchangeFundingRate.value = processedData.lastFundingRate;
  selectedExchangeNextFundingTime.value = processedData.nextFundingTime;
  
  selectedExchangeMarkPriceLastUpdate.value = new Date().toLocaleTimeString();
  
};

// 事件处理
const onSymbolChange = () => {
  handleConnectionChange();
};

const onExchangeChange = () => {
  handleConnectionChange();
};

const onExchangeTypeChange = () => {
  handleConnectionChange();
};

const onDepthLevelsChange = () => {
  // 深度档位变更时需要重新连接以获取新的深度数据
  console.log('深度档位变更:', depthLevels.value);
  handleConnectionChange();
};

// 统一的连接变更处理
const handleConnectionChange = () => {
  // 显示 loading 状态
  isLoadingData.value = true;
  
  // 清除之前的重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // 立即清空数据和重置状态
  closeWebSockets();

  // 延迟重新连接，确保旧连接完全关闭
  reconnectTimer = setTimeout(() => {
    initializeWebSockets();
    reconnectTimer = null;
  }, 1500);
};

const closeWebSockets = () => {
  if (wsService) {
    wsService.disconnectAll();
  }

  // 清空所有数据
  selectedExchangeAsks.value = [];
  selectedExchangeBids.value = [];
  toobitAsks.value = [];
  toobitBids.value = [];

  // 重置最佳价格
  selectedExchangeBestBid.value = 0;
  selectedExchangeBestAsk.value = 0;
  toobitBestBid.value = 0;
  toobitBestAsk.value = 0;

  // 重置状态
  selectedExchangeStatus.value = 'disconnected';
  toobitStatus.value = 'disconnected';
  selectedExchangeMarkPriceStatus.value = 'disconnected';
  selectedExchangeLastUpdate.value = '--';
  toobitLastUpdate.value = '--';
  selectedExchangeMarkPriceLastUpdate.value = '--';

  console.log('数据已清空，状态已重置');
};

// 监听器
watch([selectedSymbol, selectedExchange, exchangeType], () => {
  console.log('监听器触发:', { symbol: selectedSymbol.value, exchange: selectedExchange.value, type: exchangeType.value });
});

// 生命周期
onMounted(() => {
  console.log('组件挂载，初始化WebSocket');
  initializeWebSockets();
});

onUnmounted(() => {
  console.log('组件卸载，关闭WebSocket');

  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // 关闭所有连接
  closeWebSockets();
});
</script>

<style scoped>
/* 自定义 loading 样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.el-loading-spinner) {
  margin-top: -25px;
}

:deep(.el-loading-spinner .el-loading-text) {
  color: #409eff !important;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}

:deep(.el-loading-spinner .circular) {
  width: 32px !important;
  height: 32px !important;
}

/* 暗色模式下的 loading 样式 */
.dark :deep(.el-loading-mask) {
  background-color: rgba(31, 41, 55, 0.9) !important;
}

.dark :deep(.el-loading-spinner .el-loading-text) {
  color: #60a5fa !important;
}

.dark :deep(.el-loading-spinner .circular) {
  color: #60a5fa !important;
}
</style>
