import { createAdminSupabaseClient } from './supabase'
import type { CommunityKind, CommunityPost, ReactionSummary } from './community-types'
import type { Block } from '@/types/blocks'

export * from './community-types'

const POST_COLUMNS = 'id,author_id,kind,title,body,content,pinned_until,created_at'

type AccountRow = { id: string; name: string; member_id: string | null }

/** 계정 id → 이름 · 프로필 이미지 */
export async function authors(ids: (string | null)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean))) as string[]
  const result = new Map<string, { name: string; image: string | null }>()
  if (!unique.length) return result
  const supabase = createAdminSupabaseClient()
  const { data: accounts } = await supabase.from('admin_users').select('id,name,member_id').in('id', unique)
  const memberIds = ((accounts ?? []) as AccountRow[]).map((row) => row.member_id).filter(Boolean) as string[]
  const { data: members } = memberIds.length
    ? await supabase.from('members').select('id,cover_image_url').in('id', memberIds)
    : { data: [] }
  const images = new Map(((members ?? []) as { id: string; cover_image_url: string | null }[]).map((row) => [row.id, row.cover_image_url]))
  for (const account of (accounts ?? []) as AccountRow[]) {
    result.set(account.id, { name: account.name, image: account.member_id ? (images.get(account.member_id) ?? null) : null })
  }
  return result
}

/** 반응을 이모지별로 묶는다 (내가 눌렀는지, 누가 눌렀는지) */
function summarize(rows: { emoji: string; user_id: string }[], viewerId: string, names: Map<string, { name: string }>) {
  const map = new Map<string, ReactionSummary>()
  for (const row of rows) {
    const current = map.get(row.emoji) ?? { emoji: row.emoji, count: 0, mine: false, names: [] }
    current.count += 1
    if (row.user_id === viewerId) current.mine = true
    current.names.push(names.get(row.user_id)?.name ?? '탈퇴한 멤버')
    map.set(row.emoji, current)
  }
  return Array.from(map.values())
}

/**
 * 최근 글 + 댓글 + 반응 (최신순. 고정 공지를 위로 올리는 건 화면이 한다)
 * 표가 아직 없으면(마이그레이션 전) null
 */
export async function getCommunityFeed(viewerId: string, limit = 80): Promise<CommunityPost[] | null> {
  const supabase = createAdminSupabaseClient()
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select(POST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('community_posts', error.message)
    return null
  }

  const ids = (posts ?? []).map((post) => post.id)
  const [{ data: comments }, { data: reactions }] = ids.length
    ? await Promise.all([
        supabase.from('community_comments').select('id,post_id,author_id,body,created_at').in('post_id', ids).order('created_at'),
        supabase.from('community_reactions').select('post_id,user_id,emoji').in('post_id', ids).order('created_at'),
      ])
    : [{ data: [] }, { data: [] }]

  const people = await authors([
    ...(posts ?? []).map((row) => row.author_id),
    ...(comments ?? []).map((row) => row.author_id),
    ...(reactions ?? []).map((row) => row.user_id),
  ])
  const person = (id: string | null) => (id ? people.get(id) : undefined) ?? { name: '탈퇴한 멤버', image: null }

  return (posts ?? []).map((post) => ({
    ...post,
    kind: post.kind as CommunityKind,
    title: post.title ?? '',
    content: post.content ?? '',
    author_name: person(post.author_id).name,
    author_image: person(post.author_id).image,
    comments: (comments ?? [])
      .filter((comment) => comment.post_id === post.id)
      .map((comment) => ({
        ...comment,
        author_name: person(comment.author_id).name,
        author_image: person(comment.author_id).image,
      })),
    reactions: summarize(
      (reactions ?? []).filter((reaction) => reaction.post_id === post.id),
      viewerId,
      people,
    ),
  }))
}

/** 블록 본문에서 미리보기 · 알림용 글자만 뽑는다 */
export function excerptFromBlocks(blocks: Block[], max = 2000) {
  const text = blocks
    .map((block) => {
      if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote' || block.type === 'callout')
        return block.text
      if (block.type === 'section-index') return block.title
      if (block.type === 'list') return block.items.join('\n')
      if (block.type === 'legacy-markdown') return block.text
      return ''
    })
    .filter(Boolean)
    .join('\n')
  return text.slice(0, max)
}

export type PostInput = { kind: CommunityKind; title: string; body: string; content: string; pinned_until: string | null }

export async function insertPost(authorId: string, input: PostInput) {
  const { data, error } = await createAdminSupabaseClient()
    .from('community_posts')
    .insert({ author_id: authorId, ...input })
    .select(POST_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function updatePost(id: string, input: Partial<PostInput>) {
  const { data, error } = await createAdminSupabaseClient()
    .from('community_posts')
    .update(input)
    .eq('id', id)
    .select(POST_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function getPost(id: string) {
  const { data } = await createAdminSupabaseClient()
    .from('community_posts')
    .select('id,author_id,kind,pinned_until,content')
    .eq('id', id)
    .maybeSingle()
  return data as {
    id: string
    author_id: string | null
    kind: CommunityKind
    pinned_until: string | null
    content: string
  } | null
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

/** 반응을 누르거나 뗀다. 돌려주는 값: 이 글의 반응 요약 */
export async function toggleReaction(postId: string, userId: string, emoji: string): Promise<ReactionSummary[]> {
  const supabase = createAdminSupabaseClient()
  const { data: existing } = await supabase
    .from('community_reactions')
    .select('post_id')
    .match({ post_id: postId, user_id: userId, emoji })
    .maybeSingle()
  const { error } = existing
    ? await supabase.from('community_reactions').delete().match({ post_id: postId, user_id: userId, emoji })
    : await supabase.from('community_reactions').insert({ post_id: postId, user_id: userId, emoji })
  if (error) throw error

  const { data: rows } = await supabase
    .from('community_reactions')
    .select('user_id,emoji')
    .eq('post_id', postId)
    .order('created_at')
  const people = await authors((rows ?? []).map((row) => row.user_id))
  return summarize(rows ?? [], userId, people)
}
