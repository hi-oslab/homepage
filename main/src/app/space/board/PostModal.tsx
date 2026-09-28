'use client'

import classNames from 'classnames'
import { useState, useTransition } from 'react'
import { GoPin, GoTrash } from 'react-icons/go'
import { BlockRenderer } from '@/components/BlockRenderer'
import { Modal } from '@/components/admin/Modal'
import { buttonClass, iconButtonClass } from '@/components/admin/ui'
import { InlineDecoratorProvider } from '@/components/blocks/InlineDecorator'
import { useMentions } from '@/components/mentions/MentionProvider'
import { MentionText, renderMentions } from '@/components/mentions/MentionText'
import { MentionTextarea } from '@/components/mentions/MentionTextarea'
import { ProfileImage } from '@/components/ProfileImage'
import { parseBlocks } from '@/lib/blocks'
import type { Block } from '@/types/blocks'
import { callAction } from '@/lib/call-action'
import { COMMENT_MAX, REACTIONS, isPinned, type CommunityPost } from '@/lib/community-types'
import { RelativeTime } from '../DashboardActions'
import {
  createCommentAction,
  deleteCommentAction,
  deletePostAction,
  setPinnedAction,
  toggleReactionAction,
} from '../community/actions'
import { BoardChip, type Viewer } from './shared'

/**
 * 글 보기 모달 안에서의 블록 모양: 모달이 작으니 미디어는 절반 너비, 블록 사이는 좁게
 * (공개 페이지용 여백을 !로 덮어쓴다)
 */
const POST_BLOCK_CLASSES: Partial<Record<Block['type'], string>> = {
  media: 'md:w-1/2 py-2!',
  gallery: 'md:w-1/2 py-2!',
  embed: 'md:w-1/2 my-2!',
  paragraph: 'my-2! text-[15px]!',
  heading: 'pt-5! pb-1!',
  'section-index': 'pt-6! pb-1!',
  divider: 'my-6!',
  quote: 'my-3!',
  callout: 'my-3!',
  list: 'my-2!',
  link: 'my-2!',
  code: 'my-2!',
}

