// 멤버 공간 알림 모음 (서버 전용)
// 승인 대기(운영자) · 나를 '@' 언급한 글 · 공지 · 새 글 · 내 글에 달린 댓글을 한 목록으로 모은다.
// 읽음 여부는 저장하지 않고, 브라우저가 마지막으로 연 시각과 비교한다 (NotificationCenter).

import { createAdminSupabaseClient } from './supabase'
import type { AdminUser } from '@/types/cms'
import { BOARDS, type CommunityKind } from './community-types'
import { mentions } from './mentions'

export type NotificationKind = 'signup' | 'notice' | 'post' | 'comment' | 'mention'

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

  // 표가 아직 없으면(마이그레이션 전) data가 null이라 빈 목록으로 넘어간다
  const recent = <T>(table: string, columns: string) =>
    supabase
      .from(table)
      .select(columns)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .then(({ data }) => (data ?? []) as T[])
  type Row = { id: string; author_id: string | null; body: string; created_at: string }

  type LabCommentRow = Row & { article_id: string; guest_name: string | null; secret: boolean }
  const [accounts, posts, comments, suggestions, suggestionComments, labComments] = await Promise.all([
    supabase.from('admin_users').select('id,name,username,status,master_requested,created_at'),
    recent<Row & { kind: string; title: string; content: string | null }>(
      'community_posts',
      'id,author_id,kind,title,body,content,created_at',
    ),
    recent<Row & { post_id: string }>('community_comments', 'id,post_id,author_id,body,created_at'),
    recent<Row>('site_suggestions', 'id,author_id,body,created_at'),
    recent<Row>('site_suggestion_comments', 'id,author_id,body,created_at'),
    recent<LabCommentRow>('lab_comments', 'id,article_id,author_id,guest_name,secret,body,created_at'),
  ])
  const users = accounts.data ?? []
  const nameOf = (id: string | null) => users.find((item) => item.id === id)?.name ?? '탈퇴한 멤버'
  const items: NotificationItem[] = []

  // '@실명' 멘션 (본인이 쓴 건 빼고). 언급된 글 · 댓글은 아래 '새 글' · '댓글' 알림 대신 이걸로 한 번만
  const approved = users.filter((item) => item.status === 'approved')
  const mentioned = new Set<string>()
  const mention = (id: string, row: Row, where: string, text: string, detail = row.body) => {
    if (row.author_id === user.id || !mentions(text, approved, user.id)) return
    mentioned.add(id)
    items.push({
      id: `mention:${id}`,
      kind: 'mention',
      title: `${nameOf(row.author_id)}님이 ${where}에서 회원님을 언급했어요`,
      detail: preview(detail),
      at: row.created_at,
      href: '/space',
    })
  }
  for (const post of posts)
    mention(`post:${post.id}`, post, '글', `${post.title}\n${post.content ?? post.body}`, post.title || post.body)
  for (const comment of comments) mention(`comment:${comment.id}`, comment, '댓글', comment.body)
  for (const item of suggestions) mention(`suggestion:${item.id}`, item, '건의사항', item.body)
  for (const item of suggestionComments) mention(`suggestion-comment:${item.id}`, item, '건의사항 코멘트', item.body)

  // Lab Space 댓글: 작성한 글에 달린 댓글(게스트 포함, 비밀 댓글도 에디터는 볼 수 있다) · 나를 언급한 멤버 댓글
  if (labComments.length) {
    const { data: labArticles } = await supabase
      .from('lab_articles')
      .select('id,slug,title,author_id')
      .in('id', Array.from(new Set(labComments.map((comment) => comment.article_id))))
    const articleOf = new Map((labArticles ?? []).map((article) => [article.id as string, article]))
    for (const comment of labComments) {
      const article = articleOf.get(comment.article_id)
      if (!article || comment.author_id === user.id) continue
      const who = comment.guest_name ? `${comment.guest_name}(게스트)` : nameOf(comment.author_id)
      const href = `/lab-space/${article.slug}`
      const onMine = article.author_id === user.id
      // 비밀 댓글은 에디터만 볼 수 있으므로 언급 알림도 보내지 않는다 (게스트는 언급을 쓸 수 없다)
      if (!comment.guest_name && !comment.secret && mentions(comment.body, approved, user.id)) {
        items.push({
          id: `mention:lab-comment:${comment.id}`,
          kind: 'mention',
          title: `${who}님이 Lab Space 댓글에서 회원님을 언급했어요`,
          detail: preview(comment.body),
          at: comment.created_at,
          href,
        })
      } else if (onMine) {
        items.push({
          id: `lab-comment:${comment.id}`,
          kind: 'comment',
          title: `${who}님이 작성한 Lab Space 글에 ${comment.secret ? '비밀 ' : ''}댓글을 달았어요`,
          detail: preview(comment.body),
          at: comment.created_at,
          href,
        })
      }
    }
  }

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
  for (const post of posts) {
    if (post.author_id === user.id || mentioned.has(`post:${post.id}`)) continue
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
    const { data: myComments } = await supabase
      .from('community_comments')
      .select('id,post_id,author_id,body,created_at')
      .in('post_id', myPostIds)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
    for (const comment of myComments ?? []) {
      if (comment.author_id === user.id || mentioned.has(`comment:${comment.id}`)) continue
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
