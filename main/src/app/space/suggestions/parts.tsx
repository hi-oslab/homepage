'use client'

// 건의사항 화면 조각: 입력 줄 · 체크 표시 · 상태 칩 · 작성자/처리자 (홈 목록과 모달이 같이 쓴다)

import classNames from 'classnames'
import { useState } from 'react'
import { GoCheck, GoChevronDown, GoPlus, GoX } from 'react-icons/go'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import { buttonClass } from '@/components/admin/ui'
import {
  SUGGESTION_MAX,
  SUGGESTION_STATUSES,
  SUGGESTION_STATUS_ORDER,
  type Suggestion,
  type SuggestionStatus,
} from '@/lib/suggestion-types'
import { RelativeTime } from '../DashboardActions'
import type { SuggestionHandlers } from './useSuggestions'

/** 건의 입력 한 줄 (Enter로 등록) */
export function Composer({
  busy,
  onSubmit,
  compact,
}: {
  busy: boolean
  onSubmit: (body: string) => Promise<boolean>
  compact?: boolean
}) {
  const [draft, setDraft] = useState('')
  const submit = async () => {
    const body = draft.trim()
    if (!body || busy) return
    if (await onSubmit(body)) setDraft('')
  }
  return (
    // 흰 블록 · 모달 안에서도 입력칸인 게 보이도록 회색 면 + 포커스 때 강조색 테두리
    <div
      className={classNames(
        'flex items-center gap-2 rounded-inner bg-ink/[0.05] py-1.5 pr-1.5 pl-3 transition-shadow',
        'focus-within:bg-surface focus-within:ring-1 focus-within:ring-accent',
      )}
    >
      {compact && <GoPlus size={15} className='shrink-0 text-accent' />}
      <AutoTextarea
        value={draft}
        maxLength={SUGGESTION_MAX}
        placeholder={compact ? '건의사항 적기' : '건의사항 적기 (Enter로 등록, Shift+Enter 줄바꿈)'}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
        className='py-1 text-sm'
      />
      <button
        type='button'
        disabled={!draft.trim() || busy}
        onClick={submit}
        className={buttonClass('primary', 'sm', 'shrink-0')}
      >
        등록
      </button>
    </div>
  )
}

/** 체크 표시: 완료는 채운 체크, 불가는 X. 운영자는 눌러서 완료 ↔ 요청 */
export function StatusCheck({ item, handlers }: { item: Suggestion; handlers: SuggestionHandlers }) {
  const done = item.status === 'done'
  const icon = done ? <GoCheck size={13} /> : item.status === 'rejected' ? <GoX size={12} /> : null
  const className = classNames(
    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
    done
      ? 'border-ink bg-ink text-paper'
      : item.status === 'rejected'
        ? 'border-mute/40 text-mute'
        : 'border-ink/25 bg-surface',
  )
  if (!handlers.viewer.isMaster) return <span className={className}>{icon}</span>
  return (
    <button
      type='button'
      title={done ? '요청으로 되돌리기' : '완료로 표시'}
      disabled={handlers.busy}
      onClick={(event) => {
        event.stopPropagation()
        handlers.changeStatus(item, done ? 'requested' : 'done')
      }}
      className={classNames(className, !done && 'hover:border-ink')}
    >
      {icon}
    </button>
  )
}

/** 상태 표시: 운영자는 골라서 바꾸고, 멤버는 보기만 */
export function StatusControl({ item, handlers }: { item: Suggestion; handlers: SuggestionHandlers }) {
  const chip = classNames('shrink-0 rounded-full px-2 py-0.5 text-[11px]', SUGGESTION_STATUSES[item.status].chip)
  if (!handlers.viewer.isMaster) return <span className={chip}>{SUGGESTION_STATUSES[item.status].label}</span>
  return (
    <span
      className={classNames(chip, 'relative flex items-center gap-0.5 pr-1.5')}
      onClick={(event) => event.stopPropagation()}
    >
      <select
        aria-label='상태 바꾸기'
        value={item.status}
        disabled={handlers.busy}
        onChange={(event) => handlers.changeStatus(item, event.target.value as SuggestionStatus)}
        className='cursor-pointer appearance-none bg-transparent pr-3 outline-none'
      >
        {SUGGESTION_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {SUGGESTION_STATUSES[status].label}
          </option>
        ))}
      </select>
      <GoChevronDown size={10} className='pointer-events-none absolute right-1.5' />
    </span>
  )
}

/** 누가 적었고 누가 처리했는지 */
export function People({ item }: { item: Suggestion }) {
  return (
    <span className='flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-mute'>
      <span className='flex items-center gap-1'>
        건의 <span className='text-ink/70'>{item.author_name}</span>
        <RelativeTime iso={item.created_at} />
      </span>
      {item.handler_name && item.status !== 'requested' && (
        <span className='flex items-center gap-1'>
          · {item.status === 'done' ? '해결' : '담당'} <span className='text-ink/70'>{item.handler_name}</span>
          {item.status === 'done' && item.resolved_at && <RelativeTime iso={item.resolved_at} />}
        </span>
      )}
    </span>
  )
}
