<template>
  <div class="container mx-auto p-5">
    <h1 class="text-3xl font-bold mb-6">
      多币对订阅示例 (Multi-Symbol Subscription Example)
    </h1>

    <!-- 币对管理 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">
        币对管理
      </h2>
      
      <div class="flex gap-4 mb-4">
        <el-input
          v-model="newSymbol"
          placeholder="输入币对名称，如：BTCUSDT"
          @keyup.enter="addSymbol"
        />
        <el-button type="primary" @click="addSymbol">
          添加币对
        </el-button>
        <el-button type="success" @click="addCommonSymbols">
          添加常用币对
        </el-button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          v-for="symbol in subscribedSymbols" 
          :key="symbol"
          class="p-4 border rounded-lg"
        >
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold">
              {{ symbol }}
            </h3>
            <el-button 
              v-if="subscribedSymbols.length > 1"
              type="danger" 
              size="small" 
              @click="removeSymbol(symbol)"
            >
              删除
            </el-button>
          </div>
          
          <!-- 连接状态 -->
          <div class="space-y-1 text-sm">
            <div class="flex items-center gap-2">
              <div :class="getStatusClass(depthStore.getConnectionStatus('binance', symbol))" class="w-2 h-2 rounded-full" />
              <span>币安: {{ getStatusText(depthStore.getConnectionStatus('binance', symbol)) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div :class="getStatusClass(depthStore.getConnectionStatus('okx', symbol))" class="w-2 h-2 rounded-full" />
              <span>OKX: {{ getStatusText(depthStore.getConnectionStatus('okx', symbol)) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div :class="getStatusClass(depthStore.getConnectionStatus('toobit', symbol))" class="w-2 h-2 rounded-full" />
              <span>Toobit: {{ getStatusText(depthStore.getConnectionStatus('toobit', symbol)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多币对数据展示 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">
        多币对深度数据
      </h2>
      
      <div class="space-y-4">
        <div 
          v-for="symbol in subscribedSymbols" 
          :key="symbol"
          class="border rounded-lg p-4"
        >
          <h3 class="text-lg font-semibold mb-3">
            {{ symbol }}
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- 币安数据 -->
            <div>
              <h4 class="font-medium text-green-600 dark:text-green-400 mb-2">
                币安
              </h4>
              <div v-if="getDepthDataBySymbol(symbol).binance.asks.length > 0">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳买价: {{ formatPrice(getDepthDataBySymbol(symbol).binance.bestBid) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳卖价: {{ formatPrice(getDepthDataBySymbol(symbol).binance.bestAsk) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最后更新: {{ getDepthDataBySymbol(symbol).binance.lastUpdate }}
                </p>
              </div>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                暂无数据
              </p>
            </div>

            <!-- OKX数据 -->
            <div>
              <h4 class="font-medium text-blue-600 dark:text-blue-400 mb-2">
                OKX
              </h4>
              <div v-if="getDepthDataBySymbol(symbol).okx.asks.length > 0">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳买价: {{ formatPrice(getDepthDataBySymbol(symbol).okx.bestBid) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳卖价: {{ formatPrice(getDepthDataBySymbol(symbol).okx.bestAsk) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最后更新: {{ getDepthDataBySymbol(symbol).okx.lastUpdate }}
                </p>
              </div>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                暂无数据
              </p>
            </div>

            <!-- Toobit数据 -->
            <div>
              <h4 class="font-medium text-orange-600 dark:text-orange-400 mb-2">
                Toobit
              </h4>
              <div v-if="getDepthDataBySymbol(symbol).toobit.asks.length > 0">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳买价: {{ formatPrice(getDepthDataBySymbol(symbol).toobit.bestBid) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最佳卖价: {{ formatPrice(getDepthDataBySymbol(symbol).toobit.bestAsk) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  最后更新: {{ getDepthDataBySymbol(symbol).toobit.lastUpdate }}
                </p>
              </div>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                暂无数据
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
      <h2 class="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
        使用说明
      </h2>
      <div class="space-y-2 text-sm text-blue-700 dark:text-blue-300">
        <p>• 添加币对后会自动连接所有交易所的WebSocket</p>
        <p>• 每个币对都会独立维护连接状态和数据</p>
        <p>• 可以通过store的getters获取特定币对的数据</p>
        <p>• 支持动态添加和删除币对订阅</p>
        <p>• 连接状态：绿色=已连接，黄色=连接中，红色=未连接</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { DepthDataProcessor } from '../services/WebSocketService.js';
import { useDepthStore } from '../stores/depth.js';

const depthStore = useDepthStore();

// 响应式数据
const newSymbol = ref('');
const subscribedSymbols = computed(() => depthStore.subscribedSymbolsList);

// 方法
const addSymbol = () => {
  if (newSymbol.value && !subscribedSymbols.value.includes(newSymbol.value)) {
    depthStore.addSymbolSubscription(newSymbol.value);
    newSymbol.value = '';
  }
};

const removeSymbol = symbol => {
  if (subscribedSymbols.value.length > 1) {
    depthStore.removeSymbolSubscription(symbol);
  }
};

const addCommonSymbols = () => {
  const commonSymbols = ['ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT'];
  commonSymbols.forEach(symbol => {
    if (!subscribedSymbols.value.includes(symbol)) {
      depthStore.addSymbolSubscription(symbol);
    }
  });
};

const getDepthDataBySymbol = symbol => {
  return depthStore.getDepthDataBySymbol(symbol);
};

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
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-500',
  };
  return statusClasses[status] || 'bg-gray-500';
};

const formatPrice = price => {
  return DepthDataProcessor.formatPrice(price);
};
</script>
