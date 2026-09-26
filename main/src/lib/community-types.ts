// 커뮤니티 타입/상수 — 클라이언트 컴포넌트에서도 import 가능 (서버 코드 없음)

export type CommunityKind = 'notice' | 'talk'

export type CommunityComment = {
  id: string
  post_id: string
  author_id: string | null
  author_name: string
  body: string
  created_at: string
}

export type CommunityPost = {
  id: string
  author_id: string | null
  author_name: string
  kind: CommunityKind
  body: string
  created_at: string
  comments: CommunityComment[]
}

export const POST_MAX = 2000
export const COMMENT_MAX = 500
