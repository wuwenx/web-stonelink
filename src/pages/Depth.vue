<template>
  <div class="minimal-container">
    <!-- 简约控制面板 -->
    <div class="controls">
      <div class="control-group">
        <label class="control-label">资产类型</label>
        <div class="toggle-group">
          <button 
            :class="['toggle-btn', { active: assetType === 'futures' }]"
            @click="updateAssetType('futures')"
          >
            合约
          </button>
          <button 
            :class="['toggle-btn', { active: assetType === 'spot' }]"
            @click="updateAssetType('spot')"
          >
            现货
          </button>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">深度范围</label>
        <div class="depth-selector">
          <button 
            v-for="option in depthOptions" 
            :key="option.value"
            :class="['depth-btn', { active: depthPercentage === option.value }]"
            @click="updateDepthPercentage(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">订单方向</label>
        <div class="toggle-group">
          <button 
            :class="['toggle-btn', { active: orderSide === 'buy' }]"
            @click="updateOrderSide('buy')"
          >
            买盘
          </button>
          <button 
            :class="['toggle-btn', { active: orderSide === 'sell' }]"
            @click="updateOrderSide('sell')"
          >
            卖盘
          </button>
        </div>
      </div>
    </div>

    <!-- 简约数据表格 -->
    <div class="data-table">
      <div class="table-header">
        <div class="header-cell">
          资产
        </div>
        <div class="header-cell">
          BINANCE
        </div>
        <div class="header-cell">
          TOOBIT
        </div>
        <div class="header-cell">
          分数
        </div>
      </div>
      
      <div class="table-body">
        <div 
          v-for="item in tableData" 
          :key="item.symbol"
          class="table-row"
          @click="goToSymbolDetail(item.symbol)"
        >
          <div class="table-cell asset">
            <div class="asset-name">
              {{ item.symbol }}
            </div>
            <div class="asset-type">
              {{ assetType.toUpperCase() }}
            </div>
          </div>
          
          <div class="table-cell value">
            <div class="value-text binance">
              {{ formatValue(item.binanceValue) }}
            </div>
          </div>
          
          <div class="table-cell value">
            <div class="value-text toobit">
              {{ formatValue(item.toobitValue) }}
            </div>
          </div>
          
          <div class="table-cell score">
            <div :class="['score', getScoreClass(item.score)]">
              {{ item.score > 0 ? '+' : '' }}{{ item.score }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 简约状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <div class="status-dot binance" />
        <span>币安</span>
      </div>
      <div class="status-item">
        <div class="status-dot toobit" />
        <span>Toobit</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBinanceStore, useToobitStore } from '../stores/index.js';

const binanceStore = useBinanceStore();
const toobitStore = useToobitStore();
const router = useRouter();

// 响应式数据
const assetType = ref('futures');
const depthPercentage = ref(0.0001); // 万1
const orderSide = ref('buy');

// 深度选项配置
const depthOptions = [
  { label: '万1(0.01%)', value: 0.0001 },
  { label: '万5(0.05%)', value: 0.0005 },
  { label: '微观(0.1%)', value: 0.001 },
  { label: '紧密(0.5%)', value: 0.005 },
  { label: '核心(1%)', value: 0.01 },
  { label: '巨额(2%)', value: 0.02 },
  { label: '大额(5%)', value: 0.05 },
  { label: '极限(10%)', value: 0.1 }
];

// 交易对列表
const symbols = ['BTCUSDT', 'ETHUSDT'];

// 计算多币对深度对比数据 - 直接使用store数据，无节流
const multiSymbolDepthComparisonData = computed(() => {
  return symbols.map(symbol => {
    const binanceData = binanceStore.getDepthDataBySymbol(symbol);
    const toobitData = toobitStore.getDepthDataBySymbol(symbol);
    
    let binanceValue = 0;
    let toobitValue = 0;
    
    if (binanceData && binanceData.bestBid && binanceData.bestAsk) {
      if (orderSide.value === 'buy') {
        binanceValue = calculateBuyDepth(binanceData.bids, binanceData.bestBid, depthPercentage.value);
      } else {
        binanceValue = calculateSellDepth(binanceData.asks, binanceData.bestAsk, depthPercentage.value);
      }
    }
    
    if (toobitData && toobitData.bestBid && toobitData.bestAsk) {
      if (orderSide.value === 'buy') {
        toobitValue = calculateBuyDepth(toobitData.bids, toobitData.bestBid, depthPercentage.value);
      } else {
        toobitValue = calculateSellDepth(toobitData.asks, toobitData.bestAsk, depthPercentage.value);
      }
    }
    
    // 计算分数
    let score = 0;
    if (toobitValue > binanceValue) score = 1;
    else if (toobitValue < binanceValue) score = -1;
    
    return {
      symbol,
      binanceValue,
      toobitValue,
      score
    };
  });
});

