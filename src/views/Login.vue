<template>
  <div class="login-container">
    <div class="login-box">
      <div class="back-to-home">
        <button class="back-btn" @click="goToHome">
          <span class="back-icon">←</span>
          返回首页
        </button>
      </div>
      <h1>登录</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            placeholder="请输入邮箱"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <!-- Cloudflare Turnstile 人机验证 -->
        <div class="form-group">
          <label>人机验证</label>
          <div ref="turnstileRef" class="turnstile-container"></div>
          <span v-if="turnstileToken" class="turnstile-status success">人机验证已通过</span>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="footer-links">
        <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
        <div class="register-entry">
          <span>没有账号？</span>
          <router-link to="/register" class="register-link">去注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { loginUser } from "@/api/user"
import { turnstileConfig } from "@/config"

const router = useRouter()
const route = useRoute()

const loginForm = reactive({
  email: "",
  password: ""
})

// 加载状态
const isLoading = ref(false)
// 错误信息
const errorMessage = ref("")

// Turnstile 相关
const turnstileRef = ref(null)
const turnstileToken = ref("")
const turnstileWidgetId = ref(null)

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

const handleLogin = async () => {
  // 重置错误信息
  errorMessage.value = ""

  // 表单验证
  if (!loginForm.email.trim()) {
    errorMessage.value = "请输入邮箱"
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(loginForm.email)) {
    errorMessage.value = "请输入有效的邮箱地址"
    return
  }
  if (!loginForm.password.trim()) {
    errorMessage.value = "请输入密码"
    return
  }

  // 验证 Turnstile token
  if (!turnstileToken.value) {
    errorMessage.value = "请完成人机验证"
    return
  }

  isLoading.value = true

  try {
    const result = await loginUser({
      email: loginForm.email,
      password: loginForm.password,
      turnstileToken: turnstileToken.value
    })
    const code = result.code

    if (code === 200) {
      // 保存用户信息到 localStorage（含头像 avatar）
      const userInfo = {
        token: result.data.token,
        role: result.data.user.role,
        name: result.data.user.name,
        address: result.data.user.address,
        email: result.data.user.email,
        lastLoginTime: result.data.user.lastLoginTime,
        avatar: result.data.user.avatar,
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      // alert('登录成功！')
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      errorMessage.value = result.message || "登录失败，请重试"
      resetTurnstile()
    }
  } catch (error) {
    console.error('登录失败:', error)
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || "登录失败，请联系管理员"
    } else {
      errorMessage.value = "登录失败，请检查网络连接"
    }
    resetTurnstile()
  } finally {
    isLoading.value = false
  }
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 组件挂载时初始化 Turnstile
onMounted(() => {
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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--primary-gradient);
  padding: 40px 20px;
}

.login-box {
  background: var(--card-bg);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 30px;
    font-size: 28px;
  }

  .back-to-home {
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

.login-btn {
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

.footer-links {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .forgot-link {
    color: #667eea;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;

    &:hover {
      color: #5a67d8;
      text-decoration: underline;
    }
  }

  .register-entry {
    font-size: 14px;
    color: var(--text-secondary);

    .register-link {
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
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px 15px;
  }
  
  .login-box {
    padding: 25px 20px;
    max-width: 100%;
  }
}
</style>
