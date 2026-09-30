// Lab Space 댓글 · 좋아요 (서버 전용)
// 비밀 댓글 본문은 볼 수 있는 사람(에디터 · 댓글 작성자)에게만 내보낸다. 게스트는 비밀번호로 확인한다.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { AdminUser } from '@/types/cms'
import { findMentions } from './mentions'
import { createAdminSupabaseClient } from './supabase'
import type { LabComment, LabCommentPart, LabDiscussion } from './lab-comment-types'

const db = () => createAdminSupabaseClient()

/** 표가 없을 때(마이그레이션 전) 나는 오류인지 */
export const missingTable = (error: { code?: string } | null) => error?.code === '42P01' || error?.code === 'PGRST205'

/** 비밀번호를 이만큼 틀리면 그 댓글은 비밀번호로 더 열 수 없다 (4자리라 계속 넣어 보는 걸 막는다) */
const PIN_TRIES = 10

type CommentRow = {
  id: string
  article_id: string
  author_id: string | null
  guest_name: string | null
  pin_hash: string | null
  pin_failures: number
  secret: boolean
  body: string
  created_at: string
}

export type CommentArticle = { id: string; author_id: string; slug: string; title: string }

/** 댓글을 달 수 있는 글 (공개된 글만) */
export async function getCommentArticle(id: string): Promise<CommentArticle | null> {
  const { data, error } = await db()
    .from('lab_articles')
    .select('id,author_id,slug,title')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle()
  if (error) throw error
  return data as CommentArticle | null
}

export async function getComment(id: string): Promise<CommentRow | null> {
  const { data, error } = await db().from('lab_comments').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as CommentRow | null
}

/* ─── 비밀번호 ─────────────────────────────────────────────────────────── */

