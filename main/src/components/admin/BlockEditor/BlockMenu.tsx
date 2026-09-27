'use client'

import classNames from 'classnames'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { filterEntries, type MenuEntry } from './menu'

/** 격자 한 줄의 칸 수 (↑↓로 한 줄씩 이동) */
export const GRID_COLUMNS = 6

/** 블록 보관함 겉모양: 어두운 상자 */
const PANEL =
  'flex w-[min(calc(100vw-2rem),600px)] flex-col overflow-hidden rounded-xl bg-ink text-white shadow-[0_12px_32px_rgba(17,17,17,0.25)]'

/**
 * 블록 위쪽에 띄우는 층 (모달 · 스크롤 영역에 잘리지 않도록 화면 맨 위 층에 그린다)
 * 위쪽 공간이 모자라면 아래쪽에 띄우고, 스크롤 · 창 크기가 바뀌면 다시 맞춘다.
 */
const FloatingPanel = forwardRef<HTMLDivElement, { anchorId: string; className?: string; children: React.ReactNode; onMouseDown?: React.MouseEventHandler }>(
  function FloatingPanel({ anchorId, className, children, onMouseDown }, forwarded) {
    const panelRef = useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

    useLayoutEffect(() => {
      const place = () => {
        const anchor = document.querySelector<HTMLElement>(`[data-block-id="${anchorId}"]`)
        const panel = panelRef.current
        if (!anchor || !panel) return
        const rect = anchor.getBoundingClientRect()
        const height = panel.offsetHeight
        const width = panel.offsetWidth
        const gap = 8
        // 위쪽 우선, 모자라면 아래쪽
        const above = rect.top - height - gap
        const top = above >= gap ? above : Math.min(rect.bottom + gap, window.innerHeight - height - gap)
        const left = Math.min(Math.max(rect.left, gap), window.innerWidth - width - gap)
        setPosition({ left, top })
      }
      place()
      window.addEventListener('scroll', place, true)
      window.addEventListener('resize', place)
      return () => {
        window.removeEventListener('scroll', place, true)
        window.removeEventListener('resize', place)
      }
    }, [anchorId, children])

    return createPortal(
      <div
        ref={(element) => {
          panelRef.current = element
          if (typeof forwarded === 'function') forwarded(element)
          else if (forwarded) forwarded.current = element
        }}
        onMouseDown={onMouseDown}
        style={position ?? { left: -9999, top: -9999 }}
        className={classNames('fixed z-[90]', className)}
      >
        {children}
      </div>,
      document.body,
    )
  },
)

/** 블록 종류 격자 (아이콘 + 이름). '/' 메뉴와 ＋ 보관함이 같이 쓴다 */
function BlockGrid({
  entries,
  activeIndex,
  onHover,
  onSelect,
}: {
  entries: MenuEntry[]
  activeIndex: number
  onHover: (index: number) => void
  onSelect: (entry: MenuEntry) => void
}) {
  return (
    <ul role='listbox' className='grid grid-cols-4 gap-1 p-2 sm:grid-cols-6'>
      {entries.map((entry, index) => (
        <li key={entry.id}>
          <button
            type='button'
            role='option'
            aria-selected={index === activeIndex}
            title={entry.hint}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(entry)}
            className={classNames(
              'flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2.5 text-center',
              index === activeIndex ? 'bg-white/12' : 'hover:bg-white/8',
            )}
          >
            <span className='flex size-8 items-center justify-center rounded-md bg-white/10 text-xs text-white/75'>
              {entry.icon}
            </span>
            <span className='text-[11px] leading-tight break-keep text-white/85'>{entry.label}</span>
          </button>
        </li>
      ))}
      {entries.length === 0 && <li className='col-span-full px-2 py-3 text-xs text-white/50'>맞는 블록이 없어요</li>}
    </ul>
  )
}

/**
 * '/'를 쳤을 때 뜨는 블록 보관함: 입력 위치 위쪽에 가로 격자로 뜬다.
 * 커서는 문단에 그대로 두고, 고르기(←→↑↓ · Enter)는 에디터가 문단 키 입력에서 처리한다.
 */
export function SlashMenu({
  anchorId,
  entries,
  activeIndex,
  query,
  onHover,
  onSelect,
}: {
  /** 이 블록 위쪽에 띄운다 */
  anchorId: string
  entries: MenuEntry[]
  activeIndex: number
  query: string
  onHover: (index: number) => void
  onSelect: (entry: MenuEntry) => void
}) {
  return (
    <FloatingPanel
      anchorId={anchorId}
      // 문단의 포커스를 빼앗지 않도록
      onMouseDown={(event) => event.preventDefault()}
      className={PANEL}
    >
      <div className='border-b border-white/10 px-3.5 py-2.5 text-sm text-white/40'>
        {query ? <span className='text-white'>/{query}</span> : '블록 이름을 이어서 입력해 찾을 수 있어요'}
      </div>
      <BlockGrid entries={entries} activeIndex={activeIndex} onHover={onHover} onSelect={onSelect} />
    </FloatingPanel>
  )
}

/**
 * ＋ 버튼으로 연 블록 보관함: 블록 위쪽에 가로 격자로 뜬다 (아래에 붙으면 스크롤에 가려져서)
 * 위의 찾기 칸에 입력해서 거르고, ←→↑↓와 Enter로도 고를 수 있다.
 */
export function PlusMenu({
  anchorId,
  onSelect,
  onClose,
}: {
  /** 이 블록 위쪽에 띄운다 */
  anchorId: string
  onSelect: (entry: MenuEntry) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const entries = filterEntries(query)
  const current = Math.min(activeIndex, Math.max(entries.length - 1, 0))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 바깥을 누르면 닫기
    const onPointerDown = (event: PointerEvent) => {
      // ＋ 버튼을 다시 누른 건 버튼이 닫는다
      if ((event.target as Element).closest?.('[data-plus-button]')) return
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  const move = (step: number) =>
    setActiveIndex((index) => Math.min(Math.max(Math.min(index, entries.length - 1) + step, 0), entries.length - 1))

  return (
    <FloatingPanel ref={rootRef} anchorId={anchorId} className={PANEL}
    >
      <input
        autoFocus
        value={query}
        placeholder='블록 찾기'
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
        onKeyDown={(event) => {
          const steps: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: GRID_COLUMNS,
            ArrowUp: -GRID_COLUMNS,
          }
          if (event.key in steps) {
            event.preventDefault()
            move(steps[event.key])
          } else if (event.key === 'Enter') {
            event.preventDefault()
            const entry = entries[current]
            if (entry) onSelect(entry)
          } else if (event.key === 'Escape') {
            // 모달까지 닫히지 않도록
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
        }}
        className='border-b border-white/10 bg-transparent px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35'
      />
      <BlockGrid entries={entries} activeIndex={current} onHover={setActiveIndex} onSelect={onSelect} />
    </FloatingPanel>
  )
}
