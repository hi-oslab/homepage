// 사이트 주소와 검색 노출 설정 (SEO 공용)
//
// 절대 주소(canonical, 사이트맵, robots, JSON-LD)는 모두 NEXT_PUBLIC_SITE_URL 기준으로 만든다.
// beta.hioslab.com → hioslab.com 으로 옮길 때 이 환경변수만 바꾸면 된다.

export const PRODUCTION_URL = 'https://hioslab.com'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(/\/$/, '')

/**
 * 검색엔진 노출 여부: 정식 도메인(hioslab.com)에서만 허용.
 * beta 등 다른 도메인은 noindex — 옛 사이트와 중복되거나 베타 주소가 검색에 남는 것을 막는다.
 * 강제로 켜고 끄려면 NEXT_PUBLIC_ALLOW_INDEXING=true/false
 */
export const ALLOW_INDEXING =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING !== undefined
    ? process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
    : new URL(SITE_URL).hostname.replace(/^www\./, '') === new URL(PRODUCTION_URL).hostname

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
