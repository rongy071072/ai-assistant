<template>
  <div class="register-container">
    <div class="register-box">
      <div class="back-to-home">
        <button class="back-btn" @click="goToHome">
          <span class="back-icon">←</span>
          返回首页
        </button>
      </div>
      <h1>注册账号</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">用户名</label>
          <input
            id="name"
            v-model="registerForm.name"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="registerForm.phone"
            type="tel"
            placeholder="请输入手机号"
            required
          />
        </div>

        <div class="form-group">
          <label for="address">地址</label>
          <input
            id="address"
            v-model="registerForm.address"
            type="text"
            placeholder="请输入地址"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            required
          />
        </div>

        <div class="form-group captcha-group">
          <label for="captcha">验证码</label>
          <div class="captcha-input-container">
            <input
              id="captcha"
              v-model="registerForm.captcha"
              type="text"
              placeholder="请输入验证码"
              required
              maxlength="4"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <div v-else class="captcha-placeholder">点击刷新</div>
            </div>
          </div>
        </div>

        <!-- Cloudflare Turnstile 人机验证 -->
        <div class="form-group">
          <label>人机验证</label>
          <div ref="turnstileRef" class="turnstile-container"></div>
        </div>

        <button type="submit" class="register-btn" :disabled="isLoading">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>

      <div class="footer-link">
        <span>已有账号？</span>
        <router-link to="/login" class="login-link">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { registerUser, getCaptcha } from "@/api/user"
import { turnstileConfig } from "@/config"

const router = useRouter()

const registerForm = reactive({
  name: "",
  password: "",
  phone: "",
  address: "",
  email: "",
  captcha: ""
})

// 加载状态
const isLoading = ref(false)
// 错误信息
const errorMessage = ref("")
// 验证码图片
const captchaImage = ref("")
const captchaId = ref("")

// Turnstile 相关
const turnstileRef = ref(null)
const turnstileToken = ref("")
const turnstileWidgetId = ref(null)

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const result = await getCaptcha()
    if (result.code === 200) {
      // 假设后端返回base64格式的图片数据
      captchaImage.value = result.data.captchaImage
      captchaId.value = result.data.captchaId

    } else {
      console.error('获取验证码失败:', result.message)
      errorMessage.value = '获取验证码失败，请重试'
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    errorMessage.value = '获取验证码失败，请检查网络连接'
  }
}

// 初始化 Turnstile
const initTurnstile = () => {
  // 等待 Turnstile API 加载
  const checkTurnstile = setInterval(() => {
    if (window.turnstile && turnstileRef.value) {
      clearInterval(checkTurnstile)
      
      try {
        // 获取当前环境的 Site Key
        const siteKey = turnstileConfig.getSiteKey()
        console.log(`Turnstile 使用 Site Key: ${siteKey}`)
        console.log(`当前环境: ${import.meta.env.DEV ? '开发环境' : '生产环境'}`)
        console.log(`当前主机名: ${window.location.hostname}`)
        
        // 渲染 Turnstile widget
        turnstileWidgetId.value = window.turnstile.render(turnstileRef.value, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token) => {
            // 验证成功后的回调
            turnstileToken.value = token
            console.log('✅ Turnstile 验证成功，Token:', token.substring(0, 20) + '...')
          },
          'error-callback': (errorCode) => {
            // 验证失败后的回调
            console.error('❌ Turnstile 验证失败，错误码:', errorCode)
            errorMessage.value = '人机验证失败，请刷新页面重试'
          },
          'expired-callback': () => {
            // token 过期后的回调
            console.log('⏰ Turnstile token 已过期')
            turnstileToken.value = ""
          },
          'timeout-callback': () => {
            // 超时后的回调
            console.error('⏱️ Turnstile 验证超时')
            errorMessage.value = '人机验证超时，请重试'
          }
        })
      } catch (error) {
        console.error('💥 Turnstile 初始化失败:', error)
      }
    }
  }, 100)
  
  // 10秒后停止检查
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

