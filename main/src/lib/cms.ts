import { cache } from 'react'
import { createAdminSupabaseClient, createPublicSupabaseClient } from './supabase'
import type {
  AccountProfileInput,
  AdminUser,
  HelpRequest,
  HistoryInput,
  HistoryItem,
  Member,
  Work,
  WorkInput,
} from '@/types/cms'

// 공개 페이지용 컬럼 — 작성자(author_id) 등 어드민 전용 정보는 내보내지 않는다
const PUBLIC_WORK_COLUMNS =
  'id,slug,title,subtitle,description,year,project_date,category,tags,thumbnail_url,content,published,display_order,created_at,updated_at'

export const getPublishedWorks = cache(async (): Promise<Work[]> => {
  const { data, error } = await createPublicSupabaseClient()
    .from('works')
    .select(PUBLIC_WORK_COLUMNS)
    .eq('published', true)
    .order('display_order')
    .order('project_date', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Work[]
})

export const getPublishedWorkBySlug = cache(async (slug: string): Promise<Work | null> => {
  const { data, error } = await createPublicSupabaseClient()
    .from('works')
    .select(PUBLIC_WORK_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) throw error
  return data as Work | null
})

export const getPublishedMembers = cache(async (): Promise<Member[]> => {
  const { data, error } = await createPublicSupabaseClient()
    .from('members')
    .select('*')
    .eq('published', true)
    .order('display_order')
  if (error) throw error
  return (data ?? []) as Member[]
})

export async function getAdminWorks(
  orderBy: 'display_order' | 'updated_at' = 'display_order',
  authorId?: string,
): Promise<Work[]> {
  let query = createAdminSupabaseClient().from('works').select('*')
  if (authorId) query = query.eq('author_id', authorId)
  const { data, error } =
    orderBy === 'updated_at'
      ? await query.order('updated_at', { ascending: false })
      : await query.order('display_order').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Work[]
}

/** ids 순서대로 display_order를 0부터 다시 매긴다 */
async function reorder(table: 'works' | 'members', ids: string[]): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const results = await Promise.all(
    ids.map((id, index) => supabase.from(table).update({ display_order: index }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

export async function reorderWorks(ids: string[]): Promise<void> {
  await reorder('works', ids)
}

export async function reorderMembers(ids: string[]): Promise<void> {
  await reorder('members', ids)
}

export async function getAdminWork(id: string): Promise<Work | null> {
  const { data, error } = await createAdminSupabaseClient().from('works').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Work | null
}

export async function createWork(authorId: string): Promise<Work> {
  const supabase = createAdminSupabaseClient()
  const slug = `untitled-${Date.now().toString(36)}`
  // 새 작품은 목록 맨 앞 (가장 작은 display_order - 1)
  const { data: first } = await supabase.from('works').select('display_order').order('display_order').limit(1)
  const displayOrder = (first?.[0]?.display_order ?? 1) - 1
  const { data, error } = await supabase
    .from('works')
    .insert({
      slug,
      title: '제목 없음',
      year: new Date().getFullYear(),
      content: '[]',
      author_id: authorId,
      display_order: displayOrder,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Work
}

export async function updateWork(id: string, input: Partial<WorkInput>): Promise<Work> {
  const { data, error } = await createAdminSupabaseClient().from('works').update(input).eq('id', id).select('*').single()
  if (error) throw error
  return data as Work
}

export async function removeWork(id: string): Promise<void> {
  const { error } = await createAdminSupabaseClient().from('works').delete().eq('id', id)
  if (error) throw error
}

export async function getAdminMembers(): Promise<Member[]> {
  const { data, error } = await createAdminSupabaseClient().from('members').select('*').order('display_order').order('created_at')
  if (error) throw error
  return (data ?? []) as Member[]
}

export async function createMember(defaults: Partial<Pick<Member, 'name' | 'email' | 'published'>> = {}): Promise<Member> {
  const supabase = createAdminSupabaseClient()
  // 새 멤버는 목록 맨 뒤에 추가
  const { count } = await supabase.from('members').select('*', { count: 'exact', head: true })
  const { data, error } = await supabase
    .from('members')
    .insert({ name: '이름 없음', ...defaults, display_order: count ?? 0 })
    .select('*')
    .single()
  if (error) throw error
  return data as Member
}

export async function updateMember(id: string, input: Partial<Omit<Member, 'id' | 'created_at' | 'updated_at'>>): Promise<Member> {
  const { data, error } = await createAdminSupabaseClient().from('members').update(input).eq('id', id).select('*').single()
  if (error) throw error
  return data as Member
}

export async function removeMember(id: string): Promise<void> {
  const { error } = await createAdminSupabaseClient().from('members').delete().eq('id', id)
  if (error) throw error
}

/* ─── 어드민 계정 ─────────────────────────────────────────────────────── */

const ADMIN_USER_COLUMNS =
  'id,username,name,status,is_master,master_requested,member_id,student_id,is_hongik,phone,joined_year,joined_half,approved_at,last_login_at,created_at,updated_at'

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .select(ADMIN_USER_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminUser[]
}

export async function updateAdminUser(
  id: string,
  input: Partial<Pick<AdminUser, 'status' | 'is_master' | 'master_requested' | 'member_id' | 'approved_at'> & AccountProfileInput>,
): Promise<AdminUser> {
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_users')
    .update(input)
    .eq('id', id)
    .select(ADMIN_USER_COLUMNS)
    .single()
  if (error) throw error
  return data as AdminUser
}

export async function removeAdminUser(id: string): Promise<void> {
  const { error } = await createAdminSupabaseClient().from('admin_users').delete().eq('id', id)
  if (error) throw error
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await createAdminSupabaseClient().from('members').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Member | null
}

/* ─── 관리자 문의 (비밀번호 / 이메일 찾기) ─────────────────────────────── */

export async function createHelpRequest(input: Pick<HelpRequest, 'kind' | 'username' | 'name' | 'phone' | 'message'>) {
  const { error } = await createAdminSupabaseClient().from('admin_help_requests').insert(input)
  if (error) throw error
}

export async function getHelpRequests(status: HelpRequest['status'] = 'open'): Promise<HelpRequest[]> {
  const { data, error } = await createAdminSupabaseClient()
    .from('admin_help_requests')
    .select('id,kind,username,name,phone,message,status,created_at,resolved_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as HelpRequest[]
}

export async function resolveHelpRequest(id: string, resolvedBy: string) {
  const { error } = await createAdminSupabaseClient()
    .from('admin_help_requests')
    .update({ status: 'resolved', resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/* ─── 연혁 (CV) ───────────────────────────────────────────────────────── */

const HISTORY_COLUMNS = 'id,year,month,category,title,detail,link,published,created_at,updated_at'

/** 최신순. 테이블이 아직 없으면(마이그레이션 전) 빈 목록 */
export const getPublishedHistory = cache(async (): Promise<HistoryItem[]> => {
  const { data, error } = await createPublicSupabaseClient()
    .from('history_items')
    .select(HISTORY_COLUMNS)
    .eq('published', true)
    .order('year', { ascending: false })
    .order('month', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) {
    console.error('history_items', error.message)
    return []
  }
  return (data ?? []) as HistoryItem[]
})

export async function getAdminHistory(): Promise<HistoryItem[]> {
  const { data, error } = await createAdminSupabaseClient()
    .from('history_items')
    .select(HISTORY_COLUMNS)
    .order('year', { ascending: false })
    .order('month', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as HistoryItem[]
}

export async function createHistoryItem(input: HistoryInput): Promise<HistoryItem> {
  const { data, error } = await createAdminSupabaseClient().from('history_items').insert(input).select(HISTORY_COLUMNS).single()
  if (error) throw error
  return data as HistoryItem
}

export async function updateHistoryItem(id: string, input: Partial<HistoryInput>): Promise<HistoryItem> {
  const { data, error } = await createAdminSupabaseClient()
    .from('history_items')
    .update(input)
    .eq('id', id)
    .select(HISTORY_COLUMNS)
    .single()
  if (error) throw error
  return data as HistoryItem
}

export async function removeHistoryItem(id: string): Promise<void> {
  const { error } = await createAdminSupabaseClient().from('history_items').delete().eq('id', id)
  if (error) throw error
}
