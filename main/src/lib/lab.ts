// Lab Space 데이터 (서버 전용). 표는 RLS만 켜져 있어 secret key(서버)로만 읽고 쓴다.
// 표가 아직 없으면(20261009 마이그레이션 전) 목록 함수는 null을 돌려준다.

import { cache } from 'react'
import { createAdminSupabaseClient } from './supabase'
import {
  DEFAULT_LAB_SETTINGS,
  type LabArticle,
  type LabArticleCard,
  type LabArticleInput,
  type LabIssue,
  type LabIssueInput,
  type LabSettings,
} from './lab-types'

const db = () => createAdminSupabaseClient()

/** 표가 없을 때(마이그레이션 전) 나는 오류인지 */
const missingTable = (error: { code?: string } | null) => error?.code === '42P01' || error?.code === 'PGRST205'

/* ─── 주차 ─────────────────────────────────────────────────────────────── */

/**
 * 주차 목록: 리드 멤버가 정한 순서, 순서가 없는(새로 만든) 주차는 맨 위에 최신순. 표가 없으면 null
 * (순서 칸은 20261010 마이그레이션. 없어도 최신순으로 동작하도록 정렬은 여기서 한다)
 */
export async function getLabIssues(): Promise<LabIssue[] | null> {
  const { data, error } = await db().from('lab_issues').select('*')
  if (missingTable(error)) return null
  if (error) throw error
  return (data as LabIssue[]).sort((a, b) => {
    const [x, y] = [a.display_order ?? null, b.display_order ?? null]
    if (x === null && y === null) return b.created_at.localeCompare(a.created_at)
    if (x === null) return -1
    if (y === null) return 1
    return x - y || b.created_at.localeCompare(a.created_at)
  })
}

/** 주차 순서 저장 (ids 순서대로 0, 1, 2 …) */
export async function reorderLabIssues(ids: string[]) {
  for (let index = 0; index < ids.length; index += 1) {
    const { error } = await db().from('lab_issues').update({ display_order: index }).eq('id', ids[index])
    if (error) throw error
  }
}

export async function createLabIssue(input: Partial<LabIssueInput> & { title: string }, createdBy: string) {
  const { data, error } = await db()
    .from('lab_issues')
    .insert({ ...input, created_by: createdBy })
    .select('*')
    .single()
  if (error) throw error
  return data as LabIssue
}

export async function updateLabIssue(id: string, input: Partial<LabIssueInput>) {
  const { data, error } = await db().from('lab_issues').update(input).eq('id', id).select('*').single()
  if (error) throw error
  return data as LabIssue
}

/** 글이 있는 주차는 지우지 않는다 (DB도 on delete restrict로 막는다) */
export async function removeLabIssue(id: string) {
  const { count } = await db().from('lab_articles').select('id', { count: 'exact', head: true }).eq('issue_id', id)
  if (count) throw new Error('HAS_ARTICLES')
  const { error } = await db().from('lab_issues').delete().eq('id', id)
  if (error) throw error
}

/* ─── 글 (멤버 공간) ─────────────────────────────────────────────────────── */

export async function getLabIssue(id: string): Promise<LabIssue | null> {
  const { data, error } = await db().from('lab_issues').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as LabIssue | null
}

export async function getLabArticle(id: string): Promise<LabArticle | null> {
  const { data, error } = await db().from('lab_articles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as LabArticle | null
}

/** 내가 쓴 글 (최근 수정순) */
export async function getMyLabArticles(authorId: string): Promise<LabArticle[]> {
  const { data, error } = await db()
    .from('lab_articles')
    .select('*')
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false })
  if (missingTable(error)) return []
  if (error) throw error
  return data as LabArticle[]
}

/** 오늘 날짜(한국 시간) YYYY-MM-DD */
const todayInSeoul = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

/**
 * 새 글의 기본 slug = 작성 날짜 (예: 2026-09-29).
 * 같은 날 이미 있으면 -2, -3 … 을 붙인다 (slug는 겹칠 수 없다)
 */
