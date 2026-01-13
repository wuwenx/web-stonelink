/**
 * 统一 WebSocket 服务
 * 连接内部聚合 WS 服务，管理所有交易所的深度数据订阅
 * 使用 Web Worker 在独立线程中处理数据
 */

import { getDepthTopic, parseTopic, UNIFIED_WS_URL } from '../config/exchanges';

export class UnifiedWebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 30000;
    this.reconnectTimer = null;

    // 订阅管理
    this.subscriptions = new Set();

    // Web Worker
    this.worker = null;
    this.workerReady = false;

    // 回调函数
    this.onDepthUpdate = null;
    this.onStatusChange = null;
    this.onError = null;

    // 初始化 Worker
    this.initWorker();
  }

  /**
   * 初始化 Web Worker
   */
  initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/unifiedDepthWorker.js', import.meta.url));

      this.worker.onmessage = event => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = error => {
        console.error('Worker 错误:', error);
        if (this.onError) {
          this.onError({ type: 'worker_error', error });
        }
      };
    } catch (error) {
      console.error('初始化 Worker 失败:', error);
      this.worker = null;
    }
  }

  /**
   * 处理 Worker 返回的消息
   */
  handleWorkerMessage(message) {
    const { type, data } = message;

    switch (type) {
    case 'ready':
      this.workerReady = true;
      console.log('深度处理 Worker 已就绪');
      break;

    case 'depthUpdate':
      // 将处理后的深度数据传递给回调
      if (this.onDepthUpdate) {
        this.onDepthUpdate(data);
      }
      break;

    case 'error':
      console.error('Worker 处理错误:', data);
      if (this.onError) {
        this.onError({ type: 'process_error', ...data });
      }
      break;

    case 'configUpdated':
      console.log('Worker 配置已更新:', data);
      break;

    default:
      break;
    }
  }

  /**
   * 发送消息到 Worker
   */
  sendToWorker(type, data) {
    if (this.worker && this.workerReady) {
      this.worker.postMessage({ type, data });
    } else if (this.worker) {
      // Worker 还未就绪，延迟发送
      setTimeout(() => this.sendToWorker(type, data), 100);
    }
  }

  /**
   * 更新 Worker 配置
   */
  updateWorkerConfig(config) {
    this.sendToWorker('updateConfig', config);
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接');
      return;
    }

    // 清除之前的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.updateStatus('connecting');

    try {
      this.ws = new WebSocket(UNIFIED_WS_URL);

      this.ws.onopen = () => {
        console.log('统一 WS 服务已连接:', UNIFIED_WS_URL);
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.startHeartbeat();

        // 重新订阅之前的订阅
        this.resubscribeAll();
      };

      this.ws.onmessage = event => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = event => {
        console.log('WebSocket 连接关闭:', event.code, event.reason);
        this.updateStatus('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = error => {
        console.error('WebSocket 错误:', error);
        this.updateStatus('error');
        if (this.onError) {
          this.onError({ type: 'websocket_error', error });
        }
      };
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      this.updateStatus('error');
    }
  }

  /**
   * 处理收到的 WebSocket 消息
   * 支持处理多条 JSON 粘连的情况
   */
  handleMessage(rawData) {
    // 尝试分割多条 JSON 消息（处理 {...}{...} 的情况）
    const jsonStrings = this.splitJsonMessages(rawData);

    for (const jsonStr of jsonStrings) {
      try {
        const data = JSON.parse(jsonStr);
        this.processMessage(data);
      } catch (error) {
        console.error('解析消息失败:', error.message);
      }
    }
  }

  /**
   * 分割可能粘连的 JSON 消息
   * @param {string} rawData - 原始数据
   * @returns {string[]} JSON 字符串数组
   */
  splitJsonMessages(rawData) {
    const messages = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < rawData.length; i++) {
      const char = rawData[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\' && inString) {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === '{') {
        if (depth === 0) {
          start = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          messages.push(rawData.substring(start, i + 1));
        }
      }
    }

    // 如果没有找到完整的 JSON，返回原始数据
    if (messages.length === 0 && rawData.trim()) {
      messages.push(rawData);
    }

    return messages;
  }

  /**
   * 处理单条解析后的消息
   */
  processMessage(data) {
    // 处理深度数据
    if (data.topic && data.topic.startsWith('depth_') && data.payload) {
      const parsed = parseTopic(data.topic);
      if (parsed && data.payload.data) {
        // 将原始数据发送到 Worker 处理
        // 使用 standardSymbol 作为统一的 symbol 格式（如 BTCUSDT）
        const depthData = {
          exchange: data.payload.info?.exchange || parsed.exchange,
          symbol: parsed.standardSymbol, // 使用标准格式的币对
          rawSymbol: parsed.symbol, // 保留原始格式
          bids: data.payload.data.bids || [],
          asks: data.payload.data.asks || [],
          tsExch: data.payload.data.tsExch,
          tsRecv: data.payload.data.tsRecv,
        };

        this.sendToWorker('processDepth', depthData);
      }
    }

    // 处理 ping/pong
    if (data.op === 'ping') {
      this.send({ op: 'pong' });
    }

    // 处理订阅确认
    if (data.op === 'subscribe' && data.code === 0) {
      console.log('订阅成功:', data.args);
    }
  }

  /**
   * 订阅深度数据
   * @param {string} exchange - 交易所 ID
   * @param {string} symbol - 交易对
   */
  subscribeDepth(exchange, symbol) {
    const topic = getDepthTopic(exchange, symbol);

    if (this.subscriptions.has(topic)) {
      console.log(`已订阅: ${topic}`);
      return;
    }

    this.subscriptions.add(topic);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        op: 'subscribe',
        args: [topic],
      });
      console.log(`订阅: ${topic}`);
    }
  }

  /**
   * 批量订阅深度数据
   * @param {Array} exchanges - 交易所列表
   * @param {string} symbol - 交易对
   */
  subscribeDepthBatch(exchanges, symbol) {
    const topics = exchanges.map(ex => getDepthTopic(ex, symbol));
    const newTopics = topics.filter(t => !this.subscriptions.has(t));

    if (newTopics.length === 0) {
      console.log('所有 topic 已订阅');
      return;
    }

    newTopics.forEach(topic => this.subscriptions.add(topic));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        op: 'subscribe',
        args: newTopics,
      });
      console.log(`批量订阅: ${newTopics.join(', ')}`);
    }
  }

  /**
   * 取消订阅
   */
  unsubscribeDepth(exchange, symbol) {
    const topic = getDepthTopic(exchange, symbol);

    if (!this.subscriptions.has(topic)) {
      return;
    }

    this.subscriptions.delete(topic);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        op: 'unsubscribe',
        args: [topic],
      });
      console.log(`取消订阅: ${topic}`);
    }

    // 清除 Worker 中对应的缓存
    this.sendToWorker('clearCache', { exchange, symbol });
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    if (this.subscriptions.size === 0) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        op: 'unsubscribe',
        args: Array.from(this.subscriptions),
      });
    }

    console.log(`取消所有订阅: ${Array.from(this.subscriptions).join(', ')}`);
    this.subscriptions.clear();

    // 清除 Worker 中的所有缓存
    this.sendToWorker('clearCache', {});
  }

  /**
   * 重新订阅所有
   */
  resubscribeAll() {
    if (this.subscriptions.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        op: 'subscribe',
        args: Array.from(this.subscriptions),
      });
      console.log(`重新订阅: ${Array.from(this.subscriptions).join(', ')}`);
    }
  }

  /**
   * 发送消息
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  /**
   * 更新状态
   */
  updateStatus(status) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ op: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts; // 递增延迟
      console.log(`${delay / 1000}秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      console.error('达到最大重连次数');
      this.updateStatus('failed');
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 停止心跳
    this.stopHeartbeat();

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 清除订阅
    this.subscriptions.clear();

    // 清除 Worker 缓存
    this.sendToWorker('clearCache', {});

    // 关闭 WebSocket
    if (this.ws) {
      this.ws.onclose = null; // 防止触发重连
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.disconnect();

    // 终止 Worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取当前订阅列表
   */
  getSubscriptions() {
    return Array.from(this.subscriptions);
  }
}

// 单例实例
let instance = null;

/**
 * 获取统一 WebSocket 服务单例
 */
export function getUnifiedWebSocketService() {
  if (!instance) {
    instance = new UnifiedWebSocketService();
  }
  return instance;
}

/**
 * 重置单例（用于测试或重新初始化）
 */
export function resetUnifiedWebSocketService() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
