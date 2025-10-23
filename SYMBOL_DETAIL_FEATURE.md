# 币对详情页面功能说明

## 功能概述

币对详情页面展示指定币对在所有交易所的流动性热力图，包括价差计算和各深度级别的流动性数据。

## 页面特性

### 1. 页面头部
- **返回按钮**: 返回上一页
- **页面标题**: 显示当前币对名称 + "流动性热力图"
- **更新时间**: 显示最后数据更新时间
- **刷新按钮**: 手动刷新数据

### 2. 流动性数据表格

#### 表格列说明
- **交易所**: 显示交易所名称（Binance, OKX, Bitunix, Toobit）
- **价差%**: 显示价差比例
- **万1(0.01%)**: 0.01%深度的流动性
- **万5(0.05%)**: 0.05%深度的流动性
- **微观(0.1%)**: 0.1%深度的流动性
- **紧密(0.5%)**: 0.5%深度的流动性
- **核心(1%)**: 1%深度的流动性
- **巨额(2%)**: 2%深度的流动性
- **大额(5%)**: 5%深度的流动性
- **极限(10%)**: 10%深度的流动性

#### 颜色编码
- **绿色**: 优秀表现（低价差、高流动性）
- **黄色**: 一般表现（中等价差、中等流动性）
- **红色**: 较差表现（高价差、低流动性）

### 3. 连接状态
- 显示各交易所的WebSocket连接状态
- 实时更新连接状态图标和颜色

## 核心计算逻辑

### 1. 价差计算
```javascript
// 价差 = 卖1价 - 买1价
const spread = data.bestAsk - data.bestBid;

// 价差比例 = 价差 / 买1价 * 100%
const spreadPercent = (spread / data.bestBid) * 100;
```

### 2. 流动性计算
```javascript
// 买盘流动性：从最优买入价向下跌价指定百分比内的累积数量
const buyLiquidity = calculateBuyDepth(bids, bestBid, percentage);

// 卖盘流动性：从最优卖出价向上涨价指定百分比内的累积数量
const sellLiquidity = calculateSellDepth(asks, bestAsk, percentage);

// 总流动性 = 买盘流动性 + 卖盘流动性
const totalLiquidity = buyLiquidity + sellLiquidity;
```

### 3. 深度计算函数

#### 买盘深度计算
```javascript
const calculateBuyDepth = (bids, bestBid, percentage) => {
  const targetPrice = bestBid * (1 - percentage);
  let totalQuantity = 0;
  
  for (const bid of bids) {
    if (bid.price <= bestBid && bid.price >= targetPrice) {
      totalQuantity += bid.quantity;
    }
  }
  
  return totalQuantity;
};
```

#### 卖盘深度计算
```javascript
const calculateSellDepth = (asks, bestAsk, percentage) => {
  const targetPrice = bestAsk * (1 + percentage);
  let totalQuantity = 0;
  
  for (const ask of asks) {
    if (ask.price >= bestAsk && ask.price <= targetPrice) {
      totalQuantity += ask.quantity;
    }
  }
  
  return totalQuantity;
};
```

## 数据更新机制

### 1. 自动更新
- 每5秒自动更新一次数据
- 使用定时器控制更新频率

### 2. 手动刷新
- 点击刷新按钮立即更新
- 重新连接WebSocket获取最新数据

### 3. 实时数据源
- 基于WebSocket实时数据
- 支持多交易所数据对比

## 用户体验

### 1. 交互功能
- **点击币对**: 在深度对比页面点击币对名称跳转到详情页
- **返回按钮**: 快速返回上一页
- **刷新按钮**: 手动刷新数据
- **悬停效果**: 表格行悬停高亮

### 2. 响应式设计
- 支持桌面和移动端
- 自适应布局
- 暗色主题支持

### 3. 加载状态
- 表格加载状态指示
- 刷新按钮加载状态
- 连接状态实时显示

## 技术实现

### 1. 路由配置
```javascript
{
  path: 'symbol/:symbol',
  name: 'SymbolDetail',
  component: () => import('../pages/SymbolDetail.vue'),
  meta: { title: '币对详情' },
}
```

### 2. 跳转实现
```javascript
// 在深度对比页面
const goToSymbolDetail = (symbol) => {
  router.push(`/symbol/${symbol}`);
};
```

### 3. 数据获取
```javascript
// 获取指定交易所和币对的深度数据
const data = depthStore.getDepthDataByExchangeAndSymbol(exchange, symbol);
```

## 使用流程

1. **进入页面**: 在深度对比页面点击币对名称
2. **查看数据**: 浏览各交易所的价差和流动性数据
3. **对比分析**: 通过颜色编码快速识别优劣
4. **刷新数据**: 点击刷新按钮获取最新数据
5. **返回**: 点击返回按钮回到上一页

## 数据准确性

### 1. 实时性
- WebSocket实时数据推送
- 5秒自动更新机制
- 手动刷新功能

### 2. 计算准确性
- 精确的价差计算
- 准确的深度流动性计算
- 多交易所数据对比

### 3. 显示准确性
- 格式化数值显示
- 颜色编码准确反映数据质量
- 连接状态实时更新

## 扩展性

### 1. 支持更多交易所
- 可轻松添加新的交易所
- 统一的接口和数据格式

### 2. 支持更多币对
- 动态币对参数
- 自动适配不同币对

### 3. 支持更多深度级别
- 可配置深度级别
- 灵活的深度计算

## 总结

币对详情页面提供了完整的流动性分析功能，通过直观的表格和颜色编码，用户可以快速了解各交易所的价差和流动性情况，为交易决策提供重要参考。
