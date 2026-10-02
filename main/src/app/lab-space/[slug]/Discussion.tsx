'use client'

import classNames from 'classnames'
import { useEffect, useState, useTransition } from 'react'
import { GoHeart, GoHeartFill, GoLock, GoTrash } from 'react-icons/go'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import { MentionProvider, type MentionMember } from '@/components/mentions/MentionProvider'
import { MentionTextarea } from '@/components/mentions/MentionTextarea'
import { ProfileImage } from '@/components/ProfileImage'
import { callAction } from '@/lib/call-action'
import {
  LAB_COMMENT_MAX,
  LAB_GUEST_NAME_MAX,
  LAB_PIN_PATTERN,
  type LabComment,
  type LabDiscussion,
} from '@/lib/lab-comment-types'
import {
  addCommentAction,
  deleteCommentAction,
  getDiscussionAction,
  getMentionMembersAction,
  revealCommentAction,
  setLikeAction,
} from './actions'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(new Date(iso))

const FIELD =
  'w-full rounded-sm bg-tile px-3 py-2.5 text-sm outline-none placeholder:text-mute focus:ring-1 focus:ring-ink/30'

/**
 * Lab Space 글 아래: 좋아요 + 댓글
 * 멤버는 계정 실명 · 프로필로, 게스트는 이름 + 숫자 4자리 비밀번호로 쓴다
 * 비밀 댓글은 에디터와 댓글 작성자에게만 보인다 (게스트는 비밀번호로 연다). '@' 언급은 멤버만
 */
export function Discussion({ articleId }: { articleId: string }) {
  const [data, setData] = useState<LabDiscussion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MentionMember[]>([])

  useEffect(() => {
    let alive = true
    callAction(() => getDiscussionAction(articleId)).then((result) => {
      if (!alive) return
      if ('message' in result) return setError(result.message)
      setData(result.data!)
      // 멤버에게만 언급 후보를 받아 온다
      if (result.data!.viewer)
        callAction(getMentionMembersAction).then((list) => alive && 'data' in list && setMembers(list.data ?? []))
    })
    return () => {
      alive = false
    }
  }, [articleId])

  const replace = (comment: LabComment) =>
    setData(
      (current) =>
        current && {
          ...current,
          comments: current.comments.map((item) => (item.id === comment.id ? comment : item)),
        },
    )
  const remove = (id: string) =>
    setData((current) => current && { ...current, comments: current.comments.filter((item) => item.id !== id) })

  return (
    <section
      aria-label='좋아요 · 댓글'
      className='mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-4 pb-24 md:px-8 md:pb-32'
    >
      {error ? (
        <p className='border-t border-ink/10 pt-6 text-sm text-mute'>{error}</p>
      ) : !data ? (
        <p className='border-t border-ink/10 pt-6 text-sm text-mute'>댓글을 불러오는 중…</p>
      ) : (
        <>
          <LikeButton articleId={articleId} likes={data.likes} onChange={(likes) => setData({ ...data, likes })} />

          <div className='flex flex-col gap-6 border-t border-ink/10 pt-6'>
            <h2 className='text-sm'>
              댓글 <span className='text-mute tabular-nums'>{data.comments.length}</span>
            </h2>

            {data.comments.length > 0 && (
              <ul className='flex flex-col'>
                {data.comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} onReplace={replace} onRemove={remove} />
                ))}
              </ul>
            )}

            <MentionProvider members={members}>
              <CommentForm
                articleId={articleId}
                viewer={data.viewer}
                onAdd={(comment) => setData({ ...data, comments: [...data.comments, comment] })}
              />
            </MentionProvider>
          </div>
        </>
      )}
    </section>
  )
}

/* ─── 좋아요 ──────────────────────────────────────────────────────────── */

