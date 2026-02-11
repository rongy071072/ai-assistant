<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>管理员中心</h1>
      <button class="btn btn-secondary" @click="goBack">返回</button>
    </div>

    <div class="admin-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>总用户数</h3>
            <p class="stat-number">{{ totalUsers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>待审核</h3>
            <p class="stat-number stat-pending">{{ pendingCount }}</p>
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
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <h3>系统状态</h3>
            <p class="stat-status">正常</p>
          </div>
        </div>
      </div>

      <!-- Tab 导航 -->
      <div class="tab-nav">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          👥 用户列表
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'review' }"
          @click="activeTab = 'review'"
        >
          📝 注册审核
          <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- 用户列表 Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="table-header">
          <h2>用户列表</h2>
          <button class="btn btn-refresh" @click="fetchAllUsers" :disabled="loading">
            {{ loading ? '加载中...' : '刷新' }}
          </button>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="userList.length === 0" class="empty-state">
          <p>暂无用户数据</p>
        </div>

        <div v-else class="user-table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.id">
                <td class="td-id">{{ user.id }}</td>
                <td>{{ user.username || user.name || '-' }}</td>
                <td>{{ user.email || '-' }}</td>
                <td>
                  <span class="role-tag" :class="user.role === 'admin' ? 'role-admin' : 'role-user'">
                    {{ user.role === 'admin' ? '管理员' : '用户' }}
                  </span>
                </td>
                <td>
                  <button class="btn-action btn-detail" @click="viewUserDetail(user.id)">
                    查看详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 注册审核 Tab -->
      <div v-if="activeTab === 'review'" class="tab-content">
        <div class="table-header">
          <h2>注册审核</h2>
          <div class="header-actions">
            <button
              v-if="selectedIds.length > 0"
              class="btn btn-approve"
              @click="batchApprove"
              :disabled="reviewing"
            >
              {{ reviewing ? '审核中...' : `批量通过 (${selectedIds.length})` }}
            </button>
            <button class="btn btn-refresh" @click="fetchRegisterApply" :disabled="reviewLoading">
              {{ reviewLoading ? '加载中...' : '刷新' }}
            </button>
          </div>
        </div>

        <div v-if="reviewLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="registerApplyList.length === 0" class="empty-state">
          <p>暂无待审核的注册申请</p>
        </div>

        <div v-else class="user-table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th class="th-checkbox">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apply in registerApplyList" :key="apply.id">
                <td class="td-checkbox">
                  <input
                    type="checkbox"
                    :value="apply.id"
                    v-model="selectedIds"
                  />
                </td>
                <td class="td-id">{{ apply.id }}</td>
                <td>{{ apply.username || apply.name || '-' }}</td>
                <td>{{ apply.email || '-' }}</td>
                <td>{{ formatTime(apply.createTime || apply.createdAt) }}</td>
                <td>
                  <button
                    class="btn-action btn-approve-single"
                    @click="approveSingle(apply.id)"
                    :disabled="reviewing"
                  >
                    通过
                  </button>
                  <button class="btn-action btn-detail" @click="viewUserDetail(apply.id)">
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 用户详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>用户详情</h3>
          <button class="modal-close" @click="closeDetailModal">&times;</button>
        </div>
        <div v-if="detailLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="userDetail" class="modal-body">
          <div class="detail-item">
            <label>ID</label>
            <span>{{ userDetail.id }}</span>
          </div>
          <div class="detail-item">
            <label>用户名</label>
            <span>{{ userDetail.username || userDetail.name || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>邮箱</label>
            <span>{{ userDetail.email || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>角色</label>
            <span class="role-tag" :class="userDetail.role === 'admin' ? 'role-admin' : 'role-user'">
              {{ userDetail.role === 'admin' ? '管理员' : '用户' }}
            </span>
          </div>
          <div class="detail-item" v-if="userDetail.createTime || userDetail.createdAt">
            <label>创建时间</label>
            <span>{{ formatTime(userDetail.createTime || userDetail.createdAt) }}</span>
          </div>
          <div class="detail-item" v-if="userDetail.updateTime || userDetail.updatedAt">
            <label>更新时间</label>
            <span>{{ formatTime(userDetail.updateTime || userDetail.updatedAt) }}</span>
          </div>
          <div class="detail-item" v-if="userDetail.phone">
            <label>手机号</label>
            <span>{{ userDetail.phone }}</span>
          </div>
          <div class="detail-item" v-if="userDetail.status !== undefined">
            <label>状态</label>
            <span :class="userDetail.status === 1 || userDetail.status === 'active' ? 'status-active' : 'status-inactive'">
              {{ userDetail.status === 1 || userDetail.status === 'active' ? '正常' : '禁用' }}
            </span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>未找到用户信息</p>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <transition name="toast">
      <div v-if="toastMessage" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllUsers, getUserById, reviewRegister, getRegisterApply, getDialogCount } from '@/api/user'

const router = useRouter()

// Tab 状态
const activeTab = ref('users')

// 统计数据
const totalUsers = ref(0)
const totalChats = ref(0)

// 用户列表
const userList = ref([])
const loading = ref(false)

// 注册审核
const registerApplyList = ref([])
const reviewLoading = ref(false)
const reviewing = ref(false)
const selectedIds = ref([])

// 用户详情弹窗
const showDetailModal = ref(false)
const detailLoading = ref(false)
const userDetail = ref(null)

// 消息提示
const toastMessage = ref('')
const toastType = ref('success')

// 待审核数量
const pendingCount = computed(() => registerApplyList.value.length)

// 是否全选
const isAllSelected = computed(() => {
  return registerApplyList.value.length > 0 &&
    selectedIds.value.length === registerApplyList.value.length
})

/**
 * 显示消息提示
 * @param {string} message - 提示内容
 * @param {string} type - 类型: success / error
 */
const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

/**
 * 格式化时间显示
 * @param {string|number} time - 时间戳或时间字符串
 * @returns {string} 格式化后的时间
 */
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  if (isNaN(date.getTime())) return time
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

/**
 * 获取对话数量
 */
const fetchDialogCount = async () => {
  try {
    const res = await getDialogCount()
    const data = res?.data ?? res
    totalChats.value = typeof data === 'number' ? data : (Number(data) || 0)
  } catch (error) {
    console.error('获取对话数量失败:', error)
  }
}

/**
 * 获取所有用户列表
 */
const fetchAllUsers = async () => {
  loading.value = true
  try {
    const res = await getAllUsers()
    // 兼容不同的返回格式: res 可能是 { data: [...] } 或直接是数组
    const data = res?.data || res
    userList.value = Array.isArray(data) ? data : []
    totalUsers.value = userList.value.length
  } catch (error) {
    console.error('获取用户列表失败:', error)
    showToast('获取用户列表失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    loading.value = false
  }
}

/**
 * 获取待审核的注册申请
 */
const fetchRegisterApply = async () => {
  reviewLoading.value = true
  try {
    const res = await getRegisterApply()
    const data = res?.data || res
    registerApplyList.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取注册申请失败:', error)
    showToast('获取注册申请失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    reviewLoading.value = false
  }
}

/**
 * 查看用户详情
 * @param {string} id - 用户ID
 */
const viewUserDetail = async (id) => {
  showDetailModal.value = true
  detailLoading.value = true
  userDetail.value = null
  try {
    const res = await getUserById(id)
    userDetail.value = res?.data || res
  } catch (error) {
    console.error('获取用户详情失败:', error)
    showToast('获取用户详情失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    detailLoading.value = false
  }
}

/**
 * 关闭详情弹窗
 */
const closeDetailModal = () => {
  showDetailModal.value = false
  userDetail.value = null
}

/**
 * 全选/取消全选
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = registerApplyList.value.map(item => item.id)
  }
}

/**
 * 批量审核通过
 */
const batchApprove = async () => {
  if (selectedIds.value.length === 0) return
  const confirmMsg = `确定要通过 ${selectedIds.value.length} 个注册申请吗？`
  if (!confirm(confirmMsg)) return

  reviewing.value = true
  try {
    await reviewRegister(selectedIds.value)
    showToast(`成功通过 ${selectedIds.value.length} 个注册申请`)
    selectedIds.value = []
    // 刷新列表
    await fetchRegisterApply()
    await fetchAllUsers()
  } catch (error) {
    console.error('审核失败:', error)
    showToast('审核失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    reviewing.value = false
  }
}

/**
 * 单个审核通过
 * @param {string} id - 申请ID
 */
const approveSingle = async (id) => {
  if (!confirm('确定要通过该注册申请吗？')) return

  reviewing.value = true
  try {
    await reviewRegister([id])
    showToast('审核通过成功')
    // 刷新列表
    await fetchRegisterApply()
    await fetchAllUsers()
  } catch (error) {
    console.error('审核失败:', error)
    showToast('审核失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    reviewing.value = false
  }
}

// 初始化数据
onMounted(async () => {
  await Promise.all([
    fetchAllUsers(),
    fetchRegisterApply(),
    fetchDialogCount()
  ])
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
  max-width: 960px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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

.stat-pending {
  color: #e67e22;
}

.stat-status {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

/* Tab 导航 */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #e74c3c;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 6px;
}

/* 表格区域 */
.tab-content {
  min-height: 300px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* 表格 */
.user-table-wrapper {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.user-table thead {
  background: #f8f9fa;
}

.user-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.user-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.user-table tbody tr:hover {
  background-color: #f8f9fa;
}

.td-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: #888;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.th-checkbox,
.td-checkbox {
  width: 40px;
  text-align: center;
}

.td-checkbox input,
.th-checkbox input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

/* 角色标签 */
.role-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-admin {
  background: #e8f0fe;
  color: #1a73e8;
}

.role-user {
  background: #f0f0f0;
  color: #666;
}

/* 状态标签 */
.status-active {
  color: #28a745;
  font-weight: 500;
}

.status-inactive {
  color: #dc3545;
  font-weight: 500;
}

/* 操作按钮 */
.btn-action {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-right: 4px;
}

.btn-detail {
  background: #e8f0fe;
  color: #1a73e8;
}

.btn-detail:hover {
  background: #d0e2fd;
}

.btn-approve-single {
  background: #d4edda;
  color: #28a745;
}

.btn-approve-single:hover {
  background: #c3e6cb;
}

.btn-approve-single:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 通用按钮 */
.btn {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 50px;
  padding: 0.75rem 2rem;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.btn-refresh {
  background: #f8f9fa;
  color: #555;
  border: 1px solid #ddd;
}

.btn-refresh:hover {
  background: #e9ecef;
}

.btn-approve {
  background: #28a745;
  color: white;
}

.btn-approve:hover {
  background: #218838;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #888;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e9ecef;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1rem;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.detail-item {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  width: 100px;
  flex-shrink: 0;
  color: #888;
  font-size: 0.9rem;
}

.detail-item span {
  color: #333;
  font-size: 0.9rem;
  word-break: break-all;
}

/* 消息提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-container {
    padding: 1rem;
  }

  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .table-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .user-table {
    font-size: 0.8rem;
  }

  .user-table th,
  .user-table td {
    padding: 0.5rem 0.5rem;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
