/**
 * 交易所配置
 * 统一管理所有支持的交易所和 WebSocket 配置
 */

// 统一 WS 服务地址
export const UNIFIED_WS_URL = 'wss://mm-admin-new.test1.wcsbapp.com/ws/websocket';

// 交易所配置
export const EXCHANGES = {
  spot: [
    { id: 'toobitSpot', name: 'Toobit', color: '#00D4AA' },
    { id: 'bnSpot', name: 'Binance', color: '#F0B90B' },
    { id: 'okexSpot', name: 'OKX', color: '#000000' },
    { id: 'gateSpot', name: 'Gate.io', color: '#17E6A1' },
    { id: 'mexcSpot', name: 'MEXC', color: '#2CA6E0' },
    { id: 'bitgetSpot', name: 'Bitget', color: '#00F0FF' },
    { id: 'bybitSpot', name: 'Bybit', color: '#F7A600' },
  ],
  futures: [
    { id: 'toobitUM', name: 'Toobit', color: '#00D4AA' },
    { id: 'bnUM', name: 'Binance', color: '#F0B90B' },
    { id: 'okexUM', name: 'OKX', color: '#000000' },
    { id: 'gateUM', name: 'Gate.io', color: '#17E6A1' },
    { id: 'mexcUM', name: 'MEXC', color: '#2CA6E0' },
    { id: 'bitgetUM', name: 'Bitget', color: '#00F0FF' },
    { id: 'bybitUM', name: 'Bybit', color: '#F7A600' },
  ],
};

// 支持的交易对
export const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT'];

// 深度选项配置
export const DEPTH_OPTIONS = [
  { label: '万1(0.01%)', value: 0.0001 },
  { label: '万5(0.05%)', value: 0.0005 },
  { label: '微观(0.1%)', value: 0.001 },
  { label: '紧密(0.5%)', value: 0.005 },
  { label: '核心(1%)', value: 0.01 },
  { label: '巨额(2%)', value: 0.02 },
  { label: '大额(5%)', value: 0.05 },
  { label: '极限(10%)', value: 0.1 },
];

/**
 * 判断交易所是否为合约类型
 * @param {string} exchangeId - 交易所 ID
 * @returns {boolean}
 */
export function isFuturesExchange(exchangeId) {
  return exchangeId.endsWith('UM');
}

/**
 * 判断交易所是否为现货类型
 * @param {string} exchangeId - 交易所 ID
 * @returns {boolean}
 */
export function isSpotExchange(exchangeId) {
  return exchangeId.endsWith('Spot');
}

/**
 * 将标准币对格式转换为合约格式
 * BTCUSDT -> BTC-SWAP-USDT
 * @param {string} symbol - 标准币对，如 'BTCUSDT'
 * @returns {string} 合约格式币对，如 'BTC-SWAP-USDT'
 */
export function toFuturesSymbol(symbol) {
  // 支持的报价币种
  const quoteCurrencies = ['USDT', 'USDC', 'BUSD'];

  for (const quote of quoteCurrencies) {
    if (symbol.endsWith(quote)) {
      const base = symbol.slice(0, -quote.length);
      return `${base}-SWAP-${quote}`;
    }
  }

  // 默认假设是 USDT
  return `${symbol.replace('USDT', '')}-SWAP-USDT`;
}

/**
 * 将合约格式币对转换为标准格式
 * BTC-SWAP-USDT -> BTCUSDT
 * @param {string} symbol - 合约格式币对
 * @returns {string} 标准格式币对
 */
export function toStandardSymbol(symbol) {
  // 处理合约格式 BTC-SWAP-USDT
  const swapMatch = symbol.match(/^([A-Z]+)-SWAP-([A-Z]+)$/);
  if (swapMatch) {
    return `${swapMatch[1]}${swapMatch[2]}`;
  }
  return symbol;
}

/**
 * 生成订阅 topic
 * 合约: depth_bnUM_BTC-SWAP-USDT
 * 现货: depth_bnSpot_BTCUSDT
 * @param {string} exchange - 交易所 ID
 * @param {string} symbol - 标准交易对格式，如 'BTCUSDT'
 * @returns {string} topic 字符串
 */
export function getDepthTopic(exchange, symbol) {
  // 根据交易所类型转换币对格式
  const formattedSymbol = isFuturesExchange(exchange) ? toFuturesSymbol(symbol) : symbol;
  return `depth_${exchange}_${formattedSymbol}`;
}

/**
 * 解析 topic
 * @param {string} topic - topic 字符串
 * @returns {Object|null} { exchange, symbol, standardSymbol } 或 null
 */
export function parseTopic(topic) {
  const match = topic.match(/^depth_([^_]+)_(.+)$/);
  if (match) {
    const exchange = match[1];
    const symbol = match[2];
    // 将币对转换回标准格式
    const standardSymbol = toStandardSymbol(symbol);
    return { exchange, symbol, standardSymbol };
  }
  return null;
}

/**
 * 根据交易所 ID 获取交易所信息
 * @param {string} exchangeId - 交易所 ID
 * @param {string} type - 'spot' 或 'futures'
 * @returns {Object|null} 交易所信息
 */
export function getExchangeInfo(exchangeId, type = 'futures') {
  const exchanges = EXCHANGES[type] || [];
  return exchanges.find(e => e.id === exchangeId) || null;
}

/**
 * 获取交易所显示名称
 * @param {string} exchangeId - 交易所 ID
 * @param {string} type - 'spot' 或 'futures'
 * @returns {string} 交易所名称
 */
export function getExchangeName(exchangeId, type = 'futures') {
  const info = getExchangeInfo(exchangeId, type);
  return info ? info.name : exchangeId;
}
