'use client'

import classNames from 'classnames'
import { GoComment } from 'react-icons/go'
import { ROW_HOVER } from '@/components/admin/styles'
import type { Suggestion } from '@/lib/suggestion-types'
import { StatusCheck, StatusControl } from './parts'
import type { SuggestionHandlers } from './useSuggestions'

/** 홈 체크리스트 한 줄: 체크 · 내용(한 줄) · 코멘트 수 · 상태. 누르면 모달에서 자세히 */
export function SuggestionRow({
  item,
  handlers,
  onOpen,
}: {
  item: Suggestion
  handlers: SuggestionHandlers
  onOpen: () => void
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) =>
        (event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget && onOpen()
      }
      className={classNames('group flex cursor-pointer items-center gap-3 px-3 py-2 text-sm', ROW_HOVER)}
    >
      <StatusCheck item={item} handlers={handlers} />
      <span
        className={classNames(
          'min-w-0 flex-1 truncate text-sm',
          item.status === 'done' ? 'text-mute line-through' : item.status === 'rejected' ? 'text-mute' : 'text-ink',
        )}
      >
        {item.body}
      </span>
      <span className='hidden shrink-0 text-xs text-mute sm:inline'>{item.author_name}</span>
      {item.comments.length > 0 && (
        <span className='flex shrink-0 items-center gap-1 text-xs text-mute tabular-nums'>
          <GoComment size={12} />
          {item.comments.length}
        </span>
      )}
      <StatusControl item={item} handlers={handlers} />
    </div>
  )
}
