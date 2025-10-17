/**
 * WebSocket服务类
 * 用于管理交易所WebSocket连接，提供统一的数据处理接口
 */
import { binanceFuturesWebSocketUrl, binanceSpotWebSocketUrl, binanceSymbol, okxFuturesWebSocketUrl, okxSymbol, toobitFuturesWebSocketUrl, toobitSymbol } from '../config/const';

export class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = 30000;
    this.heartbeatTimers = new Map();
  }

  /**
   * 连接Binance现货WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectBinance(symbol, onMessage, onStatusChange) {
    const connectionId = `binance_spot_${symbol}`;

    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId);
    }

    try {
      const stream = `${symbol.toLowerCase()}@depth20@100ms`;
      const wsUrl = binanceSpotWebSocketUrl + stream;

      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        onStatusChange('connected');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectBinance(symbol, onMessage, onStatusChange);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

      onStatusChange('connecting');
    } catch (error) {
      onStatusChange('error');
    }
  }

  /**
   * 连接Binance U本位合约WebSocket（包含深度数据和标记价格）
   * @param {string} symbol - 交易对符号
   * @param {Function} onDepthMessage - 深度数据消息处理回调
   * @param {Function} onMarkPriceMessage - 标记价格消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   * @param {number} depthLevels - 深度档位数，默认20
   */
  connectBinanceFuturesWithMarkPrice(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange, depthLevels = 20) {
    const connectionId = `binance_futures_combined_${symbol}`;

    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId);
    }

    try {
      const wsUrl = binanceFuturesWebSocketUrl;

      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        onStatusChange('connected');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据流和标记价格流
        const subscribeMessage = {
          method: 'SUBSCRIBE',
          params: [
            `${binanceSymbol(symbol).toLowerCase()}@depth${depthLevels}@500ms`,
            `${binanceSymbol(symbol).toLowerCase()}@markPrice@1s`
          ],
          id: Date.now(),
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理ping消息 - 必须回复pong
          if (data.ping) {
            ws.send(JSON.stringify({ pong: data.ping }));
            return;
          }

          // 处理深度数据流
          if (data.stream && data.stream.includes('depth')) {
            onDepthMessage(data.data);
          } else if (data.stream && data.stream.includes('markPrice')) {
            // 处理标记价格流
            onMarkPriceMessage(data.data);
          } else if (data.e === 'depthUpdate') {
            // 处理直接深度数据（U本位合约格式）
            onDepthMessage(data);
          } else if (data.p && data.i) {
            // 处理直接标记价格数据
            onMarkPriceMessage(data);
          } else if (data.result === null && data.id) {
            // 处理订阅确认
            // 订阅成功确认
          }
        } catch (error) {
          // 静默处理错误
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectBinanceFuturesWithMarkPrice(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

      onStatusChange('connecting');
    } catch (error) {
      onStatusChange('error');
    }
  }

  /**
   * 连接OKX WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectOKX(symbol, onMessage, onStatusChange) {
    const connectionId = `okx_${symbol}`;

    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId);
    }

    try {
      const wsUrl = okxFuturesWebSocketUrl;

      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        onStatusChange('connected');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据
        const subscribeMessage = {
          op: 'subscribe',
          args: [
            {
              channel: 'books',
              instId: okxSymbol(symbol)
            }
          ]
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          // 处理深度数据
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const depthData = data.data[0];
            if (depthData.asks && depthData.bids) {
              // 转换OKX格式到通用格式
              const convertedData = {
                a: depthData.asks.map(ask => [ask[0], ask[1]]), // asks: [price, quantity]
                b: depthData.bids.map(bid => [bid[0], bid[1]])  // bids: [price, quantity]
              };
              onMessage(convertedData);
            }
          }
        } catch (error) {
          // 静默处理错误
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectOKX(symbol, onMessage, onStatusChange);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

      onStatusChange('connecting');
    } catch (error) {
      onStatusChange('error');
    }
  }

  /**
   * 连接Toobit WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectToobit(symbol, onMessage, onStatusChange) {
    const connectionId = `toobit_${symbol}`;

    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId);
    }

    try {
      const wsUrl = toobitFuturesWebSocketUrl;

      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        onStatusChange('connected');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据
        const subscribeMessage = {
          symbol: toobitSymbol(symbol),
          topic: 'depth',
          event: 'sub',
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          // 处理深度数据
          if (data.topic && data.topic === 'depth' && data.data && Array.isArray(data.data)) {
            // Toobit返回的是数组格式，取第一个元素
            const depthData = data.data[0];
            if (depthData && (depthData.b || depthData.a)) {
              onMessage(depthData);
            }
          }
        } catch (error) {
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectToobit(symbol, onMessage, onStatusChange);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

      onStatusChange('connecting');
    } catch (error) {
      onStatusChange('error');
    }
  }

  /**
   * 断开指定连接
   * @param {string} connectionId - 连接ID
   */
  disconnect(connectionId) {
    const ws = this.connections.get(connectionId);
    if (ws) {
      console.log(`正在关闭连接: ${connectionId}`);

      // 移除事件监听器，防止在关闭过程中触发回调
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;

      // 关闭连接
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Connection closed by user');
      }

      // 清理资源
      this.connections.delete(connectionId);
      this.stopHeartbeat(connectionId);
      this.reconnectAttempts.delete(connectionId);

      console.log(`连接已关闭: ${connectionId}`);
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    console.log('开始断开所有WebSocket连接');
    const connectionIds = Array.from(this.connections.keys());

    for (const connectionId of connectionIds) {
      this.disconnect(connectionId);
    }

    // 确保所有资源都被清理
    this.connections.clear();
    this.reconnectAttempts.clear();

    // 停止所有心跳定时器
    for (const [connectionId] of this.heartbeatTimers) {
      this.stopHeartbeat(connectionId);
    }
    this.heartbeatTimers.clear();

    console.log('所有WebSocket连接已断开，资源已清理');
  }

  /**
   * 重连机制
   * @param {string} connectionId - 连接ID
   * @param {Function} reconnectFn - 重连函数
   */
  scheduleReconnect(connectionId, reconnectFn) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(connectionId, attempts + 1);
      console.log(`${connectionId} 准备重连，第${attempts + 1}次尝试`);

      setTimeout(() => {
        reconnectFn();
      }, this.reconnectDelay);
    } else {
      console.error(`${connectionId} 重连次数已达上限`);
    }
  }

  /**
   * 开始心跳检测
   * @param {string} connectionId - 连接ID
   */
  startHeartbeat(connectionId) {
    this.stopHeartbeat(connectionId);

    // 对于U本位合约，服务器会每3分钟发送ping，我们不需要主动发送ping
    // 只需要监控连接状态
    const timer = setInterval(() => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        // 连接正常，不需要发送ping
        console.log(`连接 ${connectionId} 状态正常`);
      } else {
        console.log(`连接 ${connectionId} 状态异常，停止心跳`);
        this.stopHeartbeat(connectionId);
      }
    }, this.heartbeatInterval);

    this.heartbeatTimers.set(connectionId, timer);
  }

  /**
   * 停止心跳检测
   * @param {string} connectionId - 连接ID
   */
  stopHeartbeat(connectionId) {
    const timer = this.heartbeatTimers.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(connectionId);
    }
  }

  /**
   * 获取连接状态
   * @param {string} connectionId - 连接ID
   * @returns {string} 连接状态
   */
  getConnectionStatus(connectionId) {
    const ws = this.connections.get(connectionId);
    if (!ws) return 'disconnected';

    switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
      return 'disconnecting';
    case WebSocket.CLOSED:
      return 'disconnected';
    default:
      return 'unknown';
    }
  }
}

