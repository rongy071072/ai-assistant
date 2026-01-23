import CryptoJS from 'crypto-js'
import { apiConfig } from '@/config'

/**
 * 讯飞语音转文字API（WebSocket流式版）
 * 参考文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */
export class XfyunSpeechRecognition {
  constructor(options = {}) {
    this.config = {
      ...apiConfig.xfyun,
      ...options
    }
    this.ws = null
    this.audioContext = null
    this.mediaStream = null
    this.audioProcessor = null
    this.isRecording = false
    this.onResult = null
    this.onError = null
    this.onStatusChange = null
  }

  /**
   * 生成WebSocket鉴权URL
   * @returns {string} 带鉴权参数的WebSocket URL
   */
  generateAuthUrl() {
    const { wsUrl, appId, apiKey, apiSecret } = this.config
    
    if (!appId || !apiKey || !apiSecret) {
      throw new Error('讯飞API配置不完整，请设置appId、apiKey和apiSecret')
    }

    // 生成鉴权参数
    const host = 'iat-api.xfyun.cn'
    const path = '/v2/iat'
    const date = new Date().toUTCString()
    
    // 生成签名
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    const signature = CryptoJS.enc.Base64.stringify(signatureSha)
    
    // 生成authorization
    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    const authorization = btoa(authorizationOrigin)
    
    // 构建URL
    const url = `${wsUrl}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`
    
    return url
  }

  /**
   * 初始化WebSocket连接
   */
  initWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        const url = this.generateAuthUrl()
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('讯飞WebSocket连接已建立')
          this.onStatusChange?.('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          this.onError?.(error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket连接已关闭')
          this.onStatusChange?.('closed')
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 处理WebSocket消息
   */
  handleMessage(data) {
    try {
      const result = JSON.parse(data)
      const code = result.code

      if (code === 0) {
        // 识别成功
        const data = result.data
        if (data && data.result) {
          const ws = data.result.ws
          if (ws && ws.length > 0) {
            let text = ''
            ws.forEach(item => {
              if (item.cw && item.cw.length > 0) {
                item.cw.forEach(word => {
                  text += word.w
                })
              }
            })
            
            if (text) {
              this.onResult?.(text, result)
            }
          }
        }
        
        // 检查是否结束
        if (data.status === 2) {
          // 识别结束
          this.onStatusChange?.('completed')
        }
      } else {
        // 识别错误
        console.error('识别错误:', result.message)
        this.onError?.(new Error(result.message || '识别失败'))
      }
    } catch (error) {
      console.error('解析识别结果失败:', error)
    }
  }

  /**
   * 发送音频数据
   * @param {ArrayBuffer} audioData - 音频数据
   * @param {number} status - 0-第一帧，1-中间帧，2-最后一帧
   */
  sendAudio(audioData, status = 1) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 将音频数据转换为base64
      const base64 = this.arrayBufferToBase64(audioData)
      
      // 构建数据帧
      const data = {
        common: {
          app_id: this.config.appId
        },
        business: {
          ...this.config.business
        },
        data: {
          status: status, // 0-第一帧，1-中间帧，2-最后一帧
          format: this.config.audio.format,
          audio: base64,
          encoding: this.config.audio.encoding
        }
      }

      this.ws.send(JSON.stringify(data))
    }
  }

  /**
   * 发送结束帧
   */
  sendEndFrame() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const data = {
        common: {
          app_id: this.config.appId
        },
        business: {
          ...this.config.business
        },
        data: {
          status: 2, // 最后一帧
          format: this.config.audio.format,
          audio: '',
          encoding: this.config.audio.encoding
        }
      }
      this.ws.send(JSON.stringify(data))
    }
  }

  /**
   * 开始实时识别
   */
  async startRecognition(mediaStream, onResult, onError, onStatusChange) {
    this.onResult = onResult
    this.onError = onError
    this.onStatusChange = onStatusChange
    this.mediaStream = mediaStream

    try {
      // 初始化WebSocket连接
      await this.initWebSocket()

      // 初始化AudioContext处理音频流
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.audio.rate
      })

      const source = this.audioContext.createMediaStreamSource(mediaStream)
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (e) => {
        if (this.isRecording) {
          const inputData = e.inputBuffer.getChannelData(0)
          // 转换为PCM格式
          const pcmData = this.floatTo16BitPCM(inputData)
          // 发送中间帧
          this.sendAudio(pcmData, 1)
        }
      }

      source.connect(processor)
      processor.connect(this.audioContext.destination)
      this.audioProcessor = processor

      this.isRecording = true
      this.onStatusChange?.('recording')

      // 发送第一帧（空数据，用于初始化）
      this.sendAudio(new ArrayBuffer(0), 0)
    } catch (error) {
      console.error('启动识别失败:', error)
      this.onError?.(error)
      throw error
    }
  }

  /**
   * 停止识别
   */
  stopRecognition() {
    this.isRecording = false

    // 发送结束帧
    this.sendEndFrame()

    // 清理资源
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // 延迟关闭WebSocket，确保最后一帧发送完成
    setTimeout(() => {
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
    }, 500)
  }

  /**
   * Float32Array转16位PCM
   */
  floatTo16BitPCM(input) {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    let offset = 0
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
    return buffer
  }

  /**
   * ArrayBuffer转Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

/**
 * 创建讯飞语音识别实例
 */
export const createXfyunRecognition = (options) => {
  return new XfyunSpeechRecognition(options)
}
