<template>
  <div :class="['message-bubble', role]">
    <div class="message-avatar">
      <span>{{ role === 'user' ? '👤' : '🤖' }}</span>
    </div>
    <div class="message-content">
      <div class="message-text" v-html="formatContent(content)"></div>
      <div class="message-time">{{ formatTime(timestamp) }}</div>
    </div>
  </div>
</template>

<script setup>
/**
 * 消息气泡组件
 * 用于显示用户和AI的消息
 */
const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['user', 'assistant'].includes(value)
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: [Date, String, Number],
    default: () => new Date()
  }
})

/**
 * 格式化消息内容
 * @param {string} content - 消息内容
 * @returns {string} 格式化后的HTML
 */
const formatContent = (content) => {
  // 简单的换行处理
  return content.replace(/\n/g, '<br>')
}

/**
 * 格式化时间
 * @param {Date|String|Number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease;
}

.message-bubble.user {
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

.message-bubble.user .message-avatar {
  background: #48bb78;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-bubble.user .message-content {
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

.message-bubble.user .message-text {
  background: #667eea;
  color: #fff;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
  padding: 0 0.5rem;
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

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
}
</style>



