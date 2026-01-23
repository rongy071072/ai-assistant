<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1>AI 助手</h1>
      </div>

      <div class="navbar-menu">
        <router-link to="/" class="nav-link" :class="{ active: $route.name === 'Home' }">
          首页
        </router-link>
        <router-link to="/chat" class="nav-link" :class="{ active: $route.name === 'Chat' }">
          对话
        </router-link>
        <router-link to="/profile" class="nav-link" :class="{ active: $route.name === 'Profile' }">
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
import UserProfile from '@/components/UserProfile.vue'
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

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }

  .navbar-brand h1 {
    font-size: 1.2rem;
  }

  .navbar-menu {
    gap: 1rem;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>