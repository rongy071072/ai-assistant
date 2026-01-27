<template>
  <div class="home-container">
    <div class="home-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-placeholder">
          <!-- Logo图片将在这里显示 -->
          <span class="logo-text">MagiMimi</span>
        </div>
      </div>

      <!-- 标题和描述 -->
      <div class="title-section">
        <h1 class="main-title">欢迎使用 MagiMimi</h1>
        <p class="subtitle">智能对话，随时为您服务</p>
      </div>

      <!-- 功能按钮 -->
      <div class="action-buttons">
        <button class="btn btn-primary" @click="startChat" id="startChatBtn">
          <span class="btn-icon">💬</span>
          开启会话
        </button>
        <button v-if="isAdmin" class="btn btn-secondary" @click="goToAdmin">
          <span class="btn-icon">⚙️</span>
          管理员入口
        </button>
      </div>
    </div>

    <!-- 背景图片占位 -->
    <div class="background-image"></div>
    
    <!-- ICP备案信息 -->
    <div class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="icp-link">
        ICP备案号：豫ICP备2025157947号-1
      </a>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserId } from '@/utils/jwt'
import { checkUserRole } from '@/api/user'

const router = useRouter()

// 用户权限状态
const isAdmin = ref(false)

// 检查用户权限,前端展示
const checkRole = () => {
  // TODO: 从token或API获取用户角色信息
  // 这里暂时通过localStorage中的用户信息判断
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      isAdmin.value = user.role === 'admin'
    } catch (e) {
      isAdmin.value = false
    }
  }
}

// 开启会话
const startChat = () => {
  if (!localStorage.getItem('userInfo')) {
    router.push('/login')
    return
  }
  router.push('/chat')
}

// 前往管理员中心
const goToAdmin = () => {
  const token = JSON.parse(localStorage.getItem('userInfo')).token
  if (token === null || token === undefined || token === '') {
    router.push('/login')
    return
  }
  if (!isAdmin.value) {
    alert('您没有管理员权限')
    return
  }
  const userId = getUserId()
  const result = checkUserRole(userId)
  if(result.data !== 'admin') {
    alert('请不要耍小聪明！')
    return
  }
  router.push('/admin')
}


// 初始化时检查用户权限
onMounted(() => {
  checkRole()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-primary);
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
  z-index: 0;
  opacity: 1;
  /* 背景图片将在这里显示 */
}

.home-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  max-width: 800px;
}

.logo-section {
  margin-bottom: 3rem;
}

.logo-placeholder {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-section {
  margin-bottom: 3rem;
}

.main-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  letter-spacing: -0.025em;
  line-height: 1.2;
  text-shadow: none;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  box-shadow: none;
}

.btn-primary {
  background: var(--brand-color);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);
}

.btn-primary:hover {
  background: var(--brand-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
  transform: translateY(-1px);
}


.btn-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
    padding: 0 1rem;
  }

  .home-content {
    padding: 1rem;
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .btn {
    width: 100%;
    justify-content: center;
    padding: 0.8rem;
  }
}

/* ICP备案信息样式 */
.icp-footer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.icp-link {
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.icp-link:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}
</style>



