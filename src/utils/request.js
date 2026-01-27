import axios from 'axios';
// import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || '/api', // api的base_url
  timeout: 15000, // 请求超时时间
});

// request拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    // if (store.getters.token) {
    //   config.headers['Authorization'] = 'Bearer ' + getToken()
    // }
    return config;
  },
  error => {
    Promise.reject(error);
  }
);

// response 拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;

    // 这里可以根据后端返回的状态码进行判断
    if (res.code !== 200) {
      //  ElMessage({
      //   message: res.message || 'Error',
      //   type: 'error',
      //   duration: 5 * 1000
      // })
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res;
    }
  },
  error => {
    // ElMessage({
    //   message: error.message,
    //   type: 'error',
    //   duration: 5 * 1000
    // })
    return Promise.reject(error);
  }
);

export default request;