function LikeButton({
  articleId,
  likes,
  onChange,
}: {
  articleId: string
  likes: LabDiscussion['likes']
  onChange: (likes: LabDiscussion['likes']) => void
}) {
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const previous = likes
    const next = !likes.liked
    // 바로 바꿔 보이고, 실패하면 되돌린다
    onChange({ liked: next, count: Math.max(0, likes.count + (next ? 1 : -1)) })
    startTransition(async () => {
      const result = await callAction(() => setLikeAction(articleId, next))
      onChange('data' in result && result.data ? result.data : previous)
    })
  }

  return (
    <div className='flex justify-center'>
      <button
        type='button'
        onClick={toggle}
        disabled={pending}
        aria-pressed={likes.liked}
        aria-label={likes.liked ? '좋아요 취소' : '좋아요'}
        className={classNames(
          'flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm tabular-nums transition-colors',
          likes.liked ? 'border-ink bg-ink text-paper' : 'border-ink/15 hover:border-ink/40',
        )}
      >
        {likes.liked ? <GoHeartFill size={16} /> : <GoHeart size={16} />}
        {likes.count.toLocaleString()}
      </button>
    </div>
  )
}

/* ─── 댓글 한 줄 ──────────────────────────────────────────────────────── */

function CommentRow({
  comment,
  onReplace,
  onRemove,
}: {
  comment: LabComment
  onReplace: (comment: LabComment) => void
  onRemove: (id: string) => void
}) {
  // 게스트 댓글: 비밀번호로 열기 · 지우기
  const [asking, setAsking] = useState<'reveal' | 'delete' | null>(null)
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const close = () => {
    setAsking(null)
    setPin('')
    setMessage(null)
  }

  const remove = (withPin?: string) => {
    if (!withPin && !confirm('이 댓글을 지울까요?')) return
    startTransition(async () => {
      const result = await callAction(() => deleteCommentAction(comment.id, withPin))
      if ('message' in result) return setMessage(result.message)
      onRemove(comment.id)
    })
  }

  const submitPin = () => {
    if (!LAB_PIN_PATTERN.test(pin)) return setMessage('숫자 4자리를 입력해 주세요.')
    if (asking === 'delete') return remove(pin)
    startTransition(async () => {
      const result = await callAction(() => revealCommentAction(comment.id, pin))
      if ('message' in result) return setMessage(result.message)
      onReplace(result.data!)
      close()
    })
  }

  return (
    <li className={classNames('flex gap-3 border-t border-ink/5 py-5 first:border-t-0', pending && 'opacity-50')}>
      <ProfileImage
        src={comment.guest ? null : comment.image}
        name={comment.name}
        size='sm'
        className='size-8 shrink-0 text-xs'
      />
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
          <span className='font-medium'>{comment.name}</span>
          {comment.guest && <Tag>게스트</Tag>}
          {comment.byArticleAuthor && <Tag strong>에디터</Tag>}
          {comment.secret && (
            <span className='flex items-center gap-0.5 text-xs text-mute'>
              <GoLock size={11} aria-hidden='true' />
              비밀
            </span>
          )}
          <span className='text-xs text-mute tabular-nums'>{formatDate(comment.created_at)}</span>

          <span className='ml-auto flex items-center gap-1'>
            {comment.guest && !comment.parts && (
              <button type='button' onClick={() => setAsking('reveal')} className='text-xs text-mute hover:text-ink'>
                비밀번호로 보기
              </button>
            )}
            {(comment.canDelete || comment.guest) && (
              <button
                type='button'
                aria-label='댓글 지우기'
                onClick={() => (comment.canDelete ? remove() : setAsking('delete'))}
                className='flex size-7 items-center justify-center rounded-full text-mute transition-colors hover:bg-tile hover:text-ink'
              >
                <GoTrash size={12} />
              </button>
            )}
          </span>
        </div>

        {comment.parts ? (
          <p className='text-[15px] leading-relaxed break-keep whitespace-pre-wrap'>
            {comment.parts.map((part, index) =>
              'mention' in part ? (
                <span key={index} className='font-medium text-accent'>
                  @{part.mention}
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </p>
        ) : (
          <p className='text-sm text-mute'>비밀 댓글이에요. 에디터와 댓글 작성자만 볼 수 있어요.</p>
        )}

        {asking && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitPin()
            }}
            className='mt-1 flex flex-wrap items-center gap-2'
          >
            <input
              autoFocus
              type='password'
              inputMode='numeric'
              autoComplete='off'
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder='비밀번호 4자리'
              aria-label='댓글 비밀번호'
              className={classNames(FIELD, 'w-36 ')}
            />
            <button type='submit' disabled={pending} className='rounded-full bg-ink px-4 py-2 text-xs text-paper'>
              {asking === 'delete' ? '지우기' : '보기'}
            </button>
            <button type='button' onClick={close} className='px-2 py-2 text-xs text-mute hover:text-ink'>
              취소
            </button>
            {message && <span className='w-full text-xs text-danger'>{message}</span>}
          </form>
        )}
        {!asking && message && <span className='text-xs text-danger'>{message}</span>}
      </div>
    </li>
  )
}

