<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>个人中心</h1>
      <button class="btn btn-secondary" @click="goBack">返回</button>
    </div>

    <div class="profile-content">
      <div class="user-info">
        <div class="avatar">
          <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="头像" class="avatar-img" />
          <span v-else class="avatar-text">{{ userInitials }}</span>
        </div>
        <div class="user-details">
          <h2>{{ userName }}</h2>
          <p>{{ userEmail }}</p>
          <p v-if="userAddress">{{ userAddress }}</p>
        </div>
      </div>

      <div class="profile-menu">
        <div class="menu-item" @click="editProfile">
          <span class="icon">👤</span>
          <span>编辑资料</span>
          <span class="arrow">></span>
        </div>
        <div class="menu-item" @click="changePassword">
          <span class="icon">🔒</span>
          <span>修改密码</span>
          <span class="arrow">></span>
        </div>
        <div class="menu-item" @click="viewHistory">
          <span class="icon">📚</span>
          <span>对话历史</span>
          <span class="arrow">></span>
        </div>
        <div class="menu-item" @click="settings">
          <span class="icon">⚙️</span>
          <span>设置</span>
          <span class="arrow">></span>
        </div>
      </div>

      <div class="logout-section">
        <button class="btn btn-danger" @click="logout">退出登录</button>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitEditProfile">
            <!-- 头像修改 -->
            <div class="form-group avatar-edit-group">
              <label>头像</label>
              <div class="avatar-edit-current">
                <img v-if="editForm.avatar" :src="resolveAvatarUrl(editForm.avatar)" alt="当前头像" class="avatar-edit-preview" />
                <span v-else class="avatar-edit-placeholder">{{ userInitials }}</span>
              </div>
              <div class="avatar-edit-options">
                <div v-if="avatarsLoading" class="avatars-loading">加载中...</div>
                <template v-else>
                  <div
                    v-for="(url, index) in defaultAvatars"
                    :key="index"
                    class="avatar-option"
                    :class="{ selected: editForm.avatar === url }"
                    @click="editForm.avatar = url"
                  >
                    <img :src="resolveAvatarUrl(url)" alt="默认头像" />
                  </div>
                </template>
              </div>
              <div class="avatar-upload-row">
                <label class="upload-label">
                  <input type="file" accept="image/*" class="upload-input" @change="handleAvatarUpload" />
                  <span class="upload-btn-text">上传自定义头像</span>
                </label>
                <span v-if="avatarUploading" class="upload-status">上传中...</span>
                <span v-if="avatarSuccess" class="upload-success">{{ avatarSuccess }}</span>
              </div>
              <span v-if="avatarError" class="avatar-error">{{ avatarError }}</span>
            </div>
            <div class="form-group">
              <label for="name">姓名</label>
              <input type="text" id="name" v-model="editForm.name" required>
            </div>
            <div class="form-group">
              <label for="address">地址</label>
              <input type="text" id="address" v-model="editForm.address">
            </div>
            <div class="form-group">
              <label for="email">邮箱</label>
              <input type="email" id="email" v-model="editForm.email" required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
              <button type="submit" class="btn btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 更改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitChangePassword">
            <div class="form-group">
              <label for="oldPassword">旧密码</label>
              <input type="password" id="oldPassword" v-model="passwordForm.oldPassword" required>
            </div>
            <div class="form-group">
              <label for="newPassword">新密码</label>
              <input type="password" id="newPassword" v-model="passwordForm.newPassword" required>
            </div>
            <div class="form-group">
              <label for="confirmPassword">确认新密码</label>
              <input type="password" id="confirmPassword" v-model="passwordForm.confirmPassword" required>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
              <button type="submit" class="btn btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { updateUserInfo, getAvatars } from '@/api/user'
import { chatApi } from '@/api/chat'

const router = useRouter()

// 用户信息（从本地存储读取；保存资料后同步更新以便头像等即时刷新）
const getUserInfo = () => {
  const item = localStorage.getItem('userInfo')
  if (!item) return null
  try {
    return JSON.parse(item)
  } catch (e) {
    console.error('Failed to parse userInfo from localStorage', e)
    return null
  }
}

const userInfo = ref(getUserInfo())

const userName = ref(userInfo.value?.name || '')
const userEmail = ref(userInfo.value?.email || '')
const userAddress = ref(userInfo.value?.address || '')

const userInitials = computed(() => {
  return userName.value.charAt(0).toUpperCase() || ''
})

/** 解析头像展示 URL：含 avatar/ 的路径走静态代理，其它相对路径走 /api */
const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return ''
  const u = url.trim()
  if (/^https?:\/\//.test(u)) return u
  if (u.startsWith('/avatar/') || u.startsWith('avatar/')) {
    return '/' + u.replace(/^\/+/, '')
  }
  return `/api${u.startsWith('/') ? u : '/' + u}`
}

/** 用户头像 URL（登录返回的 avatar），无则用空串不显示图片 */
const userAvatarUrl = computed(() => resolveAvatarUrl(userInfo.value?.avatar))