async function dateSlug() {
  const base = todayInSeoul()
  const { data } = await db().from('lab_articles').select('slug').like('slug', `${base}%`)
  const taken = new Set((data ?? []).map((row) => row.slug as string))
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

export async function createLabArticle(authorId: string, issueId: string): Promise<LabArticle> {
  // 두 사람이 같은 순간에 만들어 slug가 겹치면 번호를 다시 골라 한 번 더 시도한다
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await db()
      .from('lab_articles')
      .insert({ author_id: authorId, issue_id: issueId, slug: await dateSlug(), title: '제목 없음' })
      .select('*')
      .single()
    if (error?.code === '23505') continue
    if (error) throw error
    return data as LabArticle
  }
  throw new Error('새 글의 주소를 만들지 못했어요.')
}

export async function updateLabArticle(id: string, input: Partial<LabArticleInput>): Promise<LabArticle> {
  const { data, error } = await db().from('lab_articles').update(input).eq('id', id).select('*').single()
  if (error) throw error
  return data as LabArticle
}

export async function removeLabArticle(id: string) {
  const { error } = await db().from('lab_articles').delete().eq('id', id)
  if (error) throw error
}

/** 여러 글을 한 번에 가져온다 (선택 지우기 확인용) */
export async function getLabArticlesByIds(ids: string[]): Promise<LabArticle[]> {
  if (ids.length === 0) return []
  const { data, error } = await db().from('lab_articles').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []) as LabArticle[]
}

export async function removeLabArticles(ids: string[]) {
  if (ids.length === 0) return
  const { error } = await db().from('lab_articles').delete().in('id', ids)
  if (error) throw error
}

export async function setLabArticleRecommended(id: string, recommendedBy: string | null) {
  const { data, error } = await db()
    .from('lab_articles')
    .update(
      recommendedBy
        ? { recommended_at: new Date().toISOString(), recommended_by: recommendedBy }
        : { recommended_at: null, recommended_by: null },
    )
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as LabArticle
}

/** 모든 글 (리드 멤버의 주차 관리 · 추천 관리용, 최신순) */
export async function getAllLabArticles(): Promise<LabArticle[]> {
  const { data, error } = await db().from('lab_articles').select('*').order('created_at', { ascending: false })
  if (missingTable(error)) return []
  if (error) throw error
  return data as LabArticle[]
}

/* ─── 공개 페이지 섹션 설정 ───────────────────────────────────────────── */

const SETTING_KEYS = Object.keys(DEFAULT_LAB_SETTINGS) as (keyof LabSettings)[]

/** 섹션 설정. 표가 없으면(20261012 마이그레이션 전) 기본값 + ready: false */
export async function getLabSettings(): Promise<{ settings: LabSettings; ready: boolean }> {
  const { data, error } = await db().from('lab_settings').select('*').eq('id', true).maybeSingle()
  if (missingTable(error)) return { settings: DEFAULT_LAB_SETTINGS, ready: false }
  if (error) throw error
  const settings = { ...DEFAULT_LAB_SETTINGS }
  for (const key of SETTING_KEYS) if (data && data[key] !== undefined) Object.assign(settings, { [key]: data[key] })
  return { settings, ready: true }
}

