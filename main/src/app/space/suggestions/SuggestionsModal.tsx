'use client'

import classNames from 'classnames'
import { Modal } from '@/components/admin/Modal'
import { ARCHIVE_DAYS, type Suggestion } from '@/lib/suggestion-types'
import { Composer } from './parts'
import { SuggestionDetail } from './SuggestionDetail'
import type { SuggestionHandlers } from './useSuggestions'

export type SuggestionsModalState = { tab: 'active' | 'archived'; focusId?: string } | null

/** 더보기 모달: 진행 중 / 보관함 탭, 건의마다 코멘트 접기 · 펼치기 */
export function SuggestionsModal({
  state,
  onChange,
  active,
  archived,
  handlers,
  onCreate,
}: {
  /** null이면 닫힘. focusId는 펼친 채로 강조할 건의 */
  state: SuggestionsModalState
  onChange: (next: SuggestionsModalState) => void
  active: Suggestion[]
  archived: Suggestion[]
  handlers: SuggestionHandlers
  onCreate: (body: string) => Promise<boolean>
}) {
  const list = state?.tab === 'archived' ? archived : active

  return (
    <Modal
      open={state !== null}
      onClose={() => onChange(null)}
      size='lg'
      title='웹사이트 건의사항'
      meta={`완료되고 ${ARCHIVE_DAYS}일이 지나면 보관함으로 옮겨져요`}
    >
      {state && (
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-1 self-start rounded-full bg-tile p-1'>
            {(
              [
                ['active', '진행 중', active.length],
                ['archived', '보관함', archived.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type='button'
                onClick={() => onChange({ tab: value })}
                className={classNames(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  state.tab === value ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(var(--shadow-rgb)/0.12)]' : 'text-mute hover:text-ink',
                )}
              >
                {label}
                <span className='text-xs text-mute tabular-nums'>{count}</span>
              </button>
            ))}
          </div>
          {state.tab === 'active' && <Composer busy={handlers.busy} onSubmit={onCreate} />}
          <ul className='flex flex-col gap-2'>
            {list.map((item) => (
              <li key={item.id}>
                <SuggestionDetail item={item} handlers={handlers} defaultOpen={item.id === state.focusId} />
              </li>
            ))}
            {list.length === 0 && (
              <li className='py-10 text-center text-sm text-mute'>
                {state.tab === 'active' ? '진행 중인 건의가 없어요.' : '보관된 건의가 없어요.'}
              </li>
            )}
          </ul>
        </div>
      )}
    </Modal>
  )
}
