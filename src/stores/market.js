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
    tickers: [], // 与 API 24hr 结构一致：{ t, a, b, s, c, o, h, l, v, qv, pc, pcp, op }
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
    async fetchTicker24hr(exchange = this.exchange) {
      this.loading = true;
      this.error = null;
      try {
        const data = await getTicker24hr({ exchange });
        this.exchange = exchange;
        this.tickers = Array.isArray(data) ? data : [];
        return this.tickers;
      } catch (e) {
        this.error = e.message || '获取24hr行情失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    initWs(exchange = this.exchange) {
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
          const list = [...this.tickers];
          const idx = list.findIndex(
            t => normalizeSymbol(t.s) === key || t.s === row.s
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...row };
          } else {
            list.push(row);
          }
          this.tickers = list;
        }
      };
      ws.onStatusChange = status => {
        this.wsStatus = status;
      };
      ws.connect();
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
