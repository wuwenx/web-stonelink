/**
 * 市场 24hr Ticker Store
 * 拉取 24hr 行情，并通过后端 WS wholeRealTime 实时更新
 */
import { defineStore } from 'pinia';
import { getBackendWebSocketService } from '../services/BackendWebSocketService';
import { getTicker24hr } from '../services/tickerApi';

// 将 WS 推送的 symbol（如 ARC_SOL_ONCHAINUSDT）转为与 API 一致的格式（ARC-SOL-ONCHAINUSDT）便于按 symbol 合并
function normalizeSymbol(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/_/g, '-');
}

// 将 WS 推送的 wholeRealTime 单条数据转成与 HTTP 24hr 一致的字段结构
function wsRowToTicker(msg) {
  const d = msg.data || {};
  const s = normalizeSymbol(d.s);
  return {
    t: msg.sendTime ?? d.E ?? Date.now(),
    a: d.a ?? null,
    b: d.b ?? null,
    s: s || d.s,
    c: d.c ?? '',
    o: d.o ?? '',
    h: d.h ?? '',
    l: d.l ?? '',
    v: d.v ?? '0',
    qv: d.qv ?? '0',
    pc: d.p ?? '0',
    pcp: d.P ?? '0',
    op: d.op ?? '',
  };
}

export const useMarketStore = defineStore('market', {
  state: () => ({
    exchange: 'toobit',
    marketType: 'contract', // 'spot' | 'contract'，现货不启用 WS
    tickers: [], // 与 API 24hr 结构一致：{ t, a, b, s, c, o, h, l, v, qv, pc, pcp, op }
    allowedSymbols: null, // 接口返回的币对白名单 Set，WS 仅更新白名单内的币对
    loading: false,
    error: null,
    wsStatus: 'disconnected',
  }),

  getters: {
    tickerList: state => state.tickers,
    tickerBySymbol: state => symbol => {
      const key = normalizeSymbol(symbol);
      return state.tickers.find(
        t => normalizeSymbol(t.s) === key || t.s === symbol
      ) || null;
    },
  },

  actions: {
    async fetchTicker24hr(exchange = this.exchange, type = this.marketType) {
      this.loading = true;
      this.error = null;
      if (type === 'spot') {
        this.stopWs();
      }
      try {
        const data = await getTicker24hr({ exchange, type });
        this.exchange = exchange;
        this.marketType = type;
        this.tickers = Array.isArray(data) ? data : [];
        // 以接口返回的币对为主，建立白名单
        this.allowedSymbols = new Set(
          (this.tickers || []).map(t => normalizeSymbol(t.s)).filter(Boolean)
        );
        if (type === 'contract') {
          this.initWs(exchange);
        }
        return this.tickers;
      } catch (e) {
        this.error = e.message || '获取24hr行情失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    initWs(exchange = this.exchange) {
      // 现货暂不启用 WS 实时更新
      if (this.marketType === 'spot') return;
      const ws = getBackendWebSocketService();
      if (ws.getStatus() === 'connected' && this._wsInitialized) return;
      this._wsInitialized = true;

      ws.onMessage = msg => {
        // Worker 已转换时直接带 row；否则用 event/topic+data 在主线程转换
        let row = msg.row;
        if (!row) {
          const isWholeRealTime =
            (msg.topic === 'wholeRealTime' || msg.event === 'wholeRealTime') &&
            msg.data;
          if (isWholeRealTime) row = wsRowToTicker(msg);
        }
        if (row) {
          const key = normalizeSymbol(row.s);
          // 以接口请求的币对为主：仅更新白名单内的币对，不展示 WS 推送但接口未返回的币对
          if (!this.allowedSymbols || !this.allowedSymbols.has(key)) return;
          const list = [...this.tickers];
          const idx = list.findIndex(
            t => normalizeSymbol(t.s) === key || t.s === row.s
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...row };
            this.tickers = list;
          }
        }
      };
      ws.onStatusChange = status => {
        this.wsStatus = status;
      };
      ws.connect();
      // 同步当前连接状态（WS 可能已在别处连接，需立即反映到 UI）
      this.wsStatus = ws.getStatus();
      // 后端协议要求 exchange 格式为 "toobit"（交易所名）
      const wsExchange = exchange ? `${exchange}` : exchange;
      ws.subscribe({ exchange: wsExchange, topic: 'wholeRealTime' });
    },

    stopWs() {
      const ws = getBackendWebSocketService();
      const wsExchange = this.exchange ? `${this.exchange}` : this.exchange;
      ws.unsubscribe({ exchange: wsExchange, topic: 'wholeRealTime' });
      ws.onMessage = null;
      ws.onStatusChange = null;
      this._wsInitialized = false;
      this.wsStatus = 'disconnected';
    },
  },
});
