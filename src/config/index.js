/**
 * 应用配置
 * 包含API认证信息等配置项
 */

// 认证配置
export const authConfig = {
  
  /**
   * 生成新的SessionID（年月日时分秒格式：YYYYMMDDHHmmss）
   * @returns {string} 格式化的SessionID，例如：20241215143025
   */
  generateNewSessionId() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`
  },
  
  /**
   * 动态获取带 Bearer 前缀的 Authorization 字符串
   */
   getAuthorization() {
    let token = ''
    try {
      const rawUserInfo = localStorage.getItem('userInfo')
      if (rawUserInfo) {
        const userInfo = JSON.parse(rawUserInfo)
        token = userInfo.token || ''
      } else {
        token = localStorage.getItem('token') || ''
      }
    } catch (e) {
      token = localStorage.getItem('token') || ''
    }
    return token ? `Bearer ${token}` : ''
  },
  
  /**
   * 设置 SessionID
   * @param {string} sessionId - 会话ID
   */
  setSessionId(sessionId) {
    localStorage.setItem('sessionId', sessionId)
  }
}

// Cloudflare Turnstile 配置
export const turnstileConfig = {
  // 开发环境使用测试 Site Key（接受所有域名，总是验证成功）
  devSiteKey: '1x00000000000000000000AA',
  // 生产环境使用真实 Site Key
  prodSiteKey: '0x4AAAAAACYUQ5qPo0_B59Sy',
  
  /**
   * 获取当前环境的 Site Key
   * @returns {string} Site Key
   */
  getSiteKey() {
    // 根据环境变量或当前主机名判断
    const isDev = import.meta.env.DEV || 
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1'
    return isDev ? this.devSiteKey : this.prodSiteKey
  }
}

// API配置
export const apiConfig = {
  // 基础API路径
  baseURL: '/api',
  
  // 默认超时时间（毫秒）
  timeout: 30000,
  
  // AI对话接口超时时间（毫秒）- AI响应可能需要更长时间
  chatTimeout: 120000, // 120秒（2分钟）
  
  // 讯飞语音识别配置
  xfyun: {
    // WebSocket地址（中英文推荐）
    wsUrl: 'wss://iat-api.xfyun.cn/v2/iat',
    // 备用地址
    wsUrlBackup: 'wss://ws-api.xfyun.cn/v2/iat',
    // 小语种地址
    wsUrlNiche: 'wss://iat-niche-api.xfyun.cn/v2/iat',
    
    // 讯飞API配置（需要从环境变量或配置中获取）
    appId: import.meta.env.VITE_XFYUN_APPID || 'def3f1cb',
    apiKey: import.meta.env.VITE_XFYUN_API_KEY || 'a7b6899220a2549d7645d579e4ddb525',
    apiSecret: import.meta.env.VITE_XFYUN_API_SECRET || 'ZWMzYzA2MDVlMzAxNjU5ZWY3ZTUxZDI5',
    
    // 音频配置
    audio: {
      // 音频格式：raw（原始音频）、wav、pcm等
      format: 'raw',
      // 采样率：16000、8000等
      rate: 16000,
      // 编码：speex、speex-wb、lame等
      encoding: 'raw',
      // 声道数：1（单声道）、2（立体声）
      channels: 1
    },
    
    // 业务参数
    business: {
      // 语言：zh_cn（中文）、en_us（英文）等
      language: 'zh_cn',
      // 领域：iat（通用）、video（视频）、poi（地图）、music（音乐）等
      domain: 'iat',
      // 方言：mandarin（普通话）、cantonese（粤语）等
      accent: 'mandarin',
      // 是否开启动态修正（仅中文支持）
      vinfo: 1,
      // 标点符号：0（无标点）、1（有标点）
      ptt: 1
    }
  }
}

