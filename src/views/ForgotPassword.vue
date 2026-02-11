<template>
  <div class="forgot-container">
    <div class="forgot-box">
      <div class="back-to-login">
        <button class="back-btn" @click="goToLogin">
          <span class="back-icon">←</span>
          返回登录
        </button>
      </div>
      <h1>找回密码</h1>

      <!-- 步骤指示器 -->
      <div class="steps">
        <div class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
          <span class="step-num">1</span>
          <span class="step-label">验证邮箱</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep >= 2 }">
          <span class="step-num">2</span>
          <span class="step-label">重置密码</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <!-- 第一步：验证邮箱 -->
        <template v-if="currentStep === 1">
          <div class="form-group">
            <label for="email">邮箱地址</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="请输入注册时使用的邮箱"
              required
            />
          </div>

          <!-- Cloudflare Turnstile 人机验证 -->
          <div class="form-group">
            <label>人机验证</label>
            <div ref="turnstileRef" class="turnstile-container"></div>
            <span v-if="turnstileToken" class="turnstile-status success">人机验证已通过</span>
          </div>

          <div class="form-group captcha-group">
            <label for="captcha">邮箱验证码</label>
            <div class="captcha-input-container">
              <input
                id="captcha"
                v-model="formData.captcha"
                type="text"
                placeholder="请输入邮箱验证码"
                required
                maxlength="6"
              />
              <button
                type="button"
                class="send-captcha-btn"
                :disabled="!turnstileToken || isSending || countdown > 0"
                @click="sendCaptcha"
                :title="!turnstileToken ? '请先完成人机验证' : ''"
              >
                {{ countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码' }}
              </button>
            </div>
            <span v-if="!turnstileToken" class="captcha-hint">请先完成上方人机验证后获取验证码</span>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? '验证中...' : '下一步' }}
          </button>
        </template>

        <!-- 第二步：设置新密码 -->
        <template v-if="currentStep === 2">
          <div class="form-group">
            <label>当前邮箱</label>
            <div class="email-display">{{ formData.email }}</div>
          </div>

          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              required
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? '重置中...' : '重置密码' }}
          </button>
        </template>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 成功信息显示 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { sendEmailCaptcha, validateEmailCaptcha, resetPassword } from "@/api/user"
import { turnstileConfig } from "@/config"

const router = useRouter()

const formData = reactive({
  email: "",
  captcha: "",
  newPassword: "",
  confirmPassword: ""
})

// 当前步骤：1-验证邮箱 2-设置新密码
const currentStep = ref(1)
// 加载状态
const isLoading = ref(false)
// 错误/成功信息
const errorMessage = ref("")
const successMessage = ref("")
// 邮箱验证码相关
const captchaId = ref("")
const isSending = ref(false)
const countdown = ref(0)
let countdownTimer = null

// Turnstile 相关
const turnstileRef = ref(null)
const turnstileToken = ref("")
const turnstileWidgetId = ref(null)

// 开始倒计时（60秒）
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 发送邮箱验证码
const sendCaptcha = async () => {
  if (!turnstileToken.value) {
    errorMessage.value = "请先完成人机验证"
    return
  }
  if (!formData.email.trim()) {
    errorMessage.value = "请先输入邮箱地址"
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errorMessage.value = "请输入有效的邮箱地址"
    return
  }

  isSending.value = true
  errorMessage.value = ""

  try {
    const result = await sendEmailCaptcha(formData.email)
    if (result.code === 200) {
      captchaId.value = result.data
      startCountdown()
      successMessage.value = "验证码已发送，请查收邮箱"
      // 3秒后清除成功提示
      setTimeout(() => { successMessage.value = "" }, 3000)
    } else {
      errorMessage.value = result.message || "发送验证码失败，请重试"
    }
  } catch (error) {
    console.error("发送验证码失败:", error)
    errorMessage.value = "发送验证码失败，请检查网络连接"
  } finally {
    isSending.value = false
  }
}

// 初始化 Turnstile
const initTurnstile = () => {
  const checkTurnstile = setInterval(() => {
    if (window.turnstile && turnstileRef.value) {
      clearInterval(checkTurnstile)
      
      try {
        const siteKey = turnstileConfig.getSiteKey()
        
        turnstileWidgetId.value = window.turnstile.render(turnstileRef.value, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token) => {
            turnstileToken.value = token
          },
          'error-callback': (errorCode) => {
            console.error('Turnstile 验证失败，错误码:', errorCode)
            turnstileToken.value = ""
            errorMessage.value = '人机验证失败，请重新验证'
            resetTurnstile()
          },
          'expired-callback': () => {
            turnstileToken.value = ""
            errorMessage.value = '人机验证已过期，请重新验证'
            resetTurnstile()
          },
          'timeout-callback': () => {
            turnstileToken.value = ""
            errorMessage.value = '人机验证超时，正在重新加载...'
            resetTurnstile()
          }
        })
      } catch (error) {
        console.error('Turnstile 初始化失败:', error)
      }
    }
  }, 100)
  
  setTimeout(() => clearInterval(checkTurnstile), 10000)
}

