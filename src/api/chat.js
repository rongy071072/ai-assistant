import request from './request'
import { apiConfig } from '@/config'

/**
 * 提取AI响应的消息内容
 * 根据后端返回的实际数据结构调整字段名
 * @param {Object} response - 后端返回的响应数据
 * @returns {string|Object} 提取的消息内容，如果检测到aim则返回特殊对象
 */
export const extractMessageContent = (response) => {
  if (!response) {
    return '抱歉，我暂时无法回答这个问题。'
  }

  // 常见的字段名：content, message, text, answer, reply, data 等
  return response.answer || response.content || response.message || response.text || 
         (typeof response === 'string' ? response : '抱歉，我暂时无法回答这个问题。')
}

/**
 * 对话相关API
 */
export const chatApi = {

  /**
   * 发送消息
   * @param {string|number} chatId - 对话ID（可选，用于前端路由）
   * @param {string} message - 消息内容
   * @returns {Promise} 返回AI回复
   */
  sendMessage(message, sessionId, userId) {
    return request({
      url: '/common_server/agent/execute',
      method: 'post',
      data: {
        query: message,
        sessionId: sessionId,
        userId: userId
      },
      timeout: apiConfig.chatTimeout // 使用更长的超时时间
    })
  },

  /**
   * 获取对话历史
   * @param {string|number} chatId - 对话ID
   * @returns {Promise} 返回对话消息列表
   */
  getChatHistory(chatId) {
    return request({
      url: `/chat/history/${chatId}`,
      method: 'get'
    })
  },

  /**
   * 获取对话列表
   * @param {object} params - 查询参数（可选）
   * @returns {Promise} 返回对话列表
   */
  getChatList(params = {}) {
    return request({
      url: '/chat/list',
      method: 'get',
      params
    })
  },

  /**
   * 删除对话
   * @param {string|number} chatId - 对话ID
   * @returns {Promise}
   */
  deleteChat(chatId) {
    return request({
      url: `/chat/${chatId}`,
      method: 'delete'
    })
  },

  /**
   * 更新对话标题
   * @param {string|number} chatId - 对话ID
   * @param {string} title - 新标题
   * @returns {Promise}
   */
  updateChatTitle(chatId, title) {
    return request({
      url: `/chat/${chatId}/title`,
      method: 'put',
      data: { title }
    })
  },

  /**
   * 获取对话历史列表
   * @param {string} userId - 用户ID（邮箱）
   * @returns {Promise<{historyList: Array<{first_content: string, session_id: string}>}>}
   */
  getHistoryList(userId) {
    return request({
      url: '/common_server/agent/getHistoryList',
      method: 'get',
      params: { userId }
    })
  },

  /**
   * 获取指定会话的对话详情
   * @param {string} userId - 用户ID（邮箱）
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Array<{content: string, role: string}>>}
   */
  getHistory(userId, sessionId) {
    return request({
      url: '/common_server/agent/getHistory',
      method: 'get',
      params: { userId, sessionId }
    })
  }
}

