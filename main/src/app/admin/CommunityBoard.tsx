'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState, useTransition } from 'react'
import { GoChevronDown, GoTrash } from 'react-icons/go'
import { Textarea, buttonClass, useRefreshOnFocus, useServerState, useToast } from '@/components/admin/ui'
import { COMMENT_MAX, POST_MAX, type CommunityKind, type CommunityPost } from '@/lib/community-types'
import { Segmented } from './AccountFields'
import { RelativeTime } from './DashboardActions'
import { createCommentAction, createPostAction, deleteCommentAction, deletePostAction } from './community/actions'

type Me = { id: string; isMaster: boolean }

const PAGE_SIZE = 8

const expand = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const

/** 대시보드 커뮤니티: 공지 / 자유글 + 댓글. 목록은 접었다 펼 수 있다 */
export function CommunityBoard({ initialPosts, me }: { initialPosts: CommunityPost[] | null; me: Me }) {
  // null(테이블 없음)을 그대로 넘겨야 렌더마다 새 배열로 바뀌지 않는다
  const [serverPosts, setPosts] = useServerState(initialPosts)
  const posts = useMemo(() => serverPosts ?? [], [serverPosts])
  useRefreshOnFocus()
  // 가장 최근 공지는 기본으로 펼쳐 둔다
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set((initialPosts ?? []).filter((post) => post.kind === 'notice').slice(0, 1).map((post) => post.id)),
  )
  const [composing, setComposing] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const toast = useToast()

  // 공지가 항상 위, 그 안에서는 최신순
  const sorted = useMemo(
    () =>
      posts
        .slice()
        .sort((a, b) =>
          a.kind === b.kind ? b.created_at.localeCompare(a.created_at) : a.kind === 'notice' ? -1 : 1,
        ),
    [posts],
  )

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (!initialPosts) {
    return (
      <section className='rounded-xl bg-surface p-5 text-sm text-mute'>
        커뮤니티를 쓰려면 DB 마이그레이션이 필요해요. supabase/migrations/20261001_community.sql 을 실행해 주세요.
      </section>
    )
  }

  return (
    <section className='flex flex-col gap-3 rounded-xl bg-surface p-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='flex items-baseline gap-2 text-sm text-mute'>
          커뮤니티
          <span className='text-xs'>{posts.length}</span>
        </h2>
        <button
          type='button'
          onClick={() => setComposing((value) => !value)}
          className={buttonClass(composing ? 'ghost' : 'secondary', 'sm')}
        >
          {composing ? '닫기' : '+ 새 글 쓰기'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {composing && (
          <motion.div {...expand} className='overflow-hidden'>
            <Composer
              isMaster={me.isMaster}
              onPosted={(post) => {
                setPosts((current) => [post, ...(current ?? [])])
                setOpenIds((current) => new Set(current).add(post.id))
                setComposing(false)
                toast.show('글을 올렸어요')
              }}
              onError={(message) => toast.show(message, 'error')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {sorted.length === 0 ? (
        <p className='py-6 text-center text-sm text-mute'>아직 글이 없어요. 첫 이야기를 남겨보세요.</p>
      ) : (
        <ul className='-mx-2 flex flex-col'>
          {sorted.slice(0, visible).map((post) => (
            <PostItem
              key={post.id}
              post={post}
              me={me}
              open={openIds.has(post.id)}
              onToggle={() => toggle(post.id)}
              onChange={(next) => setPosts((current) => (current ?? []).map((item) => (item.id === next.id ? next : item)))}
              onDelete={() => setPosts((current) => (current ?? []).filter((item) => item.id !== post.id))}
              toast={toast.show}
            />
          ))}
        </ul>
      )}

      {sorted.length > visible && (
        <button type='button' onClick={() => setVisible((value) => value + PAGE_SIZE)} className={buttonClass('ghost', 'sm', 'self-center')}>
          더 보기 ({sorted.length - visible})
        </button>
      )}
      {toast.node}
    </section>
  )
}

function Composer({
  isMaster,
  onPosted,
  onError,
}: {
  isMaster: boolean
  onPosted: (post: CommunityPost) => void
  onError: (message: string) => void
}) {
  const [kind, setKind] = useState<CommunityKind>('talk')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (!body.trim() || isPending) return
    startTransition(async () => {
      const result = await createPostAction(kind, body)
      if ('message' in result) return onError(result.message)
      setBody('')
      onPosted(result.data!)
    })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className='flex flex-col gap-2 rounded-lg bg-field p-3'
    >
      {isMaster && (
        <div className='self-start'>
          <Segmented<CommunityKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: 'talk', label: '자유' },
              { value: 'notice', label: '공지' },
            ]}
          />
        </div>
      )}
      <Textarea
        autoFocus
        rows={4}
        maxLength={POST_MAX}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
        placeholder={kind === 'notice' ? '멤버들에게 알릴 공지를 적어주세요.' : '하고 싶은 말을 자유롭게 남겨주세요.'}
        className='resize-none bg-surface'
      />
      <div className='flex items-center justify-between text-xs text-mute'>
        <span>
          {body.length}/{POST_MAX} · ⌘+Enter로 등록
        </span>
        <button type='submit' disabled={!body.trim() || isPending} className={buttonClass('primary', 'sm')}>
          {isPending ? '올리는 중…' : kind === 'notice' ? '공지 올리기' : '올리기'}
        </button>
      </div>
    </form>
  )
}

