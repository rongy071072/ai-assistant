import { defineStore } from 'pinia'

/**
 * 对话状态管理
 * 可以根据需要扩展状态管理功能
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    currentChatId: null,
    currentSessionId: null, // 当前会话的SessionID
    currentMessages: [],
    chatList: [],
    // 存储每个会话的SessionID映射 { chatId: sessionId }
    sessionIdMap: {}
  }),

  actions: {
    /**
     * 设置当前对话ID
     * @param {string|number} chatId - 对话ID
     */
    setCurrentChatId(chatId) {
      this.currentChatId = chatId
      // 如果该会话已有SessionID，则使用它；否则保持null（新会话）
      if (chatId && this.sessionIdMap[chatId]) {
        this.currentSessionId = this.sessionIdMap[chatId]
      }
    },
    
    
      /**
       * 获取当前会话的SessionID
       * 如果当前没有，则生成一个新的并保存
       * @returns {string} 当前SessionID
       */
      getCurrentSessionId() {
        if (this.currentSessionId) {
          return this.currentSessionId
        }
        // 如果没有，生成新的并保存到 currentSessionId
        const newSessionId = this.generateNewSessionId()
        this.currentSessionId = newSessionId

        return newSessionId
      },
    
    /**
     * 生成新的SessionID（年月日时分秒格式）
     * @returns {string} 格式化的SessionID
     */
    generateNewSessionId() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      
      return `${year}${month}${day}${hours}${minutes}${seconds}`+Math.random().toString(36).substring(2, 4)
    },

    /**
     * 设置当前消息列表
     * @param {Array} messages - 消息列表
     */
    setCurrentMessages(messages) {
      this.currentMessages = messages
    },

    /**
     * 添加消息
     * @param {Object} message - 消息对象
     */
    addMessage(message) {
      this.currentMessages.push(message)
    },

    /**
     * 设置当前SessionID
     * @param {string} sessionId - SessionID
     */
    setCurrentSessionId(sessionId) {
      this.currentSessionId = sessionId
    },

    /**
     * 设置对话列表
     * @param {Array} list - 对话列表
     */
    setChatList(list) {
      this.chatList = list
    }
  }
})



