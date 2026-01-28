<template>
  <div v-if="isVisible" class="voice-modal-overlay" @click.self="handleClose">
    <div class="voice-modal">
      <div class="voice-visualizer">
        <!-- 核心动画区域 -->
        <div class="visualizer-container" :class="statusClass">
          <!-- 波纹层 -->
          <div class="ripple ripple-1"></div>
          <div class="ripple ripple-2"></div>
          <div class="ripple ripple-3"></div>
          
          <!-- 中心圆球/主按钮 -->
          <div class="core-circle" @click="toggleRecording">
            <div class="core-icon">
              <span v-if="isProcessing" class="icon-spin">⏳</span>
              <img 
                v-else 
                src="/话筒.svg" 
                class="mic-svg" 
                alt="麦克风"
              />
            </div>
          </div>
        </div>
        
        <!-- 状态文本 -->
        <div class="status-display">
          <p class="main-status">{{ displayStatusText }}</p>
          <p v-if="isRecording" class="timer">{{ formatTime(recordingTime) }}</p>
        </div>
      </div>
      
      <!-- 识别结果实时展示 -->
      <div class="result-area" :class="{ 'has-content': recognizedText }">
        <div class="result-scroll">
          {{ recognizedText || '说点什么吧...' }}
          <span v-if="isRecording" class="cursor"></span>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button class="action-btn secondary" @click="handleClose">
          取消
        </button>
        
        <!-- 确认按钮仅在有内容时可用，或者在非录音状态下可用 -->
        <button 
          class="action-btn primary" 
          :disabled="!recognizedText || isProcessing"
          @click="handleConfirm"
        >
          确认发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { createXfyunRecognition } from '@/api/speech'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'close'])

// 使用computed来处理v-model的双向绑定
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 录音状态
const isRecording = ref(false)
const isProcessing = ref(false)
const recordingTime = ref(0)
const recognizedText = ref('')
const recognitionInstance = ref(null)
const mediaStream = ref(null)
const recordingTimer = ref(null)
const connectionStatus = ref('idle') // idle, connecting, connected, recording, completed

// 状态文本
const displayStatusText = computed(() => {
  if (connectionStatus.value === 'connecting') return '正在连接...'
  if (isProcessing.value) return '正在识别...'
  if (isRecording.value) return '正在聆听...'
  if (recognizedText.value) return '点击确认发送'
  return '点击麦克风开始说话'
})

const statusClass = computed(() => {
  if (isProcessing.value) return 'processing'
  if (isRecording.value) return 'recording'
  return 'idle'
})

// 监听visible变化，重置状态
watch(() => isVisible.value, (newVal) => {
  if (!newVal) {
    resetState()
  }
})

// 重置状态
const resetState = () => {
  // 停止识别
  if (recognitionInstance.value) {
    recognitionInstance.value.stopRecognition()
    recognitionInstance.value = null
  }
  
  // 停止媒体流
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  
  isRecording.value = false
  isProcessing.value = false
  recordingTime.value = 0
  recognizedText.value = ''
  connectionStatus.value = 'idle'
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isProcessing.value) return
  
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录音（使用WebSocket实时识别）
const startRecording = async () => {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    
    mediaStream.value = stream
    
    // 创建讯飞识别实例
    recognitionInstance.value = createXfyunRecognition()
    
    // 设置回调函数
    recognitionInstance.value.onResult = (text, fullResult) => {
      // 实时更新识别结果（追加模式）
      recognizedText.value += text
    }
    
    recognitionInstance.value.onError = (error) => {
      console.error('识别错误:', error)
      // alert('语音识别失败：' + (error.message || '未知错误')) // 移除alert，保持界面清爽
      connectionStatus.value = 'idle'
      stopRecording()
    }
    
    recognitionInstance.value.onStatusChange = (status) => {
      console.log('识别状态:', status)
      if (status === 'connected') {
        connectionStatus.value = 'connected'
        isRecording.value = true
        
        // 开始计时
        recordingTime.value = 0
        recordingTimer.value = setInterval(() => {
          recordingTime.value++
        }, 1000)
      } else if (status === 'recording') {
        isRecording.value = true
      } else if (status === 'completed') {
        isProcessing.value = false
        isRecording.value = false
        connectionStatus.value = 'completed'
        
        if (recordingTimer.value) {
          clearInterval(recordingTimer.value)
          recordingTimer.value = null
        }
      }
    }
    
    // 开始实时识别
    connectionStatus.value = 'connecting'
    await recognitionInstance.value.startRecognition(
      stream,
      recognitionInstance.value.onResult,
      recognitionInstance.value.onError,
      recognitionInstance.value.onStatusChange
    )
    
  } catch (error) {
    console.error('启动录音失败:', error)
    alert('无法访问麦克风，请检查权限设置')
    connectionStatus.value = 'idle'
    resetState()
  }
}

