/**
 * WebSocket服务类
 * 用于管理交易所WebSocket连接，提供统一的数据处理接口
 */
export class WebSocketService {
  constructor() {
    this.connections = new Map()
    this.reconnectAttempts = new Map()
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.heartbeatInterval = 30000
    this.heartbeatTimers = new Map()
  }

  /**
   * 连接Binance现货WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectBinance(symbol, onMessage, onStatusChange) {
    const connectionId = `binance_spot_${symbol}`
    
    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId)
    }

    try {
      const stream = `${symbol.toLowerCase()}@depth20@100ms`
      const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`
      
      const ws = new WebSocket(wsUrl)
      this.connections.set(connectionId, ws)
      this.reconnectAttempts.set(connectionId, 0)
      
      ws.onopen = () => {
        console.log(`Binance现货WebSocket连接成功: ${symbol}`)
        onStatusChange('connected')
        this.reconnectAttempts.set(connectionId, 0)
        this.startHeartbeat(connectionId)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (error) {
          console.error('Binance现货数据解析错误:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log(`Binance现货WebSocket连接关闭: ${symbol}`, event.code, event.reason)
        onStatusChange('disconnected')
        this.stopHeartbeat(connectionId)
        this.scheduleReconnect(connectionId, () => {
          this.connectBinance(symbol, onMessage, onStatusChange)
        })
      }
      
      ws.onerror = (error) => {
        console.error(`Binance现货WebSocket错误: ${symbol}`, error)
        onStatusChange('error')
      }
      
      onStatusChange('connecting')
      
    } catch (error) {
      console.error('创建Binance现货WebSocket连接失败:', error)
      onStatusChange('error')
    }
  }

  /**
   * 连接Binance U本位合约WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectBinanceFutures(symbol, onMessage, onStatusChange) {
    const connectionId = `binance_futures_${symbol}`
    
    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId)
    }

    try {
      // U本位合约使用正确的WebSocket端点
      const wsUrl = 'wss://fstream.binance.com/ws'
      
      const ws = new WebSocket(wsUrl)
      this.connections.set(connectionId, ws)
      this.reconnectAttempts.set(connectionId, 0)
      
      ws.onopen = () => {
        console.log(`Binance U本位合约WebSocket连接成功: ${symbol}`)
        onStatusChange('connected')
        this.reconnectAttempts.set(connectionId, 0)
        this.startHeartbeat(connectionId)
        
        // 订阅深度数据流
        const subscribeMessage = {
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@depth20@100ms`],
          id: Date.now()
        }
        ws.send(JSON.stringify(subscribeMessage))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // 处理ping消息 - 必须回复pong
          if (data.ping) {
            console.log('收到ping消息，回复pong')
            ws.send(JSON.stringify({ pong: data.ping }))
            return
          }
          
          // 处理深度数据流
          if (data.stream && data.stream.includes('depth')) {
            onMessage(data.data)
          }
          // 处理直接深度数据（U本位合约格式）
          else if (data.e === 'depthUpdate') {
            onMessage(data)
          }
          // 处理订阅确认
          else if (data.result === null && data.id) {
            console.log(`Binance U本位合约订阅成功: ${symbol}`)
          }
        } catch (error) {
          console.error('Binance U本位合约数据解析错误:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log(`Binance U本位合约WebSocket连接关闭: ${symbol}`, event.code, event.reason)
        onStatusChange('disconnected')
        this.stopHeartbeat(connectionId)
        this.scheduleReconnect(connectionId, () => {
          this.connectBinanceFutures(symbol, onMessage, onStatusChange)
        })
      }
      
      ws.onerror = (error) => {
        console.error(`Binance U本位合约WebSocket错误: ${symbol}`, error)
        onStatusChange('error')
      }
      
      onStatusChange('connecting')
      
    } catch (error) {
      console.error('创建Binance U本位合约WebSocket连接失败:', error)
      onStatusChange('error')
    }
  }

  /**
   * 连接Toobit WebSocket
   * @param {string} symbol - 交易对符号
   * @param {Function} onMessage - 消息处理回调
   * @param {Function} onStatusChange - 状态变更回调
   */
  connectToobit(symbol, onMessage, onStatusChange) {
    const connectionId = `toobit_${symbol}`
    
    // 如果已存在连接，先关闭
    if (this.connections.has(connectionId)) {
      this.disconnect(connectionId)
    }

    try {
      const wsUrl = 'wss://stream.toobit.com/quote/ws/v1'
      
      const ws = new WebSocket(wsUrl)
      this.connections.set(connectionId, ws)
      this.reconnectAttempts.set(connectionId, 0)
      
      ws.onopen = () => {
        console.log(`Toobit WebSocket连接成功: ${symbol}`)
        onStatusChange('connected')
        this.reconnectAttempts.set(connectionId, 0)
        this.startHeartbeat(connectionId)
        
        // 订阅深度数据
        const subscribeMessage = {
          symbol: symbol,
          topic: "depth",
          event: "sub"
        }
        ws.send(JSON.stringify(subscribeMessage))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('收到Toobit原始数据:', data)
          
          // 处理深度数据
          if (data.topic && data.topic === 'depth' && data.data && Array.isArray(data.data)) {
            // Toobit返回的是数组格式，取第一个元素
            const depthData = data.data[0]
            if (depthData && (depthData.b || depthData.a)) {
              console.log('处理Toobit深度数据:', depthData)
              onMessage(depthData)
            }
          }
        } catch (error) {
          console.error('Toobit数据解析错误:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log(`Toobit WebSocket连接关闭: ${symbol}`, event.code, event.reason)
        onStatusChange('disconnected')
        this.stopHeartbeat(connectionId)
        this.scheduleReconnect(connectionId, () => {
          this.connectToobit(symbol, onMessage, onStatusChange)
        })
      }
      
      ws.onerror = (error) => {
        console.error(`Toobit WebSocket错误: ${symbol}`, error)
        onStatusChange('error')
      }
      
      onStatusChange('connecting')
      
    } catch (error) {
      console.error('创建Toobit WebSocket连接失败:', error)
      onStatusChange('error')
    }
  }

  /**
   * 断开指定连接
   * @param {string} connectionId - 连接ID
   */
  disconnect(connectionId) {
    const ws = this.connections.get(connectionId)
    if (ws) {
      ws.close()
      this.connections.delete(connectionId)
      this.stopHeartbeat(connectionId)
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    for (const [connectionId] of this.connections) {
      this.disconnect(connectionId)
    }
  }

  /**
   * 重连机制
   * @param {string} connectionId - 连接ID
   * @param {Function} reconnectFn - 重连函数
   */
  scheduleReconnect(connectionId, reconnectFn) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(connectionId, attempts + 1)
      console.log(`${connectionId} 准备重连，第${attempts + 1}次尝试`)
      
      setTimeout(() => {
        reconnectFn()
      }, this.reconnectDelay)
    } else {
      console.error(`${connectionId} 重连次数已达上限`)
    }
  }

