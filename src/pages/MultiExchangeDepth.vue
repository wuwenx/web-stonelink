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
        <el-table-column prop="displayName" label="资产" width="140" align="center" fixed>
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goToSymbolDetail(row.symbol)">
              {{ row.displayName }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column
          v-for="exchange in compareExchanges"
          :key="exchange.id"
          :label="exchange.name"
          align="center"
          min-width="120"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.maxExchange === exchange.id ? 'success' : 'info'"
              size="large"
            >
              {{ formatDepthValue(row.exchanges[exchange.id]) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最优" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">
              {{ getExchangeShortName(row.maxExchange) }}
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
        <el-table-column prop="displayName" label="资产" width="140" align="center" fixed>
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goToSymbolDetail(row.symbol)">
              {{ row.displayName }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column
          v-for="exchange in compareExchanges"
          :key="exchange.id"
          :label="exchange.name"
          align="center"
          min-width="120"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.minExchange === exchange.id ? 'success' : 'info'"
              size="large"
            >
              {{ formatSpread(row.exchanges[exchange.id]) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最优" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">
              {{ getExchangeShortName(row.minExchange) }}
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
import { getExchangeName } from '../config/exchanges';
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

// 获取当前对比的交易所列表
const compareExchanges = computed(() => {
  return depthStore.compareExchanges.map(id => ({
    id,
    name: getExchangeName(id, exchangeType.value),
  }));
});

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

// 获取交易所简称
const getExchangeShortName = exchangeId => {
  if (!exchangeId) return '-';
  return getExchangeName(exchangeId, exchangeType.value);
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
/* ============================================
   金融科技风格 - 多交易所深度对比
   ============================================ */

.multi-exchange-depth {
  padding: 32px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 卡片样式 */
.header-card,
.control-card,
.table-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.header-card:hover,
.control-card:hover,
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

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #e4e8f0;
}

/* 深度选择器 */
.depth-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.depth-label {
  font-size: 14px;
  color: #a0aec0;
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
  color: #a0aec0;
  white-space: nowrap;
}

/* Radio Button 金融科技风格 */
:deep(.el-radio-group) {
  --el-radio-button-checked-bg-color: linear-gradient(135deg, #00d4ff, #0099cc);
}

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

/* 表格样式 */
.comparison-table {
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

/* 响应式 */
@media (max-width: 768px) {
  .multi-exchange-depth {
    padding: 16px;
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
