/**
 * 统一深度数据处理 Web Worker
 * 在独立线程中处理来自内部 WS 服务的深度数据，避免阻塞主线程
 */

// 存储各交易所的深度数据
const depthDataCache = new Map();

// 配置
let config = {
  depthLevels: 250, // 最大深度档位
};

/**
 * 处理从主线程收到的消息
 */
self.onmessage = function(event) {
  const { type, data } = event.data;

  switch (type) {
  case 'updateConfig':
    handleUpdateConfig(data);
    break;

  case 'processDepth':
    handleProcessDepth(data);
    break;

  case 'clearCache':
    handleClearCache(data);
    break;

  case 'getCache':
    handleGetCache(data);
    break;

  default:
    console.warn('Worker: 未知消息类型', type);
  }
};

/**
 * 更新配置
 */
function handleUpdateConfig(newConfig) {
  config = { ...config, ...newConfig };
  self.postMessage({
    type: 'configUpdated',
    data: config,
  });
}

/**
 * 处理深度数据
 * @param {Object} data - 原始深度数据
 */
function handleProcessDepth(data) {
  try {
    const { exchange, symbol, bids, asks, tsExch, tsRecv } = data;

    if (!exchange || !symbol) {
      return;
    }

    // 处理买盘和卖盘数据
    const processedBids = processDepthData(bids, 'bids');
    const processedAsks = processDepthData(asks, 'asks');

    // 计算最佳买卖价
    const bestBid = processedBids.length > 0 ? processedBids[0].price : 0;
    const bestAsk = processedAsks.length > 0 ? processedAsks[0].price : 0;

    // 计算价差
    const spread = bestBid > 0 && bestAsk > 0 ? bestAsk - bestBid : 0;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    // 计算各深度范围的累计量
    const depthStats = calculateDepthStats(processedBids, processedAsks, bestBid, bestAsk);

    // 构建处理后的数据
    const result = {
      exchange,
      symbol,
      bids: processedBids,
      asks: processedAsks,
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      depthStats,
      tsExch: parseInt(tsExch) || 0,
      tsRecv: parseInt(tsRecv) || 0,
      processedAt: Date.now(),
    };

    // 更新缓存
    const cacheKey = `${exchange}_${symbol}`;
    depthDataCache.set(cacheKey, result);

    // 发送处理后的数据到主线程
    self.postMessage({
      type: 'depthUpdate',
      data: result,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      data: {
        message: error.message,
        originalData: data,
      },
    });
  }
}

/**
 * 处理深度数据
 * @param {Array} rawData - 原始数据 [{ px, qty }, ...]
 * @param {string} type - 'bids' 或 'asks'
 * @returns {Array} 处理后的数据
 */
function processDepthData(rawData, type) {
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }

  // 转换并过滤数据
  const processed = rawData
    .map(item => ({
      price: parseFloat(item.px),
      quantity: parseFloat(item.qty),
    }))
    .filter(item => item.quantity > 0 && !isNaN(item.price) && !isNaN(item.quantity))
    .slice(0, config.depthLevels);

  // 排序：bids 降序（最高价在前），asks 升序（最低价在前）
  if (type === 'bids') {
    processed.sort((a, b) => b.price - a.price);
  } else {
    processed.sort((a, b) => a.price - b.price);
  }

  // 计算累计数量
  let total = 0;
  for (const item of processed) {
    total += item.quantity;
    item.total = total;
  }

  return processed;
}

/**
 * 计算各深度范围的统计数据
 * @param {Array} bids - 买盘数据
 * @param {Array} asks - 卖盘数据
 * @param {number} bestBid - 最佳买价
 * @param {number} bestAsk - 最佳卖价
 * @returns {Object} 深度统计数据
 */
function calculateDepthStats(bids, asks, bestBid, bestAsk) {
  // 预定义的深度百分比
  const percentages = [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.02, 0.05, 0.1];

  const stats = {};

  for (const pct of percentages) {
    const pctKey = `${pct}`;

    // 计算买盘深度
    const bidThreshold = bestBid * (1 - pct);
    const bidDepth = bids.filter(b => b.price >= bidThreshold).reduce((sum, b) => sum + b.quantity, 0);

    // 计算卖盘深度
    const askThreshold = bestAsk * (1 + pct);
    const askDepth = asks.filter(a => a.price <= askThreshold).reduce((sum, a) => sum + a.quantity, 0);

    stats[pctKey] = {
      bidDepth,
      askDepth,
      totalDepth: bidDepth + askDepth,
    };
  }

  return stats;
}

/**
 * 清除缓存
 */
function handleClearCache(data) {
  if (data && data.exchange && data.symbol) {
    const cacheKey = `${data.exchange}_${data.symbol}`;
    depthDataCache.delete(cacheKey);
  } else if (data && data.exchange) {
    // 清除指定交易所的所有缓存
    for (const key of depthDataCache.keys()) {
      if (key.startsWith(`${data.exchange}_`)) {
        depthDataCache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    depthDataCache.clear();
  }

  self.postMessage({
    type: 'cacheCleared',
    data: { size: depthDataCache.size },
  });
}

/**
 * 获取缓存数据
 */
function handleGetCache(data) {
  if (data && data.exchange && data.symbol) {
    const cacheKey = `${data.exchange}_${data.symbol}`;
    const cached = depthDataCache.get(cacheKey);
    self.postMessage({
      type: 'cacheData',
      data: cached || null,
    });
  } else {
    // 返回所有缓存
    const allCache = {};
    for (const [key, value] of depthDataCache.entries()) {
      allCache[key] = value;
    }
    self.postMessage({
      type: 'cacheData',
      data: allCache,
    });
  }
}

// Worker 就绪通知
self.postMessage({
  type: 'ready',
  data: { timestamp: Date.now() },
});
