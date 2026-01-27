<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1>AI 助手</h1>
      </div>

      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleMenu" :class="{ 'active': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="navbar-menu" :class="{ 'is-open': isMenuOpen }">
        <router-link to="/" class="nav-link" :class="{ active: $route.name === 'Home' }" @click="closeMenu">
          首页
        </router-link>
        <router-link to="/chat" class="nav-link" :class="{ active: $route.name === 'Chat' }" @click="closeMenu">
          对话
        </router-link>
        <router-link to="/profile" class="nav-link" :class="{ active: $route.name === 'Profile' }" @click="closeMenu">
          个人中心
        </router-link>
      </div>

      <div class="navbar-user">
        <UserProfile />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import UserProfile from '@/components/UserProfile.vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand h1 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

.navbar-user {
  display: flex;
  align-items: center;
}

/* 移动端菜单按钮默认隐藏 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background-color: white;
  border-radius: 10px;
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
}

/* 汉堡菜单动画 */
.mobile-menu-btn.active span:first-child {
  transform: rotate(45deg);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg);
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }

  .navbar-brand h1 {
    font-size: 1.2rem;
  }

  .mobile-menu-btn {
    display: flex;
  }

  /* 移动端菜单样式 */
  .navbar-menu {
    position: fixed;
    top: 60px; /* Navbar height */
    left: 0;
    width: 100%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 50%, rgba(240, 147, 251, 0.95) 100%);
    flex-direction: column;
    align-items: center;
    padding: 2rem 0;
    gap: 1.5rem;
    transform: translateY(-150%);
    transition: transform 0.3s ease-in-out;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    z-index: 999;
  }

  .navbar-menu.is-open {
    transform: translateY(0);
  }

  .nav-link {
    font-size: 1.1rem;
    width: 80%;
    text-align: center;
    padding: 0.8rem;
  }
}
</style>