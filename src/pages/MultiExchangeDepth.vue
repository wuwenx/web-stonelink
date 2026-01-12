<template>
  <div class="multi-exchange-depth">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <div class="header-left">
          <h1 class="page-title">
            多交易所深度对比
          </h1>
        </div>
        <div class="header-right">
          <el-tag :type="connectionStatusType" size="small">
            {{ connectionStatusText }}
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
        <!-- 交易类型 -->
        <el-col :span="4">
          <div class="control-group">
            <label class="control-label">交易类型</label>
            <el-radio-group v-model="exchangeType" size="default" @change="handleExchangeTypeChange">
              <el-radio-button label="futures">
                合约
              </el-radio-button>
              <el-radio-button label="spot">
                现货
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>

        <!-- 交易对 -->
        <el-col :span="4">
          <div class="control-group">
            <label class="control-label">交易对</label>
            <el-select v-model="currentSymbol" size="default" @change="handleSymbolChange">
              <el-option
                v-for="symbol in availableSymbols"
                :key="symbol"
                :label="symbol"
                :value="symbol"
              />
            </el-select>
          </div>
        </el-col>

        <!-- 买卖方向 -->
        <el-col :span="4">
          <div class="control-group">
            <label class="control-label">方向</label>
            <el-radio-group v-model="orderSide" size="default">
              <el-radio-button label="buy">
                买盘
              </el-radio-button>
              <el-radio-button label="sell">
                卖盘
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>

        <!-- 深度范围 -->
        <el-col :span="12">
          <div class="control-group">
            <label class="control-label">深度范围</label>
            <el-radio-group v-model="depthPercentage" size="small" @change="handleDepthPercentageChange">
              <el-radio-button
                v-for="option in depthOptions"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>

      <!-- 交易所选择 -->
      <el-row :gutter="20" class="exchange-selector">
        <el-col :span="24">
          <div class="control-group">
            <label class="control-label">选择交易所</label>
            <el-checkbox-group v-model="selectedExchangeIds" @change="handleExchangeSelectionChange">
              <el-checkbox
                v-for="exchange in availableExchanges"
                :key="exchange.id"
                :label="exchange.id"
                border
              >
                <span :style="{ color: exchange.color }">{{ exchange.name }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 深度对比表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            {{ currentSymbol }} - {{ orderSide === 'buy' ? '买盘' : '卖盘' }}深度对比
          </span>
          <span class="depth-info">
            深度范围: {{ getCurrentDepthLabel }}
          </span>
        </div>
      </template>

      <el-table
        v-loading="isLoading"
        :data="comparisonTableData"
        class="comparison-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="rank" label="排名" width="80" align="center">
          <template #default="{ $index }">
            <el-tag :type="getRankTagType($index)" size="small">
              {{ $index + 1 }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="exchangeName" label="交易所" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.color, fontWeight: 'bold' }">
              {{ row.exchangeName }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="深度量" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="large">
              {{ formatDepthValue(orderSide === 'buy' ? row.bidDepth : row.askDepth) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最佳买价" align="center">
          <template #default="{ row }">
            <span class="price-value bid">{{ formatPrice(row.bestBid) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="最佳卖价" align="center">
          <template #default="{ row }">
            <span class="price-value ask">{{ formatPrice(row.bestAsk) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="价差" align="center">
          <template #default="{ row }">
            <el-tag :type="getSpreadTagType(row.spreadPercent)" size="small">
              {{ formatSpread(row.spreadPercent) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="100" align="center">
          <template #default="{ row }">
            <span class="update-time">{{ row.lastUpdate }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 深度可视化 -->
    <el-card class="chart-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">深度分布可视化</span>
        </div>
      </template>

      <div class="depth-bars">
        <div
          v-for="(item, index) in comparisonTableData"
          :key="item.exchange"
          class="depth-bar-item"
        >
          <div class="bar-label">
            <span :style="{ color: item.color }">{{ item.exchangeName }}</span>
            <span class="bar-value">{{ formatDepthValue(orderSide === 'buy' ? item.bidDepth : item.askDepth) }}</span>
          </div>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(item, index) + '%',
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDepthStore } from '../stores/depth';

const depthStore = useDepthStore();

// 响应式数据
const exchangeType = ref(depthStore.config.exchangeType);
const currentSymbol = ref(depthStore.config.symbol);
const depthPercentage = ref(depthStore.config.depthPercentage);
const orderSide = ref('buy');
const selectedExchangeIds = ref([...depthStore.selectedExchanges]);

// 计算属性
const availableExchanges = computed(() => depthStore.availableExchanges);
const availableSymbols = computed(() => depthStore.availableSymbols);
const depthOptions = computed(() => depthStore.depthOptions);
const isLoading = computed(() => depthStore.isLoading);

const connectionStatusType = computed(() => {
  const statusMap = {
    connected: 'success',
    connecting: 'warning',
    disconnected: 'info',
    error: 'danger',
    failed: 'danger',
  };
  return statusMap[depthStore.connectionStatus] || 'info';
});

const connectionStatusText = computed(() => {
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '连接错误',
    failed: '连接失败',
  };
  return statusMap[depthStore.connectionStatus] || '未知';
});

const getCurrentDepthLabel = computed(() => {
  const option = depthOptions.value.find(o => o.value === depthPercentage.value);
  return option ? option.label : '';
});

// 对比表格数据
const comparisonTableData = computed(() => {
  return depthStore.depthComparisonData;
});

// 事件处理
const handleExchangeTypeChange = type => {
  depthStore.switchExchangeType(type);
  // 更新选中的交易所
  selectedExchangeIds.value = [...depthStore.selectedExchanges];
};

const handleSymbolChange = symbol => {
  depthStore.switchSymbol(symbol);
};

const handleDepthPercentageChange = percentage => {
  depthStore.updateDepthPercentage(percentage);
};

const handleExchangeSelectionChange = selected => {
  depthStore.updateSelectedExchanges(selected);
};

// 格式化函数
const formatDepthValue = value => {
  if (!value || value === 0) return '0';
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  } else {
    return value.toFixed(4);
  }
};

const formatPrice = price => {
  if (!price || price === 0) return '--';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
};

const formatSpread = spreadPercent => {
  if (!spreadPercent || spreadPercent === 0) return '0.0000%';
  return `${spreadPercent.toFixed(4)}%`;
};

// 样式函数
const getRankTagType = index => {
  if (index === 0) return 'success';
  if (index === 1) return 'warning';
  if (index === 2) return '';
  return 'info';
};

const getSpreadTagType = spreadPercent => {
  if (spreadPercent < 0.01) return 'success';
  if (spreadPercent < 0.05) return 'warning';
  return 'danger';
};

const getBarWidth = (item, index) => {
  if (comparisonTableData.value.length === 0) return 0;

  const maxDepth = Math.max(
    ...comparisonTableData.value.map(d =>
      orderSide.value === 'buy' ? d.bidDepth : d.askDepth
    )
  );

  if (maxDepth === 0) return 0;

  const depth = orderSide.value === 'buy' ? item.bidDepth : item.askDepth;
  return (depth / maxDepth) * 100;
};

const getCellStyle = () => ({
  textAlign: 'center',
});

const getHeaderCellStyle = () => ({
  textAlign: 'center',
  fontWeight: 'bold',
});

// 生命周期
onMounted(() => {
  depthStore.connect();
});

onUnmounted(() => {
  // 可选：离开页面时保持连接
  // depthStore.disconnect();
});
</script>

<style scoped>
.multi-exchange-depth {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 卡片样式 */
.header-card,
.control-card,
.table-card,
.chart-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.depth-info {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 控制组样式 */
.control-group {
  margin-bottom: 12px;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.exchange-selector {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.exchange-selector :deep(.el-checkbox) {
  margin-right: 12px;
  margin-bottom: 8px;
}

/* 表格样式 */
.comparison-table {
  width: 100%;
}

.price-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
}

.price-value.bid {
  color: #10b981;
}

.price-value.ask {
  color: #ef4444;
}

.update-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 深度可视化 */
.depth-bars {
  padding: 16px 0;
}

.depth-bar-item {
  margin-bottom: 16px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.bar-value {
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--el-text-color-regular);
}

.bar-container {
  height: 24px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 响应式 */
@media (max-width: 768px) {
  .multi-exchange-depth {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .control-group :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
