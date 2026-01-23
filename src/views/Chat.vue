<template>
  <div class="chat-container">
    <!-- 左侧历史记录抽屉 -->
    <div class="sidebar-drawer" :class="{ 'open': showSidebar }">
      <div class="sidebar-header">
        <h3>对话历史</h3>
        <button class="close-btn" @click="toggleSidebar">
          <span>✕</span>
        </button>
      </div>
      <div class="sidebar-content">
        <div class="history-list">
          <div
            v-for="session in chatHistory"
            :key="session.id"
            :class="['history-item', { 'active': session.id === currentSessionId }]"
            @click="switchSession(session.id)"
          >
            <div class="history-title">{{ session.title || '新对话' }}</div>
            <div class="history-time">{{ formatHistoryTime(session.timestamp) }}</div>
          </div>
        </div>
        <button class="new-session-btn" @click="createNewSession">
          <span>+</span> 新建对话
        </button>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- 主聊天区域 -->
    <div class="main-chat" :class="{ 'sidebar-open': showSidebar }">
      <!-- 顶部导航栏 -->
      <div class="chat-header">
        <button class="menu-btn" @click="toggleSidebar">
          <span>☰</span>
        </button>
        <h2 class="chat-title">AI助手对话</h2>
        <div class="header-actions">
          <button class="back-btn" @click="goBack">
            <span>←</span> 返回
          </button>
        </div>
      </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message-item', message.role]"
      >
        <div class="message-avatar">
          <span v-if="message.role === 'user'">👤</span>
          <span v-else>🤖</span>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)" @click="handlePreviewClick"></div>

          <!-- 打字机输出中的提示 -->
          <div v-if="message.typing" class="typing-indicator-small">
            <span>正在生成方案...</span>
          </div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <!-- 加载中提示 -->
      <div v-if="isLoading" class="message-item assistant">
        <div class="message-avatar">
          <span>🤖</span>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <button class="voice-btn" @click="showVoiceModal = true" title="语音输入">
          <span>🎤</span>
        </button>
        <textarea
          v-model="inputText"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="inputText += '\n'"
          placeholder="输入消息..."
          class="message-input"
          rows="1"
          ref="inputRef"
        ></textarea>
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="!inputText.trim() || isLoading"
        >
          <span>发送</span>
        </button>
      </div>
    </div>
    </div>
    
    <!-- 语音输入弹窗 -->
    <VoiceInput 
      v-model:visible="showVoiceModal"
      @confirm="handleVoiceConfirm"
    />
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { chatApi } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import VoiceInput from '@/components/VoiceInput.vue'
import { extractMessageContent } from '@/api/chat'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const showVoiceModal = ref(false)
const typingMessageIndex = ref(-1) // 正在打字机输出的消息索引
const typingTimer = ref(null) // 打字机定时器


// 侧边栏相关状态
const showSidebar = ref(false)
const chatHistory = ref([])

const currentSessionId = ref(null)
const userId = ref(null)


// 加载对话记录
onMounted(async () => {
  // // 加载历史会话列表
  // loadChatHistoryList()
  currentSessionId.value = chatStore.getCurrentSessionId()
  // const sessionId = sessionStorage.getItem('sessionId')
  // if(sessionId){
  //   currentSessionId.value = sessionId
  // }else{
  //   sessionStorage.setItem('sessionId', chatStore.generateSessionId())
  //   currentSessionId.value = sessionStorage.getItem('sessionId')
  // }
  const userInfo = JSON.parse(localStorage.getItem('userInfo'))
  userId.value = userInfo?.phone || null
  
  inputRef.value?.focus()

})

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 监听消息内容变化，重新绑定按钮（用于打字机效果）
watch(
  () => messages.value.map(m => m.content).join(''),
  () => {
    nextTick(() => {
    })
  }
)

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return

  const userMessage = {
    role: 'user',
    content: inputText.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const currentInput = inputText.value.trim()
  inputText.value = ''
  isLoading.value = true

  try {
    const response = await chatApi.sendMessage( currentInput,currentSessionId.value,userId.value)
    // 使用统一的消息提取函数处理响应
    const content = extractMessageContent(response)
    // 普通消息，直接显示
    const assistantMessage = {
      role: 'assistant',
      content: content,
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)
    
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 根据错误类型提供不同的提示信息
    let errorMessage = '抱歉，发送消息时出现错误，请稍后重试。'
    
    if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // 超时错误 - AI响应时间较长，提示用户稍等
      errorMessage = 'AI正在思考中，响应时间较长，请稍后重试或检查网络连接。'
    } else if (error.response) {
      // 服务器返回错误
      const status = error.response.status
      if (status >= 500) {
        errorMessage = '服务器暂时无法响应，请稍后重试。'
      } else if (status === 401 || status === 403) {
        errorMessage = '认证失败，请检查登录状态。'
      }
    } else if (error.request) {
      // 网络错误
      errorMessage = '网络连接异常，请检查网络后重试。'
    }
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    nextTick(() => {
      scrollToBottom()
      inputRef.value?.focus()
    })
  }
}

// 创建新对话
// const createNewChat = async () => {
//   try {
//     // 生成新的SessionID（年月日时分秒格式）
//     const newSessionId = chatStore.generateNewSessionId()
    
//     // 先设置SessionID，这样请求会使用新的SessionID
//     chatStore.currentSessionId = newSessionId
    
//     const response = await chatApi.createChat()
//     const newChatId = response.id || response.chatId || Date.now().toString()
//     chatId.value = newChatId
    
