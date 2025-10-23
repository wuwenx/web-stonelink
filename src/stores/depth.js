import { defineStore } from 'pinia';
import { DepthDataProcessor, WebSocketService } from '../services/WebSocketService.js';

export const useDepthStore = defineStore('depth', {
  state: () => ({
    // 连接状态
    connections: {
      binance: 'disconnected',
      okx: 'disconnected',
      toobit: 'disconnected',
    },
    
    // 深度数据
    depthData: {
      binance: {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
        markPrice: 0,
        indexPrice: 0,
        fundingRate: 0,
        nextFundingTime: 0,
        markPriceLastUpdate: '--',
      },
      okx: {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
      },
      toobit: {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
      },
    },
    
    // 配置
    config: {
      selectedSymbol: 'BTCUSDT',
      selectedExchange: 'binance',
      exchangeType: 'futures',
      depthLevels: 250,
      depthPercentage: '0.01',
    },
    
    // 加载状态
    isLoading: false,
    
    // WebSocket服务实例
    wsService: null,
  }),

  getters: {
    // 获取指定交易所的深度数据
    getDepthDataByExchange: state => exchange => {
      return state.depthData[exchange] || {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
      };
    },

    // 获取当前选择交易所的深度数据
    currentExchangeDepthData: state => {
      return state.depthData[state.config.selectedExchange];
    },

    // 获取所有交易所的深度数据
    allDepthData: state => state.depthData,

    // 获取连接状态
    getConnectionStatus: state => exchange => {
      return state.connections[exchange] || 'disconnected';
    },

    // 获取当前选择交易所的连接状态
    currentExchangeStatus: state => {
      return state.connections[state.config.selectedExchange];
    },

    // 获取所有连接状态
    allConnectionStatus: state => state.connections,

    // 计算价差
    priceDifference: state => {
      const currentExchange = state.config.selectedExchange;
      const currentData = state.depthData[currentExchange];
      const toobitData = state.depthData.toobit;
      
      if (!currentData || !toobitData) return 0;
      return currentData.bestBid - toobitData.bestBid;
    },

    // 深度对比数据
    depthComparisonData: state => {
      const percentage = parseFloat(state.config.depthPercentage) / 100;
      const currentExchange = state.config.selectedExchange;
      const currentData = state.depthData[currentExchange];
      const toobitData = state.depthData.toobit;
      
      if (!currentData || !toobitData) {
        return [{
          symbol: state.config.selectedSymbol,
          selectedExchangeValue: 0,
          toobitValue: 0,
        }];
      }

      return [{
        symbol: state.config.selectedSymbol,
        selectedExchangeValue: calculateDepthValue(currentData.bids, currentData.bestBid, percentage),
        toobitValue: calculateDepthValue(toobitData.bids, toobitData.bestBid, percentage),
      }];
    },

    // 获取最佳价格对比
    bestPricesComparison: state => {
      const currentExchange = state.config.selectedExchange;
      const currentData = state.depthData[currentExchange];
      const toobitData = state.depthData.toobit;
      
      return {
        currentExchange: {
          bestBid: currentData?.bestBid || 0,
          bestAsk: currentData?.bestAsk || 0,
        },
        toobit: {
          bestBid: toobitData?.bestBid || 0,
          bestAsk: toobitData?.bestAsk || 0,
        },
      };
    },

    // 获取标记价格信息（仅币安支持）
    markPriceInfo: state => {
      const binanceData = state.depthData.binance;
      return {
        markPrice: binanceData.markPrice,
        indexPrice: binanceData.indexPrice,
        fundingRate: binanceData.fundingRate,
        nextFundingTime: binanceData.nextFundingTime,
        lastUpdate: binanceData.markPriceLastUpdate,
      };
    },

    // 检查是否有数据
    hasData: state => {
      const currentExchange = state.config.selectedExchange;
      const currentData = state.depthData[currentExchange];
      const toobitData = state.depthData.toobit;
      
      return (currentData?.bids?.length > 0 || currentData?.asks?.length > 0) &&
             (toobitData?.bids?.length > 0 || toobitData?.asks?.length > 0);
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
      const reconnectKeys = ['selectedSymbol', 'selectedExchange', 'exchangeType', 'depthLevels'];
      return reconnectKeys.some(key => oldConfig[key] !== newConfig[key]);
    },

    // 连接WebSocket
    async connectWebSockets() {
      this.initializeWebSocketService();
      this.isLoading = true;
      
      try {
        await this.connectSelectedExchange();
        this.connectToobit();
      } catch (error) {
        console.error('连接WebSocket失败:', error);
        this.isLoading = false;
      }
    },

    // 连接选择的交易所
    async connectSelectedExchange() {
      const { selectedExchange, selectedSymbol, exchangeType, depthLevels } = this.config;
      
      if (selectedExchange === 'binance') {
        await this.connectBinance(selectedSymbol, exchangeType, depthLevels);
      } else if (selectedExchange === 'okx') {
        this.connectOKX(selectedSymbol);
      }
    },

    // 连接币安
    async connectBinance(symbol, exchangeType, depthLevels) {
      if (exchangeType === 'futures') {
        await this.wsService.connectBinanceFuturesWithMarkPrice(
          symbol,
          this.handleBinanceDepthData.bind(this),
          this.handleBinanceMarkPriceData.bind(this),
          status => {
            this.connections.binance = status;
            if (status === 'connected') {
              setTimeout(() => {
                this.isLoading = false;
              }, 1000);
            }
          },
          depthLevels
        );
      } else {
        this.wsService.connectBinance(
          symbol,
          this.handleBinanceDepthData.bind(this),
          status => {
            this.connections.binance = status;
            if (status === 'connected') {
              setTimeout(() => {
                this.isLoading = false;
              }, 1000);
            }
          }
        );
      }
    },

    // 连接OKX
    connectOKX(symbol) {
      this.wsService.connectOKX(
        symbol,
        this.handleOKXData.bind(this),
        status => {
          this.connections.okx = status;
          if (status === 'connected') {
            setTimeout(() => {
              this.isLoading = false;
            }, 1000);
          }
        }
      );
    },

    // 连接Toobit
    connectToobit() {
      const { selectedSymbol } = this.config;
      this.wsService.connectToobit(
        selectedSymbol,
        this.handleToobitData.bind(this),
        status => {
          this.connections.toobit = status;
        }
      );
    },

    // 处理币安深度数据
    handleBinanceDepthData(data) {
      if (data.e === 'depthUpdate' || (data.a && data.b)) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels);
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels);

        this.depthData.binance.asks = processedAsks;
        this.depthData.binance.bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.binance.bestBid = bestPrices.bestBid;
        this.depthData.binance.bestAsk = bestPrices.bestAsk;
        this.depthData.binance.lastUpdate = new Date().toLocaleTimeString();
        
        this.isLoading = false;
      }
    },

    // 处理币安标记价格数据
    handleBinanceMarkPriceData(data) {
      const processedData = DepthDataProcessor.processMarkPriceData(data);
      
      this.depthData.binance.markPrice = processedData.markPrice;
      this.depthData.binance.indexPrice = processedData.indexPrice;
      this.depthData.binance.fundingRate = processedData.lastFundingRate;
      this.depthData.binance.nextFundingTime = processedData.nextFundingTime;
      this.depthData.binance.markPriceLastUpdate = new Date().toLocaleTimeString();
    },

    // 处理OKX数据
    handleOKXData(data) {
      if (data.a && data.b) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels);
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels);

        this.depthData.okx.asks = processedAsks;
        this.depthData.okx.bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.okx.bestBid = bestPrices.bestBid;
        this.depthData.okx.bestAsk = bestPrices.bestAsk;
        this.depthData.okx.lastUpdate = new Date().toLocaleTimeString();
        
        this.isLoading = false;
      }
    },

    // 处理Toobit数据
    handleToobitData(data) {
      if (data.a && data.b) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels, '0.001');
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels, '0.001');

        this.depthData.toobit.asks = processedAsks;
        this.depthData.toobit.bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.toobit.bestBid = bestPrices.bestBid;
        this.depthData.toobit.bestAsk = bestPrices.bestAsk;
        this.depthData.toobit.lastUpdate = new Date().toLocaleTimeString();
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
      Object.keys(this.depthData).forEach(exchange => {
        this.depthData[exchange] = {
          asks: [],
          bids: [],
          bestBid: 0,
          bestAsk: 0,
          lastUpdate: '--',
          ...(exchange === 'binance' && {
            markPrice: 0,
            indexPrice: 0,
            fundingRate: 0,
            nextFundingTime: 0,
            markPriceLastUpdate: '--',
          }),
        };
      });

      // 重置连接状态
      Object.keys(this.connections).forEach(exchange => {
        this.connections[exchange] = 'disconnected';
      });
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

// 辅助函数：计算深度值
function calculateDepthValue(bids, bestBid, percentage) {
  if (!bids || bids.length === 0 || !bestBid || bestBid === 0) {
    return 0;
  }
 
  const targetPrice = bestBid * (1 + percentage);
  let totalQuantity = 0;
  
  for (const bid of bids) {
    if (bid.price <= targetPrice && bid.price >= bestBid) {
      totalQuantity += bid.quantity;
    }
  }
  
  return totalQuantity;
}
