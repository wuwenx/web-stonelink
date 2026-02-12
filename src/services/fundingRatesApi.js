/**
 * 资金费率 API
 * GET /api/v1/funding-rates
 */
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';
// 'okx', 'bybit', 'gateio', 'bitget'
const SUPPORTED_EXCHANGES = ['binance_usdm', 'toobit',"okx","bybit"];

/**
 * 获取资金费率
 * @param {Object} params
 * @param {string} [params.exchange] - 逗号分隔的交易所，如 'toobit,binance_usdm'，不传则请求全部支持
 * @param {string} [params.symbol] - 可选，筛选交易对
 * @returns {Promise<Record<string, Array<{ symbol, funding_rate, funding_timestamp, next_funding_rate, previous_funding_rate }>>>}
 */
export function getFundingRates(params = {}) {
  const exchange = params.exchange ?? SUPPORTED_EXCHANGES.join(',');
  const url = `${API_BASE_URL}/funding-rates`;

  return axios({
    url,
    method: 'get',
    params: { exchange, symbol: params.symbol || undefined },
    timeout: 15000,
  })
    .then(response => {
      const res = response.data;
      if (res.code !== 200) {
        throw new Error(res.message || '获取资金费率失败');
      }
      return res.data || {};
    })
    .catch(error => {
      if (error.response) {
        throw new Error(error.response.data?.message || '获取资金费率失败');
      }
      if (error.request) {
        throw new Error('网络错误，请检查后端服务是否启动');
      }
      throw error;
    });
}

export { SUPPORTED_EXCHANGES };
