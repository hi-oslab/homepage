'use server'

import { createHash, randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import type { MentionMember } from '@/components/mentions/MentionProvider'
import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import {
  LAB_COMMENT_MAX,
  LAB_GUEST_NAME_MAX,
  LAB_PIN_PATTERN,
  type LabComment,
  type LabDiscussion,
} from '@/lib/lab-comment-types'
import {
  checkPin,
  getApprovedPeople,
  getComment,
  getCommentArticle,
  getDiscussion,
  hashPin,
  insertComment,
  missingTable,
  removeComment,
  setLike,
  spamCheck,
  toView,
} from '@/lib/lab-comments'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIGRATION = '댓글 준비 중이에요. (DB 마이그레이션 20261013_lab_comments.sql 필요)'

async function run<T>(task: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await task()
  } catch (error) {
    if (missingTable(error as { code?: string })) return { ok: false, message: MIGRATION }
    console.error(error)
    return { ok: false, message: '처리하지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
}

/** 승인된 멤버만 '로그인한 사람'으로 본다 (그 밖에는 게스트) */
const member = async () => {
  const user = await getCurrentUser().catch(() => null)
  return isApproved(user) ? user : null
}

/** 게스트를 구분하는 브라우저 쿠키 (좋아요 한 번). create: 없으면 만든다 */
const VISITOR_COOKIE = 'osl_lab_visitor'
async function likerOf(userId: string | null, create: boolean) {
  if (userId) return `user:${userId}`
  const jar = await cookies()
  let visitor = jar.get(VISITOR_COOKIE)?.value
  if (visitor && !UUID.test(visitor)) visitor = undefined
  if (!visitor && create) {
    visitor = randomUUID()
    jar.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }
  return visitor ? `guest:${visitor}` : null
}

/** 도배 방지용 작성자 표시: 멤버는 계정, 게스트는 IP 해시 (원래 IP는 남기지 않는다) */
async function writerOf(userId: string | null) {
  if (userId) return `user:${userId}`
  const list = await headers()
  const ip = list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'unknown'
  return `ip:${createHash('sha256')
    .update(`${ip}|${process.env.SUPABASE_SECRET_KEY ?? ''}`)
    .digest('hex')
    .slice(0, 32)}`
}

async function article(id: string) {
  return UUID.test(id) ? getCommentArticle(id) : null
}

/** 댓글 · 좋아요 불러오기 (페이지는 캐시되므로 브라우저에서 따로 부른다) */
export async function getDiscussionAction(articleId: string) {
  return run<LabDiscussion>(async () => {
    const target = await article(articleId)
    if (!target) return { ok: false, message: '글을 찾을 수 없어요.' }
    const user = await member()
    const data = await getDiscussion(target, user, await likerOf(user?.id ?? null, false))
    if (!data) return { ok: false, message: MIGRATION }
    return { ok: true, data }
  })
}

/** '@' 언급 후보 (로그인한 멤버에게만) */
export async function getMentionMembersAction() {
  return run<MentionMember[]>(async () => {
    if (!(await member())) return { ok: true, data: [] }
    const people = await getApprovedPeople()
    return {
      ok: true,
      data: people.map((person) => ({ ...person, profile: null })),
    }
  })
}

export async function addCommentAction(
  articleId: string,
  input: { body: string; secret: boolean; name?: string; pin?: string; website?: string },
) {
  return run<LabComment>(async () => {
    // 사람에게는 안 보이는 칸(website)을 채웠으면 자동 등록 프로그램으로 본다
    if (input.website) return { ok: false, message: '처리하지 못했어요. 잠시 후 다시 시도해 주세요.' }
    const target = await article(articleId)
    if (!target) return { ok: false, message: '글을 찾을 수 없어요.' }
    const body = String(input.body ?? '').trim()
    if (!body) return { ok: false, message: '댓글을 입력해 주세요.' }
    if (body.length > LAB_COMMENT_MAX) return { ok: false, message: `댓글은 ${LAB_COMMENT_MAX}자까지 쓸 수 있어요.` }

    const user = await member()
    let guest: { name: string; pin: string } | null = null
    if (!user) {
      const name = String(input.name ?? '').trim()
      const pin = String(input.pin ?? '')
      if (!name) return { ok: false, message: '이름을 입력해 주세요.' }
      if (name.length > LAB_GUEST_NAME_MAX) return { ok: false, message: `이름은 ${LAB_GUEST_NAME_MAX}자까지예요.` }
      if (!LAB_PIN_PATTERN.test(pin)) return { ok: false, message: '비밀번호는 숫자 4자리예요.' }
      guest = { name, pin }
    }

    const writer = await writerOf(user?.id ?? null)
    const spam = await spamCheck(writer, body, !user)
    if (spam) return { ok: false, message: spam }

    const row = await insertComment({
      article_id: target.id,
      author_id: user?.id ?? null,
      guest_name: guest?.name ?? null,
      pin_hash: guest ? hashPin(guest.pin) : null,
      secret: Boolean(input.secret),
      body,
      writer,
    })
    // 방금 쓴 사람에게는 비밀 댓글도 보여 준다
    return { ok: true, data: toView(row, target, user, await getApprovedPeople(), true) }
  })
}

/** 게스트 비밀 댓글을 비밀번호로 열어 본다 */
export async function revealCommentAction(id: string, pin: string) {
  return run<LabComment>(async () => {
    const comment = UUID.test(id) ? await getComment(id) : null
    const target = comment && (await getCommentArticle(comment.article_id))
    if (!comment || !target || !comment.guest_name) return { ok: false, message: '댓글을 찾을 수 없어요.' }
    const checked = await checkPin(comment, String(pin))
    if (checked !== 'ok') return { ok: false, message: pinMessage(checked) }
    return { ok: true, data: toView(comment, target, await member(), await getApprovedPeople(), true) }
  })
}

/**
 * 댓글 지우기
 * 멤버 댓글 작성자 · 에디터 · 운영자는 바로, 게스트는 댓글을 쓸 때 정한 비밀번호로
 */
export async function deleteCommentAction(id: string, pin?: string) {
  return run(async () => {
    const comment = UUID.test(id) ? await getComment(id) : null
    const target = comment && (await getCommentArticle(comment.article_id))
    if (!comment || !target) return { ok: false, message: '댓글을 찾을 수 없어요.' }
    const user = await member()
    const allowed = user && (comment.author_id === user.id || target.author_id === user.id || user.is_master)
    if (!allowed) {
      if (!comment.guest_name || !pin) return { ok: false, message: '지울 권한이 없어요.' }
      const checked = await checkPin(comment, String(pin))
      if (checked !== 'ok') return { ok: false, message: pinMessage(checked) }
    }
    await removeComment(comment.id)
    return { ok: true }
  })
}

const pinMessage = (result: 'wrong' | 'locked') =>
  result === 'locked'
    ? '비밀번호를 너무 많이 틀렸어요. 에디터나 운영자에게 문의해 주세요.'
    : '비밀번호가 맞지 않아요.'

/** 좋아요 켜기 · 끄기 (게스트는 브라우저 쿠키로 한 번) */
export async function setLikeAction(articleId: string, liked: boolean) {
  return run<{ count: number; liked: boolean }>(async () => {
    const target = await article(articleId)
    if (!target) return { ok: false, message: '글을 찾을 수 없어요.' }
    const user = await member()
    const liker = await likerOf(user?.id ?? null, true)
    if (!liker) return { ok: false, message: '좋아요를 누르지 못했어요.' }
    const count = await setLike(target.id, liker, Boolean(liked))
    return { ok: true, data: { count, liked: Boolean(liked) } }
  })
}
