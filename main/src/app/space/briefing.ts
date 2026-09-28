// 로그인 직후 한 번만 알림 브리핑을 띄우기 위한 표시 (이 탭에만 저장, 브리핑을 띄우면 지운다)

const KEY = 'osl-login-briefing'

/** 로그인에 성공하면 남긴다 */
export const requestBriefing = () => {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // 저장이 막혀 있으면 브리핑 없이 넘어간다
  }
}

/** 남아 있으면 true를 돌려주고 지운다 */
export const takeBriefing = () => {
  try {
    const requested = sessionStorage.getItem(KEY) === '1'
    sessionStorage.removeItem(KEY)
    return requested
  } catch {
    return false
  }
}