  /**
   * 开始心跳检测
   * @param {string} connectionId - 连接ID
   */
  startHeartbeat(connectionId) {
    this.stopHeartbeat(connectionId)
    
    // 对于U本位合约，服务器会每3分钟发送ping，我们不需要主动发送ping
    // 只需要监控连接状态
    const timer = setInterval(() => {
      const ws = this.connections.get(connectionId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        // 连接正常，不需要发送ping
        console.log(`连接 ${connectionId} 状态正常`)
      } else {
        console.log(`连接 ${connectionId} 状态异常，停止心跳`)
        this.stopHeartbeat(connectionId)
      }
    }, this.heartbeatInterval)
    
    this.heartbeatTimers.set(connectionId, timer)
  }

  /**
   * 停止心跳检测
   * @param {string} connectionId - 连接ID
   */
  stopHeartbeat(connectionId) {
    const timer = this.heartbeatTimers.get(connectionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(connectionId)
    }
  }

  /**
   * 获取连接状态
   * @param {string} connectionId - 连接ID
   * @returns {string} 连接状态
   */
  getConnectionStatus(connectionId) {
    const ws = this.connections.get(connectionId)
    if (!ws) return 'disconnected'
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'disconnecting'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
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
  static processDepthData(rawData, type, maxLevels = 20) {
    if (!rawData || !Array.isArray(rawData)) {
      return []
    }
    
    const processed = rawData
      .filter(item => parseFloat(item[1]) > 0) // 过滤数量为0的订单
      .map(item => ({
        price: parseFloat(item[0]),
        quantity: parseFloat(item[1])
      }))
      .slice(0, maxLevels) // 限制档位数
    
    // 计算累计数量
    let total = 0
    processed.forEach(item => {
      total += item.quantity
      item.total = total
    })
    
    // 排序：asks升序，bids降序
    if (type === 'asks') {
      processed.sort((a, b) => a.price - b.price)
    } else {
      processed.sort((a, b) => b.price - a.price)
    }
    
    return processed
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
      bestAsk: asks.length > 0 ? asks[0].price : 0
    }
  }

  /**
   * 计算价差
   * @param {number} price1 - 价格1
   * @param {number} price2 - 价格2
   * @returns {number} 价差
   */
  static calculateSpread(price1, price2) {
    return Math.abs(price1 - price2)
  }

  /**
   * 格式化价格
   * @param {number} price - 价格
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的价格
   */
  static formatPrice(price, decimals = 8) {
    if (!price || price === 0) return '--'
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    })
  }

  /**
   * 格式化数量
   * @param {number} quantity - 数量
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的数量
   */
  static formatQuantity(quantity, decimals = 8) {
    if (!quantity || quantity === 0) return '--'
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })
  }
}
