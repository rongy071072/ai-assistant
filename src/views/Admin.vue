<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>管理员中心</h1>
      <button class="btn btn-secondary" @click="goBack">返回</button>
    </div>

    <div class="admin-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>总用户数</h3>
            <p class="stat-number">{{ totalUsers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <h3>总对话数</h3>
            <p class="stat-number">{{ totalChats }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>今日活跃</h3>
            <p class="stat-number">{{ todayActive }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <h3>系统状态</h3>
            <p class="stat-status">正常</p>
          </div>
        </div>
      </div>

      <div class="admin-menu">
        <div class="menu-section">
          <h2>用户管理</h2>
          <div class="menu-item" @click="manageUsers">
            <span class="icon">👥</span>
            <span>用户列表</span>
            <span class="arrow">></span>
          </div>
          <div class="menu-item" @click="userPermissions">
            <span class="icon">🔐</span>
            <span>权限管理</span>
            <span class="arrow">></span>
          </div>
        </div>

        <div class="menu-section">
          <h2>内容管理</h2>
          <div class="menu-item" @click="manageContent">
            <span class="icon">📝</span>
            <span>内容审核</span>
            <span class="arrow">></span>
          </div>
          <div class="menu-item" @click="chatHistory">
            <span class="icon">📚</span>
            <span>对话记录</span>
            <span class="arrow">></span>
          </div>
        </div>

        <div class="menu-section">
          <h2>系统设置</h2>
          <div class="menu-item" @click="systemSettings">
            <span class="icon">⚙️</span>
            <span>系统配置</span>
            <span class="arrow">></span>
          </div>
          <div class="menu-item" @click="dataBackup">
            <span class="icon">💾</span>
            <span>数据备份</span>
            <span class="arrow">></span>
          </div>
          <div class="menu-item" @click="logs">
            <span class="icon">📋</span>
            <span>系统日志</span>
            <span class="arrow">></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 统计数据
const totalUsers = ref(0)
const totalChats = ref(0)
const todayActive = ref(0)

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 用户管理
const manageUsers = () => {
  // TODO: 实现用户管理功能
  alert('用户管理功能开发中')
}

// 权限管理
const userPermissions = () => {
  // TODO: 实现权限管理功能
  alert('权限管理功能开发中')
}

// 内容管理
const manageContent = () => {
  // TODO: 实现内容管理功能
  alert('内容管理功能开发中')
}

// 对话记录
const chatHistory = () => {
  // TODO: 实现对话记录查看功能
  alert('对话记录功能开发中')
}

// 系统设置
const systemSettings = () => {
  // TODO: 实现系统设置功能
  alert('系统设置功能开发中')
}

// 数据备份
const dataBackup = () => {
  // TODO: 实现数据备份功能
  alert('数据备份功能开发中')
}

// 系统日志
const logs = () => {
  // TODO: 实现系统日志功能
  alert('系统日志功能开发中')
}

// 初始化数据
onMounted(() => {
  // TODO: 从API获取统计数据
  // 这里暂时使用模拟数据
  totalUsers.value = 1250
  totalChats.value = 5680
  todayActive.value = 89
})
</script>

<style scoped>
.admin-container {
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.admin-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
}

.admin-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.stat-info h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-number {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.stat-status {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

.admin-menu {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.menu-section h2 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-item .icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  width: 30px;
  text-align: center;
}

.menu-item span {
  flex: 1;
  color: #333;
}

.arrow {
  color: #ccc;
  font-weight: bold;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 1rem;
  }

  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }
}
</style>