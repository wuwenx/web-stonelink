/**
 * K 线 WebSocket 服务
 * 订阅实时 K 线增量数据，协议：sub/cancel + kline 事件
 */
import { KLINE_WS_URL } from '@/config/api';

export class KlineWebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;

    this.subscription = null; // { exchange, symbol, interval }
    this.onKline = null;
    this.onStatusChange = null;
    this.onError = null;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this._setStatus('connecting');
    try {
      this.ws = new WebSocket(KLINE_WS_URL);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._setStatus('connected');
        this._resubscribe();
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
      if (data.event === 'kline' && data.data && this.onKline) {
        this.onKline(data);
      }
    } catch (e) {
      // ignore parse error
    }
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  /**
   * 订阅 K 线
   * @param {Object} params - { exchange, symbol, interval }
   * symbol 使用 CCXT 格式：现货 BTC/USDT，合约 BTC/USDT:USDT
   */
  subscribe(params) {
    const { exchange, symbol, interval } = params;
    if (!exchange || !symbol || !interval) return;

    this._cancelCurrent();
    this.subscription = { exchange, symbol, interval };
    this._send({ event: 'sub', exchange, symbol, interval });
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.connect();
    }
  }

  _cancelCurrent() {
    if (this.subscription) {
      const { exchange, symbol, interval } = this.subscription;
      this._send({ event: 'cancel', exchange, symbol, interval });
      this.subscription = null;
    }
  }

  _resubscribe() {
    if (this.subscription && this.ws?.readyState === WebSocket.OPEN) {
      const { exchange, symbol, interval } = this.subscription;
      this._send({ event: 'sub', exchange, symbol, interval });
    }
  }

  unsubscribe() {
    this._cancelCurrent();
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (!this.subscription) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._cancelCurrent();
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

let klineWsInstance = null;

export function getKlineWebSocketService() {
  if (!klineWsInstance) {
    klineWsInstance = new KlineWebSocketService();
  }
  return klineWsInstance;
}
