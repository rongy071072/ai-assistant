export function parseJwt(token) {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadStr = atob(
      payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    );
    return JSON.parse(payloadStr);
  } catch (e) {
    console.error('Invalid JWT token', e);
    return null;
  }
}

// 从 token 获取用户 ID（ULID 字符串，兼容 sub / userId / id 等字段）
export const getUserId = () => {
  const userInfo = localStorage.getItem('userInfo')
  if (!userInfo) return null
  try {
    const user = JSON.parse(userInfo)
    const token = user.token
    if (!token) return null
    const payload = parseJwt(token)
    if (!payload) return null
    const raw = payload.sub ?? payload.userId ?? payload.id
    const id = raw != null ? String(raw).trim() : ''
    return id || null
  } catch (e) {
    return null
  }
}