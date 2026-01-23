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

// 获取验证码
export const getCaptcha = () => {
  return request({
    url: '/common_server/captcha/getCode',
    method: 'get',
    raw: true  // 需要获取原始响应体
  })
}

// 判断是否是管理员
export const checkUserRole = () => {
  return request({
    url: '/user/checkUserRole',
    method: 'get',
    raw: true
  })
}