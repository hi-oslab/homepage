export type Work = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  year: number
  project_date: string | null
  category: string
  tags: string[]
  thumbnail_url: string | null
  content: string
  published: boolean
  display_order: number
  /** 작성한 어드민 계정 (마이그레이션 이전 작품은 null) */
  author_id?: string | null
  created_at: string
  updated_at: string
}

export type Member = {
  id: string
  name: string
  sub_name: string
  description: string
  role: string
  fields: string[]
  email: string
  website: string
  cover_image_url: string | null
  published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/** 프로필 역할 (운영자가 목록을 관리한다) */
export type MemberRole = {
  id: string
  name: string
  created_at: string
}

export type WorkInput = Pick<
  Work,
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'year'
  | 'project_date'
  | 'category'
  | 'tags'
  | 'thumbnail_url'
  | 'content'
  | 'published'
  | 'display_order'
>


export type AdminUserStatus = 'pending' | 'approved' | 'rejected'

/** club: 현재 학교 소모임 소속 / external: 외부 활동 멤버 */
export type MemberAffiliation = 'club' | 'external'

export type AdminUser = {
  id: string
  /** 로그인 아이디 */
  username: string
  name: string
  status: AdminUserStatus
  is_master: boolean
  /** 가입 시 관리자 권한을 신청했는지 (처리되면 false) */
  master_requested: boolean
  member_id: string | null
  /** 소속 (마이그레이션 이전 계정은 null) */
  affiliation: MemberAffiliation | null
  /** 첫 로그인 프로필 연결 안내를 마친 시각 */
  onboarded_at: string | null
  /** 학번 (선택) */
  student_id: string
  /** 전공 (선택) */
  major: string
  is_hongik: boolean
  phone: string
  /** 오픈소스랩 가입 연도와 반기 */
  joined_year: number | null
  joined_half: 'H1' | 'H2' | null
  approved_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type HelpRequest = {
  id: string
  /** password: 비밀번호 재설정 / username: 아이디 찾기 */
  kind: 'password' | 'username'
  username: string
  name: string
  phone: string
  message: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
}

/** 가입/내 정보 수정 시 받는 프로필 정보 */
export type AccountProfileInput = Pick<
  AdminUser,
  'name' | 'affiliation' | 'student_id' | 'major' | 'is_hongik' | 'phone' | 'joined_year' | 'joined_half'
>

/** About 페이지 연혁(CV) 항목 */
export type HistoryItem = {
  id: string
  year: number
  month: number | null
  category: string
  title: string
  detail: string
  link: string
  published: boolean
  created_at: string
  updated_at: string
}

export type HistoryInput = Pick<HistoryItem, 'year' | 'month' | 'category' | 'title' | 'detail' | 'link' | 'published'>