export async function saveLabSettings(settings: LabSettings): Promise<LabSettings> {
  const { data, error } = await db()
    .from('lab_settings')
    .upsert({ id: true, ...settings, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  return data as LabSettings
}

/** 최근 days일 동안의 글별 조회수 (BEST 기준 기간용) */
async function viewsSince(days: number): Promise<Map<string, number>> {
  const since = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10)
  const { data, error } = await db().rpc('lab_view_counts', { p_since: since })
  if (error) throw error
  return new Map(
    ((data ?? []) as { article_id: string; views: number }[]).map((row) => [row.article_id, Number(row.views)]),
  )
}

/* ─── 공개 ─────────────────────────────────────────────────────────────── */

/** 글쓴이 이름 · 프로필 이미지 (계정 → 연결된 프로필카드) */
async function authors(ids: string[]) {
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) return new Map<string, { name: string; image: string | null }>()
  const { data: accounts } = await db().from('admin_users').select('id,name,member_id').in('id', unique)
  const memberIds = (accounts ?? []).map((account) => account.member_id).filter(Boolean) as string[]
  const { data: profiles } = memberIds.length
    ? await db().from('members').select('id,cover_image_url').in('id', memberIds)
    : { data: [] }
  const image = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile.cover_image_url as string | null]),
  )
  return new Map(
    (accounts ?? []).map((account) => [
      account.id as string,
      { name: account.name as string, image: account.member_id ? (image.get(account.member_id) ?? null) : null },
    ]),
  )
}

/** 글에 글쓴이 · 주차 이름을 붙인다 */
export async function toCards(articles: LabArticle[], issues: LabIssue[]): Promise<LabArticleCard[]> {
  const people = await authors(articles.map((article) => article.author_id))
  const issueTitle = new Map(issues.map((issue) => [issue.id, issue.title]))
  return articles.map((article) => ({
    ...article,
    author_name: people.get(article.author_id)?.name ?? '탈퇴한 멤버',
    author_image: people.get(article.author_id)?.image ?? null,
    issue_title: issueTitle.get(article.issue_id) ?? '',
  }))
}

/** 공개 Lab Space: 주차 + 공개된 글 (글쓴이 · 주차 이름 포함). 표가 없으면 null */
export const getPublishedLab = cache(async () => {
  const issues = await getLabIssues()
  if (!issues) return null
  const { data, error } = await db()
    .from('lab_articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  const articles = await toCards(data as LabArticle[], issues)
  const { settings } = await getLabSettings()

  // BEST: 기준 기간 안의 조회수 순 (전체 기간이면 누적 조회수)
  let best: (LabArticleCard & { period_views: number })[] = []
  if (settings.best_enabled) {
    const period = settings.best_period_days ? await viewsSince(settings.best_period_days) : null
    best = articles
      .map((article) => ({ ...article, period_views: period ? (period.get(article.id) ?? 0) : article.view_count }))
      .filter((article) => article.period_views > 0)
      .sort((a, b) => b.period_views - a.period_views)
      .slice(0, settings.best_limit)
  }

  // 추천: 고르는 방식에 따라
  let recommended: LabArticleCard[] = []
  if (settings.recommend_enabled) {
    if (settings.recommend_mode === 'manual')
      recommended = articles
        .filter((article) => article.recommended_at)
        .sort((a, b) => b.recommended_at!.localeCompare(a.recommended_at!))
    else if (settings.recommend_mode === 'recent') recommended = articles
    else
      recommended = articles
        .map((article) => ({ article, key: Math.random() }))
        .sort((a, b) => a.key - b.key)
        .map(({ article }) => article)
    recommended = recommended.slice(0, settings.recommend_limit)
  }

  return { issues, articles, best, recommended, settings }
})

export const getPublishedLabArticleBySlug = cache(async (slug: string): Promise<LabArticleCard | null> => {
  const { data, error } = await db()
    .from('lab_articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (missingTable(error)) return null
  if (error) throw error
  if (!data) return null
  const { data: issue } = await db().from('lab_issues').select('*').eq('id', data.issue_id).maybeSingle()
  const [card] = await toCards([data as LabArticle], issue ? [issue as LabIssue] : [])
  return card
})

/** 조회 1회 기록 (같은 방문자는 하루 한 번). 새로 셌으면 true */
export async function recordLabView(articleId: string, viewer: string): Promise<boolean> {
  const { data, error } = await db().rpc('lab_record_view', { p_article: articleId, p_viewer: viewer })
  // 없는(지워진) 글이면 기록할 곳이 없으니 세지 않는다
  if (error?.code === '23503') return false
  if (error) throw error
  return Boolean(data)
}
