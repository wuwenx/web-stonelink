/**
 * 交易对数据 Store
 * 管理交易对列表和相关数据
 */
import { defineStore } from 'pinia';
import { getSymbols } from '../services/symbolApi';

export const useSymbolStore = defineStore('symbol', {
  state: () => ({
    // 交易对列表，按交易所和类型分组
    // 格式: { 'toobit_contract': [...], 'toobit_spot': [...], ... }
    symbolsByExchangeAndType: {},

    // 当前选中的交易所
    currentExchange: 'toobit',

    // 当前选中的交易类型
    currentType: 'contract', // 'spot' 或 'contract'

    // 加载状态
    loading: false,

    // 错误信息
    error: null,
  }),

  getters: {
    /**
     * 获取当前交易所和类型的交易对列表
     */
    currentSymbols: state => {
      const key = `${state.currentExchange}_${state.currentType}`;
      return state.symbolsByExchangeAndType[key] || [];
    },

    /**
     * 获取当前交易对的 symbol 字符串数组（用于下拉选择）
     */
    symbolList: state => {
      const key = `${state.currentExchange}_${state.currentType}`;
      const symbols = state.symbolsByExchangeAndType[key] || [];
      return symbols.map(s => s.symbol);
    },

    /**
     * 根据 symbol 获取交易对详情
     */
    getSymbolInfo: state => symbol => {
      const key = `${state.currentExchange}_${state.currentType}`;
      const symbols = state.symbolsByExchangeAndType[key] || [];
      return symbols.find(s => s.symbol === symbol) || null;
    },

    /**
     * 获取指定交易所和类型的交易对列表
     */
    getSymbolsByExchangeAndType: state => (exchange, type) => {
      const key = `${exchange}_${type}`;
      return state.symbolsByExchangeAndType[key] || [];
    },
  },

  actions: {
    /**
     * 获取交易对列表
     * @param {Object} params - 查询参数
     * @param {string} params.exchange - 交易所名称
     * @param {string} params.type - 交易类型 'spot' 或 'contract'
     * @param {boolean} params.forceRefresh - 是否强制刷新
     */
    async fetchSymbols(params = {}) {
      const {
        exchange = this.currentExchange,
        type = this.currentType,
        forceRefresh = false,
      } = params;

      const key = `${exchange}_${type}`;

      // 如果已有缓存且不强制刷新，直接返回
      if (!forceRefresh && this.symbolsByExchangeAndType[key]?.length > 0) {
        return this.symbolsByExchangeAndType[key];
      }

      this.loading = true;
      this.error = null;

      try {
        const symbols = await getSymbols({ exchange, type });
        
        // 只保存状态为 TRADING 的交易对
        const tradingSymbols = symbols.filter(s => s.status === 'TRADING');
        
        this.symbolsByExchangeAndType[key] = tradingSymbols;
        
        return tradingSymbols;
      } catch (error) {
        this.error = error.message || '获取交易对列表失败';
        console.error('[SymbolStore] 获取交易对列表失败:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 设置当前交易所
     * @param {string} exchange - 交易所名称
     */
    setCurrentExchange(exchange) {
      this.currentExchange = exchange;
    },

    /**
     * 设置当前交易类型
     * @param {string} type - 交易类型 'spot' 或 'contract'
     */
    setCurrentType(type) {
      this.currentType = type;
    },

    /**
     * 初始化：获取当前交易所和类型的交易对
     */
    async init() {
      await this.fetchSymbols({
        exchange: this.currentExchange,
        type: this.currentType,
      });
    },
  },
});