//     // 将SessionID与会话关联
//     chatStore.setSessionIdForChat(newChatId, newSessionId)
//     chatStore.setCurrentChatId(newChatId)
    
//     // 更新路由但不刷新页面
//     router.replace(`/chat/${newChatId}`)
//   } catch (error) {
//     console.error('创建对话失败:', error)
//   }
// }

// 加载对话历史
const loadChatHistory = async (id) => {
  try {
    const response = await chatApi.getChatHistory(id)
    // 如果返回了消息列表，则加载
    if (response && (response.messages || response.data)) {
      messages.value = response.messages || response.data || []
    }
  } catch (error) {
    // 静默处理错误，不显示错误信息（因为后端接口可能还未实现）
    // 如果接口不存在或失败，不影响新对话的创建和使用
    console.log('对话历史接口暂未实现，跳过加载历史记录')
    // 清空消息列表，开始新对话
    messages.value = []
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息内容（支持简单的Markdown和PPT预览按钮）
const formatMessage = (content) => {
  if (!content) {
    return ''
  }
  // 直接替换换行符，内容中已经包含按钮HTML
  const text = String(content)
  return text.replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 返回上一页
const goBack = () => {
  router.push('/')
}

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 切换到指定会话
const switchSession = async (sessionId) => {
  if (sessionId === currentSessionId.value) return
  
  currentSessionId.value = sessionId
  chatId.value = sessionId
  chatStore.setCurrentChatId(sessionId)
  
  // 加载选中会话的消息
  await loadChatHistory(sessionId)
  
  // 关闭侧边栏（在移动端）
  if (window.innerWidth < 768) {
    showSidebar.value = false
  }
}

// 创建新会话
const createNewSession = async () => {
  // 清空当前消息
  messages.value = []
  // 创建新会话
  await createNewChat()
  // 关闭侧边栏
  showSidebar.value = false
}

// 格式化历史记录时间
const formatHistoryTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 一分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 一小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  // 更早
  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载对话历史列表（模拟数据）
const loadChatHistoryList = () => {
  // 这里应该调用API获取历史会话列表
  // 暂时使用模拟数据
  chatHistory.value = [
    {
      id: 'session_1',
      title: '养老方案咨询',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    },
    {
      id: 'session_2', 
      title: '健康体检分析',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
    },
    {
      id: 'session_3',
      title: '智慧助餐方案',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
    }
  ]
}

// 开启新会话
const startNewChat = async () => {
  // 清空当前消息
  messages.value = []
  // 创建新会话
  await createNewChat()
}

// 处理语音识别确认
const handleVoiceConfirm = (text) => {
  inputText.value = text
  // 自动聚焦到输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}



// 组件卸载时清理定时器
onUnmounted(() => {
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
    typingTimer.value = null
  }
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: #f5f5f5;
  position: relative;
}

/* 侧边栏样式 */
.sidebar-drawer {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 300px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.sidebar-drawer.open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #666;
}

.close-btn:hover {
  background: #f0f0f0;
}

.sidebar-content {
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.history-item {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #f8f9fa;
  border-color: #e0e0e0;
}

.history-item.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.history-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 0.8rem;
  color: #666;
}

.new-session-btn {
  margin: 1rem;
  padding: 0.75rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.new-session-btn:hover {
  background: #1976d2;
}

/* 遮罩层 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 主聊天区域 */
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-chat.sidebar-open {
  margin-left: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-drawer {
    width: 280px;
  }
  
  .main-chat.sidebar-open {
    margin-left: 280px;
  }
}

.chat-header {
  background: #fff;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  color: #666;
}

.menu-btn:hover {
  background: #f0f0f0;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 0.7;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: 80px;
}

/* 新会话按钮 - 主要操作按钮，使用醒目样式 */
.new-chat-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border: none;
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.new-chat-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

/* 查看记录按钮 - 次要操作按钮，使用简洁样式 */
.history-btn {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #4a5568;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.history-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  color: #2d3748;
}

.chat-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  display: flex;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #48bb78;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  line-height: 1.5;
}

.message-item.user .message-text {
  background: #667eea;
  color: #fff;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
  padding: 0 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-container {
  background: #fff;
  padding: 1rem;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  max-width: 1200px;
  margin: 0 auto;
}

.voice-btn {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 1.25rem;
}

.voice-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: scale(1.05);
}

.voice-btn:active {
  transform: scale(0.95);
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 关键词抽取中的加载指示器 */
.extracting-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f7fafc;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #667eea;
}

.extracting-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* PPT预览按钮样式 */
.preview-ppt-btn {
  display: inline-block;
  margin: 0 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.preview-ppt-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.preview-ppt-btn:active {
  transform: translateY(0);
}

/* 打字机输出中的提示 */
.typing-indicator-small {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #718096;
  font-style: italic;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .chat-title {
    font-size: 1rem;
  }
  
  .chat-header {
    padding: 0.75rem;
  }
  
  .header-actions {
    gap: 0.5rem;
  }
  
  .new-chat-btn,
  .history-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
  }
  
  .new-chat-btn .text,
  .history-btn .text {
    display: none;
  }
  
  .new-chat-btn,
  .history-btn {
    min-width: 44px;
    padding: 0.5rem;
    justify-content: center;
  }
  
  .new-chat-btn .icon,
  .history-btn .icon {
    font-size: 1.1rem;
  }
}
</style>



