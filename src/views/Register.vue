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
import { ref, reactive, onMounted } from "vue"
import { useRouter } from "vue-router"
import { registerUser, getCaptcha } from "@/api/user"

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

  // 设置加载状态
  isLoading.value = true

  // 校验验证码
  

  try {
    // 调用注册API
    const result = await registerUser({
      name: registerForm.name,
      password: registerForm.password,
      phone: registerForm.phone,
      address: registerForm.address,
      email: registerForm.email,
      captcha: registerForm.captcha
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

    // 注册失败时刷新验证码
    refreshCaptcha()
  } finally {
    // 无论成功还是失败，都要重置加载状态
    isLoading.value = false
  }
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 组件挂载时获取验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style lang="scss" scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.register-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;

  h1 {
    text-align: center;
    color: #333;
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
    color: #555;
    font-size: 14px;
  }

  input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    transition: border-color 0.3s;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: #999;
    }
  }
}

.register-btn {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
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
      border: 1px solid #ddd;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
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
        color: #999;
        font-size: 12px;
        text-align: center;
      }
    }
  }
}
</style>