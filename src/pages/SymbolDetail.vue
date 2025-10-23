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
              {{ symbol }} 单币对详情
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
            <label class="control-label">交易对</label>
            <el-select v-model="selectedSymbol" placeholder="选择交易对" @change="updateSymbol">
              <el-option 
                v-for="option in symbolOptions" 
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
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
              <el-radio-button label="both">
                全部
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 滑点模拟 -->
    <el-card class="slippage-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">滑点模拟</span>
        </div>
      </template>
      
      <div class="slippage-controls">
        <div class="input-group">
          <label class="input-label">模拟交易数量 ({{ symbol.replace('USDT', '') }})</label>
          <el-input-number
            v-model="simulationQuantity"
            :min="0.001"
            :max="1000"
            :precision="3"
            :step="0.1"
            size="large"
            @change="calculateSlippage"
          />
        </div>
        <el-button 
          type="primary" 
          size="large"
          @click="calculateSlippage"
        >
          计算滑点
        </el-button>
      </div>
      
      <el-table 
        :data="slippageData" 
        stripe 
        border
        class="slippage-table"
        v-loading="isCalculating"
      >
        <el-table-column prop="exchange" label="交易所" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getExchangeTagType(row.exchange)" size="large">
              {{ row.exchange.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="buySlippage" label="买入滑点" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSlippageTagType(row.buySlippage)"
              size="large"
            >
              {{ formatSlippage(row.buySlippage) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="sellSlippage" label="卖出滑点" width="200" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSlippageTagType(row.sellSlippage)"
              size="large"
            >
              {{ formatSlippage(row.sellSlippage) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="buyAvgPrice" label="买入均价" width="150" align="center">
          <template #default="{ row }">
            <span class="price-text">{{ formatPrice(row.buyAvgPrice) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="sellAvgPrice" label="卖出均价" width="150" align="center">
          <template #default="{ row }">
            <span class="price-text">{{ formatPrice(row.sellAvgPrice) }}</span>
          </template>
        </el-table-column>
      </el-table>
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
          <div class="status-item">
            <div class="status-icon">
              <el-icon :color="getStatusColor(exchange)" size="20">
                <component :is="getStatusIcon(exchange)" />
              </el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                {{ exchange }}
              </div>
              <div class="status-value" :style="getStatusStyle(exchange)">
                {{ getConnectionStatusText(exchange) }}
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
  ArrowLeft,
  CircleCheck as CircleCheckIcon,
  CircleClose as CircleCloseIcon,
  Connection as ConnectionIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@element-plus/icons-vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBinanceStore, useOKXStore, useToobitStore } from '../stores/index.js';

const route = useRoute();
const router = useRouter();
const binanceStore = useBinanceStore();
const okxStore = useOKXStore();
const toobitStore = useToobitStore();

// 响应式数据
const symbol = ref('');
const selectedSymbol = ref('');
const orderSide = ref('both'); // 'buy', 'sell', 'both'
const isLoading = ref(false);
const isRefreshing = ref(false);
const lastUpdateTime = ref('--');
const tableData = ref([]);

// 滑点模拟相关
const simulationQuantity = ref(1.0);
const slippageData = ref([]);
const isCalculating = ref(false);

// 交易对选项
const symbolOptions = ref([
  { label: 'BTCUSDT', value: 'BTCUSDT' },
  { label: 'ETHUSDT', value: 'ETHUSDT' }
]);

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
const exchanges = ['Binance', 'OKX', 'Toobit'];

// 计算价差和价差比例
const calculateSpread = (exchange, symbol) => {
  let data;
  
  switch (exchange.toLowerCase()) {
  case 'binance':
    data = binanceStore.getDepthDataBySymbol(symbol);
    break;
  case 'okx':
    data = okxStore.getDepthDataBySymbol(symbol);
    break;
  case 'toobit':
    data = toobitStore.getDepthDataBySymbol(symbol);
    break;
  default:
    return { spread: 0, spreadPercent: 0 };
  }
  
  if (!data || !data.bestBid || !data.bestAsk) {
    return { spread: 0, spreadPercent: 0 };
  }
  
  const spread = data.bestAsk - data.bestBid;
  const spreadPercent = (spread / data.bestBid) * 100;
  
  return { spread, spreadPercent };
};

// 计算指定深度的流动性
const calculateLiquidity = (exchange, symbol, percentage) => {
  let data;
  
  switch (exchange.toLowerCase()) {
  case 'binance':
    data = binanceStore.getDepthDataBySymbol(symbol);
    break;
  case 'okx':
    data = okxStore.getDepthDataBySymbol(symbol);
    break;
  case 'toobit':
    data = toobitStore.getDepthDataBySymbol(symbol);
    break;
  default:
    return 0;
  }
  
  if (!data) return 0;
  
  const percentageValue = parseFloat(percentage) / 100;
  
  // 根据订单方向计算流动性
  if (orderSide.value === 'buy') {
    return calculateBuyDepth(data.bids, data.bestBid, percentageValue);
  } else if (orderSide.value === 'sell') {
    return calculateSellDepth(data.asks, data.bestAsk, percentageValue);
  } else {
    // 全部：买盘 + 卖盘
    const buyLiquidity = calculateBuyDepth(data.bids, data.bestBid, percentageValue);
    const sellLiquidity = calculateSellDepth(data.asks, data.bestAsk, percentageValue);
    return buyLiquidity + sellLiquidity;
  }
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

// 计算滑点
const calculateSlippage = () => {
  if (!simulationQuantity.value || simulationQuantity.value <= 0) {
    return;
  }
  
  isCalculating.value = true;
  
  try {
    const data = [];
    
    // 只计算币安和Toobit
    const targetExchanges = ['binance', 'toobit'];
    
    targetExchanges.forEach(exchange => {
      const exchangeData = getExchangeDepthData(exchange, symbol.value);
      if (exchangeData) {
        const buySlippage = calculateSlippageForSide(exchangeData.asks, simulationQuantity.value, 'buy');
        const sellSlippage = calculateSlippageForSide(exchangeData.bids, simulationQuantity.value, 'sell');
        data.push({
          exchange: exchange,
          buySlippage: buySlippage.slippagePercent,
          sellSlippage: sellSlippage.slippagePercent,
          buyAvgPrice: buySlippage.averagePrice,
          sellAvgPrice: sellSlippage.averagePrice
        });
      } else {
        data.push({
          exchange: exchange,
          buySlippage: 0,
          sellSlippage: 0,
          buyAvgPrice: 0,
          sellAvgPrice: 0
        });
      }
    });
    
    slippageData.value = data;
  } catch (error) {
    console.error('滑点计算错误:', error);
  } finally {
    isCalculating.value = false;
  }
};

// 获取交易所深度数据
const getExchangeDepthData = (exchange, symbol) => {
  switch (exchange.toLowerCase()) {
  case 'binance':
    return binanceStore.getDepthDataBySymbol(symbol);
  case 'toobit':
    return toobitStore.getDepthDataBySymbol(symbol);
  default:
    return null;
  }
};

// 计算单边滑点
const calculateSlippageForSide = (depthData, targetQuantity, side) => {
  if (!depthData || depthData.length === 0) {
    return { slippagePercent: 0, averagePrice: 0, startPrice: 0, finalPrice: 0 };
  }
  
  // 确定起始价格
  const startPrice = depthData[0].price;
  
  let totalExecutedValue = 0; // 累计成交金额
  let totalExecutedQuantity = 0; // 累计成交数量
  let remainingQuantity = targetQuantity; // 剩余未成交数量
  let finalPrice = startPrice; // 最终成交的最后一档价格
  
  // 模拟吃单过程
  for (const order of depthData) {
    if (remainingQuantity <= 0) {
      break; // 订单已完全成交
    }
    
    const price = order.price;
    const availableQuantity = order.quantity;
    
    // 计算当前档位成交量
    const executedQty = Math.min(remainingQuantity, availableQuantity);
    
    // 累计金额和数量
    totalExecutedValue += executedQty * price;
    totalExecutedQuantity += executedQty;
    remainingQuantity -= executedQty;
    finalPrice = price; // 记录当前档位价格
  }
  
  // 检查是否全部成交
  if (remainingQuantity > 0) {
    console.warn(`警告: 市场深度不足! 尚有 ${remainingQuantity.toFixed(2)} 未成交`);
  }
  
  // 计算实际成交均价
  const averagePrice = totalExecutedQuantity > 0 ? totalExecutedValue / totalExecutedQuantity : startPrice;
  
  // 计算滑点百分比
  const slippage = ((averagePrice - startPrice) / startPrice) * 100;
  
  return {
    slippagePercent: slippage,
    averagePrice: averagePrice,
    startPrice: startPrice,
    finalPrice: finalPrice
  };
};

// 刷新数据
const refreshData = async() => {
  isRefreshing.value = true;
  try {
    await Promise.all([
      binanceStore.reconnectWebSockets(),
      okxStore.reconnectWebSockets(),
      toobitStore.reconnectWebSockets()
    ]);
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

// 更新交易对
const updateSymbol = newSymbol => {
  symbol.value = newSymbol;
  selectedSymbol.value = newSymbol;
  updateTableData();
};

// 更新订单方向
const updateOrderSide = side => {
  orderSide.value = side;
  updateTableData();
};

// 获取交易所标签类型
const getExchangeTagType = exchange => {
  const typeMap = {
    'Binance': 'success',
    'OKX': 'warning',
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

// 格式化滑点
const formatSlippage = slippage => {
  if (!slippage || slippage === 0) return '0.0000 %';
  return `${slippage.toFixed(4)} %`;
};

// 格式化价格
const formatPrice = price => {
  if (!price || price === 0) return '--';
  return price.toFixed(2);
};

// 获取滑点标签类型
const getSlippageTagType = slippage => {
  if (slippage < 0.05) return 'success'; // 小于0.05%为绿色
  if (slippage < 0.1) return 'warning';  // 0.05%-0.1%为黄色
  return 'danger'; // 大于0.1%为红色
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
  let store;
  
  switch (exchange.toLowerCase()) {
  case 'binance':
    store = binanceStore;
    break;
  case 'okx':
    store = okxStore;
    break;
  case 'toobit':
    store = toobitStore;
    break;
  default:
    return 'disconnected';
  }
  
  return store.getConnectionStatus(symbol.value);
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
onMounted(() => {
  symbol.value = route.params.symbol || 'BTCUSDT';
  selectedSymbol.value = symbol.value;
  
  // WebSocket连接由SimpleLayout管理，这里不需要连接
  console.log('SymbolDetail页面已挂载，WebSocket连接由SimpleLayout管理');
  
  // 初始化数据
  updateTableData();
  
  // 初始化滑点计算
  calculateSlippage();
  
  // 设置每秒更新
  const timer = setInterval(updateTableData, 1000);
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(timer);
    // 页面离开时不清理连接，保持全局连接
    console.log('SymbolDetail页面已卸载，保持WebSocket连接');
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
.control-card,
.slippage-card,
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

/* 滑点控制面板样式 */
.slippage-controls {
  display: flex;
  align-items: end;
  gap: 20px;
  margin-bottom: 20px;
}

.input-group {
  flex: 1;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.price-text {
  font-family: 'Courier New', monospace;
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
