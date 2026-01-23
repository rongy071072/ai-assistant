import axios from 'axios'
import { authConfig } from '@/config'
import { useChatStore } from '@/stores/chat'

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // 通过vite代理转发到后端
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 Authorization 和 SessionID headers
    const authHeader = authConfig.getAuthorization()
    if (authHeader) {
      config.headers.Authorization = authHeader
    }
    console.log('当前 Authorization:', config.headers.Authorization)
    
    // // 从store获取当前会话的SessionID
    // const chatStore = useChatStore()
    // const sessionId = chatStore.getCurrentSessionId()
    
    // if (sessionId) {
    //   config.headers.SessionID = sessionId
    // } else {
    //   // 如果没有SessionID，生成一个新的（这种情况应该很少发生）
    //   const newSessionId = chatStore.generateNewSessionId()
    //   chatStore.currentSessionId = newSessionId
    //   config.headers.SessionID = newSessionId
    // }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 如果请求配置中设置了 raw: true，则直接返回原始响应体（不自动解包）
    if (response.config.raw) {
      return data;
    }

    // 判断是否为标准统一响应格式：{ code, data, message, ... }
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) && // 防止数组被误判
      'code' in data &&
      data.code === 200
    ) {
      // 成功：返回 data 字段
      return data.data;
    }

    // 非标准格式（如 AI 后端直接返回 content / result / 或纯数据）
    // 交由调用方自行处理（例如某些流式接口、文件下载、或未遵循规范的接口）
    return data;
  },
  (error) => {
    // 提取错误相关信息
    const { response, request, config = {} } = error;
    const { url = '' } = config;

    // ====== 1. 服务器返回了响应（HTTP 状态码非 2xx） ======
    if (response) {
      const { status, data } = response;

      // 静默处理 404（接口未实现）
      if (status === 404) {
        return Promise.reject(error);
      }

      // 统一打印错误日志（除 404 外）
      console.error(`[HTTP ${status}] 请求失败:`, data);

      // 按状态码处理业务逻辑
      switch (status) {
        case 401:
          alert('认证失效，请重新登录');
          localStorage.removeItem('userInfo');
          // 跳转至登录页
          window.location.href = '/login';
          break;
        case 403:
          console.error('权限不足，无法访问');
          break;
        case 429:
          console.error('请求过于频繁，请稍后再试');
          break;
        default:
          if (status >= 500) {
            console.error('服务器内部错误，请联系管理员');
          }
      }

      return Promise.reject(error);
    }

    // ====== 2. 请求已发出，但未收到响应（网络层错误） ======
    if (request) {
      // 超时错误
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        error.isTimeout = true;
        console.error('请求超时，请稍后重试');
        return Promise.reject(error);
      }

      // 特定接口静默处理（如对话历史未实现）
      const silentUrls = ['/chat/history', '/chat/list'];
      if (silentUrls.some(path => url.includes(path))) {
        return Promise.reject(error);
      }

      // 其他网络错误
      console.error('网络异常，请检查网络连接');
      return Promise.reject(error);
    }

    // ====== 3. 请求配置阶段出错（如 URL 格式错误） ======
    console.error('请求配置错误:', error.message);
    return Promise.reject(error);
  }
);

export default request