/**
 * 深度数据处理工具类
 */
export class DepthDataProcessor {
  /**
   * 处理深度数据
   * @param {Array} rawData - 原始深度数据
   * @param {string} type - 数据类型 ('asks' 或 'bids')
   * @param {number} maxLevels - 最大档位数
   * @returns {Array} 处理后的深度数据
   */
  static processDepthData(rawData, type, maxLevels = 5, percentage = 1) {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    const processed = rawData
      .filter(item => parseFloat(item[1]) > 0) // 过滤数量为0的订单
      .map(item => ({
        price: parseFloat(item[0]),
        quantity: parseFloat(item[1]) * percentage,
      }))
      .slice(0, maxLevels); // 限制档位数

    // 排序：asks降序，bids升序
    // if (type === 'bids') {
    //   processed.sort((a, b) => b.price - a.price); // 卖盘降序
    // } else {
    //   processed.sort((a, b) => b.price - a.price); // 买盘升序
    // }
    if (type === 'asks') {
      processed.reverse(); // 卖盘降序
    } 
    // let total = 0;
    // processed.forEach(item => {
    //   total += item.quantity;
    //   item.total = total;
    // });
    // // 计算累计数量（在排序后进行）
    if (type === 'asks') {
      // 卖盘：从最后一条（最接近市价）开始向上累计
      let total = 0;
      for (let i = processed.length - 1; i >= 0; i--) {
        total += processed[i].quantity;
        processed[i].total = total;
      }
    } else {
      // 买盘：从第一条（最接近市价）开始向下累计
      let total = 0;
      processed.forEach(item => {
        total += item.quantity;
        item.total = total;
      });
    }

    return processed;
  }

