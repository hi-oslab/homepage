// 웹사이트 건의사항 (서버 전용)

import { createAdminSupabaseClient } from './supabase'
import { authors } from './community'
import { isArchived, type Suggestion, type SuggestionStatus } from './suggestion-types'

export * from './suggestion-types'

const COLUMNS = 'id,author_id,body,status,handler_id,resolved_at,created_at'
const COMMENT_COLUMNS = 'id,suggestion_id,author_id,body,created_at'

type Row = {
  id: string
  author_id: string | null
  body: string
  status: SuggestionStatus
  handler_id: string | null
  resolved_at: string | null
  created_at: string
}

/**
 * 건의사항 + 코멘트 (최신순). 보관 여부는 여기서 계산한다.
 * 표가 아직 없으면(마이그레이션 전) null
 */
export async function getSuggestions(limit = 200): Promise<Suggestion[] | null> {
  const supabase = createAdminSupabaseClient()
  const { data: rows, error } = await supabase
    .from('site_suggestions')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('site_suggestions', error.message)
    return null
  }

  const ids = (rows ?? []).map((row) => row.id)
  const { data: comments } = ids.length
    ? await supabase.from('site_suggestion_comments').select(COMMENT_COLUMNS).in('suggestion_id', ids).order('created_at')
    : { data: [] }

  const people = await authors([
    ...(rows ?? []).flatMap((row) => [row.author_id, row.handler_id]),
    ...(comments ?? []).map((row) => row.author_id),
  ])
  const person = (id: string | null) => (id ? people.get(id) : undefined) ?? { name: '탈퇴한 멤버', image: null }
  const now = Date.now()

  return ((rows ?? []) as Row[]).map((row) => ({
    id: row.id,
    author_id: row.author_id,
    author_name: person(row.author_id).name,
    author_image: person(row.author_id).image,
    body: row.body,
    status: row.status,
    handler_name: row.handler_id ? person(row.handler_id).name : null,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    archived: isArchived(row, now),
    comments: (comments ?? [])
      .filter((comment) => comment.suggestion_id === row.id)
      .map((comment) => ({
        ...comment,
        author_name: person(comment.author_id).name,
        author_image: person(comment.author_id).image,
      })),
  }))
}

export async function insertSuggestion(authorId: string, body: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('site_suggestions')
    .insert({ author_id: authorId, body })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as Row
}

export async function getSuggestion(id: string) {
  const { data } = await createAdminSupabaseClient().from('site_suggestions').select(COLUMNS).eq('id', id).maybeSingle()
  return data as Row | null
}

/** 상태 바꾸기: 바꾼 운영자를 남기고, 완료면 완료 시각을 적는다 */
export async function setSuggestionStatus(id: string, status: SuggestionStatus, handlerId: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('site_suggestions')
    .update({ status, handler_id: handlerId, resolved_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as Row
}

export async function removeSuggestion(id: string) {
  const { error } = await createAdminSupabaseClient().from('site_suggestions').delete().eq('id', id)
  if (error) throw error
}

export async function insertSuggestionComment(authorId: string, suggestionId: string, body: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('site_suggestion_comments')
    .insert({ author_id: authorId, suggestion_id: suggestionId, body })
    .select(COMMENT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function getSuggestionCommentAuthor(id: string) {
  const { data } = await createAdminSupabaseClient()
    .from('site_suggestion_comments')
    .select('author_id')
    .eq('id', id)
    .maybeSingle()
  return data as { author_id: string | null } | null
}

export async function removeSuggestionComment(id: string) {
  const { error } = await createAdminSupabaseClient().from('site_suggestion_comments').delete().eq('id', id)
  if (error) throw error
}