// 表格数据 - 直接使用计算属性，无节流
const tableData = computed(() => multiSymbolDepthComparisonData.value);

// 计算买盘深度
const calculateBuyDepth = (bids, bestBid, percentage) => {
  if (!bids || bids.length === 0 || !bestBid) return 0;
  
  const threshold = bestBid * (1 - percentage);
  return bids
    .filter(bid => bid.price >= threshold)
    .reduce((sum, bid) => sum + bid.quantity, 0);
};

// 计算卖盘深度
const calculateSellDepth = (asks, bestAsk, percentage) => {
  if (!asks || asks.length === 0 || !bestAsk) return 0;
  
  const threshold = bestAsk * (1 + percentage);
  return asks
    .filter(ask => ask.price <= threshold)
    .reduce((sum, ask) => sum + ask.quantity, 0);
};

// 跳转到币对详情页面
const goToSymbolDetail = symbol => {
  router.push(`/symbol/${symbol}`);
};

// 更新资产类型
const updateAssetType = type => {
  assetType.value = type;
  binanceStore.updateConfig({ exchangeType: type });
};

// 更新深度百分比
const updateDepthPercentage = percentage => {
  depthPercentage.value = percentage;
};

// 更新订单方向
const updateOrderSide = side => {
  orderSide.value = side;
};

// 格式化数值显示
const formatValue = value => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(1);
  }
};

// 获取分数样式类
const getScoreClass = score => {
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

// 生命周期
onMounted(() => {
  // WebSocket连接由SimpleLayout管理，这里不需要连接
  console.log('Depth页面已挂载，WebSocket连接由SimpleLayout管理');
});

onUnmounted(() => {
  // 页面离开时不清理连接，保持全局连接
  console.log('Depth页面已卸载，保持WebSocket连接');
});
</script>

<style scoped>
/* 简约现代化样式 */
.minimal-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #fafafa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 控制面板 */
.controls {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.control-group {
  flex: 1;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.toggle-group {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
}

.toggle-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #374151;
}

.toggle-btn.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.depth-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.depth-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.depth-btn:hover {
  border-color: #9ca3af;
  color: #374151;
}

.depth-btn.active {
  background: #111827;
  color: white;
  border-color: #111827;
}

/* 数据表格 */
.data-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 24px;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.header-cell {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.table-body {
  background: white;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-cell.asset {
  justify-content: flex-start;
}

.asset-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.asset-type {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.value-text {
  font-size: 16px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
}

.value-text.binance {
  color: #dc2626;
  background: #fef2f2;
}

.value-text.toobit {
  color: #059669;
  background: #f0fdf4;
}

.score {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.score.positive {
  background: #dcfce7;
  color: #166534;
}

.score.negative {
  background: #fef2f2;
  color: #dc2626;
}

.score.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

/* 状态栏 */
.status-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.status-dot.binance {
  background: #3b82f6;
}

.status-dot.toobit {
  background: #8b5cf6;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .minimal-container {
    background: #111827;
  }
  
  .controls,
  .data-table,
  .status-bar {
    background: #1f2937;
    border-color: #374151;
  }
  
  .control-label {
    color: #d1d5db;
  }
  
  .toggle-group {
    background: #374151;
  }
  
  .toggle-btn {
    color: #9ca3af;
  }
  
  .toggle-btn:hover {
    color: #d1d5db;
  }
  
  .toggle-btn.active {
    background: #111827;
    color: #f9fafb;
  }
  
  .depth-btn {
    background: #1f2937;
    color: #9ca3af;
    border-color: #374151;
  }
  
  .depth-btn:hover {
    border-color: #6b7280;
    color: #d1d5db;
  }
  
  .depth-btn.active {
    background: #111827;
    color: #f9fafb;
    border-color: #111827;
  }
  
  .table-header {
    background: #111827;
    border-bottom-color: #374151;
  }
  
  .header-cell {
    color: #d1d5db;
  }
  
  .table-row {
    border-bottom-color: #374151;
  }
  
  .table-row:hover {
    background: #111827;
  }
  
  .asset-name {
    color: #f9fafb;
  }
  
  .asset-type {
    background: #374151;
    color: #9ca3af;
  }
  
  .value-text.binance {
    background: #7f1d1d;
    color: #fca5a5;
  }
  
  .value-text.toobit {
    background: #14532d;
    color: #86efac;
  }
  
  .score.positive {
    background: #14532d;
    color: #86efac;
  }
  
  .score.negative {
    background: #7f1d1d;
    color: #fca5a5;
  }
  
  .score.neutral {
    background: #374151;
    color: #9ca3af;
  }
  
  .status-item {
    color: #9ca3af;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .minimal-container {
    padding: 16px;
  }
  
  .controls {
    flex-direction: column;
    gap: 20px;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-cell,
  .table-cell {
    text-align: left;
    padding: 12px 16px;
  }
  
  .depth-selector {
    justify-content: flex-start;
  }
}
</style>