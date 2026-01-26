/**
 * 统一深度数据处理 Web Worker
 * 在独立线程中处理来自内部 WS 服务的深度数据，避免阻塞主线程
 */

// 导入 BigNumber
// Vue CLI 5.0+ 支持在 Worker 中使用 ES6 import
import BigNumber from 'bignumber.js';

// 配置 BigNumber：不使用指数表示法，截取模式
BigNumber.config({
  EXPONENTIAL_AT: [-20, 20],
  ROUNDING_MODE: BigNumber.ROUND_DOWN, // 截取，不四舍五入
});

// 存储各交易所的深度数据
const depthDataCache = new Map();

// 配置
let config = {
  depthLevels: 1000, // 最大深度档位
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

function handleProcessDepth(data) {
  try {
    const { exchange, symbol, bids, asks, tsExch, tsRecv } = data;

    if (!exchange || !symbol) {
      return;
    }

    // 判断是否需要对数量进行转换（接口已处理，不需要除以 1000）
    const quantityDivisor = 1;

    // 处理买盘和卖盘数据
    const processedBids = processDepthData(bids, 'bids', quantityDivisor);
    const processedAsks = processDepthData(asks, 'asks', quantityDivisor);

    // 计算最佳买卖价（使用 BigNumber）
    const bestBid = processedBids.length > 0 
      ? new BigNumber(processedBids[0].price).toNumber() 
      : 0;
    const bestAsk = processedAsks.length > 0 
      ? new BigNumber(processedAsks[0].price).toNumber() 
      : 0;

    // 计算价差（使用 BigNumber）
    let spread = 0;
    let spreadPercent = 0;
    
    if (bestBid > 0 && bestAsk > 0) {
      const bestBidBN = new BigNumber(bestBid);
      const bestAskBN = new BigNumber(bestAsk);
      spread = bestAskBN.minus(bestBidBN).toNumber();
      spreadPercent = bestBidBN.gt(0) 
        ? bestAskBN.minus(bestBidBN).dividedBy(bestBidBN).multipliedBy(100).toNumber()
        : 0;
    }

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
 * @param {number} quantityDivisor - 数量除数（接口已处理，统一为 1）
 * @returns {Array} 处理后的数据
 */
function processDepthData(rawData, type, quantityDivisor = 1) {
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }

  // 转换并过滤数据（使用 BigNumber 进行精确计算）
  const processed = rawData
    .map(item => {
      const priceBN = new BigNumber(item.px);
      const quantityBN = new BigNumber(item.qty);
      const divisorBN = new BigNumber(quantityDivisor);
      
      const price = priceBN.toNumber();
      const quantity = quantityBN.dividedBy(divisorBN).toNumber();
      
      return { price, quantity };
    })
    .filter(item => item.quantity > 0 && !isNaN(item.price) && !isNaN(item.quantity))
    .slice(0, config.depthLevels);

  // 排序：bids 降序（最高价在前），asks 升序（最低价在前）
  if (type === 'bids') {
    processed.sort((a, b) => b.price - a.price);
  } else {
    processed.sort((a, b) => a.price - b.price);
  }

  // 计算累计数量（使用 BigNumber）
  let totalBN = new BigNumber(0);
  for (const item of processed) {
    totalBN = totalBN.plus(item.quantity);
    item.total = totalBN.toNumber();
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
  const bestBidBN = new BigNumber(bestBid);
  const bestAskBN = new BigNumber(bestAsk);

  for (const pct of percentages) {
    const pctKey = `${pct}`;
    const pctBN = new BigNumber(pct);

    // 计算买盘深度（使用 BigNumber）
    // bidThreshold = bestBid * (1 - pct)
    const bidThresholdBN = bestBidBN.multipliedBy(new BigNumber(1).minus(pctBN));
    const bidThreshold = bidThresholdBN.toNumber();
    
    let bidDepthBN = new BigNumber(0);
    for (const b of bids) {
      if (b.price >= bidThreshold) {
        bidDepthBN = bidDepthBN.plus(b.quantity);
      }
    }
    const bidDepth = bidDepthBN.toNumber();

    // 计算卖盘深度（使用 BigNumber）
    // askThreshold = bestAsk * (1 + pct)
    const askThresholdBN = bestAskBN.multipliedBy(new BigNumber(1).plus(pctBN));
    const askThreshold = askThresholdBN.toNumber();
    
    let askDepthBN = new BigNumber(0);
    for (const a of asks) {
      if (a.price <= askThreshold) {
        askDepthBN = askDepthBN.plus(a.quantity);
      }
    }
    const askDepth = askDepthBN.toNumber();

    // 计算总深度（使用 BigNumber）
    const totalDepthBN = bidDepthBN.plus(askDepthBN);
    const totalDepth = totalDepthBN.toNumber();

    stats[pctKey] = {
      bidDepth,
      askDepth,
      totalDepth,
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
