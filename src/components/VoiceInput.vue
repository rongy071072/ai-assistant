<template>
  <div v-if="isVisible" class="voice-modal-overlay" @click.self="handleClose">
    <div class="voice-modal">
      <div class="voice-modal-header">
        <h3>语音输入</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="voice-modal-content">
        <!-- 录音状态显示 -->
        <div class="recording-status">
          <div class="recording-indicator" :class="{ 'recording': isRecording, 'processing': isProcessing }">
            <!-- 未录音状态：显示波浪线动画 -->
            <div v-if="!isRecording && !isProcessing" class="idle-waves">
              <svg class="wave-svg" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <path class="wave-path wave-1" d="M0,40 Q25,20 50,40 T100,40 T150,40 T200,40 T250,40 T300,40" />
                <path class="wave-path wave-2" d="M0,40 Q25,25 50,40 T100,40 T150,40 T200,40 T250,40 T300,40" />
                <path class="wave-path wave-3" d="M0,40 Q25,30 50,40 T100,40 T150,40 T200,40 T250,40 T300,40" />
              </svg>
            </div>
            
            <!-- 录音中状态：显示麦克风图标和波形 -->
            <div v-if="isRecording" class="mic-icon-wrapper">
              <span class="mic-icon">🎤</span>
              <div class="recording-waves">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <!-- 处理中状态：显示加载图标 -->
            <div v-if="isProcessing" class="processing-icon">
              <span class="mic-icon">⏳</span>
            </div>
            
            <p v-if="statusText" class="status-text">
              {{ statusText }}
            </p>
            <p v-if="isRecording" class="recording-time">{{ formatTime(recordingTime) }}</p>
          </div>
        </div>
        
        <!-- 识别结果显示 -->
        <div v-if="recognizedText" class="recognized-text">
          <p class="text-label">识别结果：</p>
          <div class="text-content">{{ recognizedText }}</div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="voice-actions">
          <button 
            v-if="!isRecording && !isProcessing"
            class="start-btn"
            @click="startRecording"
          >
            <span>🎙️</span> 开始讲话
          </button>
          
          <button 
            v-if="isRecording"
            class="stop-btn"
            @click="stopRecording"
          >
            <span>⏹️</span> 结束讲话
          </button>
          
          <button 
            v-if="isProcessing"
            class="processing-btn"
            disabled
          >
            <span>⏳</span> 识别中...
          </button>
          
          <button 
            v-if="recognizedText && !isRecording && !isProcessing"
            class="confirm-btn"
            @click="handleConfirm"
          >
            <span>✓</span> 确认使用
          </button>
          
          <button 
            v-if="recognizedText && !isRecording && !isProcessing"
            class="cancel-btn"
            @click="handleCancel"
          >
            <span>✕</span> 取消
          </button>
        </div>
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
const statusText = computed(() => {
  if (connectionStatus.value === 'connecting') {
    return '正在连接...'
  } else if (isProcessing.value) {
    return '正在识别语音...'
  } else if (isRecording.value) {
    return '正在录音，请说话...'
  } else {
    return '' // 未录音时不显示文字，只显示波浪线
  }
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
      alert('语音识别失败：' + (error.message || '未知错误'))
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
          alert('未识别到语音内容，请重试')
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

// 取消
const handleCancel = () => {
  handleClose()
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.voice-modal {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

.voice-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.voice-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.voice-modal-content {
  padding: 2rem 1.5rem;
}

.recording-status {
  text-align: center;
  margin-bottom: 2rem;
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* 未录音状态：波浪线动画 */
.idle-waves {
  width: 100%;
  max-width: 300px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.wave-svg {
  width: 100%;
  height: 100%;
}

.wave-path {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  transform-origin: 150px 40px;
}

.wave-1 {
  stroke: #667eea;
  animation: waveMove1 2s ease-in-out infinite;
}

.wave-2 {
  stroke: #764ba2;
  opacity: 0.7;
  animation: waveMove2 2s ease-in-out infinite 0.3s;
}

.wave-3 {
  stroke: #667eea;
  opacity: 0.5;
  animation: waveMove3 2s ease-in-out infinite 0.6s;
}

.mic-icon-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-icon {
  font-size: 3rem;
  display: block;
}

.recording-indicator.recording .mic-icon-wrapper {
  animation: pulse 1.5s ease-in-out infinite;
}

.recording-waves {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.recording-waves span {
  width: 4px;
  height: 40px;
  background: #667eea;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.recording-waves span:nth-child(1) {
  animation-delay: 0s;
}

.recording-waves span:nth-child(2) {
  animation-delay: 0.2s;
  height: 60px;
}

.recording-waves span:nth-child(3) {
  animation-delay: 0.4s;
}

.recording-indicator.processing .mic-icon {
  animation: spin 2s linear infinite;
}

.status-text {
  font-size: 1rem;
  color: #4a5568;
  margin: 0;
}

.recording-time {
  font-size: 1.5rem;
  font-weight: 600;
  color: #667eea;
  margin: 0;
  font-family: monospace;
}

.recognized-text {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.text-label {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 0.5rem 0;
}

.text-content {
  font-size: 1rem;
  color: #2d3748;
  line-height: 1.6;
  min-height: 60px;
}

.voice-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.voice-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.start-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.stop-btn {
  background: #e53e3e;
  color: #fff;
  box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
}

.stop-btn:hover {
  background: #c53030;
  transform: translateY(-1px);
}

.processing-btn {
  background: #cbd5e0;
  color: #4a5568;
  cursor: not-allowed;
}

.confirm-btn {
  background: #48bb78;
  color: #fff;
}

.confirm-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #edf2f7;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes waveMove1 {
  0%, 100% {
    transform: scaleY(0.8) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scaleY(1.2) translateY(-8px);
    opacity: 0.8;
  }
}

@keyframes waveMove2 {
  0%, 100% {
    transform: scaleY(0.9) translateY(0);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1.1) translateY(-6px);
    opacity: 0.9;
  }
}

@keyframes waveMove3 {
  0%, 100% {
    transform: scaleY(0.7) translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1.0) translateY(-4px);
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .voice-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .voice-modal-content {
    padding: 1.5rem 1rem;
  }
  
  .mic-icon-wrapper {
    width: 80px;
    height: 80px;
  }
  
  .mic-icon {
    font-size: 2.5rem;
  }
  
  .voice-actions {
    flex-direction: column;
  }
  
  .voice-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>

