// 웹사이트 건의사항 타입/상수 — 클라이언트 컴포넌트에서도 import 가능 (서버 코드 없음)

export type SuggestionStatus = 'requested' | 'reviewing' | 'done' | 'on_hold' | 'rejected'

export const SUGGESTION_STATUSES: Record<SuggestionStatus, { label: string; chip: string }> = {
  requested: { label: '요청', chip: 'bg-tile text-ink/70' },
  reviewing: { label: '확인중', chip: 'bg-[#e6ecfb] text-[#2f4fae]' },
  done: { label: '완료', chip: 'bg-[#e9f1e3] text-[#3f6b2a]' },
  on_hold: { label: '보류', chip: 'bg-[#fbf0dc] text-[#946312]' },
  rejected: { label: '불가', chip: 'bg-danger-soft text-danger' },
}
export const SUGGESTION_STATUS_ORDER: SuggestionStatus[] = ['requested', 'reviewing', 'done', 'on_hold', 'rejected']

/** 완료되고 며칠 지나면 보관함으로 */
export const ARCHIVE_DAYS = 3
export const SUGGESTION_MAX = 500
export const SUGGESTION_COMMENT_MAX = 500

export type SuggestionComment = {
  id: string
  suggestion_id: string
  author_id: string | null
  author_name: string
  author_image: string | null
  body: string
  created_at: string
}

export type Suggestion = {
  id: string
  author_id: string | null
  author_name: string
  author_image: string | null
  body: string
  status: SuggestionStatus
  /** 마지막으로 상태를 바꾼 운영자 (완료면 해결한 사람) */
  handler_name: string | null
  resolved_at: string | null
  created_at: string
  /** 완료되고 ARCHIVE_DAYS가 지났는지 (서버가 계산해서 화면과 어긋나지 않게) */
  archived: boolean
  comments: SuggestionComment[]
}

export const isArchived = (row: { status: string; resolved_at: string | null }, now = Date.now()) =>
  row.status === 'done' && Boolean(row.resolved_at) && now - new Date(row.resolved_at!).getTime() > ARCHIVE_DAYS * 24 * 60 * 60 * 1000
