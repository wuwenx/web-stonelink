/**
 * 交易对相关 API
 */
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

/**
 * 获取交易对列表
 * @param {Object} params - 查询参数
 * @param {string} params.exchange - 交易所名称，如 'toobit'
 * @param {string} params.type - 交易类型，'spot' 或 'contract'
 * @returns {Promise<Array>} 交易对列表
 */
export function getSymbols(params = {}) {
  const { exchange = 'toobit', type = 'contract' } = params;
  const url = `${API_BASE_URL}/symbols`;
  const requestParams = {
    exchange,
    type,
  };
  
  // 直接使用 axios 而不是 request 实例，避免 baseURL 冲突
  return axios({
    url,
    method: 'get',
    params: requestParams,
    timeout: 15000,
  }).then(response => {
    const res = response.data;
    
    // 检查响应格式
    if (res.code !== 200) {
      throw new Error(res.message || '获取交易对列表失败');
    }
    
    // 返回 data 字段中的数据
    return res.data || [];
  }).catch(error => {
    console.error('获取交易对失败:', error);
    if (error.response) {
      // 服务器返回了错误响应
      throw new Error(error.response.data?.message || '获取交易对列表失败');
    } else if (error.request) {
      // 请求已发出但没有收到响应
      throw new Error('网络错误，请检查后端服务是否启动');
    } else {
      // 其他错误
      throw error;
    }
  });
}

/**
 * 获取交易对列表（CCXT contracts，含分页与精度等元数据）
 * @param {Object} params - 查询参数
 * @param {string} params.exchange - 交易所，如 'toobit'
 * @param {string} params.market_type - 市场类型 'spot' 或 'contract'
 * @param {number} params.page - 页码，从 1 开始
 * @param {number} params.page_size - 每页条数，默认 10
 * @returns {Promise<{ items: Array, total: number, page: number, page_size: number }>}
 */
export function getSymbolsCcxtContracts(params = {}) {
  const { exchange = 'toobit', market_type = 'spot', page = 1, page_size = 10 } = params;
  const url = `${API_BASE_URL}/symbols/ccxt/contracts`;

  return axios({
    url,
    method: 'get',
    params: { exchange, market_type, page, page_size },
    timeout: 15000,
  }).then(response => {
    const res = response.data;
    if (res.code !== 200) {
      throw new Error(res.message || '获取交易对列表失败');
    }
    const data = res.data || {};
    const exchangeKey = exchange || (Object.keys(data)[0]);
    const block = data[exchangeKey];
    if (!block) {
      return { items: [], total: 0, page: 1, page_size: 10 };
    }
    return {
      items: block.items || [],
      total: block.total ?? 0,
      page: block.page ?? 1,
      page_size: block.page_size ?? 10,
    };
  }).catch(error => {
    console.error('获取交易对列表失败:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || '获取交易对列表失败');
    } else if (error.request) {
      throw new Error('网络错误，请检查后端服务是否启动');
    } else {
      throw error;
    }
  });
}
