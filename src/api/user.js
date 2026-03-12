import request from './request'

// 用户注册
export const registerUser = (userData) => {
  return request({
    url: '/common_server/user/create',
    method: 'post',
    data: userData
  })
}

// 用户登录
export const loginUser = (loginData) => {
  return request({
    url: '/common_server/user/login',
    method: 'post',
    data: loginData,
    raw: true  // 需要获取原始响应体以提取 token
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 更新用户信息
export const updateUserInfo = (userData) => {
  return request({
    url: '/common_server/user/update',
    method: 'post',
    data: userData,
    raw: true  // 需要获取原始响应体以提取 token
  })
}

// 获取验证码（已废弃，改用邮箱验证码）
export const getCaptcha = () => {
  return request({
    url: '/common_server/captcha/getCode',
    method: 'get',
    raw: true  // 需要获取原始响应体
  })
}

// 发送邮箱验证码
export const sendEmailCaptcha = (email) => {
  const formData = new FormData()
  formData.append('to', email)
  return request({
    url: '/common_server/email/sendCaptcha',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    raw: true  // 需要获取原始响应体，data 为 captchaId
  })
}

// 验证邮箱验证码
export const validateEmailCaptcha = (captchaId, captchaValue) => {
  const formData = new FormData()
  formData.append('captchaId', captchaId)
  formData.append('captchaValue', captchaValue)
  return request({
    url: '/common_server/email/validate',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    raw: true
  })
}

// 重置密码（通过邮箱找回）
export const resetPassword = (email,newPassword) => {
  const formData = new FormData()
  formData.append('email', email)
  formData.append('newPassword', newPassword)
  return request({
    url: '/common_server/user/resetPw',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    raw: true
  })
}

// 判断是否是管理员（与后端 /common_server/user/checkUserRole 一致）
export const checkUserRole = (userId) => {
  const formData = new FormData()
  formData.append('userId', userId)
  return request({
    url: '/common_server/user/checkUserRole',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    raw: true
  })
}

// 获取所有用户列表
export const getAllUsers = () => {
  return request({
    url: '/common_server/user/getAllUsers',
    method: 'get'
  })
}

// 根据ID获取用户信息
export const getUserById = (id) => {
  const params = new URLSearchParams()
  params.append('id', id)
  return request({
    url: '/common_server/user/getUserById',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 审核注册申请
 * @param {string[]} ids - 申请ID列表
 * @param {string} status - '1' 审核通过 / '2' 审核不通过
 */
export const reviewRegister = (ids, status) => {
  const params = new URLSearchParams()
  ids.forEach(id => params.append('ids', id))
  params.append('status', status)
  return request({
    url: '/common_server/user/reviewRegister',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 获取待审核的注册申请列表
export const getRegisterApply = () => {
  return request({
    url: '/common_server/user/getRegisterApply',
    method: 'post'
  })
}

// 获取对话数量
export const getDialogCount = () => {
  return request({
    url: '/common_server/user/getDialogCount',
    method: 'get'
  })
}

/**
 * 获取全部默认头像路径（用于注册等场景）
 * @returns {Promise<string[]>} 默认头像 URL 列表
 */
export const getAvatars = () => {
  return request({
    url: '/common_server/user/getAvatars',
    method: 'get'
  })
}