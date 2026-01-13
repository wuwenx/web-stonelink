/**
 * 统一深度数据 Store
 * 管理来自所有交易所的深度数据
 * 以币种为维度组织数据，支持多币种多交易所对比
 */
import { defineStore } from 'pinia';
import { DEPTH_OPTIONS, SYMBOLS } from '../config/exchanges';
import { getUnifiedWebSocketService } from '../services/UnifiedWebSocketService';

// 默认支持的币种（从统一配置获取，只使用前两个作为默认订阅）
const DEFAULT_SYMBOLS = SYMBOLS.slice(0, 2);

// 默认对比的两个交易所
const COMPARE_EXCHANGES = {
  futures: ['bnUM', 'toobitUM'],
  spot: ['bnSpot', 'toobitSpot'],
};

export const useDepthStore = defineStore('depth', {
  state: () => ({
    // 连接状态
    connectionStatus: 'disconnected',

    // 当前配置
    config: {
      exchangeType: 'futures', // 'spot' 或 'futures'
      orderSide: 'buy', // 'buy' 买盘 或 'sell' 卖盘
      depthLevels: 250,
      depthPercentage: 0.0001, // 当前选择的深度百分比
    },

    // 支持的币种列表
    symbols: DEFAULT_SYMBOLS,

    // 深度数据 - 按 symbol_exchange 分组
    // { 'BTCUSDT_bnUM': { ... }, 'BTCUSDT_toobitUM': { ... }, ... }
    depthData: {},

    // 加载状态
    isLoading: false,

    // WebSocket 服务实例引用
    wsService: null,
  }),

  getters: {
    // 获取深度选项
    depthOptions: () => DEPTH_OPTIONS,

    // 获取当前对比的交易所
    compareExchanges: state => {
      return COMPARE_EXCHANGES[state.config.exchangeType] || COMPARE_EXCHANGES.futures;
    },

    // 获取指定币种和交易所的深度数据
    getDepthData: state => (symbol, exchange) => {
      const key = `${symbol}_${exchange}`;
      return (
        state.depthData[key] || {
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

    // 获取深度对比数据（以币种为维度）
    depthComparisonBySymbol: state => {
      const pctKey = `${state.config.depthPercentage}`;
      const exchanges = COMPARE_EXCHANGES[state.config.exchangeType] || [];
      const [binanceEx, toobitEx] = exchanges;
      const isBuy = state.config.orderSide === 'buy';

      return state.symbols.map(symbol => {
        const binanceKey = `${symbol}_${binanceEx}`;
        const toobitKey = `${symbol}_${toobitEx}`;

        const binanceData = state.depthData[binanceKey];
        const toobitData = state.depthData[toobitKey];

        // 根据买卖方向获取对应的深度
        const binanceDepth = isBuy
          ? (binanceData?.depthStats?.[pctKey]?.bidDepth || 0)
          : (binanceData?.depthStats?.[pctKey]?.askDepth || 0);
        const toobitDepth = isBuy
          ? (toobitData?.depthStats?.[pctKey]?.bidDepth || 0)
          : (toobitData?.depthStats?.[pctKey]?.askDepth || 0);

        // 计算深度分数：谁高谁 +1，相等 0
        let depthScore = 0;
        if (toobitDepth > binanceDepth) {
          depthScore = 1;
        } else if (toobitDepth < binanceDepth) {
          depthScore = -1;
        }

        return {
          symbol,
          displayName: `${symbol.replace('USDT', '')}USDT`,
          binanceDepth,
          toobitDepth,
          depthScore,
        };
      });
    },

    // 获取价差对比数据（以币种为维度）
    spreadComparisonBySymbol: state => {
      const exchanges = COMPARE_EXCHANGES[state.config.exchangeType] || [];
      const [binanceEx, toobitEx] = exchanges;

      return state.symbols.map(symbol => {
        const binanceKey = `${symbol}_${binanceEx}`;
        const toobitKey = `${symbol}_${toobitEx}`;

        const binanceData = state.depthData[binanceKey];
        const toobitData = state.depthData[toobitKey];

        const binanceSpread = binanceData?.spreadPercent || 0;
        const toobitSpread = toobitData?.spreadPercent || 0;

        // 计算价差分数：谁低谁 +1（价差低更好），相等 0
        let spreadScore = 0;
        if (toobitSpread < binanceSpread) {
          spreadScore = 1;
        } else if (toobitSpread > binanceSpread) {
          spreadScore = -1;
        }

        return {
          symbol,
          displayName: `${symbol.replace('USDT', '')}USDT`,
          binanceSpread,
          toobitSpread,
          spreadScore,
        };
      });
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

    // 订阅所有币种和交易所
    subscribeAll() {
      if (!this.wsService) return;

      const exchanges = COMPARE_EXCHANGES[this.config.exchangeType] || [];

      // 为每个币种订阅两个交易所
      for (const symbol of this.symbols) {
        this.wsService.subscribeDepthBatch(exchanges, symbol);
      }
    },

    // 处理深度数据更新
    handleDepthUpdate(data) {
      const { exchange, symbol, bids, asks, bestBid, bestAsk, spread, spreadPercent, depthStats, processedAt } = data;

      // 使用 symbol_exchange 作为 key
      const key = `${symbol}_${exchange}`;

      // 更新 store
      this.depthData[key] = {
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

      // 重新订阅
      if (this.wsService && this.wsService.getStatus() === 'connected') {
        this.subscribeAll();
      }
    },

    // 更新深度百分比
    updateDepthPercentage(percentage) {
      this.config.depthPercentage = percentage;
    },

    // 更新买卖方向
    updateOrderSide(side) {
      this.config.orderSide = side;
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
