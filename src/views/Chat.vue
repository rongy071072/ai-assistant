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
        <button class="new-session-btn" @click="startNewChat">
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
        <h2 class="chat-title">MagiMimi</h2>
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
        <div :class="['message-avatar', { 'is-ai': message.role !== 'user' }]">
          <span v-if="message.role === 'user'">👤</span>
          <div v-else class="cat-avatar"></div>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)" @click="handlePreviewClick"></div>
          <!-- 消息附件图片 -->
          <div v-if="message.images && message.images.length > 0" class="message-images">
            <img
              v-for="(imgUrl, imgIdx) in message.images"
              :key="imgIdx"
              :src="imgUrl"
              class="message-image"
              @click="openImagePreview(imgUrl)"
            />
          </div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <!-- 加载中提示 -->
      <div v-if="isLoading" class="message-item assistant">
        <div class="message-avatar is-ai">
          <div class="cat-avatar"></div>
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
      <!-- 已上传图片预览区 -->
      <div v-if="uploadedFiles.length > 0" class="upload-preview-area">
        <div
          v-for="(file, idx) in uploadedFiles"
          :key="idx"
          class="upload-preview-item"
        >
          <div v-if="file.uploading" class="upload-uploading">
            <div class="upload-spinner"></div>
          </div>
          <img v-else :src="file.localPreview" class="upload-preview-img" :title="file.name" />
          <button class="upload-remove-btn" @click="removeUploadedFile(idx)" :disabled="file.uploading">✕</button>
        </div>
      </div>
      <!-- 隐藏的文件选择框 -->
      <input
        type="file"
        ref="fileInputRef"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="input-wrapper">
        <!-- 附件上传按钮 -->
        <button class="attach-btn" @click="fileInputRef.click()" title="上传图片" :disabled="isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button class="voice-btn" @click="showVoiceModal = true" title="语音输入">
          <img src="/话筒语音.svg" class="voice-icon" alt="语音输入" />
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
          :disabled="(!inputText.trim() && uploadedFiles.filter(f => !f.uploading).length === 0) || isLoading || uploadedFiles.some(f => f.uploading)"
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

    <!-- 图片预览弹窗 -->
    <div v-if="previewImageUrl" class="image-preview-overlay" @click="previewImageUrl = null">
      <img :src="previewImageUrl" class="image-preview-full" @click.stop />
      <button class="image-preview-close" @click="previewImageUrl = null">✕</button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { chatApi } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import { authConfig } from '@/config'
import VoiceInput from '@/components/VoiceInput.vue'
import { extractMessageContent } from '@/api/chat'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 或者其他你喜欢的主题，如 atom-one-dark.css

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const showVoiceModal = ref(false)

// 附件上传相关状态
const uploadedFiles = ref([])   // [{url, localPreview, name, uploading}]
const fileInputRef = ref(null)
const previewImageUrl = ref(null)

// 侧边栏相关状态
const showSidebar = ref(false)
const chatHistory = ref([])

const currentSessionId = ref(null)
const userId = ref(null)


