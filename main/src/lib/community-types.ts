// 게시판 타입/상수 — 클라이언트 컴포넌트에서도 import 가능 (서버 코드 없음)

/** notice: 공지 · talk: 자유 · collab: 협업 · info: 정보공유 */
export type CommunityKind = 'notice' | 'talk' | 'collab' | 'info'

export const BOARDS: Record<CommunityKind, { label: string; hint: string; chip: string; dot: string }> = {
  notice: { label: '공지', hint: '모두가 알아야 할 소식 (운영자)', chip: 'bg-ink text-white', dot: 'bg-ink' },
  talk: { label: '자유', hint: '편하게 나누는 이야기', chip: 'bg-[#e9f1e3] text-[#3f6b2a]', dot: 'bg-[#7cae5b]' },
  collab: { label: '협업', hint: '함께 할 사람 · 진행 중인 일', chip: 'bg-[#e6ecfb] text-[#2f4fae]', dot: 'bg-[#5b7fe0]' },
  info: { label: '정보공유', hint: '자료 · 링크 · 행사 · 팁', chip: 'bg-[#fbf0dc] text-[#946312]', dot: 'bg-[#e0a526]' },
}
export const BOARD_ORDER: CommunityKind[] = ['notice', 'talk', 'collab', 'info']

/** 글에 붙일 수 있는 반응 */
export const REACTIONS = ['👍', '❤️', '🎉', '😂', '👀', '🙏'] as const

/** 공지를 올리면 기본으로 고정되는 기간 */
export const PIN_DAYS = 7

export type CommunityAuthor = { name: string; image: string | null }

export type CommunityComment = {
  id: string
  post_id: string
  author_id: string | null
  author_name: string
  author_image: string | null
  body: string
  created_at: string
}

export type ReactionSummary = { emoji: string; count: number; mine: boolean; names: string[] }

export type CommunityPost = {
  id: string
  author_id: string | null
  author_name: string
  author_image: string | null
  kind: CommunityKind
  title: string
  /** 미리보기 · 알림용 글자 요약 (예전 글은 본문 전체) */
  body: string
  /** 블록 본문 JSON (프로젝트 본문과 같은 형식, 예전 글은 빈 문자열) */
  content: string
  /** 이 시각까지 맨 위에 고정 */
  pinned_until: string | null
  created_at: string
  comments: CommunityComment[]
  reactions: ReactionSummary[]
}

export const TITLE_MAX = 100
export const POST_MAX = 2000
export const COMMENT_MAX = 500

export const isPinned = (post: Pick<CommunityPost, 'pinned_until'>) =>
  Boolean(post.pinned_until) && new Date(post.pinned_until!).getTime() > Date.now()
