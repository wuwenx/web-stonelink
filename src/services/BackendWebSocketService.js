/**
 * 后端 WebSocket 服务
 * 连接 ws://localhost:8000/api/v1/ws
 * 协议：{ event, exchange?, symbol?, topic }
 */

const BACKEND_WS_URL = 'ws://localhost:8000/api/v1/ws';

export class BackendWebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;

    // 订阅集合，key 为 `${exchange}|${topic}` 或 `${exchange}|${symbol}|${topic}`
    this.subscriptions = new Set();

    this.onMessage = null;
    this.onStatusChange = null;
    this.onError = null;
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
      const data = JSON.parse(raw);
      if (this.onMessage) this.onMessage(data);
    } catch (e) {
      // ignore parse error
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
      const parts = key.split('|');
      const [exchange, p2, topic] = parts;
      if (parts.length >= 3) {
        this._send({ event: 'sub', exchange, symbol: p2, topic });
      } else {
        this._send({ event: 'sub', exchange, topic: p2 });
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
