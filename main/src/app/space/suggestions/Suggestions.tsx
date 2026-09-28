'use client'

import { useState } from 'react'
import { GoChevronRight } from 'react-icons/go'
import type { Suggestion } from '@/lib/suggestion-types'
import type { Viewer } from '../board/shared'
import { ScrollFade } from '@/components/admin/ScrollFade'
import { HomeSection } from '../home/HomeSection'
import { Composer } from './parts'
import { SuggestionRow } from './SuggestionRow'
import { SuggestionsModal, type SuggestionsModalState } from './SuggestionsModal'
import { useSuggestions } from './useSuggestions'

/**
 * 웹사이트 건의사항 (홈 카드): 멤버 누구나 체크리스트에 적고, 운영자가 상태(요청 · 확인중 · 완료 · 보류 · 불가)를 바꾼다.
 * 진행 중인 건의를 최신순으로, 3줄 높이 안에서 스크롤해 본다. 입력 줄은 스크롤 밖 아래에 고정.
 * 더보기 모달에서 전체 · 보관함(완료 후 3일) · 코멘트를 본다.
 */
export function Suggestions({
  initialItems,
  viewer,
  className,
}: {
  initialItems: Suggestion[] | null
  viewer: Viewer
  className?: string
}) {
  const { items, active, archived, create, handlers, busy, toast } = useSuggestions(initialItems, viewer)
  const [modal, setModal] = useState<SuggestionsModalState>(null)

  // 표가 아직 없으면(마이그레이션 전)
  if (items === null) {
    return (
      <HomeSection size='sm' className={className}>
        <p className='text-sm text-mute'>
          건의사항을 쓰려면 DB 마이그레이션(supabase/migrations/20261007_site_suggestions.sql)이 필요해요.
        </p>
      </HomeSection>
    )
  }

  return (
    // 한 장짜리 체크리스트: 제목 줄 · 최근 5개 · 입력 줄
    <HomeSection
      className={className}
      title='웹사이트 건의사항'
      meta={active.length > 0 ? `진행 중 ${active.length}` : undefined}
      action={
        <button
          type='button'
          onClick={() => setModal({ tab: 'active' })}
          className='flex items-center gap-0.5 text-xs text-mute hover:text-ink'
        >
          더보기
          <GoChevronRight size={12} />
        </button>
      }
    >
      {/* 최신순 전체 목록, 약 3줄 높이에서 안쪽 스크롤 (입력 줄은 스크롤 밖) */}
      <ScrollFade className='-mx-1 max-h-28 overflow-y-auto'>
        <ul className='flex flex-col'>
          {active.map((item) => (
            <li key={item.id}>
              <SuggestionRow
                item={item}
                handlers={handlers}
                onOpen={() => setModal({ tab: 'active', focusId: item.id })}
              />
            </li>
          ))}
          {active.length === 0 && (
            <li className='px-3 py-2.5 text-sm text-mute'>
              {archived.length > 0 ? '진행 중인 건의가 없어요.' : '사이트에서 불편한 점이나 바라는 점을 적어 주세요.'}
            </li>
          )}
        </ul>
      </ScrollFade>

      <Composer busy={busy} onSubmit={create} compact />

      <SuggestionsModal
        state={modal}
        onChange={setModal}
        active={active}
        archived={archived}
        handlers={handlers}
        onCreate={create}
      />
      {toast.node}
    </HomeSection>
  )
}
