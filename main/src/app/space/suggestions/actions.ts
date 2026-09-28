'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/admin-auth'
import {
  SUGGESTION_COMMENT_MAX,
  SUGGESTION_MAX,
  SUGGESTION_STATUSES,
  getSuggestion,
  getSuggestionCommentAuthor,
  insertSuggestion,
  insertSuggestionComment,
  removeSuggestion,
  removeSuggestionComment,
  setSuggestionStatus,
  type Suggestion,
  type SuggestionComment,
  type SuggestionStatus,
} from '@/lib/suggestions'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; message: string }
type User = Awaited<ReturnType<typeof requireUser>>

async function run<T>(task: (user: User) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const user = await requireUser()
    const result = await task(user)
    revalidatePath('/space', 'layout')
    return result
  } catch (error) {
    console.error(error)
    return { ok: false, message: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}

/** 건의사항 적기: 승인된 멤버 누구나 */
export async function createSuggestionAction(raw: string) {
  return run<Suggestion>(async (user) => {
    const body = raw.trim()
    if (!body) return { ok: false, message: '건의사항을 입력해 주세요.' }
    if (body.length > SUGGESTION_MAX) return { ok: false, message: `건의사항은 ${SUGGESTION_MAX}자까지 쓸 수 있어요.` }
    const row = await insertSuggestion(user.id, body)
    return {
      ok: true,
      data: { ...row, author_name: user.name, author_image: null, handler_name: null, archived: false, comments: [] },
    }
  })
}

/** 상태 바꾸기: 운영자(담당자)만 */
export async function setSuggestionStatusAction(id: string, status: SuggestionStatus) {
  return run<{ handler_name: string; resolved_at: string | null }>(async (user) => {
    if (!user.is_master) return { ok: false, message: '상태는 운영자만 바꿀 수 있어요.' }
    if (!(status in SUGGESTION_STATUSES)) return { ok: false, message: '알 수 없는 상태예요.' }
    const row = await setSuggestionStatus(id, status, user.id)
    return { ok: true, data: { handler_name: user.name, resolved_at: row.resolved_at } }
  })
}

/** 지우기: 운영자, 또는 아직 요청 상태인 본인 건의 */
export async function deleteSuggestionAction(id: string) {
  return run(async (user) => {
    const row = await getSuggestion(id)
    if (!row) return { ok: true }
    if (!user.is_master && (row.author_id !== user.id || row.status !== 'requested'))
      return { ok: false, message: '처리가 시작되기 전의 본인 건의만 지울 수 있어요.' }
    await removeSuggestion(id)
    return { ok: true }
  })
}

export async function createSuggestionCommentAction(suggestionId: string, raw: string) {
  return run<SuggestionComment>(async (user) => {
    const body = raw.trim()
    if (!body) return { ok: false, message: '코멘트를 입력해 주세요.' }
    if (body.length > SUGGESTION_COMMENT_MAX)
      return { ok: false, message: `코멘트는 ${SUGGESTION_COMMENT_MAX}자까지 쓸 수 있어요.` }
    const comment = await insertSuggestionComment(user.id, suggestionId, body)
    return { ok: true, data: { ...comment, author_name: user.name, author_image: null } }
  })
}

// 본인 코멘트는 본인이, 운영자는 모두 지울 수 있다
export async function deleteSuggestionCommentAction(id: string) {
  return run(async (user) => {
    const comment = await getSuggestionCommentAuthor(id)
    if (!comment) return { ok: true }
    if (!user.is_master && comment.author_id !== user.id) return { ok: false, message: '본인 코멘트만 지울 수 있어요.' }
    await removeSuggestionComment(id)
    return { ok: true }
  })
}
