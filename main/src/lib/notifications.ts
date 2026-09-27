// 멤버 공간 알림 모음 (서버 전용)
// 승인 대기(운영자) · 공지 · 새 글 · 내 글에 달린 댓글을 한 목록으로 모은다.
// 읽음 여부는 저장하지 않고, 브라우저가 마지막으로 연 시각과 비교한다 (NotificationCenter).

import { createAdminSupabaseClient } from './supabase'
import type { AdminUser } from '@/types/cms'
import { BOARDS, type CommunityKind } from './community-types'

export type NotificationKind = 'signup' | 'notice' | 'post' | 'comment'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  title: string
  /** 글 · 댓글 미리보기 */
  detail?: string
  at: string
  href?: string
  /** 승인 대기: 바로 처리할 계정 */
  userId?: string
  masterRequested?: boolean
}

/** 최근 며칠 치를 보여줄지 */
const WINDOW_DAYS = 30
const LIMIT = 40

const preview = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text)

export async function getNotifications(user: AdminUser): Promise<NotificationItem[]> {
  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [accounts, posts] = await Promise.all([
    supabase.from('admin_users').select('id,name,status,master_requested,created_at'),
    supabase
      .from('community_posts')
      .select('id,author_id,kind,title,body,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT),
  ])
  const users = accounts.data ?? []
  const nameOf = (id: string | null) => users.find((item) => item.id === id)?.name ?? '탈퇴한 멤버'
  const items: NotificationItem[] = []

  // 승인 대기 (운영자만, 기간과 상관없이 모두)
  if (user.is_master) {
    for (const account of users.filter((item) => item.status === 'pending')) {
      items.push({
        id: `signup:${account.id}`,
        kind: 'signup',
        title: `${account.name}님이 가입을 신청했어요`,
        detail: account.master_requested ? '운영자 권한도 신청했어요' : undefined,
        at: account.created_at,
        href: '/space/users',
        userId: account.id,
        masterRequested: account.master_requested,
      })
    }
  }

  // 공지 · 새 글 (내가 쓴 건 빼고). 커뮤니티 표가 없으면(마이그레이션 전) 건너뛴다
  for (const post of posts.data ?? []) {
    if (post.author_id === user.id) continue
    items.push({
      id: `post:${post.id}`,
      kind: post.kind === 'notice' ? 'notice' : 'post',
      title:
        post.kind === 'notice'
          ? `${nameOf(post.author_id)}님이 공지를 올렸어요`
          : `${nameOf(post.author_id)}님이 ${BOARDS[post.kind as CommunityKind]?.label ?? '자유'} 게시판에 글을 썼어요`,
      detail: preview(post.title || post.body),
      at: post.created_at,
      href: '/space',
    })
  }

  // 작성한 글에 달린 댓글 (본인이 쓴 댓글은 빼고)
  const { data: myPosts } = await supabase.from('community_posts').select('id').eq('author_id', user.id)
  const myPostIds = (myPosts ?? []).map((post) => post.id)
  if (myPostIds.length) {
    const { data: comments } = await supabase
      .from('community_comments')
      .select('id,post_id,author_id,body,created_at')
      .in('post_id', myPostIds)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
    for (const comment of comments ?? []) {
      if (comment.author_id === user.id) continue
      items.push({
        id: `comment:${comment.id}`,
        kind: 'comment',
        title: `${nameOf(comment.author_id)}님이 작성한 글에 댓글을 달았어요`,
        detail: preview(comment.body),
        at: comment.created_at,
        href: '/space',
      })
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, LIMIT)
}
