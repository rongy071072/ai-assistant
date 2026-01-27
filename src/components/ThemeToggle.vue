<template>
  <button 
    class="theme-toggle" 
    @click="toggleTheme" 
    :title="isDark ? '切换亮色模式' : '切换暗黑模式'"
    aria-label="Toggle Theme"
  >
    <div class="toggle-track">
      <div class="toggle-thumb">
        <span v-if="isDark" class="icon moon">🌙</span>
        <span v-else class="icon sun">☀️</span>
      </div>
    </div>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const updateTheme = () => {
  const root = document.documentElement
  if (isDark.value) {
    root.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    root.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    updateTheme()
  } else if (savedTheme === 'light') {
    isDark.value = false
    updateTheme()
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDark.value = true
      updateTheme()
    }
  }
})
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.toggle-track {
  width: 50px;
  height: 26px;
  background-color: #cbd5e1;
  border-radius: 20px;
  position: relative;
  transition: background-color 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

[data-theme="dark"] .toggle-track {
  background-color: rgba(255, 255, 255, 0.1); /* Update local scoped style as well if needed */
}

.toggle-thumb {
  width: 22px;
  height: 22px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.icon {
  font-size: 14px;
  line-height: 1;
}

/* Dark mode state for the thumb */
.theme-toggle:hover .toggle-thumb {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

/* When dark is active */
/* Note: We use the logic in script to set isDark, so we can use a class or just rely on the [data-theme] selector if we passed props, but here we use the local state to animate */
</style>

<style>
/* Global styles for the toggle animation based on data-theme attribute on root */
[data-theme="dark"] .toggle-track {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .toggle-thumb {
  transform: translateX(24px);
  background-color: #000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>