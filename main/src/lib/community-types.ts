// 게시판 타입/상수 — 클라이언트 컴포넌트에서도 import 가능 (서버 코드 없음)

/** notice: 공지 · talk: 자유 · collab: 협업 · info: 정보공유 */
export type CommunityKind = 'notice' | 'talk' | 'collab' | 'info'

// 칩 색: 공지는 ink ↔ paper 짝(다크에서 밝은 칩 + 어두운 글자로 뒤집힘),
// 나머지는 라이트 파스텔 · 다크에서는 같은 색을 옅게 깐 어두운 칩 + 밝은 글자 (dark: 은 globals.css)
export const BOARDS: Record<CommunityKind, { label: string; hint: string; chip: string; dot: string }> = {
  notice: { label: '공지', hint: '모두가 알아야 할 소식 (운영자)', chip: 'bg-ink text-paper', dot: 'bg-ink' },
  talk: {
    label: '자유',
    hint: '편하게 나누는 이야기',
    chip: 'bg-[#e9f1e3] text-[#3f6b2a] dark:bg-[#7cae5b]/20 dark:text-[#a9d68c]',
    dot: 'bg-[#7cae5b]',
  },
  collab: {
    label: '협업',
    hint: '함께 할 사람 · 진행 중인 일',
    chip: 'bg-[#e6ecfb] text-[#2f4fae] dark:bg-[#5b7fe0]/20 dark:text-[#a3b8f2]',
    dot: 'bg-[#5b7fe0]',
  },
  info: {
    label: '정보공유',
    hint: '자료 · 링크 · 행사 · 팁',
    chip: 'bg-[#fbf0dc] text-[#946312] dark:bg-[#e0a526]/20 dark:text-[#f0c877]',
    dot: 'bg-[#e0a526]',
  },
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
  /** 고정 공지 순서 (작을수록 앞, 없으면 순서를 정한 공지들보다 앞에 최신순) */
  pin_order: number | null
  created_at: string
  comments: CommunityComment[]
  reactions: ReactionSummary[]
}

export const TITLE_MAX = 100
export const POST_MAX = 2000
export const COMMENT_MAX = 500

export const isPinned = (post: Pick<CommunityPost, 'pinned_until'>) =>
  Boolean(post.pinned_until) && new Date(post.pinned_until!).getTime() > Date.now()

/** 고정 공지 정렬: 순서를 안 정한(새로 고정된) 공지가 최신순으로 먼저, 그다음 정한 순서대로 */
export const byPinOrder = (
  a: Pick<CommunityPost, 'pin_order' | 'created_at'>,
  b: Pick<CommunityPost, 'pin_order' | 'created_at'>,
) => {
  if (a.pin_order === null && b.pin_order === null) return b.created_at.localeCompare(a.created_at)
  if (a.pin_order === null) return -1
  if (b.pin_order === null) return 1
  return a.pin_order - b.pin_order
}