// 加载对话记录
onMounted(async () => {
  currentSessionId.value = chatStore.getCurrentSessionId()
  const userInfo = JSON.parse(localStorage.getItem('userInfo'))
  userId.value = userInfo?.email || null

  // 加载历史会话列表
  await loadHistoryList()

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

// 监听消息内容变化，自动滚动（用于流式输出）
watch(
  () => messages.value.length > 0 ? messages.value[messages.value.length - 1].content : '',
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 发送消息
const sendMessage = async () => {
  const hasText = inputText.value.trim()
  const readyFiles = uploadedFiles.value.filter(f => !f.uploading && f.url)
  if ((!hasText && readyFiles.length === 0) || isLoading.value) return

  // 收集已上传完成的图片 OSS URL
  const fileLinks = readyFiles.map(f => f.url)

  const userMessage = {
    role: 'user',
    content: inputText.value.trim(),
    images: fileLinks.length > 0 ? [...fileLinks] : undefined,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const currentInput = inputText.value.trim()
  inputText.value = ''
  // 清空已上传图片列表并释放本地 Object URL
  uploadedFiles.value.forEach(f => f.localPreview && URL.revokeObjectURL(f.localPreview))
  uploadedFiles.value = []
  isLoading.value = true

  // 创建助手消息对象，使用 reactive 确保响应式更新
  const assistantMessage = reactive({
    role: 'assistant',
    content: '',
    timestamp: new Date()
  })

  try {
    const token = authConfig.getAuthorization()
    const response = await fetch('/api/common_server/agent/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || ''
      },
      body: JSON.stringify({
        query: currentInput,
        sessionId: currentSessionId.value,
        userId: userId.value,
        ...(fileLinks.length > 0 && { fileLinks })
      })
    })

    if(response.status == 400||response.status == 401){
      alert("登录超时，请重新登录")
      localStorage.removeItem('userInfo')
      router.push('/login')
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 收到响应，隐藏加载动画，显示消息气泡
    isLoading.value = false
    messages.value.push(assistantMessage)

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      // 处理 SSE 数据块
      const lines = buffer.split('\n')
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data:')) continue

        const dataStr = trimmedLine.slice(5).trim()
        if (dataStr === '[DONE]') continue

        try {
          const data = JSON.parse(dataStr)
          // 提取内容，根据实际后端返回结构调整
          let content = data.content || data.data || ''
          
          if (content && typeof content === 'object') {
            content = content.text || content.content || JSON.stringify(content)
          }

          if (content) {
            assistantMessage.content += String(content)
          }
        } catch (e) {
          console.warn('解析SSE数据失败:', e, dataStr)
          if (dataStr && !dataStr.startsWith('{')) {
             assistantMessage.content += dataStr
          }
        }
      }
    }

    // 流结束后刷新侧边栏历史列表
    loadHistoryList()

  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage = '抱歉，发送消息时出现错误，请稍后重试。'
    const networkErrorMsg = '\n\n[网络连接异常或请求超时]'

    if (messages.value.length === 0 || messages.value[messages.value.length - 1].role !== 'assistant') {
       isLoading.value = false
       assistantMessage.content = errorMessage
       messages.value.push(assistantMessage)
    } else {
       assistantMessage.content += networkErrorMsg
    }
  } finally {
    isLoading.value = false
    nextTick(() => {
      scrollToBottom()
      inputRef.value?.focus()
    })
  }
}


// 获取对话历史列表（侧边栏）
const loadHistoryList = async () => {
  if (!userId.value) return
  try {
    const data = await chatApi.getHistoryList(userId.value)
    if (data && Array.isArray(data.historyList)) {
      // 将接口数据映射为组件所需的统一格式
      chatHistory.value = data.historyList.map(item => ({
        id: item.session_id,
        title: item.first_content || '新对话',
        timestamp: null
      }))
    }
  } catch (error) {
    console.error('获取对话历史列表失败:', error)
  }
}

// 加载指定会话的消息详情
const loadChatHistory = async (sessionId) => {
  if (!userId.value || !sessionId) return
  try {
    const data = await chatApi.getHistory(userId.value, sessionId)
    if (Array.isArray(data)) {
      messages.value = data
        .filter(msg => msg.content)
        .map(msg => {
          let content = msg.content
          
          // 处理 content 为数组的情况 (e.g. [{text: "...", type: "text"}])
          if (Array.isArray(content)) {
            content = content
              .filter(item => item && item.type === 'text')
              .map(item => item.text)
              .join('')
          }
          // 处理 content 为对象的情况
          else if (content && typeof content === 'object') {
            // 尝试常见字段名：text, content, message, answer
            content = content.text || content.content || content.message || content.answer || JSON.stringify(content)
          }
          return {
            role: msg.role,
            content: String(content || ''), // 确保是字符串
            timestamp: new Date()
          }
        })
    }
  } catch (error) {
    console.error('获取对话详情失败:', error)
    messages.value = []
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息内容（支持 Markdown 和代码高亮）
const formatMessage = (content) => {
  if (!content) {
    return ''
  }
  // 使用 markdown-it 渲染
  return md.render(String(content))
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
  chatStore.setCurrentSessionId(sessionId)

  // 加载选中会话的消息详情
  await loadChatHistory(sessionId)

  // 移动端自动收起侧边栏
  if (window.innerWidth < 768) {
    showSidebar.value = false
  }
}

// 格式化历史记录时间
const formatHistoryTime = (timestamp) => {
  if (!timestamp) return ''
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


// 开启新会话
const startNewChat = async () => {
  // 清空当前消息
  messages.value = []
  // 创建新sessionId
  const newSessionId = chatStore.generateNewSessionId()
  sessionStorage.setItem('sessionId', newSessionId)
  currentSessionId.value = newSessionId
  chatStore.setCurrentSessionId(newSessionId)
}

// 处理语音识别确认
const handleVoiceConfirm = (text) => {
  inputText.value = text
  // 自动聚焦到输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

/**
 * 处理文件选择：为每个图片生成本地预览，并立即上传到 OSS
 * 使用对象引用而非下标，避免多文件上传时下标偏移引发错误赋值。
 */
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  // 重置 input 值，允许重复选择同一文件
  event.target.value = ''
  
  if (files.length === 0) return

  // 1. 创建本地预览项并添加到列表
  const newEntries = []
  for (const file of files) {
    const localPreview = URL.createObjectURL(file)
    // 用 reactive 包装以便直接通过引用修改属性
    const entry = reactive({ url: null, localPreview, name: file.name, uploading: true })
    newEntries.push(entry)
    uploadedFiles.value.push(entry)
  }

  // 2. 批量上传
  try {
    const ossUrls = await chatApi.batchUploadFiles(files)
    
    // 校验返回值：必须是数组且长度一致
    if (!Array.isArray(ossUrls) || ossUrls.length !== files.length) {
      throw new Error('上传返回数据异常或数量不匹配')
    }

    // 3. 更新上传状态和 URL
    newEntries.forEach((entry, index) => {
      const url = ossUrls[index]
      if (typeof url === 'string' && url.startsWith('http')) {
        entry.url = url
        entry.uploading = false
      } else {
        // 单个文件失败处理逻辑（视具体业务需求，这里简单标记失败或移除）
        console.warn(`文件 ${entry.name} 上传返回 URL 异常:`, url)
        // 移除该文件预览
        const idx = uploadedFiles.value.indexOf(entry)
        if (idx !== -1) {
          uploadedFiles.value.splice(idx, 1)
          if (entry.localPreview) URL.revokeObjectURL(entry.localPreview)
        }
      }
    })
  } catch (err) {
    console.error('批量上传失败:', err)
    // 移除所有本次尝试上传的文件预览
    newEntries.forEach(entry => {
      const idx = uploadedFiles.value.indexOf(entry)
      if (idx !== -1) {
        uploadedFiles.value.splice(idx, 1)
        if (entry.localPreview) URL.revokeObjectURL(entry.localPreview)
      }
    })
    alert(`图片上传失败: ${err.message || '未知错误'}`)
  }
}

/**
 * 移除已选择的图片
 * @param {number} idx - 要移除的图片索引
 */
const removeUploadedFile = (idx) => {
  const entry = uploadedFiles.value[idx]
  if (entry?.localPreview) {
    URL.revokeObjectURL(entry.localPreview)
  }
  uploadedFiles.value.splice(idx, 1)
}

/**
 * 打开图片全屏预览
 * @param {string} url - 图片 URL
 */
const openImagePreview = (url) => {
  previewImageUrl.value = url
}



</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
  position: relative;
}

/* 侧边栏样式 */
.sidebar-drawer {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 300px;
  background: var(--bg-secondary);
  box-shadow: var(--sidebar-shadow);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  border-right: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
}

.sidebar-drawer.open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--bg-tertiary);
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
  color: var(--text-primary);
}

.history-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.history-item.active {
  background: rgba(33, 150, 243, 0.1);
  border-color: #2196f3;
}

.history-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.history-time {
  font-size: 0.8rem;
  color: var(--text-tertiary);
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
    width: 80%; /* 移动端侧边栏宽度调整 */
    max-width: 300px;
  }
  
  .main-chat.sidebar-open {
    margin-left: 0; /* 移动端打开侧边栏时，主内容不移动，而是被遮罩 */
  }

  /* 移动端输入框区域调整 */
  .input-container {
    padding: 0.5rem;
  }

  .input-wrapper {
    gap: 0.5rem;
  }

  .voice-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .message-input {
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
  }

  .send-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  /* 移动端消息气泡调整 */
  .message-content {
    max-width: 85%;
  }
  
  .message-text {
    padding: 0.6rem 0.8rem;
    font-size: 0.95rem;
  }
}

