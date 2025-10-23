<template>
  <div class="depth-comparison-container">
    <!-- 资产类型筛选 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">资产类型筛选</span>
        </div>
      </template>
      <el-radio-group v-model="assetType" class="filter-group" @change="updateAssetType">
        <el-radio-button label="futures">
          合约(PERP)
        </el-radio-button>
        <el-radio-button label="spot">
          现货(SPOT)
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 深度详情对比选项 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">深度详情对比(Depth Detail Comparison)</span>
          <el-tag type="info" size="small">
            当前: {{ currentDepthLabel }}
          </el-tag>
        </div>
      </template>
      <el-radio-group v-model="depthPercentage" class="depth-group" @change="updateDepthPercentage">
        <el-radio-button 
          v-for="option in depthOptions" 
          :key="option.value"
          :label="option.value"
        >
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 买盘/卖盘选择 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">订单方向</span>
        </div>
      </template>
      <el-radio-group v-model="orderSide" class="side-group" @change="updateOrderSide">
        <el-radio-button label="buy">
          买盘
        </el-radio-button>
        <el-radio-button label="sell">
          卖盘
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">深度对比数据</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              :icon="RefreshIcon" 
              :loading="isRefreshing"
              @click="refreshData"
            >
              刷新数据
            </el-button>
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
        <el-table-column prop="symbol" label="资产(ASSET)" width="150" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              style="border: none; background: transparent; color: var(--el-color-primary);"
              @click="goToSymbolDetail(row.symbol)"
            >
              {{ row.symbol }} PERP
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column prop="binanceValue" label="BINANCE" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getValueTagType(row.binanceValue, row.toobitValue)"
              size="small"
            >
              {{ formatQuantity(row.binanceValue) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="toobitValue" label="TOOBIT" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getValueTagType(row.toobitValue, row.binanceValue)"
              size="small"
            >
              {{ formatQuantity(row.toobitValue) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="分数↑" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getScoreTagType(row.score)"
              size="small"
              effect="dark"
            >
              {{ getScoreText(row.score) }}
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
        <el-col :span="8">
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
        
        <el-col :span="8">
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
        
        <el-col :span="8">
          <div class="status-item">
            <div class="status-icon">
              <el-icon color="#409EFF" size="20">
                <Clock />
              </el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                数据更新时间
              </div>
              <div class="status-value" style="color: #409EFF; font-size: 14px;">
                {{ lastUpdateTime }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import {
  CircleCheck as CircleCheckIcon,
  CircleClose as CircleCloseIcon,
  Clock,
  Connection as ConnectionIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@element-plus/icons-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBinanceStore, useToobitStore } from '../stores/index.js';

const binanceStore = useBinanceStore();
const toobitStore = useToobitStore();
const router = useRouter();

// 响应式数据
const assetType = ref('futures');
const depthPercentage = ref('0.01');
const orderSide = ref('buy');
const isRefreshing = ref(false);
const lastUpdateTime = ref('--');

// 节流控制
const updateTimer = ref(null);
const pendingUpdate = ref(false);
const throttledTableData = ref([]);
const autoRefreshTimer = ref(null);

// 支持的币对
const symbols = ['BTCUSDT', 'ETHUSDT'];

// 深度选项配置
const depthOptions = [
  { label: '万1(0.01%)', value: '0.01' },
  { label: '万5(0.05%)', value: '0.05' },
  { label: '微观(0.1%)', value: '0.1' },
  { label: '紧密(0.5%)', value: '0.5' },
  { label: '核心(1%)', value: '1' },
  { label: '巨额(2%)', value: '2' },
  { label: '大额(5%)', value: '5' },
  { label: '极限(10%)', value: '10' }
];

// 计算当前深度标签
const currentDepthLabel = computed(() => {
  const option = depthOptions.find(opt => opt.value === depthPercentage.value);
  return option ? option.label : '核心(1%)';
});

// 计算深度比较数据
const multiSymbolDepthComparisonData = computed(() => {
  const percentage = parseFloat(depthPercentage.value) / 100;
  const isBuySide = orderSide.value === 'buy';
  
  return symbols.map(symbol => {
    const binanceData = binanceStore.getDepthDataBySymbol(symbol);
    const toobitData = toobitStore.getDepthDataBySymbol(symbol);
    
    if (!binanceData || !toobitData) {
      return {
        symbol,
        binanceValue: 0,
        toobitValue: 0,
        score: 0
      };
    }

    let binanceValue, toobitValue;

    if (isBuySide) {
      binanceValue = calculateBuyDepth(binanceData.bids, binanceData.bestBid, percentage);
      toobitValue = calculateBuyDepth(toobitData.bids, toobitData.bestBid, percentage);
    } else {
      binanceValue = calculateSellDepth(binanceData.asks, binanceData.bestAsk, percentage);
      toobitValue = calculateSellDepth(toobitData.asks, toobitData.bestAsk, percentage);
    }

    const diff = toobitValue - binanceValue;
    const score = diff > 0 ? 1 : (diff < 0 ? -1 : 0);

    return {
      symbol,
      binanceValue,
      toobitValue,
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

// 节流更新函数
const throttledUpdate = () => {
  // 如果已经有待处理的更新，直接返回
  if (pendingUpdate.value) return;
  
  pendingUpdate.value = true;
  
  // 清除之前的定时器
  if (updateTimer.value) {
    clearTimeout(updateTimer.value);
  }
  
  // 使用requestAnimationFrame确保在下一个渲染帧更新
  updateTimer.value = setTimeout(() => {
    requestAnimationFrame(() => {
      const data = multiSymbolDepthComparisonData.value;
      throttledTableData.value = data.map(item => ({
        symbol: item.symbol,
        binanceValue: item.binanceValue,
        toobitValue: item.toobitValue,
        score: item.score
      }));
      lastUpdateTime.value = new Date().toLocaleTimeString();
      pendingUpdate.value = false;
      updateTimer.value = null;
    });
  }, 1000);
};

// 自动刷新函数
const startAutoRefresh = () => {
  // 每1秒自动刷新一次数据
  autoRefreshTimer.value = setInterval(() => {
    const data = multiSymbolDepthComparisonData.value;
    throttledTableData.value = data.map(item => ({
      symbol: item.symbol,
      binanceValue: item.binanceValue,
      toobitValue: item.toobitValue,
      score: item.score
    }));
    lastUpdateTime.value = new Date().toLocaleTimeString();
  }, 1000);
};

// 跳转到币对详情页面
const goToSymbolDetail = symbol => {
  router.push(`/symbol/${symbol}`);
};

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
};

// 表格数据（节流后的数据）
const tableData = computed(() => throttledTableData.value);

// 更新资产类型
const updateAssetType = type => {
  assetType.value = type;
  binanceStore.updateConfig({ exchangeType: type });
};

// 更新深度百分比
const updateDepthPercentage = percentage => {
  depthPercentage.value = percentage;
  // 深度百分比不需要重新连接WebSocket
};

// 更新订单方向
const updateOrderSide = side => {
  orderSide.value = side;
  // 订单方向不需要重新连接WebSocket
};

// 刷新数据
const refreshData = async() => {
  isRefreshing.value = true;
  try {
    await Promise.all([
      binanceStore.reconnectWebSockets(),
      toobitStore.reconnectWebSockets()
    ]);
    
    // 立即更新数据，不等待节流
    const data = multiSymbolDepthComparisonData.value;
    throttledTableData.value = data.map(item => ({
      symbol: item.symbol,
      binanceValue: item.binanceValue,
      toobitValue: item.toobitValue,
      score: item.score
    }));
    lastUpdateTime.value = new Date().toLocaleTimeString();
    
    // 重置节流状态
    if (updateTimer.value) {
      clearTimeout(updateTimer.value);
      updateTimer.value = null;
    }
    pendingUpdate.value = false;
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// 获取深度值
const getDepthValue = (symbol, exchange) => {
  const comparisonData = multiSymbolDepthComparisonData.value;
  const symbolData = comparisonData.find(item => item.symbol === symbol);
  
  if (!symbolData) return 0;
  
  if (exchange === 'binance') {
    return symbolData.binanceValue;
  } else if (exchange === 'toobit') {
    return symbolData.toobitValue;
  }
  
  return 0;
};

// 获取分数
const getScore = symbol => {
  const comparisonData = multiSymbolDepthComparisonData.value;
  const symbolData = comparisonData.find(item => item.symbol === symbol);
  
  if (!symbolData) return '0';
  
  const score = symbolData.score;
  if (score > 0) return '+1';
  if (score < 0) return '-1';
  return '0';
};

// 获取分数文本
const getScoreText = score => {
  if (score > 0) return '+1';
  if (score < 0) return '-1';
  return '0';
};

// 获取值标签类型
const getValueTagType = (value, otherValue) => {
  if (value > otherValue) return 'success';
  if (value < otherValue) return 'danger';
  return 'warning';
};

// 获取分数标签类型
const getScoreTagType = score => {
  if (score > 0) return 'success';
  if (score < 0) return 'danger';
  return 'info';
};

// 获取单元格样式
const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 0) {
    return { backgroundColor: '#f5f7fa', fontWeight: 'bold' };
  }
  return {};
};

// 获取表头样式
const getHeaderCellStyle = () => {
  return { 
    backgroundColor: '#f5f7fa', 
    color: '#303133', 
    fontWeight: 'bold',
    textAlign: 'center'
  };
};

// 格式化数量
const formatQuantity = quantity => {
  if (!quantity || quantity === 0) return '--';
  
  if (quantity >= 1000000) {
    return `${(quantity / 1000000).toFixed(1)}M`;
  } else if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)}K`;
  } else {
    return quantity.toFixed(1);
  }
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
    error: '错误',
    disconnected: '未连接'
  };
  return statusMap[status] || '未知';
};

// 获取状态颜色
const getStatusColor = exchange => {
  const status = getConnectionStatus(exchange);
  const colorMap = {
    connected: '#67C23A',
    connecting: '#E6A23C',
    error: '#F56C6C',
    disconnected: '#909399'
  };
  return colorMap[status] || '#909399';
};

// 获取状态样式
const getStatusStyle = exchange => {
  const color = getStatusColor(exchange);
  return {
    color: color,
    fontSize: '14px',
    fontWeight: 'bold'
  };
};

// 获取状态图标
const getStatusIcon = exchange => {
  const status = getConnectionStatus(exchange);
  const iconMap = {
    connected: CircleCheckIcon,
    connecting: ConnectionIcon,
    error: CircleCloseIcon,
    disconnected: WarningIcon
  };
  return iconMap[status] || WarningIcon;
};

// 监听配置变化
watch([assetType, depthPercentage, orderSide], () => {
  // 配置变化时立即更新数据
  const data = multiSymbolDepthComparisonData.value;
  throttledTableData.value = data.map(item => ({
    symbol: item.symbol,
    binanceValue: item.binanceValue,
    toobitValue: item.toobitValue,
    score: item.score
  }));
  lastUpdateTime.value = new Date().toLocaleTimeString();
  
  // 重置节流状态
  if (updateTimer.value) {
    clearTimeout(updateTimer.value);
    updateTimer.value = null;
  }
  pendingUpdate.value = false;
}, { deep: true });

// 组件挂载时连接WebSocket
onMounted(async() => {
  binanceStore.updateConfig({
    exchangeType: assetType.value,
    depthLevels: 250
  });
  
  await Promise.all([
    binanceStore.connectWebSockets(),
    toobitStore.connectWebSockets()
  ]);
  
  // 初始化表格数据
  const data = multiSymbolDepthComparisonData.value;
  throttledTableData.value = data.map(item => ({
    symbol: item.symbol,
    binanceValue: item.binanceValue,
    toobitValue: item.toobitValue,
    score: item.score
  }));
  lastUpdateTime.value = new Date().toLocaleTimeString();
  
  // 启动自动刷新
  startAutoRefresh();
});

// 组件卸载时断开连接
onUnmounted(() => {
  // 停止自动刷新
  stopAutoRefresh();
  
  // 清理定时器
  if (updateTimer.value) {
    clearTimeout(updateTimer.value);
    updateTimer.value = null;
  }
  
  // 断开WebSocket连接
  binanceStore.disconnectAll();
  toobitStore.disconnectAll();
});
</script>

<style scoped>
.depth-comparison-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 卡片样式 */
.filter-card,
.table-card,
.status-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 单选按钮组样式 */
.filter-group,
.depth-group,
.side-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.depth-group {
  flex-wrap: wrap;
}

.depth-group .el-radio-button {
  margin-bottom: 8px;
}

/* 表格样式 */
.comparison-table {
  width: 100%;
}

.comparison-table :deep(.el-table__header) {
  background-color: var(--el-fill-color-light);
}

.comparison-table :deep(.el-table__header th) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: bold;
  text-align: center;
}

.comparison-table :deep(.el-table__body tr:hover > td) {
  background-color: var(--el-fill-color-lighter);
}

/* 标签样式 */
.el-tag {
  font-weight: 500;
}

/* 状态项样式 */
.status-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  transition: all 0.3s ease;
}

.status-item:hover {
  background: var(--el-fill-color-light);
  transform: translateY(-2px);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-title {
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
}

.status-value {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .depth-comparison-container {
    padding: 10px;
  }
  
  .filter-group,
  .depth-group,
  .side-group {
    flex-direction: column;
  }
  
  .depth-group .el-radio-button {
    width: 100%;
  }
  
  .comparison-table {
    font-size: 12px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .depth-comparison-container {
    padding: 5px;
  }
  
  .filter-card,
  .table-card,
  .status-card {
    margin-bottom: 15px;
  }
  
  .comparison-table :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}

/* 暗色主题适配 */
html.dark .depth-comparison-container {
  background: var(--el-bg-color-page);
}

html.dark .comparison-table :deep(.el-table__header) {
  background-color: var(--el-fill-color-darker);
}

html.dark .comparison-table :deep(.el-table__header th) {
  background-color: var(--el-fill-color-darker);
  color: var(--el-text-color-primary);
}

html.dark .comparison-table :deep(.el-table__body tr:hover > td) {
  background-color: var(--el-fill-color-dark);
}

/* 动画效果 */
.filter-card,
.table-card,
.status-card {
  transition: all 0.3s ease;
}

.filter-card:hover,
.table-card:hover,
.status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

/* 加载状态 */
.el-button.is-loading {
  pointer-events: none;
}

/* 自定义滚动条 */
.comparison-table :deep(.el-table__body-wrapper)::-webkit-scrollbar {
  height: 8px;
}

.comparison-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.comparison-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: var(--el-fill-color-dark);
  border-radius: 4px;
}

.comparison-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: var(--el-fill-color-darker);
}
</style>
