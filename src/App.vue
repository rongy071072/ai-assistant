<template>
  <div id="app" :class="{ 'has-navbar': !isAuthPage }">
    <Navbar v-if="!isAuthPage" />
    <router-view v-slot="{ Component }">
      <component :is="Component" :key="$route.fullPath" />
    </router-view>
  </div>
</template>

<script setup>
import { computed, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const route = useRoute()

// 捕获子组件错误
onErrorCaptured((err) => {
  console.error('App Captured Error:', err)
  return false
})

// 定义不需要显示 Navbar 的页面
const authPages = ['Login', 'Register']

const isAuthPage = computed(() => {
  return authPages.includes(route.name)
})

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const root = document.documentElement
  if (savedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (savedTheme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark') // Optional: save system preference
    }
  }
}

initTheme()
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh; /* 改为 min-height，允许内容超出时扩展 */
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 禁止横向滚动 */
}

/* 为有导航栏的页面添加顶部间距 */
#app.has-navbar {
  padding-top: 60px;
  height: 100vh; /* 有导航栏的页面固定高度 */
  overflow: hidden; /* 有导航栏的页面内部组件自己处理滚动 */
}
</style>



