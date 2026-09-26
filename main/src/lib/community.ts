import { createAdminSupabaseClient } from './supabase'
import type { CommunityComment, CommunityKind, CommunityPost } from './community-types'

export * from './community-types'

type AuthorRow = { id: string; name: string }

async function authorNames(ids: (string | null)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean))) as string[]
  if (!unique.length) return new Map<string, string>()
  const { data } = await createAdminSupabaseClient().from('admin_users').select('id,name').in('id', unique)
  return new Map(((data ?? []) as AuthorRow[]).map((row) => [row.id, row.name]))
}

/** 최근 글 + 댓글. 테이블이 아직 없으면(마이그레이션 전) null */
export async function getCommunityFeed(limit = 30): Promise<CommunityPost[] | null> {
  const supabase = createAdminSupabaseClient()
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select('id,author_id,kind,body,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('community_posts', error.message)
    return null
  }

  const ids = (posts ?? []).map((post) => post.id)
  const { data: comments } = ids.length
    ? await supabase
        .from('community_comments')
        .select('id,post_id,author_id,body,created_at')
        .in('post_id', ids)
        .order('created_at')
    : { data: [] }

  const names = await authorNames([...(posts ?? []), ...(comments ?? [])].map((row) => row.author_id))
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? '탈퇴한 멤버') : '탈퇴한 멤버')

  return (posts ?? []).map((post) => ({
    ...post,
    kind: post.kind as CommunityKind,
    author_name: nameOf(post.author_id),
    comments: (comments ?? [])
      .filter((comment) => comment.post_id === post.id)
      .map((comment) => ({ ...comment, author_name: nameOf(comment.author_id) })),
  }))
}

export async function insertPost(authorId: string, kind: CommunityKind, body: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('community_posts')
    .insert({ author_id: authorId, kind, body })
    .select('id,author_id,kind,body,created_at')
    .single()
  if (error) throw error
  return data
}

export async function insertComment(authorId: string, postId: string, body: string) {
  const { data, error } = await createAdminSupabaseClient()
    .from('community_comments')
    .insert({ author_id: authorId, post_id: postId, body })
    .select('id,post_id,author_id,body,created_at')
    .single()
  if (error) throw error
  return data
}

export async function getPostAuthor(id: string) {
  const { data } = await createAdminSupabaseClient().from('community_posts').select('author_id').eq('id', id).maybeSingle()
  return data as { author_id: string | null } | null
}

export async function getCommentAuthor(id: string) {
  const { data } = await createAdminSupabaseClient().from('community_comments').select('author_id').eq('id', id).maybeSingle()
  return data as { author_id: string | null } | null
}

export async function removePost(id: string) {
  const { error } = await createAdminSupabaseClient().from('community_posts').delete().eq('id', id)
  if (error) throw error
}

export async function removeComment(id: string) {
  const { error } = await createAdminSupabaseClient().from('community_comments').delete().eq('id', id)
  if (error) throw error
}