// 重置 Turnstile
const resetTurnstile = () => {
  if (window.turnstile && turnstileWidgetId.value !== null) {
    try {
      window.turnstile.reset(turnstileWidgetId.value)
      turnstileToken.value = ""
    } catch (error) {
      console.error('重置 Turnstile 失败:', error)
    }
  }
}

// 处理表单提交（根据当前步骤）
const handleSubmit = async () => {
  errorMessage.value = ""
  successMessage.value = ""

  if (currentStep.value === 1) {
    await handleVerifyEmail()
  } else if (currentStep.value === 2) {
    await handleResetPassword()
  }
}

// 第一步：验证邮箱验证码
const handleVerifyEmail = async () => {
  if (!formData.email.trim()) {
    errorMessage.value = "请输入邮箱地址"
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errorMessage.value = "请输入有效的邮箱地址"
    return
  }
  if (!formData.captcha.trim()) {
    errorMessage.value = "请输入邮箱验证码"
    return
  }
  if (!captchaId.value) {
    errorMessage.value = "请先获取邮箱验证码"
    return
  }

  isLoading.value = true

  try {
    const result = await validateEmailCaptcha(captchaId.value, formData.captcha)
    if (result.code === 200) {
      // 验证码验证通过，进入第二步
      currentStep.value = 2
      errorMessage.value = ""
    } else {
      errorMessage.value = result.message || "验证码验证失败"
    }
  } catch (error) {
    console.error("验证码验证失败:", error)
    errorMessage.value = "验证失败，请检查网络连接"
  } finally {
    isLoading.value = false
  }
}

// 第二步：重置密码
const handleResetPassword = async () => {
  if (!formData.newPassword.trim()) {
    errorMessage.value = "请输入新密码"
    return
  }
  if (formData.newPassword.length < 6) {
    errorMessage.value = "密码长度不能少于6位"
    return
  }
  if (formData.newPassword !== formData.confirmPassword) {
    errorMessage.value = "两次输入的密码不一致"
    return
  }

  isLoading.value = true

  try {
    const result = await resetPassword(
      formData.email,
      formData.newPassword
    )

    if (result.code === 200) {
      successMessage.value = "密码重置成功，即将跳转到登录页面..."
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } else {
      errorMessage.value = result.message || "密码重置失败，请重试"
    }
  } catch (error) {
    console.error("密码重置失败:", error)
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || "密码重置失败，请重试"
    } else {
      errorMessage.value = "密码重置失败，请检查网络连接"
    }
  } finally {
    isLoading.value = false
  }
}

// 返回登录页
const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  initTurnstile()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (window.turnstile && turnstileWidgetId.value !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId.value)
    } catch (error) {
      console.error('移除 Turnstile widget 失败:', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.forgot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--primary-gradient);
  padding: 40px 20px;
}

.forgot-box {
  background: var(--card-bg);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 20px;
    font-size: 28px;
  }

  .back-to-login {
    text-align: left;
  }

  .back-btn {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 0;
    transition: color 0.3s;

    &:hover {
      color: #5a67d8;
    }

    .back-icon {
      font-size: 16px;
      font-weight: bold;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// 步骤指示器
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 0;

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .step-num {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #ddd;
      color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 12px;
      color: #999;
      transition: color 0.3s;
    }

    &.active {
      .step-num {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .step-label {
        color: #667eea;
        font-weight: 600;
      }
    }

    &.done {
      .step-num {
        background: #27ae60;
        color: white;
      }
      .step-label {
        color: #27ae60;
      }
    }
  }

  .step-line {
    width: 60px;
    height: 2px;
    background: #ddd;
    margin: 0 12px;
    margin-bottom: 22px;
    transition: background 0.3s;

    &.active {
      background: #27ae60;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 14px;
  }

  input {
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 5px;
    font-size: 14px;
    transition: border-color 0.3s;
    background: var(--input-bg);
    color: var(--text-primary);

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: var(--text-tertiary);
    }
  }
}

.email-display {
  padding: 12px;
  background: var(--bg-tertiary, #f5f5f5);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 14px;
  color: var(--text-primary);
}

.submit-btn {
  padding: 12px;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background: #fdf2f2;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.success-message {
  color: #27ae60;
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
}

.captcha-group {
  .captcha-input-container {
    display: flex;
    gap: 10px;
    align-items: center;

    input {
      flex: 1;
    }

    .send-captcha-btn {
      white-space: nowrap;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.3s, transform 0.2s;
      min-width: 130px;
      text-align: center;

      &:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: #999;
      }
    }
  }
}

.turnstile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 65px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--input-bg);
}

.turnstile-status {
  font-size: 12px;
  margin-top: 4px;

  &.success {
    color: #27ae60;
  }
}

.captcha-hint {
  font-size: 12px;
  color: #e67e22;
  margin-top: 4px;
}

@media (max-width: 480px) {
  .forgot-container {
    padding: 15px 15px;
  }
  
  .forgot-box {
    padding: 25px 20px;
    max-width: 100%;
  }
}
</style>