const pepper = () => process.env.SUPABASE_SECRET_KEY ?? ''

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(`${pin}${pepper()}`, salt, 32).toString('hex')}`
}

/** 비밀번호 확인. 틀리면 틀린 횟수를 올린다. 'locked': 너무 많이 틀려 막힘 */
export async function checkPin(comment: CommentRow, pin: string): Promise<'ok' | 'wrong' | 'locked'> {
  if (!comment.pin_hash) return 'wrong'
  if (comment.pin_failures >= PIN_TRIES) return 'locked'
  const [salt, hash] = comment.pin_hash.split(':')
  const given = scryptSync(`${pin}${pepper()}`, salt, 32)
  const stored = Buffer.from(hash, 'hex')
  if (stored.length === given.length && timingSafeEqual(stored, given)) return 'ok'
  await db()
    .from('lab_comments')
    .update({ pin_failures: comment.pin_failures + 1 })
    .eq('id', comment.id)
  return comment.pin_failures + 1 >= PIN_TRIES ? 'locked' : 'wrong'
}

/* ─── 사람 · 언급 ──────────────────────────────────────────────────────── */

type Person = { id: string; name: string; username: string; image: string | null }

/** 승인된 멤버 (이름 · 아이디 · 프로필 이미지). 언급 찾기 · 댓글 작성자 표시에 쓴다 */
export async function getApprovedPeople(): Promise<Person[]> {
  const { data: accounts, error } = await db()
    .from('admin_users')
    .select('id,name,username,member_id')
    .eq('status', 'approved')
  if (error) throw error
  const memberIds = (accounts ?? []).map((account) => account.member_id).filter(Boolean) as string[]
  const { data: profiles } = memberIds.length
    ? await db().from('members').select('id,cover_image_url').in('id', memberIds)
    : { data: [] }
  const image = new Map((profiles ?? []).map((item) => [item.id as string, item.cover_image_url as string | null]))
  return (accounts ?? []).map((account) => ({
    id: account.id as string,
    name: account.name as string,
    username: account.username as string,
    image: account.member_id ? (image.get(account.member_id as string) ?? null) : null,
  }))
}

/** 본문을 글자 · 언급 조각으로 나눈다 ('@실명(아이디)'의 아이디는 빼고 실명만) */
function toParts(body: string, people: Person[]): LabCommentPart[] {
  const matches = findMentions(body, people)
  const parts: LabCommentPart[] = []
  let last = 0
  for (const match of matches) {
    if (match.start > last) parts.push({ text: body.slice(last, match.start) })
    parts.push({ mention: match.label.slice(1) })
    last = match.end
  }
  if (last < body.length) parts.push({ text: body.slice(last) })
  return parts
}

/** 게스트 댓글에는 언급을 쓰지 않는다: '@'가 있어도 글자 그대로 */
const plain = (body: string): LabCommentPart[] => [{ text: body }]

/* ─── 목록 ─────────────────────────────────────────────────────────────── */

/** 댓글 하나를 보는 사람에 맞춰 내보낸다 */
export function toView(
  row: CommentRow,
  article: CommentArticle,
  user: AdminUser | null,
  people: Person[],
  revealed = false,
): LabComment {
  const author = row.author_id ? people.find((person) => person.id === row.author_id) : undefined
  const mine = Boolean(user && row.author_id === user.id)
  const isArticleAuthor = Boolean(user && article.author_id === user.id)
  const visible = !row.secret || revealed || mine || isArticleAuthor
  return {
    id: row.id,
    name: row.guest_name ?? author?.name ?? '탈퇴한 멤버',
    image: author?.image ?? null,
    guest: row.guest_name !== null,
    byArticleAuthor: Boolean(row.author_id && row.author_id === article.author_id),
    mine,
    secret: row.secret,
    parts: visible ? (row.guest_name !== null ? plain(row.body) : toParts(row.body, people)) : null,
    created_at: row.created_at,
    canDelete: Boolean(user && (mine || isArticleAuthor || user.is_master)),
  }
}

export async function getDiscussion(
  article: CommentArticle,
  user: AdminUser | null,
  liker: string | null,
): Promise<LabDiscussion | null> {
  const [comments, likes, liked, people] = await Promise.all([
    db().from('lab_comments').select('*').eq('article_id', article.id).order('created_at'),
    db().from('lab_article_likes').select('liker', { count: 'exact', head: true }).eq('article_id', article.id),
    liker
      ? db().from('lab_article_likes').select('liker').eq('article_id', article.id).eq('liker', liker).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    getApprovedPeople(),
  ])
  if (missingTable(comments.error) || missingTable(likes.error)) return null
  if (comments.error) throw comments.error
  if (likes.error) throw likes.error

  const me = user ? people.find((person) => person.id === user.id) : undefined
  return {
    viewer: user ? { name: user.name, image: me?.image ?? null } : null,
    comments: ((comments.data ?? []) as CommentRow[]).map((row) => toView(row, article, user, people)),
    likes: { count: likes.count ?? 0, liked: Boolean(liked.data) },
  }
}

/* ─── 쓰기 ─────────────────────────────────────────────────────────────── */

export async function insertComment(input: {
  article_id: string
  author_id: string | null
  guest_name: string | null
  pin_hash: string | null
  secret: boolean
  body: string
  writer: string
}): Promise<CommentRow> {
  const { data, error } = await db().from('lab_comments').insert(input).select('*').single()
  if (error) throw error
  return data as CommentRow
}

/* ─── 도배 방지 ───────────────────────────────────────────────────────── */

const SPAM = {
  /** 같은 사람이 이어서 쓸 때 기다릴 시간 */
  cooldownMs: 15_000,
  /** 이 시간 동안 */
  windowMs: 10 * 60_000,
  /** 최대 몇 개까지 (멤버 · 게스트) */
  memberLimit: 10,
  guestLimit: 5,
  /** 게스트 댓글에 넣을 수 있는 링크 수 */
  guestLinks: 2,
}

/** 도배로 보이면 안내 문구, 괜찮으면 null */
export async function spamCheck(writer: string, body: string, guest: boolean): Promise<string | null> {
  if (guest && (body.match(/https?:\/\/|www\./gi)?.length ?? 0) > SPAM.guestLinks)
    return `게스트 댓글에는 링크를 ${SPAM.guestLinks}개까지 넣을 수 있어요.`
  const since = new Date(Date.now() - SPAM.windowMs).toISOString()
  const { data, error } = await db()
    .from('lab_comments')
    .select('body,created_at')
    .eq('writer', writer)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  const recent = (data ?? []) as { body: string; created_at: string }[]
  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < SPAM.cooldownMs)
    return '댓글을 조금 뒤에 다시 남겨 주세요.'
  if (recent.length >= (guest ? SPAM.guestLimit : SPAM.memberLimit))
    return '짧은 시간에 댓글을 너무 많이 남겼어요. 잠시 후 다시 시도해 주세요.'
  const normalized = body.replace(/\s+/g, ' ')
  if (recent.some((item) => item.body.replace(/\s+/g, ' ') === normalized)) return '같은 댓글을 이미 남겼어요.'
  return null
}

export async function removeComment(id: string) {
  const { error } = await db().from('lab_comments').delete().eq('id', id)
  if (error) throw error
}

/** 좋아요 켜기 · 끄기. 바뀐 뒤의 개수를 돌려준다 */
export async function setLike(articleId: string, liker: string, liked: boolean) {
  const table = db().from('lab_article_likes')
  const { error } = liked
    ? await table.upsert({ article_id: articleId, liker }, { ignoreDuplicates: true })
    : await table.delete().eq('article_id', articleId).eq('liker', liker)
  if (error) throw error
  const { count, error: countError } = await db()
    .from('lab_article_likes')
    .select('liker', { count: 'exact', head: true })
    .eq('article_id', articleId)
  if (countError) throw countError
  return count ?? 0
}
