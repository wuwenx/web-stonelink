/**
 * WebSocket数据处理Worker
 * 用于处理WebSocket消息，避免阻塞主线程
 */

// 存储本地orderbook数据
const localOrderBooks = new Map();
const lastUpdateIds = new Map();

// 处理Binance深度数据
function processBinanceDepthData(data, symbol) {
  try {
    // 处理ping消息
    if (data.ping) {
      return { type: 'ping', data: data.ping };
    }

    // 处理深度数据流
    if (data.e && data.e === 'depthUpdate') {
      const updateData = data;
      
      // 检查更新ID的连续性
      if (lastUpdateIds.has(symbol)) {
        const lastU = lastUpdateIds.get(symbol);
        // 只有在lastU > 0时才检查连续性，避免初始化时的误报
        if (lastU > 0 && updateData.pu > 0 && updateData.pu !== lastU) {
          console.warn(`检测到丢包: 期望 pu=${lastU}, 实际 pu=${updateData.pu}`);
          lastUpdateIds.set(symbol, updateData.u);
          return { type: 'error', message: '丢包检测' };
        }
      }
      
      // 更新本地orderbook
      const orderBook = localOrderBooks.get(symbol);
      if (!orderBook) {
        return { type: 'error', message: '本地orderbook不存在' };
      }
      
      // 批量更新买单
      if (updateData.b && updateData.b.length > 0) {
        for (let i = 0; i < updateData.b.length; i++) {
          const [price, quantity] = updateData.b[i];
          const numPrice = parseFloat(price);
          const numQuantity = parseFloat(quantity);
          
          if (numQuantity === 0) {
            orderBook.bids.delete(numPrice);
          } else {
            orderBook.bids.set(numPrice, numQuantity);
          }
        }
      }

      // 批量更新卖单
      if (updateData.a && updateData.a.length > 0) {
        for (let i = 0; i < updateData.a.length; i++) {
          const [price, quantity] = updateData.a[i];
          const numPrice = parseFloat(price);
          const numQuantity = parseFloat(quantity);
          
          if (numQuantity === 0) {
            orderBook.asks.delete(numPrice);
          } else {
            orderBook.asks.set(numPrice, numQuantity);
          }
        }
      }

      // 更新lastUpdateId
      lastUpdateIds.set(symbol, updateData.u);
      orderBook.lastUpdateId = updateData.u;

      // 转换为数组格式
      const bids = convertMapToSortedArray(orderBook.bids, 'desc');
      const asks = convertMapToSortedArray(orderBook.asks, 'asc');

      return {
        type: 'depthUpdate',
        data: {
          e: 'depthUpdate',
          a: asks,
          b: bids,
          lastUpdateId: updateData.u
        }
      };
    }
    
    return { type: 'unknown', data };
  } catch (error) {
    return { type: 'error', message: error.message };
  }
}

// 处理Toobit深度数据
function processToobitDepthData(data, symbol) {
  try {
    if (data.topic && data.topic === 'diffDepth' && data.data && Array.isArray(data.data)) {
      const depthData = data.data[0];
      if (depthData && (depthData.b || depthData.a)) {
        
        // 检查是否为全量数据
        if (data.f === true) {
          // 初始化本地orderbook
          initializeToobitOrderBook(symbol, depthData);
          
          return {
            type: 'initialData',
            data: {
              e: 'depthUpdate',
              a: depthData.a || [],
              b: depthData.b || [],
              lastUpdateTime: depthData.t || Date.now()
            }
          };
        } else {
          // 更新本地orderbook
          const orderBook = localOrderBooks.get(`toobit_${symbol}`);
          if (!orderBook) {
            return { type: 'error', message: 'Toobit本地orderbook不存在' };
          }

          // 批量更新买单
          if (depthData.b && Array.isArray(depthData.b) && depthData.b.length > 0) {
            for (let i = 0; i < depthData.b.length; i++) {
              const [price, quantity] = depthData.b[i];
              const numPrice = parseFloat(price);
              const numQuantity = parseFloat(quantity);
              
              if (numQuantity === 0) {
                orderBook.bids.delete(numPrice);
              } else {
                orderBook.bids.set(numPrice, numQuantity);
              }
            }
          }

          // 批量更新卖单
          if (depthData.a && Array.isArray(depthData.a) && depthData.a.length > 0) {
            for (let i = 0; i < depthData.a.length; i++) {
              const [price, quantity] = depthData.a[i];
              const numPrice = parseFloat(price);
              const numQuantity = parseFloat(quantity);
              
              if (numQuantity === 0) {
                orderBook.asks.delete(numPrice);
              } else {
                orderBook.asks.set(numPrice, numQuantity);
              }
            }
          }

          // 更新最后更新时间
          orderBook.lastUpdateTime = depthData.t || Date.now();

          // 转换为数组格式
          const bids = convertMapToSortedArray(orderBook.bids, 'desc');
          const asks = convertMapToSortedArray(orderBook.asks, 'asc');

          return {
            type: 'depthUpdate',
            data: {
              e: 'depthUpdate',
              a: asks,
              b: bids,
              lastUpdateTime: orderBook.lastUpdateTime
            }
          };
        }
      }
    }
    
    return { type: 'unknown', data };
  } catch (error) {
    return { type: 'error', message: error.message };
  }
}

