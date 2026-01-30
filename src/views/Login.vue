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
          <label for="phone">账号</label>
          <input
            id="phone"
            v-model="loginForm.phone"
            type="phone"
            placeholder="请输入账号"
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

        <div class="form-group captcha-group">
          <label for="captcha">验证码</label>
          <div class="captcha-input-container">
            <input
              id="captcha"
              v-model="loginForm.captcha"
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

        <button type="submit" class="login-btn">登录</button>
      </form>
      
      <div class="footer-link">
        <span>没有账号？</span>
        <router-link to="/register" class="register-link">去注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { loginUser, getCaptcha } from "@/api/user"

const router = useRouter()
const route = useRoute()

const loginForm = reactive({
  phone: "",
  password: "",
  captcha: ""
})

// 验证码图片
const captchaImage = ref("")
const captchaId = ref("")

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
      alert('获取验证码失败，请重试')
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    alert('获取验证码失败，请检查网络连接')
  }
}

const handleLogin = async () => {
  // 表单验证
  if (!loginForm.captcha.trim()) {
    alert('请输入验证码')
    return
  }

  try {
    // 调用登录API
    const result = await loginUser(loginForm)
    const code = result.code

    if (code === 200) {
      // 保存token到localStorage
      const userInfo = {
        token: result.data.token,
        role: result.data.user.role,
        name: result.data.user.name,
        address: result.data.user.address,
        phone: result.data.user.phone,
        email: result.data.user.email,
        lastLoginTime: result.data.user.lastLoginTime,
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      // 显示成功消息
      alert('登录成功！')
      // 登录成功后跳转到来源页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      alert(result.message)
      // 登录失败时刷新验证码
      refreshCaptcha()
    }
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请联系管理员...')
    // 登录失败时刷新验证码
    refreshCaptcha()
  }
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 组件挂载时获取验证码
onMounted(() => {
  refreshCaptcha()
})</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--primary-gradient);
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
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
</style>