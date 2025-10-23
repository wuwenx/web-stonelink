# 全局WebSocket数据管理架构

## 概述

本项目已实现全局WebSocket数据管理架构，在SimpleLayout中统一订阅WebSocket，其他页面通过Pinia store获取数据。这样可以避免重复连接，提高性能，并实现数据的统一管理。

## 架构特点

### 🏗️ 全局连接管理
- **SimpleLayout**: 负责WebSocket连接的初始化和生命周期管理
- **统一订阅**: 所有交易所的WebSocket连接在应用启动时建立
- **状态显示**: 在导航栏实时显示各交易所的连接状态

### 📊 数据共享
- **Pinia Store**: 所有深度数据存储在全局store中
- **响应式**: 数据变更自动更新到所有使用该数据的组件
- **多页面访问**: 任何页面都可以访问相同的实时数据

### 🔄 自动重连
- **配置变更**: 当用户更改交易对、交易所等配置时自动重连
- **连接失败**: 自动重试机制，确保数据连续性
- **状态管理**: 完整的连接状态跟踪和错误处理

## 文件结构

```
src/
├── layouts/
│   └── SimpleLayout.vue          # 全局WebSocket连接管理
├── stores/
│   └── depth.js                 # 深度数据store
├── pages/
│   ├── DepthAggregator.vue      # 深度对比页面
│   └── OrderBook.vue            # 盘口展示页面
├── views/
│   ├── DepthTest.vue            # Store测试页面
│   └── DataExample.vue          # 数据获取示例页面
└── services/
    └── WebSocketService.js      # WebSocket服务
```

## 使用方法

### 1. 在SimpleLayout中订阅WebSocket

```javascript
// SimpleLayout.vue
import { useDepthStore } from '../stores/depth.js';

const depthStore = useDepthStore();

onMounted(async() => {
  // 初始化WebSocket连接
  await depthStore.connectWebSockets();
});
```

### 2. 在其他页面获取数据

```javascript
// 任何组件中
import { useDepthStore } from '../stores/depth.js';

const depthStore = useDepthStore();

// 获取特定交易所数据
const binanceData = computed(() => depthStore.getDepthDataByExchange('binance'));
const okxData = computed(() => depthStore.getDepthDataByExchange('okx'));
const toobitData = computed(() => depthStore.getDepthDataByExchange('toobit'));

// 获取连接状态
const binanceStatus = computed(() => depthStore.getConnectionStatus('binance'));

// 获取计算属性
const priceDifference = computed(() => depthStore.priceDifference);
const hasData = computed(() => depthStore.hasData);
```

### 3. 更新配置

```javascript
// 更新配置会自动重连WebSocket
depthStore.updateConfig({ 
  selectedSymbol: 'ETHUSDT',
  selectedExchange: 'okx',
  exchangeType: 'futures'
});
```

## 页面功能

### 🏠 首页 (`/`)
- 应用入口页面

### 📊 深度对比 (`/depth`)
- 实时深度数据对比
- 支持多交易所切换
- 标记价格信息展示

### 📈 盘口展示 (`/order-book`)
- 盘口数据可视化
- 深度图表展示

### 🧪 Store测试 (`/depth-test`)
- 测试所有store功能
- 手动连接/断开操作
- 实时数据监控

### 📋 数据示例 (`/data-example`)
- 展示如何在其他页面获取数据
- 代码示例和使用说明

## 连接状态显示

在导航栏中实时显示各交易所的连接状态：
- 🟢 **绿色**: 已连接
- 🟡 **黄色**: 连接中
- 🔴 **红色**: 未连接/错误

## 技术优势

### 1. 性能优化
- **单次连接**: 避免重复建立WebSocket连接
- **数据共享**: 多个页面共享同一份数据
- **响应式更新**: 数据变更自动同步到所有组件

### 2. 用户体验
- **实时状态**: 连接状态实时显示
- **无缝切换**: 页面切换时数据保持连续
- **自动重连**: 网络问题自动恢复

### 3. 开发体验
- **统一管理**: 所有WebSocket逻辑集中管理
- **类型安全**: 完整的TypeScript支持
- **易于扩展**: 新增交易所或功能简单

## 配置选项

```javascript
const config = {
  selectedSymbol: 'BTCUSDT',    // 交易对
  selectedExchange: 'binance',  // 交易所 (binance, okx)
  exchangeType: 'futures',      // 交易所类型 (futures, spot)
  depthLevels: 250,             // 深度档位
  depthPercentage: '0.01'       // 深度百分比
};
```

## 支持的交易所

- **币安 (Binance)**: 现货/U本位合约，包含标记价格
- **OKX**: U本位合约
- **Toobit**: U本位合约

## 注意事项

1. **连接管理**: WebSocket连接由SimpleLayout统一管理，其他页面不应手动连接/断开
2. **数据同步**: 所有页面访问的是同一份数据，确保数据一致性
3. **配置变更**: 修改配置会自动重连，无需手动处理
4. **错误处理**: 连接失败会自动重试，用户无需干预
5. **资源清理**: 应用关闭时会自动清理所有连接

## 开发建议

1. **新增页面**: 直接使用store获取数据，无需关心WebSocket连接
2. **数据展示**: 使用computed属性确保响应式更新
3. **错误处理**: 检查连接状态和数据有效性
4. **性能优化**: 避免在computed中进行复杂计算
5. **测试**: 使用DepthTest页面验证功能

这种架构确保了WebSocket连接的高效管理和数据的统一访问，为多页面应用提供了良好的数据流管理方案。
