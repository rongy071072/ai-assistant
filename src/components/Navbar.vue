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
        <ThemeToggle />
        <UserProfile />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import UserProfile from '@/components/UserProfile.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

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
  background: var(--navbar-bg);
  box-shadow: var(--shadow-sm);
  border-bottom: var(--navbar-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.navbar-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand h1 {
  color: var(--navbar-text);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
  margin-right: auto; /* Push user section to the right */
  margin-left: 3rem;  /* Add space after brand */
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: var(--brand-color);
  background: var(--bg-tertiary);
}

.nav-link.active {
  color: var(--brand-color);
  background: var(--bg-tertiary);
  font-weight: 600;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* Increased gap from 1rem */
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
  height: 2px;
  background-color: var(--text-primary);
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
    background: var(--navbar-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-direction: column;
    align-items: center;
    padding: 2rem 0;
    gap: 1.5rem;
    transform: translateY(-150%);
    transition: transform 0.3s ease-in-out;
    box-shadow: var(--shadow-lg);
    z-index: 999;
    border-bottom: var(--navbar-border);
    margin: 0; /* Override desktop margin */
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