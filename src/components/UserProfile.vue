<template>
  <div class="user-profile" @click="handleClick">
    <div v-if="!isLoggedIn" class="not-logged-in">
      未登录
    </div>
    <div v-else class="logged-in">
      <img :src="avatar" alt="头像" class="avatar" />
      <span class="username">{{ username }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 用户信息
const userInfo = ref(null)

const isLoggedIn = ref(false)

const username = computed(() => {
  return userInfo.value ? userInfo.value.username || userInfo.value.name : ''
})

const avatar = computed(() => {
  // 这里可以从用户信息中获取头像URL，如果没有则使用默认头像
  return 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#e0e0e0"/><circle cx="16" cy="12" r="5" fill="#999"/><path d="M6 26c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#999"/></svg>')

})

// 检查登录状态
const checkLoginStatus = () => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    try {
      userInfo.value = JSON.parse(storedUserInfo)
      isLoggedIn.value = true
    } catch (e) {
      userInfo.value = null
      isLoggedIn.value = false
    }
  } else {
    userInfo.value = null
    isLoggedIn.value = false
  }
}

// 点击处理
const handleClick = () => {
  console.log('点击处理')
  if (!isLoggedIn.value) {
    router.push('/login')
  } else {
    router.push('/profile')
  }
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.user-profile {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.2);
}

.not-logged-in {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.logged-in {
  display: flex;
  align-items: center;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.username {
  font-size: 14px;
  color: white;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
</style>