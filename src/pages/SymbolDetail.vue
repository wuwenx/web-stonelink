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
        <el-col :span="4">
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
          <span class="card-title">高级滑点模拟</span>
        </div>
      </template>
      
      <div class="slippage-controls">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">交易数量 ({{ symbol.replace('USDT', '') }})</label>
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
          </el-col>
          
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">订单类型</label>
              <el-select v-model="orderType" size="large" @change="calculateSlippage">
                <el-option label="市价单" value="market" />
                <el-option label="限价单" value="limit" />
              </el-select>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">订单拆分</label>
              <el-select v-model="splitStrategy" size="large" @change="calculateSlippage">
                <el-option label="不拆分" value="none" />
                <el-option label="平均拆分" value="equal" />
                <el-option label="智能拆分" value="smart" />
              </el-select>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">限价偏移 (%)</label>
              <el-input-number
                v-model="limitPriceOffset"
                :min="0"
                :max="5"
                :precision="2"
                :step="0.01"
                size="large"
                :disabled="orderType !== 'limit'"
                @change="calculateSlippage"
              />
            </div>
          </el-col>
        </el-row>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large"
            @click="calculateSlippage"
          >
            计算滑点
          </el-button>
          <el-button 
            type="success" 
            size="large"
            @click="compareAllExchanges"
          >
            对比所有交易所
          </el-button>
        </div>
      </div>
      
      <el-table 
        v-loading="isCalculating" 
        :data="slippageData" 
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
        
        <el-table-column prop="buySlippage" label="买入滑点" width="150" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSlippageTagType(row.buySlippage)"
              size="large"
            >
              {{ formatSlippage(row.buySlippage) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="sellSlippage" label="卖出滑点" width="150" align="center">
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
        
        <el-table-column prop="totalCost" label="总成本" width="150" align="center">
          <template #default="{ row }">
            <span class="cost-text" :class="row.totalCost > 0 ? 'negative' : 'positive'">
              {{ formatCost(row.totalCost) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="executionTime" label="预计执行时间" width="150" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.executionTime }}ms</span>
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
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getExchangeName } from '../config/exchanges';
import { useDepthStore } from '../stores/depth';
import { useSymbolStore } from '../stores/symbol';

const route = useRoute();
const router = useRouter();
const depthStore = useDepthStore();
const symbolStore = useSymbolStore();

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
const orderType = ref('market'); // 'market' 或 'limit'
const splitStrategy = ref('none'); // 'none', 'equal', 'smart'
const limitPriceOffset = ref(0.1); // 限价单价格偏移百分比

// 从 store 获取交易对选项
const symbolOptions = computed(() =>
  symbolStore.symbolList.map(sym => ({ label: sym, value: sym }))
);

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
        const buyResult = calculateAdvancedSlippage(
          depthData.asks,
          simulationQuantity.value,
          'buy',
          orderType.value,
          splitStrategy.value,
          limitPriceOffset.value
        );
        
        const sellResult = calculateAdvancedSlippage(
          depthData.bids,
          simulationQuantity.value,
          'sell',
          orderType.value,
          splitStrategy.value,
          limitPriceOffset.value
        );
        
        // 计算总成本（买入均价 - 卖出均价）
        const totalCost = buyResult.averagePrice - sellResult.averagePrice;
        
        data.push({
          exchangeId,
          exchangeName,
          buySlippage: buyResult.slippagePercent,
          sellSlippage: sellResult.slippagePercent,
          buyAvgPrice: buyResult.averagePrice,
          sellAvgPrice: sellResult.averagePrice,
          totalCost: totalCost * simulationQuantity.value,
          executionTime: buyResult.executionTime + sellResult.executionTime,
        });
      } else {
        data.push({
          exchangeId,
          exchangeName,
          buySlippage: 0,
          sellSlippage: 0,
          buyAvgPrice: 0,
          sellAvgPrice: 0,
          totalCost: 0,
          executionTime: 0,
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

// 高级滑点计算（支持订单类型和拆分策略）
const calculateAdvancedSlippage = (depthData, targetQuantity, side, orderType, splitStrategy, limitOffset) => {
  if (!depthData || depthData.length === 0) {
    return { slippagePercent: 0, averagePrice: 0, startPrice: 0, finalPrice: 0, executionTime: 0 };
  }
  
  const startPrice = depthData[0].price;
  let totalExecutedValue = 0;
  let totalExecutedQuantity = 0;
  let remainingQuantity = targetQuantity;
  let finalPrice = startPrice;
  let executionTime = 0;
  
  // 限价单处理
  if (orderType === 'limit') {
    const limitPrice = side === 'buy' 
      ? startPrice * (1 + limitOffset / 100)  // 买入限价单：高于市价
      : startPrice * (1 - limitOffset / 100); // 卖出限价单：低于市价
    
    // 只执行限价范围内的订单
    const filteredData = depthData.filter(order => {
      if (side === 'buy') {
        return order.price <= limitPrice; // 买入：价格不高于限价
      } else {
        return order.price >= limitPrice; // 卖出：价格不低于限价
      }
    });
    
    if (filteredData.length === 0) {
      return {
        slippagePercent: 0,
        averagePrice: limitPrice,
        startPrice: startPrice,
        finalPrice: limitPrice,
        executionTime: 0,
      };
    }
    
    depthData = filteredData;
  }
  
  // 订单拆分处理
  let orders = [];
  if (splitStrategy === 'equal') {
    // 平均拆分：将订单平均分成3份
    const splitCount = 3;
    const splitQuantity = targetQuantity / splitCount;
    orders = Array(splitCount).fill(splitQuantity);
  } else if (splitStrategy === 'smart') {
    // 智能拆分：根据深度分布拆分
    const totalDepth = depthData.reduce((sum, o) => sum + o.quantity, 0);
    orders = depthData.slice(0, 5).map(order => {
      const ratio = order.quantity / totalDepth;
      return targetQuantity * ratio;
    }).filter(qty => qty > 0);
  } else {
    // 不拆分：一次性执行
    orders = [targetQuantity];
  }
  
  // 执行每个拆分订单
  for (const orderQuantity of orders) {
    let orderRemaining = orderQuantity;
    
    for (const order of depthData) {
      if (orderRemaining <= 0) break;
      
      const price = order.price;
      const availableQuantity = order.quantity;
      const executedQty = Math.min(orderRemaining, availableQuantity);
      
      totalExecutedValue += executedQty * price;
      totalExecutedQuantity += executedQty;
      orderRemaining -= executedQty;
      finalPrice = price;
      
      // 模拟执行时间（每个订单档位需要10-50ms）
      executionTime += 10 + Math.random() * 40;
    }
    
    // 拆分订单之间的延迟（100-300ms）
    if (orders.length > 1) {
      executionTime += 100 + Math.random() * 200;
    }
  }
  
  // 计算实际成交均价
  const averagePrice = totalExecutedQuantity > 0 ? totalExecutedValue / totalExecutedQuantity : startPrice;
  
  // 计算滑点百分比
  const slippage = side === 'buy'
    ? ((averagePrice - startPrice) / startPrice) * 100
    : ((startPrice - averagePrice) / startPrice) * 100;
  
  return {
    slippagePercent: Math.abs(slippage),
    averagePrice: averagePrice,
    startPrice: startPrice,
    finalPrice: finalPrice,
    executionTime: Math.round(executionTime),
  };
};

// 对比所有交易所
const compareAllExchanges = () => {
  calculateSlippage();
  
  // 找出最优交易所
  if (slippageData.value.length > 0) {
    const bestBuy = slippageData.value.reduce((best, current) => 
      current.buySlippage < best.buySlippage ? current : best
    );
    
    const bestSell = slippageData.value.reduce((best, current) => 
      current.sellSlippage < best.sellSlippage ? current : best
    );
    
    ElMessage.success({
      message: `最优买入: ${bestBuy.exchangeName} (滑点 ${bestBuy.buySlippage.toFixed(4)}%) | 最优卖出: ${bestSell.exchangeName} (滑点 ${bestSell.sellSlippage.toFixed(4)}%)`,
      duration: 5000,
    });
  }
};

// 更新最后更新时间
const updateLastTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString();
};

// 返回上一页
const goBack = () => {
  router.push('/multi-depth');
};

// 更新交易对：确保当前选中的交易对已订阅
const updateSymbol = newSymbol => {
  symbol.value = newSymbol;
  selectedSymbol.value = newSymbol;
  depthStore.subscribeSymbol(newSymbol);
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

// 格式化成本
const formatCost = cost => {
  if (!cost || cost === 0) return '0.00';
  const sign = cost > 0 ? '+' : '';
  return `${sign}${cost.toFixed(2)}`;
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
  const routeSymbol = route.params.symbol || 'BTCUSDT';
  
  // 如果路由中的 symbol 在列表中，使用它；否则使用列表中的第一个
  if (symbolStore.symbolList.includes(routeSymbol)) {
    symbol.value = routeSymbol;
    selectedSymbol.value = routeSymbol;
  } else if (symbolStore.symbolList.length > 0) {
    symbol.value = symbolStore.symbolList[0];
    selectedSymbol.value = symbolStore.symbolList[0];
  } else {
    symbol.value = routeSymbol;
    selectedSymbol.value = routeSymbol;
  }
  
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

// 监听交易对列表变化，如果当前选中的不在列表中，切换到第一个
watch(() => symbolStore.symbolList, newList => {
  if (newList.length > 0 && !newList.includes(selectedSymbol.value)) {
    selectedSymbol.value = newList[0];
    symbol.value = newList[0];
  }
}, { immediate: true });
</script>

<style scoped>
/* ============================================
   金融科技风格 - 单币对详情
   ============================================ */

.symbol-detail-container {
  padding: 32px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 卡片样式 */
.header-card,
.control-card,
.slippage-card,
.table-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
  transition: all 0.3s ease;
}

.header-card:hover,
.control-card:hover,
.slippage-card:hover,
.table-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  gap: 15px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #e4e8f0;
}

/* 控制面板样式 */
.control-group {
  margin-bottom: 15px;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #a0aec0;
  margin-bottom: 8px;
}

/* Radio Button 金融科技风格 */
:deep(.el-radio-button__inner) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(0, 212, 255, 0.2) !important;
  color: #a0aec0 !important;
  transition: all 0.3s ease;
}

:deep(.el-radio-button__inner:hover) {
  color: #00d4ff !important;
  border-color: rgba(0, 212, 255, 0.4) !important;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
  border-color: #00d4ff !important;
  color: #0a0e17 !important;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

/* Select 样式 */
:deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(0, 212, 255, 0.2) !important;
  box-shadow: none !important;
}

:deep(.el-select .el-input__inner) {
  color: #e4e8f0 !important;
}

/* 滑点控制面板样式 */
.slippage-controls {
  margin-bottom: 20px;
}

.slippage-controls .input-group {
  margin-bottom: 16px;
}

.slippage-controls .input-label {
  display: block;
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 8px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.price-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.cost-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.cost-text.positive {
  color: #00ff88;
}

.cost-text.negative {
  color: #ff4757;
}

.time-text {
  font-family: 'JetBrains Mono', monospace;
  color: #718096;
}

.input-group {
  flex: 1;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #a0aec0;
  margin-bottom: 8px;
}

/* Input Number 样式 */
:deep(.el-input-number) {
  --el-input-bg-color: rgba(0, 0, 0, 0.3);
  --el-input-border-color: rgba(0, 212, 255, 0.2);
  --el-input-text-color: #e4e8f0;
}

:deep(.el-input-number .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(0, 212, 255, 0.2) !important;
  box-shadow: none !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: rgba(0, 212, 255, 0.1) !important;
  border-color: rgba(0, 212, 255, 0.2) !important;
  color: #00d4ff !important;
}

.price-text {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-weight: 700;
  color: #00d4ff;
}

/* 表格样式 */
.liquidity-table,
.slippage-table {
  width: 100%;
}

:deep(.el-table) {
  background: transparent !important;
  --el-table-border-color: rgba(0, 212, 255, 0.1);
  --el-table-header-bg-color: rgba(0, 0, 0, 0.3);
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(0, 212, 255, 0.05);
}

:deep(.el-table__header-wrapper) {
  background: rgba(0, 0, 0, 0.3);
}

:deep(.el-table th.el-table__cell) {
  background: rgba(0, 0, 0, 0.3) !important;
  color: #a0aec0 !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1) !important;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(0, 212, 255, 0.05) !important;
}

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(0, 212, 255, 0.08) !important;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* Tag 样式优化 */
:deep(.el-tag) {
  border: none !important;
}

:deep(.el-tag--info) {
  background: rgba(0, 212, 255, 0.15) !important;
  color: #00d4ff !important;
}

:deep(.el-tag--success) {
  background: rgba(0, 255, 136, 0.15) !important;
  color: #00ff88 !important;
}

:deep(.el-tag--warning) {
  background: rgba(251, 191, 36, 0.15) !important;
  color: #fbbf24 !important;
}

:deep(.el-tag--danger) {
  background: rgba(255, 71, 87, 0.15) !important;
  color: #ff4757 !important;
}

/* 按钮样式 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
  border: none !important;
  color: #0a0e17 !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .symbol-detail-container {
    padding: 16px;
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
  
  .slippage-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
