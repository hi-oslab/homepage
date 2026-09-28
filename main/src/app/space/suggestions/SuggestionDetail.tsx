'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { GoChevronDown, GoComment, GoTrash } from 'react-icons/go'
import { buttonClass, iconButtonClass } from '@/components/admin/ui'
import { MentionText } from '@/components/mentions/MentionText'
import { MentionTextarea } from '@/components/mentions/MentionTextarea'
import { ProfileImage } from '@/components/ProfileImage'
import { SUGGESTION_COMMENT_MAX, type Suggestion } from '@/lib/suggestion-types'
import { RelativeTime } from '../DashboardActions'
import { People, StatusCheck, StatusControl } from './parts'
import type { SuggestionHandlers } from './useSuggestions'

/** 모달 안 한 건: 전체 내용 · 처리한 사람 · 코멘트 접기/펼치기 */
export function SuggestionDetail({
  item,
  handlers,
  defaultOpen,
}: {
  item: Suggestion
  handlers: SuggestionHandlers
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const [comment, setComment] = useState('')
  const { viewer } = handlers
  const canDelete = viewer.isMaster || (item.author_id === viewer.id && item.status === 'requested')

  const addComment = async () => {
    const body = comment.trim()
    if (!body || handlers.busy) return
    if (await handlers.addComment(item, body)) setComment('')
  }

  return (
    <div className={classNames('rounded-block flex flex-col bg-surface', defaultOpen && 'ring-1 ring-ink/15')}>
      <div className='group flex items-start gap-3 px-4 pt-3.5 pb-2'>
        <span className='pt-0.5'>
          <StatusCheck item={item} handlers={handlers} />
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <p
            className={classNames(
              'text-[15px] leading-relaxed break-keep whitespace-pre-wrap',
              item.status === 'done' ? 'text-mute line-through' : item.status === 'rejected' ? 'text-mute' : 'text-ink',
            )}
          >
            <MentionText text={item.body} />
          </p>
          <People item={item} />
        </div>
        <span className='flex shrink-0 items-center gap-1'>
          <StatusControl item={item} handlers={handlers} />
          {canDelete && (
            <button
              type='button'
              onClick={() => handlers.remove(item)}
              title='건의 지우기'
              className={iconButtonClass(
                { danger: true, size: 'sm' },
                'opacity-0 group-hover:opacity-100 focus:opacity-100',
              )}
            >
              <GoTrash size={12} />
            </button>
          )}
        </span>
      </div>

      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className='flex items-center gap-1.5 self-start px-4 pb-3 pl-12 text-xs text-mute hover:text-ink'
      >
        <GoComment size={12} />
        {item.comments.length > 0 ? `코멘트 ${item.comments.length}개` : '코멘트 남기기'}
        <GoChevronDown size={12} className={classNames('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='overflow-hidden'
          >
            <div className='flex flex-col gap-2.5 border-t border-tile px-4 pt-3 pb-4 pl-12'>
              {item.comments.map((entry) => (
                <div key={entry.id} className='group/comment flex gap-2.5'>
                  <ProfileImage
                    src={entry.author_image}
                    name={entry.author_name}
                    size='sm'
                    className='size-6 shrink-0 text-[10px]'
                  />
                  <div className='rounded-inner flex min-w-0 flex-1 flex-col gap-0.5 bg-paper px-3 py-2'>
                    <span className='flex items-baseline gap-2 text-xs'>
                      <span className='text-ink'>{entry.author_name}</span>
                      <RelativeTime iso={entry.created_at} />
                    </span>
                    <p className='text-sm leading-relaxed break-keep whitespace-pre-wrap'>
                      <MentionText text={entry.body} />
                    </p>
                  </div>
                  {(entry.author_id === viewer.id || viewer.isMaster) && (
                    <button
                      type='button'
                      onClick={() => handlers.removeComment(item, entry.id)}
                      title='코멘트 지우기'
                      className={iconButtonClass(
                        { danger: true, size: 'sm' },
                        'mt-1 opacity-0 group-hover/comment:opacity-100 focus:opacity-100',
                      )}
                    >
                      <GoTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
              <div className='flex items-end gap-2 rounded-inner bg-ink/[0.05] px-3 py-2'>
                <MentionTextarea
                  value={comment}
                  maxLength={SUGGESTION_COMMENT_MAX}
                  placeholder="코멘트 남기기 ('@'로 멤버 언급 · Enter로 등록)"
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
                  disabled={!comment.trim() || handlers.busy}
                  onClick={addComment}
                  className={buttonClass('primary', 'sm', 'shrink-0')}
                >
                  등록
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