function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={classNames(
        'rounded-full px-1.5 text-[10px] leading-4',
        strong ? 'bg-ink text-paper' : 'bg-tile text-mute',
      )}
    >
      {children}
    </span>
  )
}

/* ─── 댓글 쓰기 ───────────────────────────────────────────────────────── */

function CommentForm({
  articleId,
  viewer,
  onAdd,
}: {
  articleId: string
  viewer: LabDiscussion['viewer']
  onAdd: (comment: LabComment) => void
}) {
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [secret, setSecret] = useState(false)
  /** 도배 방지: 사람에게는 안 보이는 칸. 자동 등록 프로그램만 채운다 */
  const [website, setWebsite] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const ready = body.trim() && (viewer || (name.trim() && LAB_PIN_PATTERN.test(pin)))

  const submit = () => {
    if (!ready || pending) return
    setMessage(null)
    startTransition(async () => {
      const result = await callAction(() =>
        addCommentAction(articleId, { body, secret, website, ...(viewer ? {} : { name, pin }) }),
      )
      if ('message' in result) return setMessage(result.message)
      onAdd(result.data!)
      setBody('')
      setSecret(false)
    })
  }

  const textarea = {
    value: body,
    maxLength: LAB_COMMENT_MAX,
    placeholder: viewer ? "댓글을 남겨 주세요. '@'로 멤버를 언급할 수 있어요." : '댓글을 남겨 주세요.',
    'aria-label': '댓글',
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value),
    // Ctrl/⌘ + Enter로 등록
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        submit()
      }
    },
    className: classNames(FIELD, 'min-h-24 resize-none leading-relaxed'),
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className='flex flex-col gap-3'
    >
      {viewer ? (
        <div className='flex items-center gap-2 text-sm'>
          <ProfileImage src={viewer.image} name={viewer.name} size='sm' className='size-6 text-[10px]' />
          {viewer.name}
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-2 sm:max-w-md'>
          <input
            value={name}
            maxLength={LAB_GUEST_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            placeholder='이름'
            aria-label='이름'
            autoComplete='nickname'
            className={FIELD}
          />
          <input
            type='password'
            inputMode='numeric'
            autoComplete='off'
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder='비밀번호 (숫자 4자리)'
            aria-label='비밀번호 숫자 4자리'
            className={classNames(FIELD, ' ')}
          />
        </div>
      )}

      <input
        type='text'
        name='website'
        tabIndex={-1}
        autoComplete='off'
        aria-hidden='true'
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        className='absolute -left-[9999px] size-px opacity-0'
      />

      {viewer ? <MentionTextarea {...textarea} /> : <AutoTextarea {...textarea} />}

      <div className='flex flex-wrap items-center justify-between gap-3'>
        {/* 비밀 댓글 켜기 · 끄기 (사이트 전체에서 체크박스 기본 모양을 지워 두어 토글 버튼으로) */}
        <span className='flex items-center gap-2'>
          <button
            type='button'
            aria-pressed={secret}
            onClick={() => setSecret((current) => !current)}
            className={classNames(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              secret ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-mute hover:border-ink/40 hover:text-ink',
            )}
          >
            <GoLock size={11} aria-hidden='true' />
            비밀 댓글
          </button>
          {secret && <span className='text-xs text-mute'>에디터와 나만 볼 수 있어요</span>}
        </span>
        <span className='flex items-center gap-3'>
          {!viewer && <span className='text-xs text-mute'>비밀번호는 댓글을 지우거나 비밀 댓글을 볼 때 써요</span>}
          <button
            type='submit'
            disabled={!ready || pending}
            className='rounded-full bg-ink px-5 py-2 text-sm text-paper transition-opacity disabled:opacity-30'
          >
            {pending ? '등록 중…' : '등록'}
          </button>
        </span>
      </div>
      {message && <p className='text-xs text-danger'>{message}</p>}
    </form>
  )
}
