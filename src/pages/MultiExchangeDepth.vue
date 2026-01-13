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
      <el-row :gutter="20" align="middle">
        <!-- 交易类型 -->
        <el-col :span="6">
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

        <!-- 买卖方向 -->
        <el-col :span="6">
          <div class="control-group">
            <label class="control-label">方向</label>
            <el-radio-group v-model="orderSide" size="default" @change="handleOrderSideChange">
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

    <!-- 深度对比数据 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">深度对比数据</span>
          <div class="depth-selector">
            <span class="depth-label">深度范围:</span>
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
        </div>
      </template>

      <el-table
        v-loading="isLoading"
        :data="depthComparisonData"
        class="comparison-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="displayName" label="资产" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goToSymbolDetail(row.symbol)">
              {{ row.displayName }} {{ exchangeTypeLabel }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="BINANCE" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="large">
              {{ formatDepthValue(row.binanceDepth) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="TOOBIT" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="large">
              {{ formatDepthValue(row.toobitDepth) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="分数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.depthScore)" size="small">
              {{ formatScore(row.depthScore) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 价差详情对比 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">价差详情对比</span>
        </div>
      </template>

      <el-table
        v-loading="isLoading"
        :data="spreadComparisonData"
        class="comparison-table"
        :cell-style="getCellStyle"
        :header-cell-style="getHeaderCellStyle"
      >
        <el-table-column prop="displayName" label="资产" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goToSymbolDetail(row.symbol)">
              {{ row.displayName }} {{ exchangeTypeLabel }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="BINANCE" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="large">
              {{ formatSpread(row.binanceSpread) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="TOOBIT" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="large">
              {{ formatSpread(row.toobitSpread) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="分数 ↑" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.spreadScore)" size="small">
              {{ formatScore(row.spreadScore) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDepthStore } from '../stores/depth';

const router = useRouter();

const depthStore = useDepthStore();

// 响应式数据
const exchangeType = ref(depthStore.config.exchangeType);
const orderSide = ref(depthStore.config.orderSide);
const depthPercentage = ref(depthStore.config.depthPercentage);

// 计算属性
const depthOptions = computed(() => depthStore.depthOptions);
const isLoading = computed(() => depthStore.isLoading);

const exchangeTypeLabel = computed(() => {
  return exchangeType.value === 'futures' ? 'FUTURES' : 'SPOT';
});

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

// 深度对比数据
const depthComparisonData = computed(() => {
  return depthStore.depthComparisonBySymbol;
});

// 价差对比数据
const spreadComparisonData = computed(() => {
  return depthStore.spreadComparisonBySymbol;
});

// 事件处理
const handleExchangeTypeChange = type => {
  depthStore.switchExchangeType(type);
};

const handleOrderSideChange = side => {
  depthStore.updateOrderSide(side);
};

const handleDepthPercentageChange = percentage => {
  depthStore.updateDepthPercentage(percentage);
};

// 跳转到单币种详情页
const goToSymbolDetail = symbol => {
  router.push(`/symbol/${symbol}`);
};

// 格式化函数
const formatDepthValue = value => {
  if (!value || value === 0) return '0';
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(1);
  }
};

const formatSpread = spreadPercent => {
  if (spreadPercent === undefined || spreadPercent === null) return '0.0000 %';
  return `${spreadPercent.toFixed(4)} %`;
};

const formatScore = score => {
  if (score > 0) return '+1';
  if (score < 0) return '-1';
  return '=';
};

// 样式函数
const getScoreTagType = score => {
  if (score > 0) return 'success';
  if (score < 0) return 'danger';
  return 'info';
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
  max-width: 1200px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 卡片样式 */
.header-card,
.control-card,
.table-card {
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

/* 深度选择器 */
.depth-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.depth-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

/* 控制组样式 */
.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

/* 表格样式 */
.comparison-table {
  width: 100%;
}

.comparison-table :deep(.el-table__header th) {
  background-color: var(--el-bg-color);
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 768px) {
  .multi-exchange-depth {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

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
}
</style>
