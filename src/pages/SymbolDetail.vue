<template>
  <div class="symbol-detail-container">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button 
              type="primary" 
              :icon="ArrowLeft" 
              size="small"
              @click="goBack"
            >
              返回
            </el-button>
            <h2 class="page-title">
              {{ symbol }} 流动性热力图
            </h2>
          </div>
          <div class="header-right">
            <el-tag type="info" size="small">
              更新时间: {{ lastUpdateTime }}
            </el-tag>
            <el-button 
              type="primary" 
              :icon="RefreshIcon" 
              :loading="isRefreshing"
              size="small"
              @click="refreshData"
            >
              刷新
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">流动性数据</span>
        </div>
      </template>
      
      <el-table 
        v-loading="isLoading" 
        :data="tableData" 
        stripe 
        border
        class="liquidity-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="exchange" label="交易所" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getExchangeTagType(row.exchange)" size="small">
              {{ row.exchange }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="spread" label="价差%" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSpreadTagType(row.spreadPercent)"
              size="small"
              effect="dark"
            >
              {{ row.spreadPercent.toFixed(4) }}%
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          v-for="depth in depthLevels" 
          :key="depth.value"
          :prop="`depth_${depth.value}`"
          :label="depth.label"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="getLiquidityTagType(row[`depth_${depth.value}`], depth.value)"
              size="small"
            >
              {{ formatLiquidity(row[`depth_${depth.value}`]) }}
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
        <el-col v-for="exchange in exchanges" :key="exchange" :span="6">
          <el-statistic 
            :title="exchange" 
            :value="getConnectionStatusText(exchange)"
            :value-style="getStatusStyle(exchange)"
          >
            <template #prefix>
              <el-icon :color="getStatusColor(exchange)">
                <component :is="getStatusIcon(exchange)" />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import {
  ArrowLeft,
  CircleCheck as CircleCheckIcon,
  CircleClose as CircleCloseIcon,
  Connection as ConnectionIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@element-plus/icons-vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDepthStore } from '../stores/depth.js';

const route = useRoute();
const router = useRouter();
const depthStore = useDepthStore();

// 响应式数据
const symbol = ref('');
const isLoading = ref(false);
const isRefreshing = ref(false);
const lastUpdateTime = ref('--');
const tableData = ref([]);

// 深度级别配置
const depthLevels = [
  { label: '万1(0.01%)', value: '0.01' },
  { label: '万5(0.05%)', value: '0.05' },
  { label: '微观(0.1%)', value: '0.1' },
  { label: '紧密(0.5%)', value: '0.5' },
  { label: '核心(1%)', value: '1' },
  { label: '巨额(2%)', value: '2' },
  { label: '大额(5%)', value: '5' },
  { label: '极限(10%)', value: '10' }
];

// 支持的交易所
const exchanges = ['Binance', 'OKX', 'Bitunix', 'Toobit'];

// 计算价差和价差比例
const calculateSpread = (exchange, symbol) => {
  const data = depthStore.getDepthDataByExchangeAndSymbol(exchange.toLowerCase(), symbol);
  if (!data || !data.bestBid || !data.bestAsk) {
    return { spread: 0, spreadPercent: 0 };
  }
  
  const spread = data.bestAsk - data.bestBid;
  const spreadPercent = (spread / data.bestBid) * 100;
  
  return { spread, spreadPercent };
};

// 计算指定深度的流动性
const calculateLiquidity = (exchange, symbol, percentage) => {
  const data = depthStore.getDepthDataByExchangeAndSymbol(exchange.toLowerCase(), symbol);
  if (!data) return 0;
  
  const percentageValue = parseFloat(percentage) / 100;
  
  // 计算买盘和卖盘的流动性
  const buyLiquidity = calculateBuyDepth(data.bids, data.bestBid, percentageValue);
  const sellLiquidity = calculateSellDepth(data.asks, data.bestAsk, percentageValue);
  
  // 返回总流动性（买盘 + 卖盘）
  return buyLiquidity + sellLiquidity;
};

// 计算买盘深度
const calculateBuyDepth = (bids, bestBid, percentage) => {
  if (!bids || bids.length === 0 || !bestBid || bestBid === 0) {
    return 0;
  }
  
  const targetPrice = bestBid * (1 - percentage);
  let totalQuantity = 0;
  
  for (const bid of bids) {
    if (bid.price <= bestBid && bid.price >= targetPrice) {
      totalQuantity += bid.quantity;
    }
  }
  
  return totalQuantity;
};

// 计算卖盘深度
const calculateSellDepth = (asks, bestAsk, percentage) => {
  if (!asks || asks.length === 0 || !bestAsk || bestAsk === 0) {
    return 0;
  }
  
  const targetPrice = bestAsk * (1 + percentage);
  let totalQuantity = 0;
  
  for (const ask of asks) {
    if (ask.price >= bestAsk && ask.price <= targetPrice) {
      totalQuantity += ask.quantity;
    }
  }
  
  return totalQuantity;
};

// 更新表格数据
const updateTableData = () => {
  const data = [];
  
  exchanges.forEach(exchange => {
    const exchangeData = {
      exchange: exchange,
      ...calculateSpread(exchange.toLowerCase(), symbol.value)
    };
    
    // 计算各深度的流动性
    depthLevels.forEach(depth => {
      const liquidity = calculateLiquidity(exchange.toLowerCase(), symbol.value, depth.value);
      exchangeData[`depth_${depth.value}`] = liquidity;
    });
    
    data.push(exchangeData);
  });
  
  tableData.value = data;
  lastUpdateTime.value = new Date().toLocaleTimeString();
};

// 刷新数据
const refreshData = async() => {
  isRefreshing.value = true;
  try {
    await depthStore.reconnectWebSockets();
    updateTableData();
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 获取交易所标签类型
const getExchangeTagType = exchange => {
  const typeMap = {
    'Binance': 'success',
    'OKX': 'warning',
    'Bitunix': 'info',
    'Toobit': 'primary'
  };
  return typeMap[exchange] || 'info';
};

// 获取价差标签类型
const getSpreadTagType = spreadPercent => {
  if (spreadPercent < 0.05) return 'success';
  if (spreadPercent < 0.1) return 'warning';
  return 'danger';
};

// 获取流动性标签类型
const getLiquidityTagType = (liquidity, depth) => {
  // 根据深度和流动性值判断颜色
  const depthValue = parseFloat(depth);
  const threshold = depthValue * 1000; // 动态阈值
  
  if (liquidity > threshold * 2) return 'success';
  if (liquidity > threshold) return 'warning';
  return 'danger';
};

// 格式化流动性
const formatLiquidity = liquidity => {
  if (!liquidity || liquidity === 0) return '--';
  
  if (liquidity >= 1000000) {
    return `${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `${(liquidity / 1000).toFixed(1)}K`;
  } else {
    return liquidity.toFixed(1);
  }
};

// 获取单元格样式
const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 0) {
    return { backgroundColor: 'var(--el-fill-color-light)', fontWeight: 'bold' };
  }
  return {};
};

// 获取表头样式
const getHeaderCellStyle = () => {
  return { 
    backgroundColor: 'var(--el-fill-color-light)', 
    color: 'var(--el-text-color-primary)', 
    fontWeight: 'bold',
    textAlign: 'center'
  };
};

// 获取连接状态
const getConnectionStatus = exchange => {
  return depthStore.getConnectionStatus(exchange.toLowerCase(), symbol.value);
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

// 组件挂载
onMounted(async() => {
  symbol.value = route.params.symbol || 'BTCUSDT';
  
  // 确保WebSocket连接
  if (!depthStore.getConnectionStatus('binance', symbol.value) === 'connected') {
    await depthStore.connectWebSockets();
  }
  
  // 初始化数据
  updateTableData();
  
  // 设置定时更新
  const timer = setInterval(updateTableData, 5000);
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(timer);
  });
});
</script>

<style scoped>
.symbol-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 卡片样式 */
.header-card,
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

/* 表格样式 */
.liquidity-table {
  width: 100%;
}

.liquidity-table :deep(.el-table__header) {
  background-color: var(--el-fill-color-light);
}

.liquidity-table :deep(.el-table__header th) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: bold;
  text-align: center;
}

.liquidity-table :deep(.el-table__body tr:hover > td) {
  background-color: var(--el-fill-color-lighter);
}

/* 标签样式 */
.el-tag {
  font-weight: 500;
}

/* 统计卡片样式 */
.el-statistic {
  text-align: center;
}

.el-statistic :deep(.el-statistic__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.el-statistic :deep(.el-statistic__title) {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin-bottom: 8px;
}

.el-statistic :deep(.el-statistic__number) {
  font-size: 16px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .symbol-detail-container {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-left,
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .liquidity-table {
    font-size: 12px;
  }
  
  .liquidity-table :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}

/* 暗色主题适配 */
html.dark .liquidity-table :deep(.el-table__header) {
  background-color: var(--el-fill-color-darker);
}

html.dark .liquidity-table :deep(.el-table__header th) {
  background-color: var(--el-fill-color-darker);
  color: var(--el-text-color-primary);
}

html.dark .liquidity-table :deep(.el-table__body tr:hover > td) {
  background-color: var(--el-fill-color-dark);
}

/* 动画效果 */
.header-card,
.table-card,
.status-card {
  transition: all 0.3s ease;
}

.header-card:hover,
.table-card:hover,
.status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}
</style>