  /**
   * 计算最佳买卖价
   * @param {Array} bids - 买盘数据
   * @param {Array} asks - 卖盘数据
   * @returns {Object} 最佳买卖价
   */
  static calculateBestPrices(bids, asks) {
    return {
      bestBid: bids.length > 0 ? bids[0].price : 0,
      bestAsk: asks.length > 0 ? asks[0].price : 0,
    };
  }

  /**
   * 计算价差
   * @param {number} price1 - 价格1
   * @param {number} price2 - 价格2
   * @returns {number} 价差
   */
  static calculateSpread(price1, price2) {
    return Math.abs(price1 - price2);
  }

  /**
   * 格式化价格
   * @param {number} price - 价格
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的价格
   */
  static formatPrice(price, decimals = 8) {
    if (!price || price === 0) return '--';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * 格式化数量
   * @param {number} quantity - 数量
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的数量
   */
  static formatQuantity(quantity, decimals = 8) {
    if (!quantity || quantity === 0) return '--';
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * 处理标记价格数据
   * @param {Object} rawData - 原始标记价格数据
   * @returns {Object} 处理后的标记价格数据
   */
  static processMarkPriceData(rawData) {
    if (!rawData) {
      return {
        markPrice: 0,
        indexPrice: 0,
        estimatedSettlePrice: 0,
        lastFundingRate: 0,
        nextFundingTime: 0,
        interestRate: 0,
        time: 0,
      };
    }

    return {
      markPrice: parseFloat(rawData.p) || 0,
      indexPrice: parseFloat(rawData.i) || 0,
      estimatedSettlePrice: parseFloat(rawData.P) || 0,
      lastFundingRate: parseFloat(rawData.r) || 0,
      nextFundingTime: parseInt(rawData.T) || 0,
      interestRate: parseFloat(rawData.R) || 0,
      time: parseInt(rawData.E) || 0,
    };
  }

  /**
   * 格式化标记价格
   * @param {number} markPrice - 标记价格
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的标记价格
   */
  static formatMarkPrice(markPrice, decimals = 8) {
    if (!markPrice || markPrice === 0) return '--';
    return markPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * 格式化资金费率
   * @param {number} fundingRate - 资金费率
   * @returns {string} 格式化后的资金费率
   */
  static formatFundingRate(fundingRate) {
    if (!fundingRate || fundingRate === 0) return '--';
    return `${(fundingRate * 100).toFixed(4)}%`;
  }

  /**
   * 格式化时间戳
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间
   */
  static formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 0) return '--';
    return new Date(timestamp).toLocaleTimeString();
  }
}
