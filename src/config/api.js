/**
 * API / WebSocket 基地址配置
 *
 * 开发：.env.development
 *   - VUE_APP_API_BASE_URL=http://localhost:8000/api/v1
 *   - VUE_APP_WS_URL=ws://localhost:8000/ws
 *
 * 生产：.env.production
 *   - VUE_APP_API_BASE_URL=https://hub.stonelink.io/web-stonelink/api/v1
 *   - VUE_APP_WS_URL=wss://hub.stonelink.io/web-stonelink/ws
 */
const base = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

/** HTTP API 基地址，用于 symbolApi、tickerApi 等 */
export const API_BASE_URL = base.replace(/\/$/, '');

/** 后端 WebSocket 地址：优先使用 VUE_APP_WS_URL，否则由 API 基地址推导 */
export const BACKEND_WS_URL = (() => {
  const envWs = process.env.VUE_APP_WS_URL;
  if (envWs && (envWs.startsWith('ws://') || envWs.startsWith('wss://'))) {
    return envWs.replace(/\/$/, '');
  }
  try {
    const u = new URL(base);
    const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${u.host}/api/v1/ws`;
  } catch {
    return 'ws://localhost:8000/ws';
  }
})();

/** K 线 WebSocket 地址：ws/klines */
export const KLINE_WS_URL = `${BACKEND_WS_URL.replace(/\/$/, '')}/klines`;
