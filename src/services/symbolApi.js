/**
 * 交易对相关 API
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

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