// 结束录音
const stopRecording = () => {
  if (recognitionInstance.value && isRecording.value) {
    isProcessing.value = true
    recognitionInstance.value.stopRecognition()
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
    
    // 停止媒体流
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
      mediaStream.value = null
    }
    
    isRecording.value = false
    
    // 如果没有识别结果，提示用户
    if (!recognizedText.value.trim()) {
      setTimeout(() => {
        if (!recognizedText.value.trim()) {
          // alert('未识别到语音内容，请重试')
          isProcessing.value = false
        }
      }, 1000)
    } else {
      isProcessing.value = false
    }
  }
}

// 确认使用
const handleConfirm = () => {
  if (recognizedText.value.trim()) {
    emit('confirm', recognizedText.value.trim())
    handleClose()
  }
}

// 关闭弹窗
const handleClose = () => {
  resetState()
  isVisible.value = false
  emit('close')
}

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
</script>

<style scoped>
.voice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.voice-modal {
  background: var(--bg-primary);
  border-radius: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 视觉化区域 */
.voice-visualizer {
  height: 240px;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-top: 2rem;
}

.visualizer-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

/* 核心圆球 */
.core-circle {
  width: 80px;
  height: 80px;
  background: var(--brand-color);
  border-radius: 50%;
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--primary-gradient);
}

.core-circle:active {
  transform: scale(0.95);
}

.core-icon {
  font-size: 2rem;
  color: #fff;
  z-index: 11;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-svg {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: brightness(0) invert(1); /* 将黑色/彩色图标变为白色，以适应深色背景 */
}

/* 状态动画：Idle */
.idle .core-circle {
  animation: breathe 3s infinite ease-in-out;
}

/* 状态动画：Recording */
.recording .core-circle {
  transform: scale(1.1);
}

.recording .ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid var(--brand-color);
  opacity: 0;
  z-index: 1;
}

.recording .ripple-1 {
  width: 100%;
  height: 100%;
  animation: ripple 1.5s infinite linear;
}

.recording .ripple-2 {
  width: 100%;
  height: 100%;
  animation: ripple 1.5s infinite linear 0.5s;
}

.recording .ripple-3 {
  width: 100%;
  height: 100%;
  animation: ripple 1.5s infinite linear 1s;
}

/* 状态动画：Processing */
.processing .core-circle {
  background: var(--text-secondary);
}

.icon-spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* 文本状态 */
.status-display {
  text-align: center;
  z-index: 10;
}

.main-status {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.timer {
  font-size: 0.875rem;
  font-family: monospace;
  color: var(--brand-color);
  background: rgba(79, 70, 229, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

/* 结果展示区 */
.result-area {
  flex: 1;
  min-height: 120px;
  padding: 1rem 1.5rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-scroll {
  width: 100%;
  max-height: 100px;
  overflow-y: auto;
  text-align: center;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-tertiary);
  transition: color 0.3s;
}

.result-area.has-content .result-scroll {
  color: var(--text-primary);
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: var(--brand-color);
  animation: blink 1s step-end infinite;
  vertical-align: middle;
  margin-left: 2px;
}

/* 底部操作栏 */
.action-bar {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.action-btn {
  flex: 1;
  padding: 0.875rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.action-btn.primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  box-shadow: none;
}

/* 关键帧动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(40px) scale(0.95);
    opacity: 0;
  }
  to { 
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes breathe {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(79, 70, 229, 0.2); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
}

@keyframes ripple {
  0% {
    width: 80px;
    height: 80px;
    opacity: 0.8;
    border-width: 4px;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
    border-width: 0px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Dark Mode 适配 */
@media (prefers-color-scheme: dark) {
  /* 如果有系统级的暗色模式支持，可以在这里微调 */
}
</style>
