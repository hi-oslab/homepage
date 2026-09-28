'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/admin-auth'
import { extractUrlsFromBlocks, parseBlocks } from '@/lib/blocks'
import { deleteR2Object, keyFromPublicR2Url } from '@/lib/r2'
import {
  BOARDS,
  COMMENT_MAX,
  PIN_DAYS,
  REACTIONS,
  TITLE_MAX,
  excerptFromBlocks,
  getCommentAuthor,
  getPost,
  insertComment,
  insertPost,
  removeComment,
  removePost,
  setPinOrder,
  toggleReaction,
  updatePost,
  type CommunityComment,
  type CommunityKind,
  type ReactionSummary,
} from '@/lib/community'

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

const pinUntil = () => new Date(Date.now() + PIN_DAYS * 24 * 60 * 60 * 1000).toISOString()

export type PostDraft = { kind: CommunityKind; title: string; content: string }

/** 입력 확인 · 정리 (공지는 운영자만) */
function normalize(
  user: User,
  draft: PostDraft,
): Result<{ kind: CommunityKind; title: string; body: string; content: string }> {
  if (!(draft.kind in BOARDS)) return { ok: false, message: '게시판을 골라 주세요.' }
  if (draft.kind === 'notice' && !user.is_master) return { ok: false, message: '공지는 운영자만 쓸 수 있어요.' }
  const title = draft.title.trim().replace(/\s+/g, ' ')
  if (title.length > TITLE_MAX) return { ok: false, message: `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.` }
  // 빈 문단은 저장하지 않는다
  const blocks = parseBlocks(draft.content).filter((block) => !(block.type === 'paragraph' && !block.text.trim()))
  const body = excerptFromBlocks(blocks)
  if (!title && blocks.length === 0) return { ok: false, message: '제목이나 내용을 입력해 주세요.' }
  return { ok: true, data: { kind: draft.kind, title, body, content: JSON.stringify(blocks) } }
}

export async function createPostAction(draft: PostDraft) {
  return run<{ id: string }>(async (user) => {
    const checked = normalize(user, draft)
    if ('message' in checked) return { ok: false, message: checked.message }
    const post = await insertPost(user.id, {
      ...checked.data!,
      // 공지는 일주일 동안 맨 위에 고정
      pinned_until: checked.data!.kind === 'notice' ? pinUntil() : null,
    })
    return { ok: true, data: { id: post.id } }
  })
}

/** 글 고치기: 작성자만 */
export async function updatePostAction(id: string, draft: PostDraft) {
  return run(async (user) => {
    const post = await getPost(id)
    if (!post) return { ok: false, message: '글을 찾을 수 없어요.' }
    if (post.author_id !== user.id) return { ok: false, message: '작성자만 고칠 수 있어요.' }
    const checked = normalize(user, draft)
    if ('message' in checked) return { ok: false, message: checked.message }
    const becameNotice = checked.data!.kind === 'notice' && post.kind !== 'notice'
    await updatePost(id, {
      ...checked.data!,
      // 공지가 아니게 되면 고정도 풀고, 새로 공지가 되면 일주일 고정
      ...(checked.data!.kind !== 'notice' ? { pinned_until: null } : becameNotice ? { pinned_until: pinUntil() } : {}),
    })
    return { ok: true }
  })
}

/** 공지 고정 풀기 · 다시 고정(일주일): 작성자와 운영자 */
export async function setPinnedAction(id: string, pinned: boolean) {
  return run<{ pinned_until: string | null }>(async (user) => {
    const post = await getPost(id)
    if (!post) return { ok: false, message: '글을 찾을 수 없어요.' }
    if (!user.is_master && post.author_id !== user.id) return { ok: false, message: '작성자만 고정을 바꿀 수 있어요.' }
    if (post.kind !== 'notice') return { ok: false, message: '공지만 고정할 수 있어요.' }
    const pinned_until = pinned ? pinUntil() : null
    await updatePost(id, { pinned_until })
    return { ok: true, data: { pinned_until } }
  })
}

/** 고정 공지 순서 바꾸기 (운영자만). ids 순서대로 앞에서부터 */
export async function setPinOrderAction(ids: string[]) {
  return run(async (user) => {
    if (!user.is_master) return { ok: false, message: '운영자만 순서를 바꿀 수 있어요.' }
    try {
      await setPinOrder(ids)
    } catch (error) {
      // 순서 칸이 아직 없으면(마이그레이션 전)
      if ((error as { code?: string }).code === '42703')
        return { ok: false, message: 'DB 마이그레이션(20261008_community_pin_order.sql)이 필요해요.' }
      throw error
    }
    return { ok: true }
  })
}

export async function toggleReactionAction(postId: string, emoji: string) {
  return run<ReactionSummary[]>(async (user) => {
    if (!(REACTIONS as readonly string[]).includes(emoji)) return { ok: false, message: '쓸 수 없는 반응이에요.' }
    return { ok: true, data: await toggleReaction(postId, user.id, emoji) }
  })
}

export async function createCommentAction(postId: string, raw: string) {
  return run<CommunityComment>(async (user) => {
    const body = raw.trim()
    if (!body) return { ok: false, message: '댓글을 입력해 주세요.' }
    if (body.length > COMMENT_MAX) return { ok: false, message: `댓글은 ${COMMENT_MAX}자까지 쓸 수 있어요.` }
    const comment = await insertComment(user.id, postId, body)
    return { ok: true, data: { ...comment, author_name: user.name, author_image: null } }
  })
}

// 본인 글/댓글은 본인이, 운영자는 모두 지울 수 있다
export async function deletePostAction(id: string) {
  return run(async (user) => {
    const post = await getPost(id)
    if (!post) return { ok: true }
    if (!user.is_master && post.author_id !== user.id) return { ok: false, message: '본인 글만 지울 수 있어요.' }
    await removePost(id)
    // 이 글에 올린 이미지도 지운다 (글쓰기 이미지는 작성자 폴더 projects/<계정 id>/ 에 있다)
    const folder = post.author_id ? `projects/${post.author_id}/` : null
    const keys = extractUrlsFromBlocks(parseBlocks(post.content))
      .map((url) => keyFromPublicR2Url(url))
      .filter((key): key is string => Boolean(key && folder && key.startsWith(folder)))
    await Promise.all(
      keys.map((key) => deleteR2Object(key).catch((error) => console.error('R2 삭제 실패', key, error))),
    )
    return { ok: true }
  })
}

export async function deleteCommentAction(id: string) {
  return run(async (user) => {
    const comment = await getCommentAuthor(id)
    if (!comment) return { ok: true }
    if (!user.is_master && comment.author_id !== user.id) return { ok: false, message: '본인 댓글만 지울 수 있어요.' }
    await removeComment(id)
    return { ok: true }
  })
}
