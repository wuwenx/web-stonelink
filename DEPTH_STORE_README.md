# 深度数据Store使用说明

## 概述

本项目已将WebSocket深度数据存储到Pinia中，并使用getters返回数据。这样可以实现数据的集中管理和响应式更新。

## 主要功能

### 1. 深度数据Store (`src/stores/depth.js`)

#### State
- `connections`: 各交易所的连接状态
- `depthData`: 各交易所的深度数据
- `config`: 配置信息（交易对、交易所类型等）
- `isLoading`: 加载状态

#### Getters
- `getDepthDataByExchange(exchange)`: 获取指定交易所的深度数据
- `currentExchangeDepthData`: 获取当前选择交易所的深度数据
- `allDepthData`: 获取所有交易所的深度数据
- `getConnectionStatus(exchange)`: 获取指定交易所的连接状态
- `currentExchangeStatus`: 获取当前选择交易所的连接状态
- `priceDifference`: 计算价差
- `depthComparisonData`: 深度对比数据
- `bestPricesComparison`: 最佳价格对比
- `markPriceInfo`: 标记价格信息（仅币安支持）
- `hasData`: 检查是否有数据
- `currentConfig`: 获取配置信息

#### Actions
- `initializeWebSocketService()`: 初始化WebSocket服务
- `updateConfig(newConfig)`: 更新配置
- `connectWebSockets()`: 连接WebSocket
- `connectSelectedExchange()`: 连接选择的交易所
- `connectBinance(symbol, exchangeType, depthLevels)`: 连接币安
- `connectOKX(symbol)`: 连接OKX
- `connectToobit()`: 连接Toobit
- `reconnectWebSockets()`: 重新连接WebSocket
- `clearAllData()`: 清空所有数据
- `disconnectAll()`: 断开所有连接
- `setLoading(loading)`: 设置加载状态

### 2. 组件更新

#### DepthAggregatorTailwind.vue
- 已更新为使用深度store而不是本地状态
- 所有数据现在通过store的getters获取
- 配置变更会自动触发WebSocket重连

#### DepthTest.vue
- 新增的测试页面，用于验证store功能
- 可以测试所有getters和actions
- 提供实时数据展示和操作控制

## 使用方法

### 1. 在组件中使用Store

```javascript
import { useDepthStore } from '../stores/depth.js';

const depthStore = useDepthStore();

// 获取数据
const depthData = computed(() => depthStore.getDepthDataByExchange('binance'));
const connectionStatus = computed(() => depthStore.getConnectionStatus('binance'));

// 更新配置
depthStore.updateConfig({ selectedSymbol: 'ETHUSDT' });

// 连接WebSocket
await depthStore.connectWebSockets();
```

### 2. 访问测试页面

启动项目后，访问以下URL：
- 主页面: `http://localhost:8080/#/`
- 深度聚合器: `http://localhost:8080/#/depth`
- Store测试页面: `http://localhost:8080/#/depth-test`

### 3. 配置选项

```javascript
const config = {
  selectedSymbol: 'BTCUSDT',    // 交易对
  selectedExchange: 'binance',  // 交易所 (binance, okx)
  exchangeType: 'futures',      // 交易所类型 (futures, spot)
  depthLevels: 250,             // 深度档位
  depthPercentage: '0.01'       // 深度百分比
};
```

## 技术特点

1. **响应式数据**: 使用Pinia的响应式系统，数据变更自动更新UI
2. **集中管理**: 所有深度数据集中存储在store中
3. **自动重连**: 配置变更时自动重新连接WebSocket
4. **类型安全**: 提供完整的getters和actions接口
5. **错误处理**: 包含连接状态管理和错误处理
6. **性能优化**: 使用computed属性避免不必要的重新计算

## 支持的交易所

- **币安 (Binance)**: 支持现货和U本位合约，包含标记价格
- **OKX**: 支持U本位合约
- **Toobit**: 支持U本位合约

## 注意事项

1. WebSocket连接需要网络环境支持
2. 不同交易所的数据格式可能不同，store已做统一处理
3. 标记价格功能仅币安交易所支持
4. 深度百分比变更不会触发重连，只会重新计算数据
5. 建议在组件卸载时调用`disconnectAll()`清理资源
