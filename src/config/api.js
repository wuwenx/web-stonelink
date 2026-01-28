/**
 * API / WebSocket 基地址配置
 *
 * 开发：.env.development → VUE_APP_API_BASE_URL=http://localhost:8000/api/v1
 *
 * 线上（生产）：
 *   - HTTP API：http://10.246.2.52/api/v1
 *   - WebSocket：ws://10.246.2.52/api/v1/ws
 *   .env.production → VUE_APP_API_BASE_URL=http://10.246.2.52/api/v1
 */
const base = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

/** HTTP API 基地址，用于 symbolApi、tickerApi 等 */
export const API_BASE_URL = base.replace(/\/$/, '');

/** 后端 WebSocket 地址：由 HTTP 基地址推导，路径固定为 /ws */
export const BACKEND_WS_URL = (() => {
  try {
    const u = new URL(base);
    const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${u.host}/api/v1/ws`;
  } catch {
    return 'ws://localhost:8000/api/v1/ws';
  }
})();
