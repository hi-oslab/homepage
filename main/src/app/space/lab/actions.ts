'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireMaster, requireUser } from '@/lib/admin-auth'
import {
  createLabArticle,
  createLabIssue,
  getLabArticle,
  getLabArticlesByIds,
  getLabIssue,
  removeLabArticle,
  removeLabArticles,
  removeLabIssue,
  reorderLabIssues,
  saveLabSettings,
  setLabArticleRecommended,
  updateLabArticle,
  updateLabArticleAccess,
  updateLabIssue,
} from '@/lib/lab'
import {
  LAB_ISSUE_TITLE_MAX,
  LAB_RECOMMEND_MODES,
  issuePhase,
  type LabArticle,
  type LabArticleInput,
  type LabEditAccess,
  type LabIssue,
  type LabIssueInput,
  type LabSettings,
} from '@/lib/lab-types'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; message: string }

// 프로덕션에서는 throw한 메시지가 가려지므로 결과 객체로 돌려준다
async function run<T>(task: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await task()
  } catch (error) {
    console.error(error)
    return { ok: false, message: '처리하지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
}

/** Lab Space가 보이는 곳들 */
function revalidateLab(slugs: string[] = []) {
  revalidatePath('/lab-space')
  for (const slug of slugs) revalidatePath(`/lab-space/${slug}`)
  revalidatePath('/space/lab', 'layout')
}

/* ─── 주차 (리드 멤버) ───────────────────────────────────────────────────── */

/** 입력 정리 + 확인. 문제가 있으면 안내 문구 */
const issueInput = (input: LabIssueInput): { data: LabIssueInput } | { message: string } => {
  const title = input.title.trim().slice(0, LAB_ISSUE_TITLE_MAX)
  if (!title) return { message: '토픽 이름을 입력해 주세요.' }
  const valid = (value: string | null) =>
    value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString() : null
  const opens_at = valid(input.opens_at) ?? new Date().toISOString()
  const closes_at = valid(input.closes_at)
  if (closes_at && closes_at <= opens_at) return { message: '마감은 시작보다 뒤여야 해요.' }
  return { data: { title, description: input.description.trim(), opens_at, closes_at } }
}

/** 작성 기간 칸이 아직 없을 때(20261011 마이그레이션 전) */
const periodMissing = (error: unknown) =>
  (error as { code?: string }).code === '42703' || (error as { code?: string }).code === 'PGRST204'
const PERIOD_MIGRATION = 'DB 마이그레이션(20261011_lab_issue_period.sql)이 필요해요.'

export async function createIssueAction(input: LabIssueInput) {
  return run<LabIssue>(async () => {
    const user = await requireMaster()
    const checked = issueInput(input)
    if ('message' in checked) return { ok: false, message: checked.message }
    try {
      const issue = await createLabIssue(checked.data, user.id)
      revalidateLab()
      return { ok: true, data: issue }
    } catch (error) {
      if (periodMissing(error)) return { ok: false, message: PERIOD_MIGRATION }
      throw error
    }
  })
}

export async function updateIssueAction(id: string, input: LabIssueInput) {
  return run<LabIssue>(async () => {
    await requireMaster()
    const checked = issueInput(input)
    if ('message' in checked) return { ok: false, message: checked.message }
    try {
      const issue = await updateLabIssue(id, checked.data)
      revalidateLab()
      return { ok: true, data: issue }
    } catch (error) {
      if (periodMissing(error)) return { ok: false, message: PERIOD_MIGRATION }
      throw error
    }
  })
}

/** 주차 순서 바꾸기 (리드 멤버). ids 순서대로 위에서부터 */
export async function reorderIssuesAction(ids: string[]) {
  return run(async () => {
    await requireMaster()
    try {
      await reorderLabIssues(ids)
    } catch (error) {
      if ((error as { code?: string }).code === '42703')
        return { ok: false, message: 'DB 마이그레이션(20261010_lab_issue_order.sql)이 필요해요.' }
      throw error
    }
    revalidateLab()
    return { ok: true }
  })
}

export async function deleteIssueAction(id: string) {
  return run(async () => {
    await requireMaster()
    try {
      await removeLabIssue(id)
    } catch (error) {
      if ((error as Error).message === 'HAS_ARTICLES' || (error as { code?: string }).code === '23503')
        return { ok: false, message: '글이 있는 토픽은 지울 수 없어요.' }
      throw error
    }
    revalidateLab()
    return { ok: true }
  })
}

/* ─── 글 (작성자 또는 공동 편집자) ───────────────────────────────────────── */

/** 편집 권한을 확인한다. 삭제와 권한 변경은 별도로 작성자만 허용한다. */
async function requireEditableArticle(id: string) {
  const user = await requireUser()
  const article = await getLabArticle(id)
  if (
    !article ||
    !(article.author_id === user.id || article.edit_scope === 'all' || article.editor_ids.includes(user.id))
  )
    throw new Error('Forbidden')
  return article
}

async function requireOwnArticle(id: string) {
  const user = await requireUser()
  const article = await getLabArticle(id)
  if (!article || article.author_id !== user.id) throw new Error('Forbidden')
  return article
}

const normalizeAccess = (input: LabEditAccess, ownerId: string): LabEditAccess => ({
  edit_scope: ['all', 'owner', 'selected'].includes(input.edit_scope) ? input.edit_scope : 'owner',
  editor_ids:
    input.edit_scope === 'selected' ? Array.from(new Set(input.editor_ids.filter((id) => id !== ownerId))) : [],
})

/** 이 주차에 새 글을 만들고 편집 화면으로. 작성 기간이 아니면 안내 문구를 돌려준다 */
export async function createArticleAction(issueId: string, access: LabEditAccess): Promise<Result> {
  const user = await requireUser()
  const issue = await getLabIssue(issueId)
  if (!issue) return { ok: false, message: '토픽을 찾을 수 없어요.' }
  const phase = issuePhase(issue)
  if (phase !== 'open')
    return { ok: false, message: phase === 'upcoming' ? '아직 작성 기간이 아니에요.' : '작성 기간이 끝난 토픽이에요.' }
  const article = await createLabArticle(user.id, issueId, normalizeAccess(access, user.id))
  redirect(`/space/lab/${article.id}`)
}

export async function updateArticleAction(id: string, input: Partial<LabArticleInput>) {
  return run<LabArticle>(async () => {
    const previous = await requireEditableArticle(id)
    if (input.slug !== undefined && !input.slug.trim()) return { ok: false, message: 'Slug를 입력해 주세요.' }
    try {
      const article = await updateLabArticle(id, input)
      revalidateLab([article.slug, ...(previous.slug !== article.slug ? [previous.slug] : [])])
      return { ok: true, data: article }
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        return { ok: false, message: '다른 글과 slug가 겹쳐요. 다른 slug를 써 주세요.' }
      throw error
    }
  })
}

export async function updateArticleAccessAction(id: string, access: LabEditAccess) {
  return run<LabArticle>(async () => {
    const article = await requireOwnArticle(id)
    const next = await updateLabArticleAccess(id, normalizeAccess(access, article.author_id))
    revalidateLab([next.slug])
    return { ok: true, data: next }
  })
}

export async function deleteArticleAction(id: string) {
  return run(async () => {
    const article = await requireOwnArticle(id)
    await removeLabArticle(id)
    revalidateLab([article.slug])
    return { ok: true }
  })
}

/**
 * 목록에서 고른 글을 한 번에 지운다
 * 멤버는 직접 작성한 글만, 리드 멤버(운영자)는 모든 글. 지울 수 없는 글은 건너뛰고 지운 id만 돌려준다
 */
export async function deleteArticlesAction(ids: string[]) {
  return run<string[]>(async () => {
    const user = await requireUser()
    const articles = await getLabArticlesByIds(Array.from(new Set(ids)))
    const targets = articles.filter((article) => user.is_master || article.author_id === user.id)
    if (targets.length === 0) return { ok: false, message: '지울 수 있는 글이 없어요.' }
    await removeLabArticles(targets.map((article) => article.id))
    revalidateLab(targets.map((article) => article.slug))
    return { ok: true, data: targets.map((article) => article.id) }
  })
}

/* ─── 추천 (리드 멤버) ───────────────────────────────────────────────────── */

export async function setRecommendedAction(id: string, recommended: boolean) {
  return run<LabArticle>(async () => {
    const user = await requireMaster()
    const article = await getLabArticle(id)
    if (!article) return { ok: false, message: '글을 찾을 수 없어요.' }
    if (recommended && !article.published) return { ok: false, message: '공개된 글만 추천할 수 있어요.' }
    const next = await setLabArticleRecommended(id, recommended ? user.id : null)
    revalidateLab([next.slug])
    return { ok: true, data: next }
  })
}

/* ─── 공개 페이지 섹션 설정 (리드 멤버) ─────────────────────────────────── */

export async function saveSettingsAction(input: LabSettings) {
  return run<LabSettings>(async () => {
    await requireMaster()
    const count = (value: number) => Math.min(24, Math.max(1, Math.round(Number(value) || 6)))
    const days = input.best_period_days ? Math.max(1, Math.round(Number(input.best_period_days))) : null
    const settings: LabSettings = {
      best_enabled: Boolean(input.best_enabled),
      best_limit: count(input.best_limit),
      best_period_days: days,
      recommend_enabled: Boolean(input.recommend_enabled),
      recommend_mode: LAB_RECOMMEND_MODES.some((item) => item.mode === input.recommend_mode)
        ? input.recommend_mode
        : 'manual',
      recommend_limit: count(input.recommend_limit),
    }
    try {
      const saved = await saveLabSettings(settings)
      revalidateLab()
      return { ok: true, data: saved }
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === '42P01' || code === 'PGRST205')
        return { ok: false, message: 'DB 마이그레이션(20261012_lab_settings.sql)이 필요해요.' }
      throw error
    }
  })
}
