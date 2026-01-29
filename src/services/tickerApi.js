/**
 * 24hr Ticker 相关 API
 */
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

/**
 * 获取 24 小时行情
 * @param {Object} params - 查询参数
 * @param {string} params.exchange - 交易所名称，如 'toobit'
 * @param {string} [params.type] - 类型：'spot' 现货，不传或 'contract' 为合约
 * @returns {Promise<Array>} ticker 列表
 */
export function getTicker24hr(params = {}) {
  const { exchange = 'toobit', type } = params;
  const url = `${API_BASE_URL}/ticker/24hr`;
  const requestParams = { exchange };
  if (type === 'spot') {
    requestParams.type = 'spot';
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
        throw new Error(res.message || '获取24hr行情失败');
      }
      return res.data || [];
    })
    .catch(error => {
      if (error.response) {
        throw new Error(error.response.data?.message || '获取24hr行情失败');
      }
      if (error.request) {
        throw new Error('网络错误，请检查后端服务是否启动');
      }
      throw error;
    });
}
