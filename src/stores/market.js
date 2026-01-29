/**
 * 市场 Ticker Store
 * 统一使用 CCXT WebSocket 获取行情（现货/合约），不再使用 24hr 接口
 */
import { defineStore } from 'pinia';
import { getBackendWebSocketService } from '../services/BackendWebSocketService';

// 将 WS 推送的 symbol（如 ARC_SOL_ONCHAINUSDT）转为与 API 一致的格式（ARC-SOL-ONCHAINUSDT）便于按 symbol 合并
function normalizeSymbol(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/_/g, '-');
}

// 将 CCXT tickers 推送的单条 data[key] 转成与 HTTP 24hr 一致的字段结构
function ccxtTickerToRow(symbolKey, item) {
  if (!item || typeof item !== 'object') return null;
  const info = item.info || {};
  const s = (info.s || item.symbol?.replace('/', '') || symbolKey?.replace('/', '') || '').toUpperCase();
  if (!s) return null;
  const close = info.c ?? item.close ?? item.last;
  const open = info.o ?? item.open;
  const high = info.h ?? item.high;
  const low = info.l ?? item.low;
  const baseVol = info.v ?? item.baseVolume;
  const quoteVol = info.qv ?? item.quoteVolume;
  const change = item.change ?? info.change;
  const pct = info.m != null ? Number(info.m) : (item.percentage != null ? item.percentage / 100 : 0);
  return {
    t: item.timestamp ?? info.t ?? Date.now(),
    a: item.bid ?? null,
    b: item.ask ?? null,
    s,
    c: close != null ? String(close) : '',
    o: open != null ? String(open) : '',
    h: high != null ? String(high) : '',
    l: low != null ? String(low) : '',
    v: baseVol != null ? String(baseVol) : '0',
    qv: quoteVol != null ? String(quoteVol) : '0',
    pc: change != null ? String(change) : '0',
    pcp: pct,
    op: info.op ?? '',
  };
}

export const useMarketStore = defineStore('market', {
  state: () => ({
    exchange: 'toobit',
    marketType: 'contract', // 'spot' | 'contract'，由 CCXT WS 推送
    tickers: [], // CCXT 结构：{ t, a, b, s, c, o, h, l, v, qv, pc, pcp, op }
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
    /**
     * 启动行情：连接 CCXT WS 并订阅当前展示列表的 symbols
     * @param {string} exchange
     * @param {string} market_type - 'spot' | 'contract'
     * @param {string[]} symbols - 当前展示页的 symbol 列表，如 ['ETH/USDT','BTC/USDT']
     */
    startTickers(exchange = this.exchange, market_type = this.marketType, symbols = []) {
      this.error = null;
      this.exchange = exchange;
      this.marketType = market_type;
      this.initWs(exchange, symbols);
    },

    /**
     * 更新订阅的 symbol 列表（翻页/改每页条数后调用）
     * @param {string[]} symbols - 当前展示页的 symbol 列表
     */
    updateTickerSymbols(symbols = []) {
      const ws = getBackendWebSocketService();
      const exchange = this.exchange ? `${this.exchange}` : this.exchange;
      const market_type = this.marketType === 'spot' ? 'spot' : 'contract';
      if (!this._wsTickersInitialized) return;
      ws.updateTickerSymbols({ exchange, market_type, symbols });
    },

    initWs(exchange = this.exchange, symbols = []) {
      const ws = getBackendWebSocketService();
      const market_type = this.marketType === 'spot' ? 'spot' : 'contract';
      const symbolList = Array.isArray(symbols) ? symbols : [];
      if (this._wsTickersInitialized && this._wsTickersInitialized !== market_type) {
        ws.unsubscribeTickers({ exchange: this.exchange, market_type: this._wsTickersInitialized });
        this._wsTickersInitialized = null;
      }
      if (ws.getStatus() === 'connected' && this._wsTickersInitialized === market_type) {
        ws.updateTickerSymbols({ exchange: this.exchange, market_type, symbols: symbolList });
        return;
      }
      this._wsTickersInitialized = market_type;

      ws.onMessage = msg => {
        if (msg.event !== 'tickers' || !msg.data || typeof msg.data !== 'object') return;
        const list = [...this.tickers];
        let changed = false;
        for (const [symbolKey, item] of Object.entries(msg.data)) {
          const row = ccxtTickerToRow(symbolKey, item);
          if (!row) continue;
          const key = normalizeSymbol(row.s);
          const idx = list.findIndex(t => normalizeSymbol(t.s) === key || t.s === row.s);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...row };
            changed = true;
          } else {
            list.push(row);
            changed = true;
          }
        }
        if (changed) this.tickers = list;
      };
      ws.onStatusChange = status => {
        this.wsStatus = status;
      };
      ws.connect();
      this.wsStatus = ws.getStatus();
      ws.subscribeTickers({
        exchange: exchange || this.exchange,
        market_type,
        symbols: symbolList,
      });
    },

    stopWs() {
      const ws = getBackendWebSocketService();
      const exchange = this.exchange ? `${this.exchange}` : this.exchange;
      const market_type = this.marketType === 'spot' ? 'spot' : 'contract';
      ws.unsubscribeTickers({ exchange, market_type });
      ws.onMessage = null;
      ws.onStatusChange = null;
      this._wsTickersInitialized = null;
      this.wsStatus = 'disconnected';
    },
  },
});
