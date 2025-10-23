import { defineStore } from 'pinia';
import { DepthDataProcessor, WebSocketService } from '../services/WebSocketService.js';

export const useBitunixStore = defineStore('bitunix', {
  state: () => ({
    // 连接状态 - 按币对分组
    connections: {},
    
    // 深度数据 - 按币对分组
    depthData: {},
    
    // 订阅的币对列表
    subscribedSymbols: ['BTCUSDT', 'ETHUSDT'],
    
    // 配置
    config: {
      depthLevels: 250,
    },
    
    // 加载状态
    isLoading: false,
    
    // WebSocket服务实例
    wsService: null,
  }),

  getters: {
    // 获取指定币对的深度数据
    getDepthDataBySymbol: state => symbol => {
      return state.depthData[symbol] || {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
      };
    },

    // 获取所有深度数据
    allDepthData: state => state.depthData,

    // 获取指定币对的连接状态
    getConnectionStatus: state => symbol => {
      return state.connections[symbol] || 'disconnected';
    },

    // 获取所有连接状态
    allConnectionStatus: state => state.connections,

    // 获取订阅的币对列表
    subscribedSymbolsList: state => state.subscribedSymbols,

    // 检查是否有数据
    hasData: state => {
      return Object.values(state.depthData).some(data => 
        data.bids?.length > 0 || data.asks?.length > 0
      );
    },

    // 获取配置信息
    currentConfig: state => state.config,
  },

  actions: {
    // 初始化WebSocket服务
    initializeWebSocketService() {
      if (!this.wsService) {
        this.wsService = new WebSocketService();
      }
    },

    // 更新订阅的币对列表
    updateSubscribedSymbols(symbols) {
      this.subscribedSymbols = symbols;
      this.reconnectWebSockets();
    },

    // 添加币对订阅
    addSymbolSubscription(symbol) {
      if (!this.subscribedSymbols.includes(symbol)) {
        this.subscribedSymbols.push(symbol);
        this.connectSymbol(symbol);
      }
    },

    // 移除币对订阅
    removeSymbolSubscription(symbol) {
      const index = this.subscribedSymbols.indexOf(symbol);
      if (index > -1) {
        this.subscribedSymbols.splice(index, 1);
        this.disconnectSymbol(symbol);
      }
    },

    // 更新配置
    updateConfig(newConfig) {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...newConfig };
      
      // 检查是否需要重新连接
      const needsReconnect = this.checkIfReconnectNeeded(oldConfig, this.config);
      
      if (needsReconnect) {
        this.reconnectWebSockets();
      }
    },

    // 检查是否需要重新连接
    checkIfReconnectNeeded(oldConfig, newConfig) {
      const reconnectKeys = ['depthLevels'];
      return reconnectKeys.some(key => oldConfig[key] !== newConfig[key]);
    },

    // 连接WebSocket - 支持多币对
    async connectWebSockets() {
      this.initializeWebSocketService();
      this.isLoading = true;
      
      try {
        // 为每个币对连接
        for (const symbol of this.subscribedSymbols) {
          await this.connectSymbol(symbol);
        }
      } catch (error) {
        console.error('连接Bitunix WebSocket失败:', error);
        this.isLoading = false;
      }
    },

    // 连接指定币对
    async connectSymbol(symbol) {
      try {
        this.connectBitunix(symbol);
      } catch (error) {
        console.error(`连接币对 ${symbol} 失败:`, error);
      }
    },

    // 断开指定币对的连接
    disconnectSymbol(symbol) {
      if (this.connections[symbol]) {
        const connectionId = `bitunix_${symbol}`;
        this.wsService?.disconnect(connectionId);
        delete this.connections[symbol];
        delete this.depthData[symbol];
      }
    },

    // 连接Bitunix
    connectBitunix(symbol) {
      this.wsService.connectBitunix(
        symbol,
        data => this.handleBitunixData(data, symbol),
        status => {
          this.connections[symbol] = status;
          if (status === 'connected') {
            setTimeout(() => {
              this.isLoading = false;
            }, 1000);
          }
        }
      );
    },

    // 处理Bitunix数据
    handleBitunixData(data, symbol) {
      if (data.a && data.b) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels);
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels);

        // 初始化币对数据
        if (!this.depthData[symbol]) {
          this.depthData[symbol] = {
            asks: [],
            bids: [],
            bestBid: 0,
            bestAsk: 0,
            lastUpdate: '--',
          };
        }

        this.depthData[symbol].asks = processedAsks;
        this.depthData[symbol].bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData[symbol].bestBid = bestPrices.bestBid;
        this.depthData[symbol].bestAsk = bestPrices.bestAsk;
        this.depthData[symbol].lastUpdate = new Date().toLocaleTimeString();
        
        this.isLoading = false;
      }
    },

    // 重新连接WebSocket
    async reconnectWebSockets() {
      this.isLoading = true;
      
      // 关闭现有连接
      if (this.wsService) {
        this.wsService.disconnectAll();
      }

      // 清空数据
      this.clearAllData();

      // 延迟重新连接
      setTimeout(async() => {
        await this.connectWebSockets();
      }, 1500);
    },

    // 清空所有数据
    clearAllData() {
      // 重置深度数据
      this.depthData = {};

      // 重置连接状态
      this.connections = {};
    },

    // 断开所有连接
    disconnectAll() {
      if (this.wsService) {
        this.wsService.disconnectAll();
      }
      this.clearAllData();
    },

    // 设置加载状态
    setLoading(loading) {
      this.isLoading = loading;
    },
  },
});
