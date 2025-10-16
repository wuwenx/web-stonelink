const toobitFuturesWebSocketUrl = 'wss://stream.toobit.com/quote/ws/v1';
const binanceFuturesWebSocketUrl = 'wss://fstream.binance.com/ws';
const binanceSpotWebSocketUrl = 'wss://stream.binance.com:9443/ws';
const okxFuturesWebSocketUrl = 'wss://ws.okx.com:8443/ws/v5/public';
export { binanceFuturesWebSocketUrl, binanceSpotWebSocketUrl, okxFuturesWebSocketUrl, toobitFuturesWebSocketUrl };

/**
 * 币对映射函数
 * 将标准币对格式转换为不同交易所的格式
 * @param {string} symbol - 标准币对格式，如 'BTCUSDT', 'ETHUSDC', 'BTCUSDT'
 * @param {string} exchange - 交易所名称 'toobit' 或 'binance'
 * @returns {string} 转换后的币对格式
 */
function mapSymbol(symbol, exchange) {
  if (!symbol || !exchange) {
    return symbol;
  }

  // 支持的报价币种列表
  const quoteCurrencies = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];

  // 提取基础币种和报价币种
  let baseCurrency = symbol;
  let quoteCurrency = '';

  // 查找报价币种
  for (const quote of quoteCurrencies) {
    if (symbol.endsWith(quote)) {
      baseCurrency = symbol.slice(0, -quote.length);
      quoteCurrency = quote;
      break;
    }
  }

  // 如果没有找到支持的报价币种，默认使用 USDT
  if (!quoteCurrency) {
    baseCurrency = symbol.replace('USDT', '');
    quoteCurrency = 'USDT';
  }

  switch (exchange.toLowerCase()) {
  case 'toobit':
    // Toobit 格式: BTCUSDT -> BTC-SWAP-USDT, BTCUSDC -> BTC-SWAP-USDC
    return `${baseCurrency}-SWAP-${quoteCurrency}`;

  case 'binance':
    // Binance 格式: BTCUSDT -> btcusdt, BTCUSDC -> btcusdc
    return `${baseCurrency.toLowerCase()}${quoteCurrency.toLowerCase()}`;

  case 'okx':
    // OKX 格式: BTCUSDT -> BTC-USDT-SWAP
    return `${baseCurrency}-${quoteCurrency}-SWAP`;

  default:
    // 默认返回原始格式
    return symbol;
  }
}

/**
 * 获取 Toobit 格式的币对
 * @param {string} symbol - 标准币对格式
 * @returns {string} Toobit 格式的币对
 */
function toobitSymbol(symbol) {
  return mapSymbol(symbol, 'toobit');
}

/**
 * 获取 Binance 格式的币对
 * @param {string} symbol - 标准币对格式
 * @returns {string} Binance 格式的币对
 */
function binanceSymbol(symbol) {
  return mapSymbol(symbol, 'binance');
}

/**
 * 获取 OKX 格式的币对
 * @param {string} symbol - 标准币对格式
 * @returns {string} OKX 格式的币对
 */
function okxSymbol(symbol) {
  return mapSymbol(symbol, 'okx');
}

export { binanceSymbol, mapSymbol, okxSymbol, toobitSymbol };