// 弹窗状态
const showEditModal = ref(false)
const showPasswordModal = ref(false)

// 默认头像列表
const defaultAvatars = ref([])
const avatarsLoading = ref(false)
const avatarUploading = ref(false)
const avatarError = ref('')
const avatarSuccess = ref('')

// 编辑资料表单
const editForm = ref({
  name: userName.value,
  email: userEmail.value,
  address: userAddress.value,
  avatar: userInfo.value?.avatar || ''
})

// 更改密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 返回上一页
const goBack = () => {
  router.go(-1)
}

/** 加载默认头像列表 */
const loadDefaultAvatars = async () => {
  avatarsLoading.value = true
  try {
    const list = await getAvatars()
    defaultAvatars.value = Array.isArray(list)
      ? list.map((item) => (item && item.url ? item.url : '')).filter(Boolean)
      : []
  } catch (e) {
    console.warn('获取默认头像失败:', e)
    defaultAvatars.value = []
  } finally {
    avatarsLoading.value = false
  }
}

/** 上传头像到 OSS */
const handleAvatarUpload = async (e) => {
  const file = e.target?.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    avatarError.value = '请选择图片文件'
    return
  }
  avatarUploading.value = true
  avatarError.value = ''
  avatarSuccess.value = ''
  try {
    const url = await chatApi.uploadFile(file)
    if (url && typeof url === 'string') {
      editForm.value.avatar = url
      avatarSuccess.value = '头像上传成功'
      setTimeout(() => { avatarSuccess.value = '' }, 3000)
    } else {
      avatarError.value = '上传失败，请重试'
    }
  } catch (err) {
    console.error('头像上传失败:', err)
    avatarError.value = '头像上传失败，请重试'
  } finally {
    avatarUploading.value = false
    e.target.value = ''
  }
}

// 编辑资料
const editProfile = () => {
  editForm.value = {
    name: userName.value,
    email: userEmail.value,
    address: userAddress.value,
    avatar: userInfo.value?.avatar || ''
  }
  avatarError.value = ''
  avatarSuccess.value = ''
  loadDefaultAvatars()
  showEditModal.value = true
}

// 修改密码
const changePassword = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  showPasswordModal.value = true
}

// 提交编辑资料（含头像）
const submitEditProfile = async () => {
  userName.value = editForm.value.name
  userEmail.value = editForm.value.email
  userAddress.value = editForm.value.address

  const data = await updateUserInfo({
    name: editForm.value.name,
    email: editForm.value.email,
    address: editForm.value.address,
    avatar: editForm.value.avatar || undefined
  })
  if (data && data.code === 200) {
    const updatedUserInfo = {
      ...userInfo.value,
      name: editForm.value.name,
      email: editForm.value.email,
      address: editForm.value.address,
      avatar: editForm.value.avatar
    }
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    userInfo.value = updatedUserInfo
    showEditModal.value = false
    alert('资料更新成功')
  } else {
    alert(data?.message || '资料更新失败')
  }
}

// 提交更改密码
const submitChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('新密码和确认密码不匹配')
    return
  }
  // TODO: 调用API更改密码
  // 这里暂时只是关闭弹窗
  showPasswordModal.value = false
  alert('密码更改成功')
}

// 关闭弹窗
const closeModal = () => {
  showEditModal.value = false
  showPasswordModal.value = false
}

// 查看历史
const viewHistory = () => {
  // TODO: 实现查看历史功能
  router.push('/history')
}

// 设置
const settings = () => {
  // TODO: 实现设置功能
  alert('设置功能开发中')
}

// 退出登录
const logout = () => {
  localStorage.removeItem('userInfo')
  router.push('/login')
}

// 初始化用户信息
onMounted(() => {
  // TODO: 从API获取用户信息
  // 这里暂时使用模拟数据
})
</script>

<style scoped>
.profile-container {
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 2rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.profile-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
}

.profile-content {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.user-details h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.user-details p {
  margin: 0;
  color: #666;
}

.profile-menu {
  margin-bottom: 2rem;
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

.menu-item:last-child {
  border-bottom: none;
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

.logout-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #eee;
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
  color: white;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    gap: 1rem;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-actions .btn-secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.modal-actions .btn-secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

/* 头像编辑区域 */
.avatar-edit-group {
  margin-bottom: 1.5rem;
}

.avatar-edit-current {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar-edit-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #667eea;
}

.avatar-edit-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.avatar-edit-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.avatars-loading {
  font-size: 13px;
  color: #999;
}

.avatar-option {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ddd;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.2s, transform 0.2s;
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-option:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.avatar-option.selected {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.avatar-upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-input {
  display: none;
}

.upload-label {
  cursor: pointer;
}

.upload-btn-text {
  display: inline-block;
  padding: 6px 14px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 13px;
  color: #333;
  transition: background 0.2s, border-color 0.2s;
}

.upload-btn-text:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
}

.upload-status {
  font-size: 12px;
  color: #999;
}

.upload-success {
  font-size: 12px;
  color: #27ae60;
  font-weight: 500;
}

.avatar-error {
  display: block;
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}
</style>