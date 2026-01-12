/**
 * 统一深度数据 Store
 * 管理来自所有交易所的深度数据
 */
import { defineStore } from 'pinia';
import { DEPTH_OPTIONS, EXCHANGES, getExchangeName, SYMBOLS } from '../config/exchanges';
import { getUnifiedWebSocketService } from '../services/UnifiedWebSocketService';

export const useDepthStore = defineStore('depth', {
  state: () => ({
    // 连接状态
    connectionStatus: 'disconnected',

    // 当前配置
    config: {
      exchangeType: 'futures', // 'spot' 或 'futures'
      symbol: 'BTCUSDT',
      depthLevels: 250,
      depthPercentage: 0.0001, // 当前选择的深度百分比
    },

    // 深度数据 - 按交易所分组
    // { bnUM: { asks: [], bids: [], bestBid, bestAsk, spread, depthStats, lastUpdate }, ... }
    depthData: {},

    // 选中的交易所列表
    selectedExchanges: [],

    // 加载状态
    isLoading: false,

    // WebSocket 服务实例引用
    wsService: null,
  }),

  getters: {
    // 获取当前类型的交易所列表
    availableExchanges: state => {
      return EXCHANGES[state.config.exchangeType] || [];
    },

    // 获取支持的交易对列表
    availableSymbols: () => SYMBOLS,

    // 获取深度选项
    depthOptions: () => DEPTH_OPTIONS,

    // 获取指定交易所的深度数据
    getDepthByExchange: state => exchange => {
      return (
        state.depthData[exchange] || {
          asks: [],
          bids: [],
          bestBid: 0,
          bestAsk: 0,
          spread: 0,
          spreadPercent: 0,
          depthStats: {},
          lastUpdate: '--',
        }
      );
    },

    // 获取所有选中交易所的深度数据
    selectedDepthData: state => {
      const result = {};
      for (const exchange of state.selectedExchanges) {
        result[exchange] = state.depthData[exchange] || {
          asks: [],
          bids: [],
          bestBid: 0,
          bestAsk: 0,
          spread: 0,
          spreadPercent: 0,
          depthStats: {},
          lastUpdate: '--',
        };
      }
      return result;
    },

    // 获取交易所显示名称
    getExchangeNameById: state => exchangeId => {
      return getExchangeName(exchangeId, state.config.exchangeType);
    },

    // 获取当前深度百分比下的对比数据
    depthComparisonData: state => {
      const pctKey = `${state.config.depthPercentage}`;
      const result = [];

      for (const exchangeId of state.selectedExchanges) {
        const data = state.depthData[exchangeId];
        if (!data) continue;

        const depthStats = data.depthStats?.[pctKey] || { bidDepth: 0, askDepth: 0 };
        const exchangeInfo = (EXCHANGES[state.config.exchangeType] || []).find(e => e.id === exchangeId);

        result.push({
          exchange: exchangeId,
          exchangeName: exchangeInfo?.name || exchangeId,
          color: exchangeInfo?.color || '#666666',
          bestBid: data.bestBid || 0,
          bestAsk: data.bestAsk || 0,
          spread: data.spread || 0,
          spreadPercent: data.spreadPercent || 0,
          bidDepth: depthStats.bidDepth,
          askDepth: depthStats.askDepth,
          totalDepth: depthStats.bidDepth + depthStats.askDepth,
          lastUpdate: data.lastUpdate || '--',
        });
      }

      // 按总深度排序（从大到小）
      result.sort((a, b) => b.totalDepth - a.totalDepth);

      return result;
    },

    // 判断是否已连接
    isConnected: state => state.connectionStatus === 'connected',
  },

  actions: {
    // 初始化 WebSocket 服务
    initWebSocket() {
      if (!this.wsService) {
        this.wsService = getUnifiedWebSocketService();

        // 设置回调
        this.wsService.onDepthUpdate = data => this.handleDepthUpdate(data);
        this.wsService.onStatusChange = status => {
          this.connectionStatus = status;
          console.log('连接状态变化:', status);
        };
        this.wsService.onError = error => {
          console.error('WebSocket 错误:', error);
        };
      }
    },

    // 连接并订阅
    async connect() {
      this.initWebSocket();
      this.isLoading = true;

      // 设置默认选中的交易所（如果未设置）
      if (this.selectedExchanges.length === 0) {
        const exchanges = EXCHANGES[this.config.exchangeType] || [];
        this.selectedExchanges = exchanges.slice(0, 3).map(e => e.id);
      }

      // 更新 Worker 配置
      this.wsService.updateWorkerConfig({
        depthLevels: this.config.depthLevels,
      });

      // 连接 WebSocket
      this.wsService.connect();

      // 等待连接成功后订阅
      this.waitAndSubscribe();
    },

    // 等待连接成功后订阅
    waitAndSubscribe() {
      const checkAndSubscribe = () => {
        if (this.wsService.getStatus() === 'connected') {
          this.subscribeAll();
          this.isLoading = false;
        } else if (this.wsService.getStatus() === 'connecting') {
          setTimeout(checkAndSubscribe, 100);
        } else {
          this.isLoading = false;
        }
      };

      setTimeout(checkAndSubscribe, 100);
    },

    // 订阅所有选中的交易所
    subscribeAll() {
      if (!this.wsService) return;

      const exchangeIds = this.selectedExchanges;
      if (exchangeIds.length > 0) {
        this.wsService.subscribeDepthBatch(exchangeIds, this.config.symbol);
      }
    },

    // 处理深度数据更新
    handleDepthUpdate(data) {
      const { exchange, bids, asks, bestBid, bestAsk, spread, spreadPercent, depthStats, processedAt } = data;

      // 更新 store
      this.depthData[exchange] = {
        bids,
        asks,
        bestBid,
        bestAsk,
        spread,
        spreadPercent,
        depthStats,
        lastUpdate: new Date(processedAt).toLocaleTimeString(),
      };
    },

    // 切换交易类型（现货/合约）
    switchExchangeType(type) {
      if (this.config.exchangeType === type) return;

      // 取消当前订阅
      if (this.wsService) {
        this.wsService.unsubscribeAll();
      }

      // 清空数据
      this.depthData = {};

      // 更新配置
      this.config.exchangeType = type;

      // 更新选中的交易所为新类型的默认值
      const newExchanges = EXCHANGES[type] || [];
      this.selectedExchanges = newExchanges.slice(0, 3).map(e => e.id);

      // 重新订阅
      if (this.wsService && this.wsService.getStatus() === 'connected') {
        this.subscribeAll();
      }
    },

    // 切换交易对
    switchSymbol(symbol) {
      if (this.config.symbol === symbol) return;

      // 取消当前订阅
      if (this.wsService) {
        this.wsService.unsubscribeAll();
      }

      // 清空数据
      this.depthData = {};

      // 更新配置
      this.config.symbol = symbol;

      // 重新订阅
      if (this.wsService && this.wsService.getStatus() === 'connected') {
        this.subscribeAll();
      }
    },

    // 更新深度百分比
    updateDepthPercentage(percentage) {
      this.config.depthPercentage = percentage;
    },

    // 更新选中的交易所
    updateSelectedExchanges(exchanges) {
      // 找出新增的和移除的交易所
      const added = exchanges.filter(e => !this.selectedExchanges.includes(e));
      const removed = this.selectedExchanges.filter(e => !exchanges.includes(e));

      // 更新选中列表
      this.selectedExchanges = exchanges;

      if (!this.wsService || this.wsService.getStatus() !== 'connected') return;

      // 取消移除的订阅
      for (const exchange of removed) {
        this.wsService.unsubscribeDepth(exchange, this.config.symbol);
        delete this.depthData[exchange];
      }

      // 添加新的订阅
      if (added.length > 0) {
        this.wsService.subscribeDepthBatch(added, this.config.symbol);
      }
    },

    // 添加单个交易所
    addExchange(exchangeId) {
      if (this.selectedExchanges.includes(exchangeId)) return;

      this.selectedExchanges.push(exchangeId);

      if (this.wsService && this.wsService.getStatus() === 'connected') {
        this.wsService.subscribeDepth(exchangeId, this.config.symbol);
      }
    },

    // 移除单个交易所
    removeExchange(exchangeId) {
      const index = this.selectedExchanges.indexOf(exchangeId);
      if (index === -1) return;

      this.selectedExchanges.splice(index, 1);

      if (this.wsService) {
        this.wsService.unsubscribeDepth(exchangeId, this.config.symbol);
      }

      delete this.depthData[exchangeId];
    },

    // 更新配置
    updateConfig(newConfig) {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...newConfig };

      // 检查是否需要更新 Worker 配置
      if (newConfig.depthLevels && newConfig.depthLevels !== oldConfig.depthLevels) {
        if (this.wsService) {
          this.wsService.updateWorkerConfig({ depthLevels: newConfig.depthLevels });
        }
      }

      // 检查是否需要重新订阅
      if (newConfig.exchangeType && newConfig.exchangeType !== oldConfig.exchangeType) {
        this.switchExchangeType(newConfig.exchangeType);
      } else if (newConfig.symbol && newConfig.symbol !== oldConfig.symbol) {
        this.switchSymbol(newConfig.symbol);
      }
    },

    // 断开连接
    disconnect() {
      if (this.wsService) {
        this.wsService.disconnect();
      }
      this.depthData = {};
      this.connectionStatus = 'disconnected';
    },

    // 重新连接
    async reconnect() {
      this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.connect();
    },
  },
});
