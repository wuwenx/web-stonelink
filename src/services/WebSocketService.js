/**
 * WebSocket服务类
 * 用于管理交易所WebSocket连接，提供统一的数据处理接口
 */
import axios from 'axios';
import { binanceFuturesWebSocketUrl, binanceSpotWebSocketUrl, binanceSymbol, okxFuturesWebSocketUrl, okxSymbol, toobitFuturesWebSocketUrl, toobitSymbol } from '../config/const';

export class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = 30000;
    this.reconnecting = new Set(); // 跟踪正在重连的连接
    this.heartbeatTimers = new Map();
    
    // Web Worker管理
    this.worker = null;
    this.workerCallbacks = new Map(); // 存储回调函数
    this.initWorker();
  }

  /**
   * 初始化Web Worker
   */
  initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/websocketWorker.js', import.meta.url));
      
      this.worker.onmessage = event => {
        const { type, exchange, symbol, result } = event.data;
        
        if (type === 'result') {
          const callbackKey = `${exchange}_${symbol}`;
          const callbacks = this.workerCallbacks.get(callbackKey);
          
          console.log(`Worker返回: exchange=${exchange}, symbol=${symbol}, callbackKey=${callbackKey}, hasCallbacks=${!!callbacks}`);
          
          if (callbacks) {
            switch (result.type) {
            case 'ping':
              // 处理ping消息
              if (callbacks.onPing) {
                callbacks.onPing(result.data);
              }
              break;
                
            case 'depthUpdate':
              // 处理深度更新
              if (callbacks.onDepthMessage) {
                callbacks.onDepthMessage(result.data);
              }
              break;
                
            case 'initialData':
              // 处理初始数据
              if (callbacks.onDepthMessage) {
                callbacks.onDepthMessage(result.data);
              }
              break;
                
            case 'error':
              console.error(`Worker处理错误 (${exchange}_${symbol}):`, result.message);
              break;
            }
          } else {
            console.warn(`未找到回调函数: ${callbackKey}`);
          }
        }
      };
      
      this.worker.onerror = error => {
        console.error('Web Worker错误:', error);
      };
      
    } catch (error) {
      console.error('初始化Web Worker失败:', error);
      this.worker = null;
    }
  }

  /**
   * 注册Worker回调函数
   * @param {string} exchange - 交易所名称
   * @param {string} symbol - 交易对符号
   * @param {Object} callbacks - 回调函数对象
   */
  registerWorkerCallbacks(exchange, symbol, callbacks) {
    const callbackKey = `${exchange}_${symbol}`;
    this.workerCallbacks.set(callbackKey, callbacks);
  }

  /**
   * 发送消息到Worker
   * @param {string} type - 消息类型
   * @param {string} exchange - 交易所名称
   * @param {string} symbol - 交易对符号
   * @param {*} data - 数据
   */
  sendToWorker(type, exchange, symbol, data) {
    if (this.worker) {
      this.worker.postMessage({
        type,
        exchange,
        symbol,
        data
      });
    }
  }
  /**
   * 获取币安合约深度快照
   */
  async getBinanceDepthSnapshot(symbol, limit = 1000) {
    try {
      const response = await axios.get('https://fapi.binance.com/fapi/v1/depth', {
        params: {
          symbol: binanceSymbol(symbol),
          limit: limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取Binance合约深度快照失败:', error);
      throw error;
    }
  }

  /**
   * 获取币安现货深度快照
   */
  async getBinanceSpotDepthSnapshot(symbol, limit = 5000) {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/depth', {
        params: {
          symbol: binanceSymbol(symbol).toUpperCase(),
          limit: limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取Binance现货深度快照失败:', error);
      throw error;
    }
  }

  /**
   * 连接Binance现货WebSocket（包含深度数据）
   * @param {string} symbol - 交易对符号
   * @param {Function} onDepthMessage - 深度数据消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   * @param {number} depthLevels - 深度档位数，默认20
   */
  async connectBinanceSpot(symbol, onDepthMessage, onStatusChange, depthLevels = 20) {
    const connectionId = `binance_spot_${symbol}`;

    // 如果已存在连接且状态正常，直接返回
    if (this.connections.has(connectionId)) {
      const existingWs = this.connections.get(connectionId);
      if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        console.log(`连接 ${connectionId} 已存在且状态正常，复用现有连接`);
        onStatusChange('connected');
        return;
      } else {
        // 连接存在但状态异常，先关闭
        console.log(`连接 ${connectionId} 存在但状态异常，关闭后重新创建`);
        this.disconnect(connectionId);
      }
    }

    try {
      // 步骤1: 尝试获取深度快照
      onStatusChange('connecting');
      console.log('正在获取Binance现货深度快照...');
      
      let snapshot = null;
      let hasSnapshot = false;
      let firstUpdateId = 0;
      
      try {
        snapshot = await this.getBinanceSpotDepthSnapshot(symbol, 5000);
        console.log('深度快照获取成功，lastUpdateId:', snapshot.lastUpdateId);
        hasSnapshot = true;
        firstUpdateId = snapshot.lastUpdateId;
        
        // 步骤2: 初始化Worker中的orderbook
        // 使用 connectionId 作为 key，区分现货和合约
        this.sendToWorker('initBinanceOrderBook', 'binance', connectionId, snapshot);
        console.log(`初始化Worker orderbook完成: ${connectionId}, lastUpdateId: ${snapshot.lastUpdateId}`);
        
        // 步骤2.5: 发送初始快照数据
        const initialData = {
          e: 'depthUpdate',
          a: snapshot.asks,
          b: snapshot.bids,
          lastUpdateId: snapshot.lastUpdateId
        };
        console.log(`发送初始快照数据: bids=${snapshot.bids.length}, asks=${snapshot.asks.length}`);
        onDepthMessage(initialData);
      } catch (snapshotError) {
        console.warn('深度快照获取失败，将直接使用WebSocket连接:', snapshotError.message);
        hasSnapshot = false;
        // 不中断流程，继续建立WebSocket连接
      }
      
      // 步骤3: 建立WebSocket连接
      const wsUrl = binanceSpotWebSocketUrl;
      
      // 确保完全清理现有连接
      this.forceDisconnect(connectionId);
      
      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据流
        // 如果有快照，使用增量更新流；否则使用20档深度流
        const subscribeMessage = {
          method: 'SUBSCRIBE',
          params: [
            hasSnapshot ? `${symbol.toLowerCase()}@depth` : `${symbol.toLowerCase()}@depth20@100ms`
          ],
          id: Date.now(),
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      // 注册Worker回调 - 使用 connectionId 与Worker处理一致
      this.registerWorkerCallbacks('binance', connectionId, {
        onPing: pingData => {
          ws.send(JSON.stringify({ pong: pingData }));
        },
        onDepthMessage: formattedData => {
          onDepthMessage(formattedData);
        }
      });

      ws.onmessage = event => {
        try {
          // 检查连接状态，如果已关闭则不处理消息
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn(`Binance现货WebSocket连接已关闭，忽略消息: ${connectionId}`);
            return;
          }

          const data = JSON.parse(event.data);
          console.log('币安现货收到消息:', data);
          
          // 处理ping消息 - 必须回复pong
          if (data.ping) {
            ws.send(JSON.stringify({ pong: data.ping }));
            return;
          }

          // 处理深度数据流
          if (data.e && data.e === 'depthUpdate') {
            // 过滤掉在快照之前的更新
            if (hasSnapshot && data.u <= firstUpdateId) {
              console.log(`跳过旧的更新: u=${data.u}, firstUpdateId=${firstUpdateId}`);
              return;
            }
            
            // 发送到Worker处理 - 使用 connectionId 保持与初始化一致
            this.sendToWorker('processBinanceMessage', 'binance', connectionId, data);
            console.log(`币安现货发送到Worker: connectionId=${connectionId}`);
          } else if (data.result === null && data.id) {
            // 处理订阅确认
            console.log('订阅确认成功');
            onStatusChange('connected');
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error);
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectBinanceSpot(symbol, onDepthMessage, onStatusChange, depthLevels);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

    } catch (error) {
      console.error('连接Binance现货失败:', error);
      onStatusChange('error');
    }
  }

  /**
   * 连接Binance现货WebSocket (旧方法，保留兼容性)
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectBinance(symbol, onMessage, onStatusChange) {
    return this.connectBinanceSpot(symbol, onMessage, onStatusChange, 20);
  }

  /**
   * 连接Binance U本位合约WebSocket（包含深度数据和标记价格）
   * @param {string} symbol - 交易对符号
   * @param {Function} onDepthMessage - 深度数据消息处理回调
   * @param {Function} onMarkPriceMessage - 标记价格消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   * @param {number} depthLevels - 深度档位数，默认20
   */
  async connectBinanceFuturesWithMarkPrice(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange, depthLevels = 20) {
    const connectionId = `binance_futures_combined_${symbol}`;

    // 如果已存在连接且状态正常，直接返回
    if (this.connections.has(connectionId)) {
      const existingWs = this.connections.get(connectionId);
      if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        console.log(`连接 ${connectionId} 已存在且状态正常，复用现有连接`);
        onStatusChange('connected');
        return;
      } else {
        // 连接存在但状态异常，先关闭
        console.log(`连接 ${connectionId} 存在但状态异常，关闭后重新创建`);
        this.disconnect(connectionId);
      }
    }

    try {
      // 步骤1: 尝试获取深度快照
      onStatusChange('connecting');
      console.log('正在获取Binance深度快照...');
      
      let snapshot = null;
      let hasSnapshot = false;
      
      try {
        snapshot = await this.getBinanceDepthSnapshot(symbol, 1000);
        console.log('深度快照获取成功，lastUpdateId:', snapshot.lastUpdateId);
        hasSnapshot = true;
        
        // 步骤2: 初始化Worker中的orderbook
        // 使用 connectionId 作为 key，区分现货和合约
        this.sendToWorker('initBinanceOrderBook', 'binance', connectionId, snapshot);
        console.log(`初始化Worker orderbook完成: ${connectionId}, lastUpdateId: ${snapshot.lastUpdateId}`);
        
        // 步骤2.5: 发送初始快照数据
        const initialData = {
          e: 'depthUpdate',
          a: snapshot.asks,
          b: snapshot.bids,
          lastUpdateId: snapshot.lastUpdateId
        };
        console.log(`发送初始快照数据: bids=${snapshot.bids.length}, asks=${snapshot.asks.length}`);
        onDepthMessage(initialData);
      } catch (snapshotError) {
        console.warn('深度快照获取失败，将直接使用WebSocket连接:', snapshotError.message);
        hasSnapshot = false;
        // 不中断流程，继续建立WebSocket连接
      }
      
      // 步骤3: 建立WebSocket连接
      const wsUrl = binanceFuturesWebSocketUrl;
      
      // 确保完全清理现有连接
      this.forceDisconnect(connectionId);
      
      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);

      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据流和标记价格流 https://developers.binance.com/docs/zh-CN/derivatives/usds-margined-futures/websocket-market-streams/Partial-Book-Depth-Streams
        const subscribeMessage = {
          method: 'SUBSCRIBE',
          params: [
            hasSnapshot ? `${binanceSymbol(symbol).toLowerCase()}@depth` : `${binanceSymbol(symbol).toLowerCase()}@depth20@500ms`,
            `${binanceSymbol(symbol).toLowerCase()}@markPrice@1s`
          ],
          id: Date.now(),
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      // 注册Worker回调 - 使用 connectionId 与Worker处理一致
      this.registerWorkerCallbacks('binance', connectionId, {
        onPing: pingData => {
          ws.send(JSON.stringify({ pong: pingData }));
        },
        onDepthMessage: formattedData => {
          onDepthMessage(formattedData);
        }
      });

      ws.onmessage = event => {
        try {
          // 检查连接状态，如果已关闭则不处理消息
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn(`Binance WebSocket连接已关闭，忽略消息: ${connectionId}`);
            return;
          }

          const data = JSON.parse(event.data);
          
          // 处理ping消息 - 必须回复pong
          if (data.ping) {
            ws.send(JSON.stringify({ pong: data.ping }));
            return;
          }

          // 处理深度数据流
          if (data.e && data.e === 'depthUpdate') {
            // 发送到Worker处理 - 使用 connectionId 保持与初始化一致
            this.sendToWorker('processBinanceMessage', 'binance', connectionId, data);
            console.log(`币安合约发送到Worker: connectionId=${connectionId}`);
          } else if (data.e && data.e === 'markPriceUpdate') {
            // 处理标记价格流
            onMarkPriceMessage(data);
          } else if (data.result === null && data.id) {
            // 处理订阅确认
            console.log('订阅确认成功');
            onStatusChange('connected');
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error);
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectBinanceFuturesWithMarkPrice(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange, depthLevels);
        });
      };

      ws.onerror = error => {
        onStatusChange('error');
      };

    } catch (error) {
      console.error('连接Binance期货失败:', error);
      onStatusChange('error');
    }
  }

  /**
   * 重新连接Binance期货（用于丢包重连）
   */
  async reconnectBinanceFutures(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange, depthLevels) {
    const connectionId = `binance_futures_combined_${symbol}`;
    
    // 检查是否已经在重连中，避免重复重连
    if (this.reconnecting.has(connectionId)) {
      console.log(`连接 ${connectionId} 正在重连中，跳过重复重连`);
      return;
    }
    
    // 检查重连次数限制
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    if (attempts >= 3) {
      console.error(`连接 ${connectionId} 重连次数已达上限，停止重连`);
      onStatusChange('error');
      return;
    }
    
    console.log(`重新初始化Binance连接... (第${attempts + 1}次尝试)`);
    this.reconnecting.add(connectionId);
    this.reconnectAttempts.set(connectionId, attempts + 1);
    
    // 清理旧的连接和数据
    this.disconnect(connectionId);
    this.localOrderBooks.delete(symbol);
    this.lastUpdateIds.delete(symbol);
    
    // 延迟重连，避免频繁重连
    setTimeout(async() => {
      try {
        await this.connectBinanceFuturesWithMarkPrice(symbol, onDepthMessage, onMarkPriceMessage, onStatusChange, depthLevels);
        this.reconnecting.delete(connectionId); // 重连成功后清除标记
      } catch (error) {
        console.error('重连失败:', error);
        this.reconnecting.delete(connectionId); // 重连失败后也清除标记
        onStatusChange('error');
      }
    }, 2000 + attempts * 1000); // 递增延迟：2s, 3s, 4s
  }

  /**
   * 连接OKX WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectOKX(symbol, onMessage, onStatusChange) {
    const connectionId = `okx_${symbol}`;

    // 如果已存在连接且状态正常，直接返回
    if (this.connections.has(connectionId)) {
      const existingWs = this.connections.get(connectionId);
      if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        console.log(`连接 ${connectionId} 已存在且状态正常，复用现有连接`);
        onStatusChange('connected');
        return;
      } else {
        // 连接存在但状态异常，先关闭
        console.log(`连接 ${connectionId} 存在但状态异常，关闭后重新创建`);
        this.disconnect(connectionId);
      }
    }

    try {
      const wsUrl = okxFuturesWebSocketUrl;

      // 确保完全清理现有连接
      this.forceDisconnect(connectionId);

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
   * @param {string} exchangeType - 交易类型 'spot' 或 'futures'
   */
  connectToobit(symbol, onMessage, onStatusChange, exchangeType = 'futures') {
    const connectionId = `toobit_${symbol}`;

    // 总是先清理旧连接
    if (this.connections.has(connectionId)) {
      console.log(`清理旧连接: ${connectionId}`);
      this.disconnect(connectionId);
    }

    // 等待旧连接完全清理后再创建新连接
    setTimeout(() => {
      this.createToobitConnection(symbol, onMessage, onStatusChange, exchangeType);
    }, 100);
  }

  /**
   * 创建Toobit WebSocket连接
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   * @param {string} exchangeType - 交易类型 'spot' 或 'futures'
   */
  createToobitConnection(symbol, onMessage, onStatusChange, exchangeType = 'futures') {
    const connectionId = `toobit_${symbol}`;
    
    // 再次确认旧连接已清理（防止重复调用）
    if (this.connections.has(connectionId)) {
      console.warn(`连接 ${connectionId} 仍然存在，强制清理`);
      this.forceDisconnect(connectionId);
    }
    
    try {
      const wsUrl = toobitFuturesWebSocketUrl;

      const ws = new WebSocket(wsUrl);
      this.connections.set(connectionId, ws);
      this.reconnectAttempts.set(connectionId, 0);
      
      console.log(`正在创建新的Toobit连接: ${connectionId}`);

      ws.onopen = () => {
        onStatusChange('connected');
        this.reconnectAttempts.set(connectionId, 0);
        this.startHeartbeat(connectionId);

        // 订阅深度数据
        const subscribeMessage = {
          symbol: toobitSymbol(symbol, exchangeType),
          topic: 'diffDepth',
          event: 'sub',
        };
        console.log(`Toobit订阅消息:`, JSON.stringify(subscribeMessage));
        ws.send(JSON.stringify(subscribeMessage));
      };

      // 注册Worker回调
      this.registerWorkerCallbacks('toobit', symbol, {
        onDepthMessage: formattedData => {
          onMessage(formattedData);
        }
      });

      ws.onmessage = event => {
        try {
          // 检查连接状态，如果已关闭则不处理消息
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn(`Toobit WebSocket连接已关闭，忽略消息: ${connectionId}`);
            return;
          }

          const data = JSON.parse(event.data);
          console.log('Toobit收到原始消息:', data);

          // 处理深度数据
          if (data.topic && data.topic === 'diffDepth' && data.data && Array.isArray(data.data)) {
            const depthData = data.data[0];
            
            // 如果是全量数据（首次），初始化 orderbook
            if (data.f === true && depthData && (depthData.b || depthData.a)) {
              console.log(`Toobit初始化orderbook: symbol=${toobitSymbol(symbol, exchangeType)}`);
              this.sendToWorker('initToobitOrderBook', 'toobit', symbol, depthData);
            }
            
            // 发送到Worker处理
            this.sendToWorker('processToobitMessage', 'toobit', symbol, data);
            console.log(`Toobit处理消息: symbol=${toobitSymbol(symbol, exchangeType)}, f=${data.f}`);
          }
        } catch (error) {
          console.error('处理Toobit WebSocket消息时出错:', error);
        }
      };

      ws.onclose = event => {
        onStatusChange('disconnected');
        this.stopHeartbeat(connectionId);
        this.scheduleReconnect(connectionId, () => {
          this.connectToobit(symbol, onMessage, onStatusChange, exchangeType);
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
   * 强制断开连接，确保完全清理
   * @param {string} connectionId - 连接ID
   */
  forceDisconnect(connectionId) {
    // 先尝试正常断开
    this.disconnect(connectionId);
    
    // 强制清理所有相关状态
    this.connections.delete(connectionId);
    this.reconnectAttempts.delete(connectionId);
    this.reconnecting.delete(connectionId);
    this.stopHeartbeat(connectionId);
    
    // 清理Worker回调
    this.workerCallbacks.delete(connectionId);
    
    console.log(`强制清理连接: ${connectionId}`);
  }

  /**
   * 断开指定连接
   * @param {string} connectionId - 连接ID
   */
  disconnect(connectionId) {
    const ws = this.connections.get(connectionId);
    if (ws) {
      console.log(`正在关闭连接: ${connectionId}`);

      // 清理事件监听器，防止数据帧在关闭后处理
      const noop = () => {};
      ws.onopen = noop;
      ws.onmessage = noop;
      ws.onerror = noop;
      ws.onclose = () => {
        console.log(`连接已关闭: ${connectionId}`);
        // 在 onclose 回调中清理状态
        this.connections.delete(connectionId);
        this.stopHeartbeat(connectionId);
        this.reconnecting.delete(connectionId);
        this.reconnectAttempts.delete(connectionId);
      };

      // 关闭连接
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.close(1000, 'Connection closed by user');
        } catch (error) {
          console.warn(`关闭WebSocket连接时出错: ${error.message}`);
          // 即使出错也要清理
          this.connections.delete(connectionId);
          this.stopHeartbeat(connectionId);
          this.reconnecting.delete(connectionId);
          this.reconnectAttempts.delete(connectionId);
        }
      } else {
        // 如果连接已经是关闭状态，立即清理
        this.connections.delete(connectionId);
        this.stopHeartbeat(connectionId);
        this.reconnecting.delete(connectionId);
        this.reconnectAttempts.delete(connectionId);
      }
    }
  }

  /**
   * 断开所有Toobit连接
   */
  disconnectAllToobit() {
    console.log('开始断开所有Toobit WebSocket连接');
    const connectionIds = Array.from(this.connections.keys());
    
    // 找出所有 Toobit 连接
    const toobitConnections = connectionIds.filter(id => id.startsWith('toobit_'));
    
    console.log(`找到 ${toobitConnections.length} 个Toobit连接需要关闭:`, toobitConnections);
    
    for (const connectionId of toobitConnections) {
      this.disconnect(connectionId);
    }
    
    console.log('所有Toobit连接已关闭');
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
    
    // 不要清理Worker回调，重连时需要保留
    console.log('保留Worker回调，准备重连');
    
    // 停止所有心跳定时器
    for (const [connectionId] of this.heartbeatTimers) {
      this.stopHeartbeat(connectionId);
    }
    this.heartbeatTimers.clear();
    
    // 不要终止Worker，保留以供重连使用
    // 只清理回调映射，避免旧回调干扰
    this.workerCallbacks.clear();
    
    console.log('所有WebSocket连接已断开，保留Worker');
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

    // 排序：asks降序（最高价在前），bids降序（最高价在前）
    if (type === 'asks') {
      processed.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));  
    } else {
      processed.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } 

    // 计算累计数量（在排序后进行）
    // if (type === 'asks') {
    //   // 卖盘：从最后一条的价格开始向下累计
    //   let total = 0;
    //   for (let i = processed.length - 1; i >= 0; i--) {
    //     total += processed[i].quantity;
    //     processed[i].total = total;
    //   }
    // } else {
    //   // 买盘：从第一条的价格开始向上累计
    //   let total = 0;
    //   for (let i = 0; i < processed.length; i++) {
    //     total += processed[i].quantity;
    //     processed[i].total = total;
    //   }
    // }
    let total = 0;
    for (let i = 0; i < processed.length; i++) {
      total += processed[i].quantity;
      processed[i].total = total;
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

