/**
 * 统一深度数据 Store
 * 管理来自所有交易所的深度数据
 * 以币种为维度组织数据，支持多币种多交易所对比
 */
import { defineStore } from 'pinia';
import { DEPTH_OPTIONS, SYMBOLS, toStandardSymbol } from '../config/exchanges';
import { getUnifiedWebSocketService } from '../services/UnifiedWebSocketService';

// 默认支持的币种：使用配置中的全部交易对
const DEFAULT_SYMBOLS = [...SYMBOLS];

// 默认对比的交易所（启用 Binance、Toobit、OKX、Bybit）
const COMPARE_EXCHANGES = {
  futures: ['bnUM', 'toobitUM'],
  spot: ['bnSpot', 'toobitSpot'],
};

// 缓存 key
const EXCHANGE_TYPE_CACHE_KEY = 'stonelink_exchange_type';

// 从缓存获取交易类型
const getCachedExchangeType = () => {
  try {
    const cached = localStorage.getItem(EXCHANGE_TYPE_CACHE_KEY);
    if (cached === 'spot' || cached === 'futures') {
      return cached;
    }
  } catch {
    // localStorage 不可用
  }
  return 'futures';
};

export const useDepthStore = defineStore('depth', {
  state: () => ({
    // 连接状态
    connectionStatus: 'disconnected',

    // 当前配置
    config: {
      exchangeType: getCachedExchangeType(), // 从缓存获取，默认 'futures'
      orderSide: 'buy', // 'buy' 买盘 或 'sell' 卖盘
      depthLevels: 250,
      depthPercentage: 0.0001, // 当前选择的深度百分比
    },

    // 全部已选币种（用于分页展示）
    allSymbols: [...DEFAULT_SYMBOLS],

    // 当前页的币种（仅此列表参与深度订阅）
    symbols: DEFAULT_SYMBOLS.slice(0, 10),

    // 分页：当前页（从 1 起）、每页条数
    currentPage: 1,
    pageSize: 10,

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
      // 将 symbol 转换为标准格式，确保能正确匹配
      const standardSymbol = toStandardSymbol(symbol);
      const key = `${standardSymbol}_${exchange}`;
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

    // 获取深度对比数据（以币种为维度，按 store 的 allSymbols 分页展示当前页）
    depthComparisonBySymbol: state => {
      const pctKey = `${state.config.depthPercentage}`;
      const exchanges = COMPARE_EXCHANGES[state.config.exchangeType] || [];
      const isBuy = state.config.orderSide === 'buy';
      const list = state.allSymbols || [];
      const size = state.pageSize || 10;
      const start = (state.currentPage - 1) * size;
      const symbols = list.slice(start, start + size);

      return symbols.map(symbol => {
        // 将 symbol 转换为标准格式，确保能正确匹配存储的 key
        const standardSymbol = toStandardSymbol(symbol);
        const exchangeDepths = {};
        let maxDepth = 0;
        let maxExchange = '';

        // 收集所有交易所的深度数据
        for (const exchangeId of exchanges) {
          const key = `${standardSymbol}_${exchangeId}`;
          const data = state.depthData[key];
          const depth = isBuy
            ? (data?.depthStats?.[pctKey]?.bidDepth || 0)
            : (data?.depthStats?.[pctKey]?.askDepth || 0);

          exchangeDepths[exchangeId] = depth;

          if (depth > maxDepth) {
            maxDepth = depth;
            maxExchange = exchangeId;
          }
        }

        return {
          symbol: standardSymbol, // 返回标准格式的 symbol
          displayName: `${standardSymbol.replace('USDT', '')}USDT`,
          exchanges: exchangeDepths,
          maxDepth,
          maxExchange,
        };
      });
    },

    // 获取价差对比数据（以币种为维度，按 store 的 allSymbols 分页展示当前页）
    spreadComparisonBySymbol: state => {
      const exchanges = COMPARE_EXCHANGES[state.config.exchangeType] || [];
      const list = state.allSymbols || [];
      const size = state.pageSize || 10;
      const start = (state.currentPage - 1) * size;
      const symbols = list.slice(start, start + size);

      return symbols.map(symbol => {
        // 将 symbol 转换为标准格式，确保能正确匹配存储的 key
        const standardSymbol = toStandardSymbol(symbol);
        const exchangeSpreads = {};
        let minSpread = Infinity;
        let minExchange = '';

        // 收集所有交易所的价差数据
        for (const exchangeId of exchanges) {
          const key = `${standardSymbol}_${exchangeId}`;
          const data = state.depthData[key];
          const spread = data?.spreadPercent ?? 0;

          exchangeSpreads[exchangeId] = spread;

          if (spread >= 0 && spread < minSpread) {
            minSpread = spread;
            minExchange = exchangeId;
          }
        }

        // 价差一样时最优展示为 --：统计达到最小价差的交易所数量
        if (minSpread !== Infinity) {
          const countAtMin = exchanges.filter(
            id => (exchangeSpreads[id] ?? 0) === minSpread
          ).length;
          if (countAtMin > 1) minExchange = '';
        }

        return {
          symbol: standardSymbol, // 返回标准格式的 symbol
          displayName: `${standardSymbol.replace('USDT', '')}USDT`,
          exchanges: exchangeSpreads,
          minSpread: minSpread === Infinity ? 0 : minSpread,
          minExchange,
        };
      });
    },

    // 判断是否已连接
    isConnected: state => state.connectionStatus === 'connected',

    // 总页数（供分页器使用）
    totalPages: state =>
      Math.max(1, Math.ceil((state.allSymbols?.length || 0) / (state.pageSize || 10))),

    // 当前页的币对（按 store 的 allSymbols 分页切片，用于表格展示）
    currentPageSymbols: state => {
      const list = state.allSymbols || [];
      const size = state.pageSize || 10;
      const start = (state.currentPage - 1) * size;
      return list.slice(start, start + size);
    },
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

    // 订阅当前页币种（仅订阅 symbols，不订阅全部 allSymbols）
    subscribeAll() {
      if (!this.wsService) return;

      const exchanges = COMPARE_EXCHANGES[this.config.exchangeType] || [];

      for (const symbol of this.symbols) {
        this.wsService.subscribeDepthBatch(exchanges, symbol);
      }
    },

    // 处理深度数据更新
    handleDepthUpdate(data) {
      const { exchange, symbol, bids, asks, bestBid, bestAsk, spread, spreadPercent, depthStats, processedAt } = data;

      // 将 symbol 转换为标准格式（统一使用标准格式存储，如 BTCUSDT）
      // Worker 返回的 symbol 已经是标准格式，但为了保险起见，再次转换
      const standardSymbol = toStandardSymbol(symbol);

      // 使用 standardSymbol_exchange 作为 key，确保格式统一
      const key = `${standardSymbol}_${exchange}`;

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

      // 保存到缓存
      try {
        localStorage.setItem(EXCHANGE_TYPE_CACHE_KEY, type);
      } catch {
        // localStorage 不可用
      }

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

    // 更新当前页交易对并同步订阅（切换页时：取消当前页订阅，订阅新页）
    updateSymbols(newSymbols) {
      if (!Array.isArray(newSymbols)) {
        return;
      }

      const symbolListStr = JSON.stringify([...this.symbols].sort());
      const newSymbolListStr = JSON.stringify([...newSymbols].sort());
      if (symbolListStr === newSymbolListStr) {
        return;
      }

      const oldSymbols = [...this.symbols];
      this.symbols = newSymbols.length ? newSymbols : [];

      if (!this.wsService || this.wsService.getStatus() !== 'connected') {
        return;
      }

      const exchanges = COMPARE_EXCHANGES[this.config.exchangeType] || [];
      const toUnsubscribe = oldSymbols.filter(s => !newSymbols.includes(s));
      const toSubscribe = newSymbols.filter(s => !oldSymbols.includes(s));

      for (const symbol of toUnsubscribe) {
        for (const exchange of exchanges) {
          this.wsService.unsubscribeDepth(exchange, symbol);
        }
      }
      for (const symbol of toSubscribe) {
        this.wsService.subscribeDepthBatch(exchanges, symbol);
      }
    },

    /**
     * 用完整币对列表初始化 allSymbols（如从 symbolStore 拉取的 500+），只订阅第一页
     */
    setAllSymbols(symbols) {
      if (!Array.isArray(symbols) || symbols.length === 0) return;
      this.allSymbols = symbols;
      this.currentPage = 1;
      const pageSymbols = symbols.slice(0, this.pageSize);
      this.updateSymbols(pageSymbols);
    },

    /**
     * 切换当前页：取消当前页深度订阅，只订阅新页的币对
     */
    setCurrentPage(page) {
      const pageNum = Math.max(1, Math.min(page, this.totalPages));
      if (this.currentPage === pageNum) return;

      const newSymbols = this.allSymbols.slice(
        (pageNum - 1) * this.pageSize,
        pageNum * this.pageSize
      );
      this.updateSymbols(newSymbols);
      this.currentPage = pageNum;
    },

    /**
     * 添加币对到全部列表；若落在当前页则加入订阅
     */
    subscribeSymbol(symbol) {
      if (!symbol) return;
      if (this.allSymbols.includes(symbol)) return;

      this.allSymbols = [...this.allSymbols, symbol];
      const start = (this.currentPage - 1) * this.pageSize;
      const newPageSymbols = this.allSymbols.slice(start, start + this.pageSize);
      this.updateSymbols(newPageSymbols);
    },
  },
});
