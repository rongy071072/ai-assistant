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

// 从token获取用户ID
export const getUserId = () => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      const token = user.token
      const payload = parseJwt(token)
      return Number(payload.sub);
    } catch (e) {
      return null
    }
  }
  return null
}