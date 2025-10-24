<template>
  <div class="depth-container">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">
            深度对比
          </h1>
        </div>
        <div class="header-right">
          <el-tag type="info" size="small">
            实时数据
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 控制面板 -->
    <el-card class="control-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">控制面板</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="control-group">
            <label class="control-label">资产类型</label>
            <el-radio-group v-model="assetType" @change="updateAssetType">
              <el-radio-button label="futures">
                合约
              </el-radio-button>
              <el-radio-button label="spot">
                现货
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
        
        <el-col :span="12">
          <div class="control-group">
            <label class="control-label">订单方向</label>
            <el-radio-group v-model="orderSide" @change="updateOrderSide">
              <el-radio-button label="buy">
                买盘
              </el-radio-button>
              <el-radio-button label="sell">
                卖盘
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">深度对比数据</span>
          </div>
          <div class="header-right">
            <div class="depth-selector">
              <label class="depth-label">深度范围:</label>
              <el-radio-group v-model="depthPercentage" size="small" @change="updateDepthPercentage">
                <el-radio-button 
                  v-for="option in depthOptions" 
                  :key="option.value"
                  :label="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="tableData" 
        stripe 
        border 
        class="comparison-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="symbol" label="资产" width="200" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="goToSymbolDetail(row.symbol)"
            >
              {{ row.symbol }} {{ assetType.toUpperCase() }}
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column prop="binanceValue" label="BINANCE" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getValueTagType(row.binanceValue, row.toobitValue)"
              size="large"
            >
              {{ formatValue(row.binanceValue) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="toobitValue" label="TOOBIT" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getValueTagType(row.toobitValue, row.binanceValue)"
              size="large"
            >
              {{ formatValue(row.toobitValue) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="分数" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getScoreTagType(row.score)"
              size="large"
            >
              {{ row.score > 0 ? '+' : '' }}{{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 价差详情对比 -->
    <el-card class="spread-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">价差详情对比</span>
        </div>
      </template>
      
      <el-table 
        :data="spreadData" 
        stripe 
        border 
        class="spread-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="symbol" label="资产" width="200" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="goToSymbolDetail(row.symbol)"
            >
              {{ row.symbol }} {{ assetType.toUpperCase() }}
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column prop="binanceSpread" label="BINANCE" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSpreadTagType(row.binanceSpreadPercent)"
              size="large"
            >
              {{ formatSpread(row.binanceSpreadPercent) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="toobitSpread" label="TOOBIT" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSpreadTagType(row.toobitSpreadPercent)"
              size="large"
            >
              {{ formatSpread(row.toobitSpreadPercent) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="分数 ↑" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getScoreTagType(row.score)"
              size="large"
            >
              {{ row.score > 0 ? '+' : '' }}{{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 连接状态 -->
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">连接状态</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="status-item">
            <div class="status-icon">
              <el-icon :color="getStatusColor('binance')" size="20">
                <component :is="getStatusIcon('binance')" />
              </el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                币安
              </div>
              <div class="status-value" :style="getStatusStyle('binance')">
                {{ getConnectionStatusText('binance') }}
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="12">
          <div class="status-item">
            <div class="status-icon">
              <el-icon :color="getStatusColor('toobit')" size="20">
                <component :is="getStatusIcon('toobit')" />
              </el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                Toobit
              </div>
              <div class="status-value" :style="getStatusStyle('toobit')">
                {{ getConnectionStatusText('toobit') }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
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

// 计算价差详情对比数据
const spreadData = computed(() => {
  return symbols.map(symbol => {
    const binanceData = binanceStore.getDepthDataBySymbol(symbol);
    const toobitData = toobitStore.getDepthDataBySymbol(symbol);
    
    let binanceSpread = 0;
    let binanceSpreadPercent = 0;
    let toobitSpread = 0;
    let toobitSpreadPercent = 0;
    
    // 计算币安价差
    if (binanceData && binanceData.bestBid && binanceData.bestAsk) {
      binanceSpread = binanceData.bestAsk - binanceData.bestBid;
      binanceSpreadPercent = (binanceSpread / binanceData.bestBid) * 100;
    }
    
    // 计算Toobit价差
    if (toobitData && toobitData.bestBid && toobitData.bestAsk) {
      toobitSpread = toobitData.bestAsk - toobitData.bestBid;
      toobitSpreadPercent = (toobitSpread / toobitData.bestBid) * 100;
    }
    
    // 计算分数：Toobit价差比例 - 币安价差比例
    // 分数 > 0 表示Toobit价差更大（不利），分数 < 0 表示币安价差更大（不利）
    let score = 0;
    if (toobitSpreadPercent > binanceSpreadPercent) score = 1;
    else if (toobitSpreadPercent < binanceSpreadPercent) score = -1;
    
    return {
      symbol,
      binanceSpread,
      binanceSpreadPercent,
      toobitSpread,
      toobitSpreadPercent,
      score
    };
  });
});

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

// 获取数值标签类型
const getValueTagType = (value1, value2) => {
  if (value1 > value2) return 'success';
  if (value1 < value2) return 'danger';
  return 'warning';
};

// 获取分数标签类型
const getScoreTagType = score => {
  if (score > 0) return 'success';
  if (score < 0) return 'danger';
  return 'info';
};

// 格式化价差显示
const formatSpread = spreadPercent => {
  if (!spreadPercent || spreadPercent === 0) return '0.0000 %';
  return `${spreadPercent.toFixed(4)} %`;
};

// 获取价差标签类型
const getSpreadTagType = spreadPercent => {
  if (spreadPercent < 0.05) return 'success'; // 小于0.05%为绿色（优秀）
  if (spreadPercent < 0.1) return 'warning';   // 0.05%-0.1%为黄色（良好）
  return 'danger'; // 大于0.1%为红色（较差）
};

// 获取连接状态
const getConnectionStatus = exchange => {
  if (exchange === 'binance') {
    const statuses = symbols.map(symbol => 
      binanceStore.getConnectionStatus(symbol)
    );
    
    if (statuses.every(status => status === 'connected')) return 'connected';
    if (statuses.some(status => status === 'connecting')) return 'connecting';
    if (statuses.some(status => status === 'error')) return 'error';
    return 'disconnected';
  } else if (exchange === 'toobit') {
    const statuses = symbols.map(symbol => 
      toobitStore.getConnectionStatus(symbol)
    );
    
    if (statuses.every(status => status === 'connected')) return 'connected';
    if (statuses.some(status => status === 'connecting')) return 'connecting';
    if (statuses.some(status => status === 'error')) return 'error';
    return 'disconnected';
  }
  
  return 'disconnected';
};

// 获取连接状态文本
const getConnectionStatusText = exchange => {
  const status = getConnectionStatus(exchange);
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '连接错误'
  };
  return statusMap[status] || '未知';
};

// 获取连接状态颜色
const getStatusColor = exchange => {
  const status = getConnectionStatus(exchange);
  const colorMap = {
    connected: '#67c23a',
    connecting: '#e6a23c',
    disconnected: '#909399',
    error: '#f56c6c'
  };
  return colorMap[status] || '#909399';
};

// 获取连接状态样式
const getStatusStyle = exchange => {
  const status = getConnectionStatus(exchange);
  const styleMap = {
    connected: { color: '#67c23a', fontSize: '14px' },
    connecting: { color: '#e6a23c', fontSize: '14px' },
    disconnected: { color: '#909399', fontSize: '14px' },
    error: { color: '#f56c6c', fontSize: '14px' }
  };
  return styleMap[status] || { color: '#909399', fontSize: '14px' };
};

// 获取连接状态图标
const getStatusIcon = exchange => {
  const status = getConnectionStatus(exchange);
  const iconMap = {
    connected: 'CircleCheck',
    connecting: 'Loading',
    disconnected: 'CircleClose',
    error: 'Warning'
  };
  return iconMap[status] || 'CircleClose';
};

// 表格样式
const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  return {
    textAlign: 'center'
  };
};

const getHeaderCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  return {
    textAlign: 'center',
    fontWeight: 'bold'
  };
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
.depth-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 卡片样式 */
.header-card,
.control-card,
.table-card,
.spread-card,
.status-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

/* 深度选择器样式 */
.depth-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.depth-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

/* 控制面板样式 */
.control-group {
  margin-bottom: 15px;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

/* 表格样式 */
.comparison-table {
  width: 100%;
}

.comparison-table :deep(.el-table__header) {
  background-color: var(--el-bg-color);
}

.comparison-table :deep(.el-table__header th) {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-weight: bold;
}

.comparison-table :deep(.el-table__body tr) {
  background-color: var(--el-bg-color);
}

.comparison-table :deep(.el-table__body tr:hover) {
  background-color: var(--el-bg-color-page);
}

.comparison-table :deep(.el-table__body td) {
  color: var(--el-text-color-primary);
}

/* 价差表格样式 */
.spread-table {
  width: 100%;
}

.spread-table :deep(.el-table__header) {
  background-color: var(--el-bg-color);
}

.spread-table :deep(.el-table__header th) {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-weight: bold;
}

.spread-table :deep(.el-table__body tr) {
  background-color: var(--el-bg-color);
}

.spread-table :deep(.el-table__body tr:hover) {
  background-color: var(--el-bg-color-page);
}

.spread-table :deep(.el-table__body td) {
  color: var(--el-text-color-primary);
}

/* 确保按钮文字颜色清晰 */
.comparison-table :deep(.el-button--primary) {
  color: #ffffff !important;
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.comparison-table :deep(.el-button--primary:hover) {
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
}

/* 价差表格按钮样式 */
.spread-table :deep(.el-button--primary) {
  color: #ffffff !important;
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.spread-table :deep(.el-button--primary:hover) {
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
}

/* 确保标签颜色对比度 */
.comparison-table :deep(.el-tag--success) {
  background-color: #f0f9ff !important;
  color: #0369a1 !important;
  border-color: #bae6fd !important;
}

.comparison-table :deep(.el-tag--danger) {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
  border-color: #fecaca !important;
}

.comparison-table :deep(.el-tag--warning) {
  background-color: #fffbeb !important;
  color: #d97706 !important;
  border-color: #fed7aa !important;
}

/* 价差表格标签样式 */
.spread-table :deep(.el-tag--success) {
  background-color: #f0f9ff !important;
  color: #0369a1 !important;
  border-color: #bae6fd !important;
}

.spread-table :deep(.el-tag--danger) {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
  border-color: #fecaca !important;
}

.spread-table :deep(.el-tag--warning) {
  background-color: #fffbeb !important;
  color: #d97706 !important;
  border-color: #fed7aa !important;
}

/* 状态样式 */
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--el-bg-color-page);
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.status-value {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  /* 深色模式下的标签颜色 */
  .comparison-table :deep(.el-tag--success) {
    background-color: #14532d !important;
    color: #86efac !important;
    border-color: #22c55e !important;
  }

  .comparison-table :deep(.el-tag--danger) {
    background-color: #7f1d1d !important;
    color: #fca5a5 !important;
    border-color: #ef4444 !important;
  }

  .comparison-table :deep(.el-tag--warning) {
    background-color: #78350f !important;
    color: #fbbf24 !important;
    border-color: #f59e0b !important;
  }

  /* 价差表格深色模式标签颜色 */
  .spread-table :deep(.el-tag--success) {
    background-color: #14532d !important;
    color: #86efac !important;
    border-color: #22c55e !important;
  }

  .spread-table :deep(.el-tag--danger) {
    background-color: #7f1d1d !important;
    color: #fca5a5 !important;
    border-color: #ef4444 !important;
  }

  .spread-table :deep(.el-tag--warning) {
    background-color: #78350f !important;
    color: #fbbf24 !important;
    border-color: #f59e0b !important;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .depth-container {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    align-self: flex-end;
  }
  
  .control-group {
    margin-bottom: 20px;
  }
  
  /* 移动端深度选择器 */
  .depth-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .depth-selector :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .depth-selector :deep(.el-radio-button) {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  /* 超小屏幕优化 */
  .depth-selector :deep(.el-radio-button__inner) {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>