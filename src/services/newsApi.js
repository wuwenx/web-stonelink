/**
 * 快讯 API
 */
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

/**
 * 获取快讯列表（分页）
 * @param {Object} params - page, page_size（默认20）, lang（默认 zh）
 * @returns {Promise<{ items: Array, total: number, page: number, page_size: number }>}
 */
export function getNewsList(params = {}) {
  const { page = 1, page_size = 20, lang = 'zh' } = params;
  const url = `${API_BASE_URL}/news`;

  return axios({
    url,
    method: 'get',
    params: { page, page_size, lang },
    timeout: 15000,
  }).then(response => {
    const res = response.data;
    if (res.code !== 200) {
      throw new Error(res.message || '获取快讯失败');
    }
    const data = res.data || {};
    return {
      items: data.items || [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      page_size: data.page_size ?? 20,
    };
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data?.message || '获取快讯失败');
    }
    if (error.request) {
      throw new Error('网络错误，请检查后端服务是否启动');
    }
    throw error;
  });
}

/**
 * 获取快讯详情
 * @param {number|string} id - 快讯 id
 * @param {Object} params - lang 等
 * @returns {Promise<Object>}
 */
export function getNewsDetail(id, params = {}) {
  const { lang = 'zh' } = params;
  const url = `${API_BASE_URL}/news/${id}`;

  return axios({
    url,
    method: 'get',
    params: { lang },
    timeout: 15000,
  }).then(response => {
    const res = response.data;
    if (res.code !== 200) {
      throw new Error(res.message || '获取快讯详情失败');
    }
    return res.data || {};
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data?.message || '获取快讯详情失败');
    }
    if (error.request) {
      throw new Error('网络错误，请检查后端服务是否启动');
    }
    throw error;
  });
}
