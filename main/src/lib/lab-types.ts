// Lab Space 타입 (클라이언트 컴포넌트에서도 import 가능, 서버 코드 없음)

/** 주차(호): 이름은 리드 멤버가 정한다 */
export type LabIssue = {
  id: string
  title: string
  description: string
  created_by: string | null
  /** 순서 (작을수록 위, 리드 멤버가 끌어서 정한다). 비어 있으면(새 주차) 맨 위 */
  display_order?: number | null
  /** 작성 기간: 이때부터 새 글을 쓸 수 있다 (20261011 마이그레이션 전에는 없음 = 제한 없음) */
  opens_at?: string | null
  /** 이때까지 (비어 있으면 마감 없음) */
  closes_at?: string | null
  created_at: string
  updated_at: string
}

/** 글: 프로젝트와 같은 구조 + 작성자 · 주차 · 조회수 · 추천 */
export type LabArticle = {
  id: string
  issue_id: string
  author_id: string
  /** 편집 권한: 모든 멤버 / 작성자만 / 지정 멤버 */
  edit_scope: LabEditScope
  /** edit_scope가 selected일 때 편집 가능한 계정 id */
  editor_ids: string[]
  slug: string
  title: string
  subtitle: string
  description: string
  thumbnail_url: string | null
  /** 블록 본문 JSON (프로젝트 본문과 같은 형식) */
  content: string
  published: boolean
  view_count: number
  recommended_at: string | null
  recommended_by: string | null
  created_at: string
  updated_at: string
}

export type LabEditScope = 'all' | 'owner' | 'selected'

export type LabEditorOption = { id: string; name: string }

export type LabEditAccess = { edit_scope: LabEditScope; editor_ids: string[] }

export const canEditLabArticle = (
  article: Pick<LabArticle, 'author_id' | 'edit_scope' | 'editor_ids'>,
  userId: string,
) => article.author_id === userId || article.edit_scope === 'all' || article.editor_ids.includes(userId)

/** 글쓴이 · 주차 이름을 붙인 글 (목록 · 공개 페이지용) */
export type LabArticleCard = LabArticle & {
  author_name: string
  author_image: string | null
  /** 지정 편집자의 이름 (작성자는 author_name으로 별도 보관) */
  editor_names: string[]
  issue_title: string
}

/** 공개 페이지에 표시할 작성자/공동 편집자 문구 */
export const labArticleByline = (
  article: Pick<LabArticleCard, 'author_name' | 'editor_names' | 'edit_scope'>,
  compact = false,
) => {
  if (article.edit_scope === 'all') return 'All'
  const names =
    article.edit_scope === 'selected' ? [article.author_name, ...article.editor_names] : [article.author_name]
  const unique = Array.from(new Set(names))
  return compact && unique.length > 1 ? `${unique[0]} 외 ${unique.length - 1}명` : unique.join(', ')
}

/** 작성자가 고칠 수 있는 칸 */
export type LabArticleInput = Pick<
  LabArticle,
  'issue_id' | 'slug' | 'title' | 'subtitle' | 'description' | 'thumbnail_url' | 'content' | 'published'
>

export const LAB_ISSUE_TITLE_MAX = 80

/** 추천 섹션 글 고르는 방식: 리드 멤버가 직접 / 최근 공개 글 / 공개 글 중 무작위 */
export type LabRecommendMode = 'manual' | 'recent' | 'random'

/** 공개 Lab Space 섹션 설정 (리드 멤버) */
export type LabSettings = {
  best_enabled: boolean
  best_limit: number
  /** BEST 기준 기간(일). null이면 전체 기간 */
  best_period_days: number | null
  recommend_enabled: boolean
  recommend_mode: LabRecommendMode
  recommend_limit: number
}

export const DEFAULT_LAB_SETTINGS: LabSettings = {
  best_enabled: true,
  best_limit: 6,
  best_period_days: null,
  recommend_enabled: true,
  recommend_mode: 'manual',
  recommend_limit: 6,
}

export const LAB_SECTION_LIMITS = [3, 6, 9, 12]
export const LAB_BEST_PERIODS: { days: number | null; label: string }[] = [
  { days: null, label: '전체 기간' },
  { days: 7, label: '최근 7일' },
  { days: 30, label: '최근 30일' },
  { days: 90, label: '최근 90일' },
  { days: 365, label: '최근 1년' },
]
export const LAB_RECOMMEND_MODES: { mode: LabRecommendMode; label: string; hint: string }[] = [
  { mode: 'manual', label: '직접 선택', hint: '글 표의 추천 스위치로 고른 글 (최근 추천순)' },
  { mode: 'recent', label: '최근 글', hint: '가장 최근에 공개된 글' },
  { mode: 'random', label: '무작위', hint: '공개 글 중 무작위 (1분마다 바뀌어요)' },
]

/** 주차 작성 상태: 예정(아직 시작 전) · 작성 중 · 마감 */
export type IssuePhase = 'upcoming' | 'open' | 'closed'

export const issuePhase = (issue: Pick<LabIssue, 'opens_at' | 'closes_at'>, now = Date.now()): IssuePhase => {
  if (issue.opens_at && new Date(issue.opens_at).getTime() > now) return 'upcoming'
  if (issue.closes_at && new Date(issue.closes_at).getTime() < now) return 'closed'
  return 'open'
}

export const ISSUE_PHASE_LABELS: Record<IssuePhase, string> = { upcoming: '예정', open: '작성 중', closed: '마감' }

/** 리드 멤버가 주차를 만들고 고칠 때 받는 값 */
export type LabIssueInput = { title: string; description: string; opens_at: string | null; closes_at: string | null }
