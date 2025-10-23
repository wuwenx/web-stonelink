import { defineStore } from 'pinia';
import { DepthDataProcessor, WebSocketService } from '../services/WebSocketService.js';

export const useDepthStore = defineStore('depth', {
  state: () => ({
    // 连接状态 - 按交易所和币对分组
    connections: {
      binance: {},
      okx: {},
      toobit: {},
    },
    
    // 深度数据 - 按交易所和币对分组
    depthData: {
      binance: {},
      okx: {},
      toobit: {},
    },
    
    // 订阅的币对列表
    subscribedSymbols: ['BTCUSDT', 'ETHUSDT'],
    
    // 配置
    config: {
      selectedSymbol: 'BTCUSDT',
      selectedExchange: 'binance',
      exchangeType: 'futures',
      depthLevels: 250,
      depthPercentage: '0.01',
      orderSide: 'buy', // 新增：订单方向 buy/sell
    },
    
    // 加载状态
    isLoading: false,
    
    // WebSocket服务实例
    wsService: null,
  }),

  getters: {
    // 获取指定交易所和币对的深度数据
    getDepthDataByExchangeAndSymbol: state => (exchange, symbol) => {
      return state.depthData[exchange]?.[symbol] || {
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
    },

    // 获取指定交易所所有币对的深度数据
    getDepthDataByExchange: state => exchange => {
      return state.depthData[exchange] || {};
    },

    // 获取指定币对在所有交易所的深度数据
    getDepthDataBySymbol: state => symbol => {
      const result = {};
      Object.keys(state.depthData).forEach(exchange => {
        result[exchange] = state.depthData[exchange]?.[symbol] || {
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
      return result;
    },

    // 获取当前选择交易所和币对的深度数据
    currentExchangeDepthData: state => {
      return state.depthData[state.config.selectedExchange]?.[state.config.selectedSymbol] || {
        asks: [],
        bids: [],
        bestBid: 0,
        bestAsk: 0,
        lastUpdate: '--',
        ...(state.config.selectedExchange === 'binance' && {
          markPrice: 0,
          indexPrice: 0,
          fundingRate: 0,
          nextFundingTime: 0,
          markPriceLastUpdate: '--',
        }),
      };
    },

    // 获取所有深度数据
    allDepthData: state => state.depthData,

    // 获取指定交易所和币对的连接状态
    getConnectionStatus: state => (exchange, symbol) => {
      return state.connections[exchange]?.[symbol] || 'disconnected';
    },

    // 获取指定交易所的连接状态（所有币对）
    getExchangeConnectionStatus: state => exchange => {
      const exchangeConnections = state.connections[exchange] || {};
      const statuses = Object.values(exchangeConnections);
      if (statuses.length === 0) return 'disconnected';
      if (statuses.every(status => status === 'connected')) return 'connected';
      if (statuses.some(status => status === 'connecting')) return 'connecting';
      if (statuses.some(status => status === 'error')) return 'error';
      return 'disconnected';
    },

    // 获取当前选择交易所和币对的连接状态
    currentExchangeStatus: state => {
      return state.connections[state.config.selectedExchange]?.[state.config.selectedSymbol] || 'disconnected';
    },

    // 获取所有连接状态
    allConnectionStatus: state => state.connections,

    // 获取订阅的币对列表
    subscribedSymbolsList: state => state.subscribedSymbols,

    // 计算价差
    priceDifference: state => {
      const currentExchange = state.config.selectedExchange;
      const currentSymbol = state.config.selectedSymbol;
      const currentData = state.depthData[currentExchange]?.[currentSymbol];
      const toobitData = state.depthData.toobit?.[currentSymbol];
      
      if (!currentData || !toobitData) return 0;
      return currentData.bestBid - toobitData.bestBid;
    },

    // 深度对比数据
    depthComparisonData: state => {
      const percentage = parseFloat(state.config.depthPercentage) / 100;
      const currentExchange = state.config.selectedExchange;
      const currentSymbol = state.config.selectedSymbol;
      const currentData = state.depthData[currentExchange]?.[currentSymbol];
      const toobitData = state.depthData.toobit?.[currentSymbol];
      
      if (!currentData || !toobitData) {
        return [{
          symbol: currentSymbol,
          selectedExchangeValue: 0,
          toobitValue: 0,
        }];
      }

      const isBuySide = state.config.orderSide === 'buy';
      let selectedExchangeValue, toobitValue;

      if (isBuySide) {
        // 买盘：从最优买入价开始，向下跌价指定百分比内的累积数量
        selectedExchangeValue = calculateBuyDepth(currentData.bids, currentData.bestBid, percentage);
        toobitValue = calculateBuyDepth(toobitData.bids, toobitData.bestBid, percentage);
      } else {
        // 卖盘：从最优卖出价开始，向上涨价指定百分比内的累积数量
        selectedExchangeValue = calculateSellDepth(currentData.asks, currentData.bestAsk, percentage);
        toobitValue = calculateSellDepth(toobitData.asks, toobitData.bestAsk, percentage);
      }

      return [{
        symbol: currentSymbol,
        selectedExchangeValue,
        toobitValue,
      }];
    },

    // 多币对深度对比数据
    multiSymbolDepthComparisonData: state => {
      const percentage = parseFloat(state.config.depthPercentage) / 100;
      const isBuySide = state.config.orderSide === 'buy';
      
      return state.subscribedSymbols.map(symbol => {
        const binanceData = state.depthData.binance?.[symbol];
        const toobitData = state.depthData.toobit?.[symbol];
        
        if (!binanceData || !toobitData) {
          return {
            symbol,
            binanceValue: 0,
            toobitValue: 0,
            score: 0
          };
        }

        let binanceValue, toobitValue;

        if (isBuySide) {
          // 买盘深度
          binanceValue = calculateBuyDepth(binanceData.bids, binanceData.bestBid, percentage);
          toobitValue = calculateBuyDepth(toobitData.bids, toobitData.bestBid, percentage);
        } else {
          // 卖盘深度
          binanceValue = calculateSellDepth(binanceData.asks, binanceData.bestAsk, percentage);
          toobitValue = calculateSellDepth(toobitData.asks, toobitData.bestAsk, percentage);
        }

        // 计算分数：toobit - binance，>0为1，<0为-1
        const diff = toobitValue - binanceValue;
        const score = diff > 0 ? 1 : (diff < 0 ? -1 : 0);

        return {
          symbol,
          binanceValue,
          toobitValue,
          score
        };
      });
    },

    // 获取最佳价格对比
    bestPricesComparison: state => {
      const currentExchange = state.config.selectedExchange;
      const currentSymbol = state.config.selectedSymbol;
      const currentData = state.depthData[currentExchange]?.[currentSymbol];
      const toobitData = state.depthData.toobit?.[currentSymbol];
      
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
      const currentSymbol = state.config.selectedSymbol;
      const binanceData = state.depthData.binance?.[currentSymbol];
      return {
        markPrice: binanceData?.markPrice || 0,
        indexPrice: binanceData?.indexPrice || 0,
        fundingRate: binanceData?.fundingRate || 0,
        nextFundingTime: binanceData?.nextFundingTime || 0,
        lastUpdate: binanceData?.markPriceLastUpdate || '--',
      };
    },

    // 检查是否有数据
    hasData: state => {
      const currentExchange = state.config.selectedExchange;
      const currentSymbol = state.config.selectedSymbol;
      const currentData = state.depthData[currentExchange]?.[currentSymbol];
      const toobitData = state.depthData.toobit?.[currentSymbol];
      
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

    // 更新订阅的币对列表
    updateSubscribedSymbols(symbols) {
      this.subscribedSymbols = symbols;
      this.reconnectWebSockets();
    },

    // 添加币对订阅
    addSymbolSubscription(symbol) {
      if (!this.subscribedSymbols.includes(symbol)) {
        this.subscribedSymbols.push(symbol);
        this.connectSymbolToAllExchanges(symbol);
      }
    },

    // 移除币对订阅
    removeSymbolSubscription(symbol) {
      const index = this.subscribedSymbols.indexOf(symbol);
      if (index > -1) {
        this.subscribedSymbols.splice(index, 1);
        this.disconnectSymbolFromAllExchanges(symbol);
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

    // 连接WebSocket - 支持多币对
    async connectWebSockets() {
      this.initializeWebSocketService();
      this.isLoading = true;
      
      try {
        // 为每个币对连接所有交易所
        for (const symbol of this.subscribedSymbols) {
          await this.connectSymbolToAllExchanges(symbol);
        }
      } catch (error) {
        console.error('连接WebSocket失败:', error);
        this.isLoading = false;
      }
    },

    // 为指定币对连接所有交易所
    async connectSymbolToAllExchanges(symbol) {
      try {
        await this.connectBinance(symbol, this.config.exchangeType, this.config.depthLevels);
        this.connectOKX(symbol);
        this.connectToobit(symbol);
      } catch (error) {
        console.error(`连接币对 ${symbol} 失败:`, error);
      }
    },

    // 断开指定币对的所有连接
    disconnectSymbolFromAllExchanges(symbol) {
      Object.keys(this.connections).forEach(exchange => {
        if (this.connections[exchange][symbol]) {
          const connectionId = `${exchange}_${symbol}`;
          this.wsService?.disconnect(connectionId);
          delete this.connections[exchange][symbol];
          delete this.depthData[exchange][symbol];
        }
      });
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
          data => this.handleBinanceDepthData(data, symbol),
          data => this.handleBinanceMarkPriceData(data, symbol),
          status => {
            this.connections.binance[symbol] = status;
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
          data => this.handleBinanceDepthData(data, symbol),
          status => {
            this.connections.binance[symbol] = status;
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
        data => this.handleOKXData(data, symbol),
        status => {
          this.connections.okx[symbol] = status;
          if (status === 'connected') {
            setTimeout(() => {
              this.isLoading = false;
            }, 1000);
          }
        }
      );
    },

    // 连接Toobit
    connectToobit(symbol) {
      this.wsService.connectToobit(
        symbol,
        data => this.handleToobitData(data, symbol),
        status => {
          this.connections.toobit[symbol] = status;
        }
      );
    },

    // 处理币安深度数据
    handleBinanceDepthData(data, symbol) {
      if (data.e === 'depthUpdate' || (data.a && data.b)) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels);
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels);

        // 初始化币对数据
        if (!this.depthData.binance[symbol]) {
          this.depthData.binance[symbol] = {
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
          };
        }

        this.depthData.binance[symbol].asks = processedAsks;
        this.depthData.binance[symbol].bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.binance[symbol].bestBid = bestPrices.bestBid;
        this.depthData.binance[symbol].bestAsk = bestPrices.bestAsk;
        this.depthData.binance[symbol].lastUpdate = new Date().toLocaleTimeString();
        
        this.isLoading = false;
      }
    },

    // 处理币安标记价格数据
    handleBinanceMarkPriceData(data, symbol) {
      const processedData = DepthDataProcessor.processMarkPriceData(data);
      
      // 确保币对数据存在
      if (!this.depthData.binance[symbol]) {
        this.depthData.binance[symbol] = {
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
        };
      }
      
      this.depthData.binance[symbol].markPrice = processedData.markPrice;
      this.depthData.binance[symbol].indexPrice = processedData.indexPrice;
      this.depthData.binance[symbol].fundingRate = processedData.lastFundingRate;
      this.depthData.binance[symbol].nextFundingTime = processedData.nextFundingTime;
      this.depthData.binance[symbol].markPriceLastUpdate = new Date().toLocaleTimeString();
    },

    // 处理OKX数据
    handleOKXData(data, symbol) {
      if (data.a && data.b) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels);
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels);

        // 初始化币对数据
        if (!this.depthData.okx[symbol]) {
          this.depthData.okx[symbol] = {
            asks: [],
            bids: [],
            bestBid: 0,
            bestAsk: 0,
            lastUpdate: '--',
          };
        }

        this.depthData.okx[symbol].asks = processedAsks;
        this.depthData.okx[symbol].bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.okx[symbol].bestBid = bestPrices.bestBid;
        this.depthData.okx[symbol].bestAsk = bestPrices.bestAsk;
        this.depthData.okx[symbol].lastUpdate = new Date().toLocaleTimeString();
        
        this.isLoading = false;
      }
    },

    // 处理Toobit数据
    handleToobitData(data, symbol) {
      if (data.a && data.b) {
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks', this.config.depthLevels, '0.001');
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids', this.config.depthLevels, '0.001');

        // 初始化币对数据
        if (!this.depthData.toobit[symbol]) {
          this.depthData.toobit[symbol] = {
            asks: [],
            bids: [],
            bestBid: 0,
            bestAsk: 0,
            lastUpdate: '--',
          };
        }

        this.depthData.toobit[symbol].asks = processedAsks;
        this.depthData.toobit[symbol].bids = processedBids;

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks);
        this.depthData.toobit[symbol].bestBid = bestPrices.bestBid;
        this.depthData.toobit[symbol].bestAsk = bestPrices.bestAsk;
        this.depthData.toobit[symbol].lastUpdate = new Date().toLocaleTimeString();
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
        this.depthData[exchange] = {};
      });

      // 重置连接状态
      Object.keys(this.connections).forEach(exchange => {
        this.connections[exchange] = {};
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

// 辅助函数：计算买盘深度值
function calculateBuyDepth(bids, bestBid, percentage) {
  if (!bids || bids.length === 0 || !bestBid || bestBid === 0) {
    return 0;
  }
 
  const targetPrice = bestBid * (1 - percentage); // 向下跌价
  let totalQuantity = 0;
  
  for (const bid of bids) {
    if (bid.price <= bestBid && bid.price >= targetPrice) {
      totalQuantity += bid.quantity;
    }
  }
  
  return totalQuantity;
}

// 辅助函数：计算卖盘深度值
function calculateSellDepth(asks, bestAsk, percentage) {
  if (!asks || asks.length === 0 || !bestAsk || bestAsk === 0) {
    return 0;
  }
 
  const targetPrice = bestAsk * (1 + percentage); // 向上涨价
  let totalQuantity = 0;
  
  for (const ask of asks) {
    if (ask.price >= bestAsk && ask.price <= targetPrice) {
      totalQuantity += ask.quantity;
    }
  }
  
  return totalQuantity;
}
