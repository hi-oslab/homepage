// 브라우저에서 서버 액션을 부를 때 쓰는 안전장치
// 네트워크가 끊기거나, 배포 · 개발 서버 재시작 직후 옛 화면이 새 서버를 부르면 서버 액션이 예외를 던진다.
// 그대로 두면 화면 전체가 "클라이언트 오류"로 깨지므로 안내 문구가 담긴 결과로 바꿔 돌려준다.

export const CONNECTION_ERROR = '서버와 연결하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.'

export async function callAction<T>(action: () => Promise<T>): Promise<T | { ok: false; message: string }> {
  try {
    return await action()
  } catch (error) {
    console.error(error)
    return { ok: false, message: CONNECTION_ERROR }
  }
}
