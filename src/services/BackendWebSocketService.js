/**
 * 后端 WebSocket 服务
 * 地址由 config/api 的 BACKEND_WS_URL 决定（开发 ws://localhost:8000/api/v1/ws，生产 ws://10.246.2.52/api/v1/ws）
 * 协议：{ event, exchange?, symbol?, topic }
 */
import { BACKEND_WS_URL } from '@/config/api';

export class BackendWebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;

    // 订阅集合，key 为 `${exchange}|${topic}` 或 `${exchange}|${symbol}|${topic}` 或 `tickers|${exchange}|${market_type}`
    this.subscriptions = new Set();
    // CCXT tickers 订阅时传入的 symbols 列表，用于重连时重发
    this.tickerSubSymbols = new Map();

    this.onMessage = null;
    this.onStatusChange = null;
    this.onError = null;

    // Web Worker：在独立线程处理 wholeRealTime 解析与转换
    this.worker = null;
    this.workerReady = false;
    this._initWorker();
  }

  _initWorker() {
    try {
      this.worker = new Worker(
        new URL('../workers/marketTickerWorker.js', import.meta.url)
      );
      this.worker.onmessage = e => this._onWorkerMessage(e.data);
      this.worker.onerror = err => {
        if (this.onError) this.onError({ type: 'worker_error', error: err });
      };
    } catch (err) {
      this.worker = null;
    }
  }

  _onWorkerMessage(data) {
    if (data.type === 'ready') {
      this.workerReady = true;
      return;
    }
    if (data.event === 'wholeRealTime' && data.row && this.onMessage) {
      this.onMessage({ event: 'wholeRealTime', row: data.row });
    }
  }

  _sendToWorker(type, data) {
    if (this.worker && this.workerReady) {
      this.worker.postMessage({ type, ...data });
    } else if (this.worker) {
      setTimeout(() => this._sendToWorker(type, data), 50);
    }
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this._setStatus('connecting');
    try {
      this.ws = new WebSocket(BACKEND_WS_URL);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._setStatus('connected');
        this._resubscribeAll();
      };
      this.ws.onmessage = event => this._handleMessage(event.data);
      this.ws.onclose = () => {
        this._setStatus('disconnected');
        this._scheduleReconnect();
      };
      this.ws.onerror = err => {
        if (this.onError) this.onError(err);
      };
    } catch (err) {
      this._setStatus('error');
      if (this.onError) this.onError(err);
    }
  }

  _setStatus(status) {
    this.status = status;
    if (this.onStatusChange) this.onStatusChange(status);
  }

  _handleMessage(raw) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // CCXT tickers 事件在主线程直接回调，不走 Worker
      if (data.event === 'tickers') {
        if (this.onMessage) this.onMessage(data);
        return;
      }
    } catch (e) {
      // ignore parse error
    }
    if (this.worker && this.workerReady) {
      this._sendToWorker('message', { raw });
    } else {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (this.onMessage) this.onMessage(data);
      } catch (e) {
        // ignore
      }
    }
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  _subKey(payload) {
    const { exchange, symbol, topic } = payload;
    if (symbol) return `${exchange}|${symbol}|${topic}`;
    return `${exchange}|${topic}`;
  }

  _tickersSubKey(exchange, market_type) {
    return `tickers|${exchange}|${market_type}`;
  }

  /**
   * 订阅
   * @param {Object} payload - { exchange, topic, symbol? }
   */
  subscribe(payload) {
    const { exchange, topic, symbol } = payload;
    const key = this._subKey({ exchange, symbol, topic });
    if (this.subscriptions.has(key)) return;
    this.subscriptions.add(key);

    const msg = symbol
      ? { event: 'sub', exchange, symbol, topic }
      : { event: 'sub', exchange, topic };
    this._send(msg);
  }

  /**
   * 订阅 CCXT Tickers（现货/合约），仅订阅传入的 symbols 列表
   * @param {Object} payload - { exchange, market_type, symbols }
   * symbols: 当前展示列表的 symbol 数组，如 ['ETH/USDT','BTC/USDT']，空数组 [] 表示不订阅任何
   */
  subscribeTickers(payload) {
    const { exchange, market_type = 'contract', symbols = [] } = payload;
    const key = this._tickersSubKey(exchange, market_type);
    const symbolList = Array.isArray(symbols) ? symbols : [];
    this.subscriptions.add(key);
    this.tickerSubSymbols.set(key, symbolList);

    const msg = {
      event: 'sub',
      exchange,
      market_type,
      symbols: symbolList,
    };
    this._send(msg);
  }

  /**
   * 更新 CCXT Tickers 订阅的 symbol 列表（先取消再按新列表订阅）
   */
  updateTickerSymbols(payload) {
    const { exchange, market_type = 'contract', symbols = [] } = payload;
    const key = this._tickersSubKey(exchange, market_type);
    const symbolList = Array.isArray(symbols) ? symbols : [];
    const prevSymbols = this.tickerSubSymbols.get(key) || [];
    this.tickerSubSymbols.set(key, symbolList);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._send({ event: 'cancel', exchange, market_type, symbols: prevSymbols });
      this._send({ event: 'sub', exchange, market_type, symbols: symbolList });
    }
  }

  /**
   * 取消订阅 CCXT Tickers
   */
  unsubscribeTickers(payload) {
    const { exchange, market_type = 'contract' } = payload;
    const key = this._tickersSubKey(exchange, market_type);
    if (!this.subscriptions.has(key)) return;
    this.subscriptions.delete(key);
    const prevSymbols = this.tickerSubSymbols.get(key) || [];
    this.tickerSubSymbols.delete(key);

    this._send({
      event: 'cancel',
      exchange,
      market_type,
      symbols: prevSymbols,
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(payload) {
    const { exchange, topic, symbol } = payload;
    const key = this._subKey({ exchange, symbol, topic });
    if (!this.subscriptions.has(key)) return;
    this.subscriptions.delete(key);

    const msg = symbol
      ? { event: 'cancel', exchange, symbol, topic }
      : { event: 'cancel', exchange, topic };
    this._send(msg);
  }

  _resubscribeAll() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.subscriptions.forEach(key => {
      if (key.startsWith('tickers|')) {
        const [, exchange, market_type] = key.split('|');
        const symbols = this.tickerSubSymbols.get(key) || [];
        this._send({
          event: 'sub',
          exchange,
          market_type: market_type || 'contract',
          symbols,
        });
      } else {
        const parts = key.split('|');
        const [exchange, p2, topic] = parts;
        if (parts.length >= 3) {
          this._send({ event: 'sub', exchange, symbol: p2, topic });
        } else {
          this._send({ event: 'sub', exchange, topic: p2 });
        }
      }
    });
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscriptions.clear();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._setStatus('disconnected');
  }

  getStatus() {
    return this.status;
  }
}

let backendWsInstance = null;

export function getBackendWebSocketService() {
  if (!backendWsInstance) {
    backendWsInstance = new BackendWebSocketService();
  }
  return backendWsInstance;
}
