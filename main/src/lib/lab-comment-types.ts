// Lab Space 댓글 · 좋아요 (서버 · 브라우저 공용 타입)

export const LAB_COMMENT_MAX = 1000
export const LAB_GUEST_NAME_MAX = 20
/** 게스트 댓글 비밀번호: 숫자 4자리 */
export const LAB_PIN_PATTERN = /^\d{4}$/

/** 본문 조각: 글자 또는 '@실명' 언급 (아이디는 화면에 내보내지 않는다) */
export type LabCommentPart = { text: string } | { mention: string }

export type LabComment = {
  id: string
  name: string
  /** 멤버의 프로필 이미지 (게스트 · 탈퇴한 멤버는 null) */
  image: string | null
  guest: boolean
  /** 이 글의 에디터가 단 댓글 */
  byArticleAuthor: boolean
  /** 지금 보는 사람이 단 댓글 (멤버) */
  mine: boolean
  secret: boolean
  /** 볼 수 없는 비밀 댓글이면 null */
  parts: LabCommentPart[] | null
  created_at: string
  /** 로그인한 권한으로 바로 지울 수 있는지 (작성자 · 에디터 · 운영자) */
  canDelete: boolean
}

export type LabDiscussion = {
  /** 로그인한(승인된) 멤버. 없으면 게스트로 쓴다 */
  viewer: { name: string; image: string | null } | null
  comments: LabComment[]
  likes: { count: number; liked: boolean }
}
