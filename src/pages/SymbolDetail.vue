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
        v-loading="isCalculating" 
        :data="slippageData" 
        stripe
        border
        class="slippage-table"
      >
        <el-table-column prop="exchange" label="交易所" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getExchangeTagType(row.exchangeName)" size="large">
              {{ row.exchangeName }}
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

    <!-- 流动性数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">流动性数据</span>
        </div>
      </template>
      
      <el-table 
        v-loading="isLoading" 
        :data="liquidityTableData" 
        stripe 
        border
        class="liquidity-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="exchangeName" label="交易所" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getExchangeTagType(row.exchangeName)" size="small">
              {{ row.exchangeName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="spreadPercent" label="价差%" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSpreadTagType(row.spreadPercent)"
              size="small"
              effect="dark"
            >
              {{ formatSpreadPercent(row.spreadPercent) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          v-for="depth in depthLevels" 
          :key="depth.value"
          :prop="`depth_${depth.value}`"
          :label="depth.label"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="getLiquidityTagType(row[`depth_${depth.value}`])"
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
      
      <div class="status-display">
        <el-tag :type="getConnectionStatusTagType" size="large">
          {{ connectionStatusText }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getExchangeName } from '../config/exchanges';
import { useDepthStore } from '../stores/depth';

const route = useRoute();
const router = useRouter();
const depthStore = useDepthStore();

// 响应式数据
const symbol = ref('BTCUSDT');
const selectedSymbol = ref('BTCUSDT');
const orderSide = ref('buy');
const isLoading = ref(false);
const lastUpdateTime = ref('--');

// 滑点模拟相关
const simulationQuantity = ref(1.0);
const slippageData = ref([]);
const isCalculating = ref(false);

// 交易对选项
const symbolOptions = ref([
  { label: 'BTCUSDT', value: 'BTCUSDT' },
  { label: 'ETHUSDT', value: 'ETHUSDT' },
]);

// 深度级别配置
const depthLevels = [
  { label: '万1(0.01%)', value: 0.0001 },
  { label: '万5(0.05%)', value: 0.0005 },
  { label: '微观(0.1%)', value: 0.001 },
  { label: '紧密(0.5%)', value: 0.005 },
  { label: '核心(1%)', value: 0.01 },
  { label: '巨额(2%)', value: 0.02 },
  { label: '大额(5%)', value: 0.05 },
  { label: '极限(10%)', value: 0.1 },
];

// 计算属性
const connectionStatusText = computed(() => {
  const statusMap = {
    connected: '已连接',
    connecting: '连接中...',
    disconnected: '未连接',
    error: '连接错误',
    failed: '连接失败',
  };
  return statusMap[depthStore.connectionStatus] || '未知';
});

const getConnectionStatusTagType = computed(() => {
  const statusTypeMap = {
    connected: 'success',
    connecting: 'warning',
    disconnected: 'info',
    error: 'danger',
    failed: 'danger',
  };
  return statusTypeMap[depthStore.connectionStatus] || 'info';
});

// 获取当前对比的交易所
const compareExchanges = computed(() => depthStore.compareExchanges);

// 流动性表格数据
const liquidityTableData = computed(() => {
  const exchanges = compareExchanges.value;
  const exchangeType = depthStore.config.exchangeType;
  
  return exchanges.map(exchangeId => {
    const depthData = depthStore.getDepthData(symbol.value, exchangeId);
    const exchangeName = getExchangeName(exchangeId, exchangeType);
    
    const row = {
      exchangeId,
      exchangeName,
      spreadPercent: depthData.spreadPercent || 0,
    };
    
    // 根据订单方向计算各深度的流动性
    for (const depth of depthLevels) {
      const pctKey = `${depth.value}`;
      const stats = depthData.depthStats?.[pctKey];
      
      if (orderSide.value === 'buy') {
        row[`depth_${depth.value}`] = stats?.bidDepth || 0;
      } else {
        row[`depth_${depth.value}`] = stats?.askDepth || 0;
      }
    }
    
    return row;
  });
});

// 计算滑点
const calculateSlippage = () => {
  if (!simulationQuantity.value || simulationQuantity.value <= 0) {
    return;
  }
  
  isCalculating.value = true;
  
  try {
    const data = [];
    const exchanges = compareExchanges.value;
    const exchangeType = depthStore.config.exchangeType;
    
    for (const exchangeId of exchanges) {
      const depthData = depthStore.getDepthData(symbol.value, exchangeId);
      const exchangeName = getExchangeName(exchangeId, exchangeType);
      
      if (depthData && depthData.asks && depthData.bids) {
        const buySlippage = calculateSlippageForSide(depthData.asks, simulationQuantity.value, 'buy');
        const sellSlippage = calculateSlippageForSide(depthData.bids, simulationQuantity.value, 'sell');
        
        data.push({
          exchangeId,
          exchangeName,
          buySlippage: buySlippage.slippagePercent,
          sellSlippage: sellSlippage.slippagePercent,
          buyAvgPrice: buySlippage.averagePrice,
          sellAvgPrice: sellSlippage.averagePrice,
        });
      } else {
        data.push({
          exchangeId,
          exchangeName,
          buySlippage: 0,
          sellSlippage: 0,
          buyAvgPrice: 0,
          sellAvgPrice: 0,
        });
      }
    }
    
    slippageData.value = data;
  } catch (error) {
    console.error('滑点计算错误:', error);
  } finally {
    isCalculating.value = false;
  }
};

// 计算单边滑点
const calculateSlippageForSide = (depthData, targetQuantity, side) => {
  if (!depthData || depthData.length === 0) {
    return { slippagePercent: 0, averagePrice: 0, startPrice: 0, finalPrice: 0 };
  }
  
  // 确定起始价格
  const startPrice = depthData[0].price;
  
  let totalExecutedValue = 0;
  let totalExecutedQuantity = 0;
  let remainingQuantity = targetQuantity;
  let finalPrice = startPrice;
  
  // 模拟吃单过程
  for (const order of depthData) {
    if (remainingQuantity <= 0) {
      break;
    }
    
    const price = order.price;
    const availableQuantity = order.quantity;
    
    const executedQty = Math.min(remainingQuantity, availableQuantity);
    
    totalExecutedValue += executedQty * price;
    totalExecutedQuantity += executedQty;
    remainingQuantity -= executedQty;
    finalPrice = price;
  }
  
  // 计算实际成交均价
  const averagePrice = totalExecutedQuantity > 0 ? totalExecutedValue / totalExecutedQuantity : startPrice;
  
  // 计算滑点百分比
  const slippage = ((averagePrice - startPrice) / startPrice) * 100;
  
  return {
    slippagePercent: Math.abs(slippage),
    averagePrice: averagePrice,
    startPrice: startPrice,
    finalPrice: finalPrice,
  };
};

// 更新最后更新时间
const updateLastTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString();
};

// 返回上一页
const goBack = () => {
  router.push('/multi-depth');
};

// 更新交易对
const updateSymbol = newSymbol => {
  symbol.value = newSymbol;
  selectedSymbol.value = newSymbol;
  calculateSlippage();
};

// 更新订单方向
const updateOrderSide = side => {
  orderSide.value = side;
  depthStore.updateOrderSide(side);
};

// 获取交易所标签类型
const getExchangeTagType = exchangeName => {
  const typeMap = {
    'Binance': 'warning',
    'Toobit': 'success',
    'OKX': 'primary',
  };
  return typeMap[exchangeName] || 'info';
};

// 获取价差标签类型
const getSpreadTagType = spreadPercent => {
  if (spreadPercent < 0.01) return 'success';
  if (spreadPercent < 0.05) return 'warning';
  return 'danger';
};

// 获取流动性标签类型
const getLiquidityTagType = liquidity => {
  if (liquidity > 100) return 'success';
  if (liquidity > 10) return 'warning';
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

// 格式化价差百分比
const formatSpreadPercent = spread => {
  if (!spread || spread === 0) return '0.0000%';
  return `${spread.toFixed(4)}%`;
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
  if (slippage < 0.05) return 'success';
  if (slippage < 0.1) return 'warning';
  return 'danger';
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
    textAlign: 'center',
  };
};

// 定时更新
let updateTimer = null;

// 组件挂载
onMounted(() => {
  // 从路由参数获取币种
  symbol.value = route.params.symbol || 'BTCUSDT';
  selectedSymbol.value = symbol.value;
  
  // 同步订单方向
  orderSide.value = depthStore.config.orderSide;
  
  // 确保 WebSocket 已连接
  if (!depthStore.isConnected) {
    depthStore.connect();
  }
  
  // 初始化滑点计算
  calculateSlippage();
  
  // 设置定时更新
  updateTimer = setInterval(() => {
    updateLastTime();
    calculateSlippage();
  }, 1000);
});

// 组件卸载
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
});

// 监听数据变化
watch(() => depthStore.depthData, () => {
  updateLastTime();
}, { deep: true });
</script>

<style scoped>
.symbol-detail-container {
  padding: 20px;
  max-width: 1600px;
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
.liquidity-table,
.slippage-table {
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

/* 连接状态样式 */
.status-display {
  text-align: center;
  padding: 10px;
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
