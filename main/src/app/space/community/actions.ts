'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/admin-auth'
import {
  COMMENT_MAX,
  POST_MAX,
  getCommentAuthor,
  getPostAuthor,
  insertComment,
  insertPost,
  removeComment,
  removePost,
  type CommunityComment,
  type CommunityKind,
  type CommunityPost,
} from '@/lib/community'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; message: string }

async function run<T>(task: (user: Awaited<ReturnType<typeof requireUser>>) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const user = await requireUser()
    const result = await task(user)
    revalidatePath('/space')
    return result
  } catch (error) {
    console.error(error)
    return { ok: false, message: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}

export async function createPostAction(kind: CommunityKind, raw: string) {
  return run<CommunityPost>(async (user) => {
    const body = raw.trim()
    if (!body) return { ok: false, message: '내용을 입력해 주세요.' }
    if (body.length > POST_MAX) return { ok: false, message: `글은 ${POST_MAX}자까지 쓸 수 있어요.` }
    // 공지는 관리자만
    const postKind: CommunityKind = kind === 'notice' && user.is_master ? 'notice' : 'talk'
    const post = await insertPost(user.id, postKind, body)
    return { ok: true, data: { ...post, kind: postKind, author_name: user.name, comments: [] } }
  })
}

export async function createCommentAction(postId: string, raw: string) {
  return run<CommunityComment>(async (user) => {
    const body = raw.trim()
    if (!body) return { ok: false, message: '댓글을 입력해 주세요.' }
    if (body.length > COMMENT_MAX) return { ok: false, message: `댓글은 ${COMMENT_MAX}자까지 쓸 수 있어요.` }
    const comment = await insertComment(user.id, postId, body)
    return { ok: true, data: { ...comment, author_name: user.name } }
  })
}

// 본인 글/댓글은 본인이, 관리자는 모두 지울 수 있다
export async function deletePostAction(id: string) {
  return run(async (user) => {
    const post = await getPostAuthor(id)
    if (!post) return { ok: true }
    if (!user.is_master && post.author_id !== user.id) return { ok: false, message: '본인 글만 지울 수 있어요.' }
    await removePost(id)
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