function PostItem({
  post,
  me,
  open,
  onToggle,
  onChange,
  onDelete,
  toast,
}: {
  post: CommunityPost
  me: Me
  open: boolean
  onToggle: () => void
  onChange: (post: CommunityPost) => void
  onDelete: () => void
  toast: (message: string, kind?: 'success' | 'error' | 'info') => void
}) {
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const canDelete = me.isMaster || post.author_id === me.id
  const preview = post.body.split('\n').find((line) => line.trim()) ?? ''

  const addComment = () => {
    if (!comment.trim() || isPending) return
    startTransition(async () => {
      const result = await createCommentAction(post.id, comment)
      if ('message' in result) return toast(result.message, 'error')
      setComment('')
      onChange({ ...post, comments: [...post.comments, result.data!] })
    })
  }

  const removePost = () => {
    if (!confirm('이 글을 삭제할까요? 댓글도 함께 삭제됩니다.')) return
    startTransition(async () => {
      const result = await deletePostAction(post.id)
      if ('message' in result) return toast(result.message, 'error')
      onDelete()
      toast('삭제했어요')
    })
  }

  const removeComment = (id: string) => {
    if (!confirm('댓글을 삭제할까요?')) return
    startTransition(async () => {
      const result = await deleteCommentAction(id)
      if ('message' in result) return toast(result.message, 'error')
      onChange({ ...post, comments: post.comments.filter((item) => item.id !== id) })
    })
  }

  return (
    <li className={classNames('rounded-lg transition-colors', open ? 'bg-field' : 'hover:bg-field')}>
      {/* 접힌 상태: 한 줄 요약 */}
      <button type='button' onClick={onToggle} aria-expanded={open} className='flex w-full items-center gap-3 px-2 py-2.5 text-left'>
        {post.kind === 'notice' ? (
          <span className='shrink-0 rounded bg-ink px-1.5 py-0.5 text-[10px] text-white'>공지</span>
        ) : (
          <span className='shrink-0 rounded bg-tile px-1.5 py-0.5 text-[10px] text-ink/60'>자유</span>
        )}
        <span className={classNames('min-w-0 flex-1 truncate text-sm', open && 'text-mute')}>{preview}</span>
        <span className='hidden shrink-0 text-xs text-mute sm:inline'>{post.author_name}</span>
        <span className='hidden shrink-0 sm:inline'>
          <RelativeTime iso={post.created_at} />
        </span>
        {post.comments.length > 0 && (
          <span className='shrink-0 rounded-full bg-surface px-1.5 text-[11px] tabular-nums text-ink/60'>
            {post.comments.length}
          </span>
        )}
        <GoChevronDown size={14} className={classNames('shrink-0 text-mute transition-transform', open && 'rotate-180')} />
      </button>

      {/* 펼친 상태: 본문 + 댓글 */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...expand} className='overflow-hidden'>
            <div className='flex flex-col gap-4 px-2 pt-1 pb-3'>
              <div className='flex flex-col gap-2'>
                <p className='whitespace-pre-wrap break-words text-sm leading-relaxed'>{post.body}</p>
                <div className='flex items-center gap-2 text-xs text-mute'>
                  <span>{post.author_name}</span>
                  <span>·</span>
                  <RelativeTime iso={post.created_at} />
                  {canDelete && (
                    <button type='button' onClick={removePost} disabled={isPending} className='ml-auto hover:text-danger'>
                      삭제
                    </button>
                  )}
                </div>
              </div>

              <div className='flex flex-col gap-2 rounded-lg bg-surface p-3'>
                {post.comments.map((item) => (
                  <div key={item.id} className='group flex items-start gap-2 text-sm'>
                    <span className='shrink-0 text-xs leading-5 text-mute'>{item.author_name}</span>
                    <p className='min-w-0 flex-1 whitespace-pre-wrap break-words leading-5'>{item.body}</p>
                    <span className='shrink-0 leading-5'>
                      <RelativeTime iso={item.created_at} />
                    </span>
                    {(me.isMaster || item.author_id === me.id) && (
                      <button
                        type='button'
                        onClick={() => removeComment(item.id)}
                        className='shrink-0 text-mute opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100'
                        aria-label='댓글 삭제'
                      >
                        <GoTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    addComment()
                  }}
                  className='flex items-end gap-2'
                >
                  <Textarea
                    rows={1}
                    maxLength={COMMENT_MAX}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        addComment()
                      }
                    }}
                    placeholder='댓글 달기 (Enter로 등록, Shift+Enter 줄바꿈)'
                    aria-label='댓글'
                    className='field-sizing-content min-h-9 resize-none py-2 text-sm'
                  />
                  <button type='submit' disabled={!comment.trim() || isPending} className={buttonClass('secondary', 'sm', 'shrink-0')}>
                    등록
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