// 初始化Binance orderbook
function initializeBinanceOrderBook(symbol, snapshot) {
  const orderBook = {
    bids: new Map(),
    asks: new Map(),
    lastUpdateId: snapshot.lastUpdateId
  };
  
  // 初始化买单
  snapshot.bids.forEach(([price, quantity]) => {
    orderBook.bids.set(parseFloat(price), parseFloat(quantity));
  });
  
  // 初始化卖单
  snapshot.asks.forEach(([price, quantity]) => {
    orderBook.asks.set(parseFloat(price), parseFloat(quantity));
  });
  
  localOrderBooks.set(symbol, orderBook);
  lastUpdateIds.set(symbol, 0);
}

// 初始化Toobit orderbook
function initializeToobitOrderBook(symbol, snapshot) {
  const orderBook = {
    bids: new Map(),
    asks: new Map(),
    lastUpdateTime: snapshot.t || Date.now()
  };
  
  // 初始化买单
  if (snapshot.b && Array.isArray(snapshot.b)) {
    snapshot.b.forEach(([price, quantity]) => {
      orderBook.bids.set(parseFloat(price), parseFloat(quantity));
    });
  }
  
  // 初始化卖单
  if (snapshot.a && Array.isArray(snapshot.a)) {
    snapshot.a.forEach(([price, quantity]) => {
      orderBook.asks.set(parseFloat(price), parseFloat(quantity));
    });
  }
  
  localOrderBooks.set(`toobit_${symbol}`, orderBook);
}

// 高效的Map转数组排序方法
function convertMapToSortedArray(map, order = 'asc') {
  const entries = [];
  const isDesc = order === 'desc';
  
  // 使用for...of遍历Map
  for (const [price, quantity] of map) {
    entries.push([price, quantity]);
  }
  
  // 排序
  if (isDesc) {
    entries.sort((a, b) => b[0] - a[0]);
  } else {
    entries.sort((a, b) => a[0] - b[0]);
  }
  
  return entries;
}

// 监听主线程消息
self.onmessage = function(event) {
  const { type, data, symbol, exchange } = event.data;
  
  let result;
  
  switch (type) {
  case 'initBinanceOrderBook':
    initializeBinanceOrderBook(symbol, data);
    result = { type: 'initComplete', symbol };
    break;
      
  case 'initToobitOrderBook':
    initializeToobitOrderBook(symbol, data);
    result = { type: 'initComplete', symbol };
    break;
      
  case 'processBinanceMessage':
    result = processBinanceDepthData(data, symbol);
    break;
      
  case 'processToobitMessage':
    result = processToobitDepthData(data, symbol);
    break;
      
  default:
    result = { type: 'error', message: '未知消息类型' };
  }
  
  // 发送处理结果回主线程
  self.postMessage({
    type: 'result',
    exchange,
    symbol,
    result
  });
};