.chat-header {
  background: var(--bg-secondary);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 0 var(--border-color);
  z-index: 10;
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
}

.menu-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--text-secondary);
}

.menu-btn:hover {
  background: var(--bg-tertiary);
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
  background: var(--primary-gradient);
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
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--text-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.history-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.chat-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
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

.message-avatar.is-ai {
  background: transparent;
  border-radius: 0;
  width: 52px; /* 稍微调大一点，因为探头图片可能需要更大空间才好看 */
  height: 52px;
  margin-left: -6px; /* 修正因为变大导致的偏移 */
}

.cat-avatar {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-image: url('/cat-dark.svg');
  transition: background-image 0.3s ease;
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
  background: var(--message-assistant-bg);
  color: var(--message-assistant-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  word-wrap: break-word;
  line-height: 1.5;
  border: 1px solid var(--border-color);
}

/* Markdown 样式适配 */
.message-text :deep(p) {
  margin: 0.5em 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-text :deep(code) {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  background: rgba(127, 127, 127, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  color: var(--text-primary);
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.message-text :deep(ul), .message-text :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.message-text :deep(li) {
  margin: 0.25em 0;
}

.message-text :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

.message-text :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
}

.message-text :deep(h1), .message-text :deep(h2), .message-text :deep(h3), 
.message-text :deep(h4), .message-text :deep(h5), .message-text :deep(h6) {
  margin: 0.75em 0 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.message-text :deep(h1) { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
.message-text :deep(h2) { font-size: 1.3em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
.message-text :deep(h3) { font-size: 1.1em; }

/* 用户消息中的 Markdown 样式适配 (深色背景) */
.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-item.user .message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.2);
  color: #f8f8f2;
}

.message-item.user .message-text :deep(a) {
  color: #fff;
  text-decoration: underline;
}

.message-item.user .message-text :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.message-item.user .message-text :deep(h1), .message-item.user .message-text :deep(h2) {
  border-bottom-color: rgba(255, 255, 255, 0.3);
}

.message-item.user .message-text {
  background: var(--message-user-bg);
  color: var(--message-user-text);
  border: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  padding: 0 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--message-assistant-bg);
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

/* ===== 附件上传：图片预览区 ===== */
.upload-preview-area {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0 0.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-preview-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
}

.upload-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-uploading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.upload-remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: background 0.2s;
}

.upload-remove-btn:hover {
  background: rgba(220, 38, 38, 0.85);
}

/* ===== 附件按钮 ===== */
.attach-btn {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.attach-btn:hover:not(:disabled) {
  background: var(--border-color);
  border-color: var(--border-hover);
  transform: scale(1.05);
  color: #667eea;
}

.attach-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.attach-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 消息气泡中的图片 ===== */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
  cursor: zoom-in;
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
  display: block;
}

.message-image:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ===== 图片全屏预览弹窗 ===== */
.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
}

.image-preview-full {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.image-preview-close {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.image-preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.input-container {
  background: var(--bg-secondary);
  padding: 1rem;
  box-shadow: 0 -1px 0 var(--border-color);
  border-top: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.voice-btn {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
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
  background: var(--border-color);
  border-color: var(--border-hover);
  transform: scale(1.05);
}

.voice-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.voice-btn:active {
  transform: scale(0.95);
}

.message-input {
  flex: 1;
  width: 0; /* 强制 flex item 收缩 */
  min-width: 0; /* 防止在 flex 容器中溢出 */
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  transition: border-color 0.2s;
  background: var(--input-bg);
  color: var(--text-primary);
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
  flex-shrink: 0;
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
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #667eea;
}

.extracting-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
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
  background: var(--primary-gradient);
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
  color: var(--text-tertiary);
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

<style>
/* 全局样式适配暗黑模式 */
[data-theme="dark"] .cat-avatar {
  background-image: url('/cat-light.svg') !important;
}
</style>



