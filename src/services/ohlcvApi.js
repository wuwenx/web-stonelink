/**
 * K 线 (OHLCV) API
 * 使用后端 CCXT fetch_ohlcv 获取 K 线数据
 */
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

/**
 * 获取 K 线数据
 * @param {Object} params - 查询参数
 * @param {string} [params.exchange] - 交易所: toobit | binance | binance_usdm，默认 toobit
 * @param {string} params.symbol - CCXT 格式: 现货 BTC/USDT, 合约 BTC/USDT:USDT
 * @param {string} [params.interval] - 周期: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M，默认 1h
 * @param {number} [params.limit] - 条数 1-1000，默认 300
 * @param {number} [params.since] - 起始时间戳(毫秒)
 * @returns {Promise<Array<{ timestamp, open, high, low, close, volume }>>}
 */
export function getKlines(params = {}) {
  const {
    exchange = 'toobit',
    symbol,
    interval = '1h',
    limit = 300,
    since,
  } = params;

  if (!symbol) {
    return Promise.reject(new Error('symbol 为必填参数'));
  }

  const url = `${API_BASE_URL}/klines`;
  const requestParams = { exchange, symbol, interval, limit };
  if (since != null) {
    requestParams.since = since;
  }

  return axios({
    url,
    method: 'get',
    params: requestParams,
    timeout: 15000,
  })
    .then(response => {
      const res = response.data;
      if (res.code !== 200) {
        throw new Error(res.message || '获取 K 线失败');
      }
      return res.data || [];
    })
    .catch(error => {
      if (error.response) {
        throw new Error(error.response.data?.message || '获取 K 线失败');
      }
      if (error.request) {
        throw new Error('网络错误，请检查后端服务是否启动');
      }
      throw error;
    });
}

/**
 * 将合约格式转为标准格式
 * BTC-SWAP-USDT -> BTCUSDT
 */
function toStandardSymbol(symbol) {
  if (!symbol) return symbol;
  const swapMatch = symbol.match(/^([A-Z0-9-]+)-SWAP-([A-Z]+)$/i);
  if (swapMatch) {
    return `${swapMatch[1]}${swapMatch[2]}`;
  }
  return symbol;
}

/**
 * 将标准币对格式转为 CCXT 现货格式
 * BTCUSDT、BTC-SWAP-USDT -> BTC/USDT
 */
export function toCcxtSpotSymbol(symbol) {
  if (!symbol) return symbol;
  if (symbol.includes('/')) return symbol;
  const standard = toStandardSymbol(symbol);
  const match = standard.match(/^([A-Z0-9]+)(USDT|USDC|BUSD)$/i);
  if (match) {
    return `${match[1]}/${match[2].toUpperCase()}`;
  }
  return symbol;
}

/**
 * 将标准币对格式转为 CCXT 合约格式
 * BTCUSDT、BTC-SWAP-USDT -> BTC/USDT:USDT
 */
export function toCcxtFuturesSymbol(symbol) {
  if (!symbol) return symbol;
  if (symbol.includes(':')) return symbol;
  const spot = toCcxtSpotSymbol(symbol);
  if (spot.includes('/')) {
    const quote = spot.split('/')[1];
    return `${spot}:${quote}`;
  }
  return symbol;
}