/** 글 모달: 본문 · 반응 이모지 · 댓글. 작성자는 고치기, 작성자 · 운영자는 공지 고정 · 지우기 */
export function PostModal({
  post,
  viewer,
  onClose,
  onChange,
  onEdit,
  onDeleted,
  onMessage,
}: {
  post: CommunityPost | null
  viewer: Viewer
  onClose: () => void
  onChange: (post: CommunityPost) => void
  onEdit: (post: CommunityPost) => void
  onDeleted: (id: string) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
}) {
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const { members } = useMentions()
  if (!post)
    return (
      <Modal open={false} onClose={onClose} title=''>
        {null}
      </Modal>
    )
  const decorateMentions = (text: string) => renderMentions(text, members)

  const isAuthor = post.author_id === viewer.id
  const canManage = isAuthor || viewer.isMaster
  const blocks = post.content ? parseBlocks(post.content) : []

  const react = (emoji: string) => {
    // 먼저 화면에 반영하고, 서버 결과로 맞춘다
    const current = post.reactions.find((reaction) => reaction.emoji === emoji)
    const optimistic = current
      ? post.reactions
          .map((reaction) =>
            reaction.emoji === emoji
              ? { ...reaction, mine: !reaction.mine, count: reaction.count + (reaction.mine ? -1 : 1) }
              : reaction,
          )
          .filter((reaction) => reaction.count > 0)
      : [...post.reactions, { emoji, count: 1, mine: true, names: ['나'] }]
    onChange({ ...post, reactions: optimistic })
    startTransition(async () => {
      const result = await callAction(() => toggleReactionAction(post.id, emoji))
      if ('message' in result) {
        onChange(post)
        return onMessage(result.message, 'error')
      }
      onChange({ ...post, reactions: result.data ?? [] })
    })
  }

  const addComment = () => {
    const body = comment.trim()
    if (!body || isPending) return
    startTransition(async () => {
      const result = await callAction(() => createCommentAction(post.id, body))
      if ('message' in result) return onMessage(result.message, 'error')
      onChange({ ...post, comments: [...post.comments, result.data!] })
      setComment('')
    })
  }

  const removeComment = (id: string) => {
    if (!confirm('댓글을 지울까요?')) return
    startTransition(async () => {
      const result = await callAction(() => deleteCommentAction(id))
      if ('message' in result) return onMessage(result.message, 'error')
      onChange({ ...post, comments: post.comments.filter((item) => item.id !== id) })
    })
  }

  const togglePin = () =>
    startTransition(async () => {
      const result = await callAction(() => setPinnedAction(post.id, !isPinned(post)))
      if ('message' in result) return onMessage(result.message, 'error')
      onChange({ ...post, pinned_until: result.data?.pinned_until ?? null })
      onMessage(result.data?.pinned_until ? '일주일 동안 맨 위에 고정했어요' : '고정을 풀었어요')
    })

  const remove = () => {
    if (!confirm('이 글을 지울까요? 댓글과 반응도 함께 지워지고 되돌릴 수 없어요.')) return
    startTransition(async () => {
      const result = await callAction(() => deletePostAction(post.id))
      if ('message' in result) return onMessage(result.message, 'error')
      onDeleted(post.id)
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      size='lg'
      title={
        <span className='flex items-center gap-2'>
          <BoardChip kind={post.kind} />
          {isPinned(post) && (
            <span className='flex items-center gap-1 text-xs font-normal text-mute'>
              <GoPin size={12} />
              고정됨
            </span>
          )}
        </span>
      }
      footer={
        canManage ? (
          <>
            {isAuthor && (
              <button type='button' onClick={() => onEdit(post)} className={buttonClass('secondary', 'sm')}>
                고치기
              </button>
            )}
            {post.kind === 'notice' && (
              <button type='button' disabled={isPending} onClick={togglePin} className={buttonClass('ghost', 'sm')}>
                <GoPin size={12} />
                {isPinned(post) ? '고정 풀기' : '다시 고정 (일주일)'}
              </button>
            )}
            <button
              type='button'
              disabled={isPending}
              onClick={remove}
              className={buttonClass('danger', 'sm', 'ml-auto')}
            >
              지우기
            </button>
          </>
        ) : undefined
      }
    >
      <article className='flex flex-col gap-6'>
        {/* 작성자 · 제목 */}
        <header className='flex flex-col gap-4'>
          <span className='flex items-center gap-2.5'>
            <ProfileImage
              src={post.author_image}
              name={post.author_name}
              size='sm'
              className='size-9 shrink-0 text-sm'
            />
            <span className='flex flex-col'>
              <span className='text-sm'>{post.author_name}</span>
              <span className='text-xs text-mute'>
                <RelativeTime iso={post.created_at} />
              </span>
            </span>
          </span>
          {post.title && (
            <h2 className='text-2xl leading-tight font-medium tracking-[-0.03em] break-keep md:text-3xl'>
              {post.title}
            </h2>
          )}
        </header>

        {/* 본문: 블록(새 글) 또는 글자(예전 글) */}
        {/* 문단 속 '@이름'은 멘션으로 (누르면 프로필카드) */}
        {blocks.length > 0 ? (
          <div className='flex flex-col'>
            <InlineDecoratorProvider decorate={decorateMentions}>
              <BlockRenderer blocks={blocks} blockClassNames={POST_BLOCK_CLASSES} />
            </InlineDecoratorProvider>
          </div>
        ) : (
          post.body && (
            <p className='text-[15px] leading-relaxed break-keep whitespace-pre-wrap text-ink/80'>
              <MentionText text={post.body} />
            </p>
          )
        )}

        {/* 반응 */}
        <div className='flex flex-wrap items-center gap-1.5'>
          {REACTIONS.map((emoji) => {
            const reaction = post.reactions.find((item) => item.emoji === emoji)
            return (
              <button
                key={emoji}
                type='button'
                onClick={() => react(emoji)}
                title={reaction ? reaction.names.join(', ') : undefined}
                className={classNames(
                  'flex h-8 items-center gap-1 rounded-full px-2.5 text-sm transition-all active:scale-90',
                  reaction?.mine
                    ? 'bg-ink text-paper'
                    : reaction
                      ? 'bg-tile'
                      : 'bg-transparent opacity-50 hover:bg-tile hover:opacity-100',
                )}
              >
                <span>{emoji}</span>
                {reaction && <span className='text-xs tabular-nums'>{reaction.count}</span>}
              </button>
            )
          })}
        </div>

        {/* 댓글 */}
        <section className='flex flex-col gap-3 border-t border-tile pt-5'>
          <span className='text-xs text-mute'>댓글</span>
          {post.comments.map((item) => (
            <div key={item.id} className='group flex gap-2.5'>
              <ProfileImage
                src={item.author_image}
                name={item.author_name}
                size='sm'
                className='size-7 shrink-0 text-[11px]'
              />
              <div className='rounded-inner flex min-w-0 flex-1 flex-col gap-0.5 bg-surface px-3.5 py-2.5'>
                <span className='flex items-baseline gap-2 text-xs'>
                  <span className='text-ink'>{item.author_name}</span>
                  <span className='text-mute'>
                    <RelativeTime iso={item.created_at} />
                  </span>
                </span>
                <p className='text-sm leading-relaxed break-keep whitespace-pre-wrap'>
                  <MentionText text={item.body} />
                </p>
              </div>
              {(item.author_id === viewer.id || viewer.isMaster) && (
                <button
                  type='button'
                  onClick={() => removeComment(item.id)}
                  title='댓글 지우기'
                  className={iconButtonClass({ danger: true, size: 'sm' }, 'mt-1 opacity-0 group-hover:opacity-100')}
                >
                  <GoTrash size={12} />
                </button>
              )}
            </div>
          ))}
          <div className='flex items-end gap-2 rounded-inner bg-ink/[0.05] px-3.5 py-2.5'>
            <MentionTextarea
              value={comment}
              maxLength={COMMENT_MAX}
              placeholder="댓글 남기기 ('@'로 멤버 언급 · Enter로 등록)"
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  addComment()
                }
              }}
              className='py-1 text-sm'
            />
            <button
              type='button'
              disabled={!comment.trim() || isPending}
              onClick={addComment}
              className={buttonClass('primary', 'sm', 'shrink-0')}
            >
              등록
            </button>
          </div>
        </section>
      </article>
    </Modal>
  )
}
