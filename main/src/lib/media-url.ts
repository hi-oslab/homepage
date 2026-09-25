// 업로드한 미디어의 공개 주소 규칙 (서버/클라이언트 공용)
//
// R2 파일은 사이트 자신의 /media/<key> 경로로 서빙한다 (src/app/media/[...key]/route.ts).
// DB에는 도메인 없는 상대 경로로 저장하므로 beta.hioslab.com → hioslab.com 처럼
// 사이트 도메인이 바뀌어도 이미지 주소를 고칠 필요가 없다.

export const MEDIA_BASE = '/media'

// 전환 전 주소(https://pub-xxx.r2.dev). 옛 주소도 "우리 파일"로 인식해서 삭제/교체가 동작하게 한다.
const LEGACY_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim().replace(/\/$/, '') || null

export function mediaUrl(key: string): string {
  return `${MEDIA_BASE}/${key}`
}

/** 우리 미디어 주소면 R2 key를, 아니면 null */
export function mediaKeyFromUrl(url: string): string | null {
  for (const base of [MEDIA_BASE, LEGACY_BASE]) {
    if (base && url.startsWith(`${base}/`)) {
      const key = decodeURIComponent(url.slice(base.length + 1))
      return key && !key.includes('..') ? key : null
    }
  }
  return null
}
