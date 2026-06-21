import axios from 'axios'
import {Message} from 'element-ui'
import {getToken} from '@/utils/auth'
import store from '../store'

function createApiError(message, code, data) {
  const error = new Error(message || '请求失败')
  error.code = code || 'error'
  error.msg = message || '请求失败'
  error.data = data || null
  return error
}
// 创建axios实例
const service = axios.create({
  baseURL:  '/api', // api的base_url
  timeout: 150000000
})
// request拦截器
service.interceptors.request.use(config => {
  let token = getToken();
  if (token) {
    config.headers.token = token;
  }
  return config
}, error => {
  // Do something with request error
  console.error(error) // for debug
  return Promise.reject(error)
})
// respone拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === '200') {
      return res.data;
    } else {
      Message({
        message: res.msg,
        type: 'error',
        duration: 3 * 1000
      })
      return Promise.reject(createApiError(res.msg, res.code, res.data))
    }
  },
  error => {
    const responseData = error.response?.data || {}
    if (error.response) {
      const {status, message} = error.response;
      switch (status) {
        case 401:
          Message({
            showClose: true,
            message: responseData.message || responseData.msg || message,
            type: 'error',
            duration: 500,
            onClose: () => {
              store.dispatch('FedLogOut').then(() => {
                location.reload()// 为了重新实例化vue-router对象 避免bug
              })
            }
          });
          break;
        case 403:
          Message({
            showClose: true,
            message: '您没有权限访问此资源',
            type: 'error',
            duration: 3 * 1000
          });
          break;
        case 404:
          Message({
            showClose: true,
            message: '请求的资源不存在',
            type: 'error',
            duration: 3 * 1000
          });
          break;
        case 102000:
          Message({
            showClose: true,
            message: message,
            type: 'error',
            duration: 3 * 1000
          });
          break;
        default:
          Message({
            message: responseData.message || responseData.msg || message || '请求失败',
            type: 'error',
            duration: 3 * 1000
          });
      }
    } else {
      Message({
        message: error.message || '网络错误',
        type: 'error',
        duration: 3 * 1000
      })
    }
    return Promise.reject(createApiError(
      responseData.message || responseData.msg || error.message,
      error.response?.status || 'error',
      responseData
    ));
  }
)
export default service