const handleRegister = async () => {
  // 重置错误信息
  errorMessage.value = ""

  // 表单验证
  if (!registerForm.name.trim()) {
    errorMessage.value = "请输入用户名"
    return
  }
  if (!registerForm.password.trim()) {
    errorMessage.value = "请输入密码"
    return
  }
  if (!registerForm.phone.trim()) {
    errorMessage.value = "请输入手机号"
    return
  }
  if (!registerForm.address.trim()) {
    errorMessage.value = "请输入地址"
    return
  }
  if (!registerForm.email.trim()) {
    errorMessage.value = "请输入邮箱地址"
    return
  }
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    errorMessage.value = "请输入有效的邮箱地址"
    return
  }
  if (!registerForm.captcha.trim()) {
    errorMessage.value = "请输入验证码"
    return
  }
  
  // 验证 Turnstile token
  if (!turnstileToken.value) {
    errorMessage.value = "请完成人机验证"
    return
  }

  // 设置加载状态
  isLoading.value = true

  try {
    // 调用注册API (将 Turnstile token 也发送给后端)
    const result = await registerUser({
      name: registerForm.name,
      password: registerForm.password,
      phone: registerForm.phone,
      address: registerForm.address,
      email: registerForm.email,
      captcha: registerForm.captcha,
      turnstileToken: turnstileToken.value // 添加 Turnstile token
    })

    // 处理成功响应
    console.log("注册成功:", result)

    // 可以在这里保存用户信息到本地存储或状态管理
    // localStorage.setItem('userToken', result.token)
    // localStorage.setItem('userInfo', JSON.stringify(result.user))

    // 注册成功后跳转到登录页面
    alert("注册成功！请登录")
    router.push("/login")

  } catch (error) {
    // 处理错误响应
    console.error("注册失败:", error)

    // 根据错误类型显示不同消息
    if (error.response) {
      // 服务器返回错误
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        errorMessage.value = data.message || "输入信息有误，请检查后重试"
      } else if (status === 409) {
        errorMessage.value = "用户名已存在，请选择其他用户名"
      } else if (status === 500) {
        errorMessage.value = "服务器错误，请稍后重试"
      } else {
        errorMessage.value = "注册失败，请重试"
      }
    } else if (error.request) {
      // 网络错误
      if (error.isTimeout) {
        errorMessage.value = "请求超时，请检查网络连接"
      } else {
        errorMessage.value = "网络错误，请检查网络连接"
      }
    } else {
      // 其他错误
      errorMessage.value = "注册失败，请重试"
    }

    // 注册失败时刷新验证码和重置 Turnstile
    refreshCaptcha()
    resetTurnstile()
  } finally {
    // 无论成功还是失败，都要重置加载状态
    isLoading.value = false
  }
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 组件挂载时初始化
onMounted(() => {
  refreshCaptcha()
  initTurnstile()
})

// 组件卸载时清理 Turnstile
onUnmounted(() => {
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center; /* 恢复居中对齐 */
  min-height: 100vh; /* 最小高度100vh，内容多时会自动扩展 */
  background: var(--primary-gradient);
  padding: 40px 20px; /* 上下左右都有padding */
}

.register-box {
  background: var(--card-bg);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  /* 移除 margin: auto 0，让 flex 居中处理 */

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 30px;
    font-size: 28px;
  }

  .back-to-home {
    text-align: left;
    margin-bottom: 20px;
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

.register-btn {
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
  margin-top: 10px;
  padding: 8px;
  background: #fdf2f2;
  border: 1px solid #f5c6cb;
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

    .captcha-image {
      width: 100px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      transition: border-color 0.3s;

      &:hover {
        border-color: #667eea;
      }

      img {
        width: 100%;
        height: 100%;
        border-radius: 4px;
        object-fit: cover;
      }

      .captcha-placeholder {
        color: var(--text-tertiary);
        font-size: 12px;
        text-align: center;
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

.footer-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);

  .login-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    margin-left: 5px;
    transition: color 0.3s;

    &:hover {
      color: #5a67d8;
      text-decoration: underline;
    }
  }
}

// 响应式样式
@media (max-height: 800px) {
  .register-container {
    padding: 20px 20px; // 小屏幕减少上下padding
  }
  
  .register-box {
    padding: 30px; // 减少内边距
    margin: 0; // 移除自动居中，让内容从顶部开始
    
    h1 {
      margin-bottom: 20px; // 减少标题下边距
      font-size: 24px; // 减小字体
    }
    
    form {
      gap: 16px; // 减少表单项之间的间距
    }
  }
  
  .form-group {
    gap: 6px; // 减少标签和输入框之间的间距
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 15px 15px;
  }
  
  .register-box {
    padding: 25px 20px;
    max-width: 100%;
  }
}
</style>