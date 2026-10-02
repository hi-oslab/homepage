'use client'

import classNames from 'classnames'
import { useCallback, useRef } from 'react'
import type {
  CalloutBlock,
  HeadingBlock,
  ListBlock,
  ParagraphBlock,
  QuoteBlock,
  SectionIndexBlock,
} from '@/types/blocks'
import { useMentionInput } from '@/components/mentions/MentionProvider'
import { MentionTextarea } from '@/components/mentions/MentionTextarea'
import { AutoTextarea } from './AutoTextarea'
import { placeCaret, useEditor, useFocusRegistration, type FocusPosition } from './context'

/*
 * 글 블록을 공개 페이지와 비슷한 모양으로, 테두리 없이 바로 편집한다.
 * 키 처리(Enter · Backspace · ↑↓ · '/')는 에디터(context)가 맡는다.
 */

/** 한 칸짜리 글 블록 공통: 입력칸 + 커서 등록 + 키 처리 */
function useSingleField<T extends { id: string }>(block: T) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const focus = useCallback((position: FocusPosition) => placeCaret(ref.current, position), [])
  useFocusRegistration(block.id, focus)
  return ref
}

export function ParagraphEditable({ block, active }: { block: ParagraphBlock; active: boolean }) {
  const { onTextKeyDown, onTextChange } = useEditor()
  const ref = useSingleField(block)
  // 게시판 글쓰기(MentionInputScope 안)에서는 '@'로 멤버를 고를 수 있다
  const Field = useMentionInput() ? MentionTextarea : AutoTextarea
  return (
    <Field
      ref={ref}
      value={block.text}
      // 포커스한 빈 문단에만 안내를 보여준다
      placeholder={active ? "글을 쓰거나 '/'로 블록 추가" : ''}
      onChange={(event) => onTextChange(block, 'text', event.target.value)}
      onKeyDown={(event) => onTextKeyDown(event, block, 'text')}
      className='py-1 text-[15px] leading-[1.7] font-medium text-ink/70 md:text-base'
    />
  )
}

const HEADING_CLASS: Record<HeadingBlock['level'], string> = {
  1: 'pt-4 pb-1 text-3xl font-bold uppercase leading-[1.2] md:text-4xl',
  2: 'pt-3 pb-1 text-2xl font-bold leading-[1.2] md:text-3xl',
  3: 'pt-2 pb-0.5 text-xl font-bold leading-[1.2] md:text-2xl',
}

export function HeadingEditable({ block }: { block: HeadingBlock }) {
  const { onTextKeyDown, onTextChange } = useEditor()
  const ref = useSingleField(block)
  return (
    <AutoTextarea
      ref={ref}
      value={block.text}
      placeholder={`제목 ${block.level}`}
      onChange={(event) => onTextChange(block, 'text', event.target.value.replace(/\n/g, ''))}
      onKeyDown={(event) => onTextKeyDown(event, block, 'text')}
      className={classNames('break-keep', HEADING_CLASS[block.level])}
    />
  )
}

export function SectionEditable({ block }: { block: SectionIndexBlock }) {
  const { onTextKeyDown, onTextChange } = useEditor()
  const ref = useSingleField(block)
  return (
    <div className='flex items-baseline gap-3 pt-4 pb-0.5'>
      <span className='shrink-0 rounded bg-tile px-1.5 py-0.5 text-[10px] text-mute'>섹션</span>
      <AutoTextarea
        ref={ref}
        value={block.title}
        placeholder='섹션 이름 (상세 페이지 옆 목차에 표시돼요)'
        onChange={(event) => onTextChange(block, 'title', event.target.value.replace(/\n/g, ''))}
        onKeyDown={(event) => onTextKeyDown(event, block, 'title')}
        className='text-base font-semibold text-ink/60'
      />
    </div>
  )
}

export function QuoteEditable({ block }: { block: QuoteBlock }) {
  const { onTextKeyDown, onTextChange, update } = useEditor()
  const ref = useSingleField(block)
  return (
    <blockquote className='my-1.5 flex flex-col gap-2 rounded-sm bg-neutral-500/8 p-4 md:p-5'>
      <AutoTextarea
        ref={ref}
        value={block.text}
        placeholder='인용할 문장'
        onChange={(event) => onTextChange(block, 'text', event.target.value)}
        onKeyDown={(event) => onTextKeyDown(event, block, 'text')}
        className='text-[clamp(1.25rem,2.6vw,2rem)] font-medium leading-[1.2] text-ink/80'
      />
      <input
        value={block.cite ?? ''}
        placeholder='출처 (선택)'
        onChange={(event) => update({ ...block, cite: event.target.value })}
        className='bg-transparent font-mono text-[10px] uppercase text-ink/40 outline-none placeholder:text-ink/25'
      />
    </blockquote>
  )
}

export function CalloutEditable({ block }: { block: CalloutBlock }) {
  const { onTextKeyDown, onTextChange, update } = useEditor()
  const ref = useSingleField(block)
  return (
    <div className='my-1.5 flex gap-3 rounded-sm bg-beige/65 p-4 md:p-5'>
      <input
        value={block.icon ?? ''}
        onChange={(event) => update({ ...block, icon: event.target.value.slice(0, 4) })}
        aria-label='아이콘'
        className='w-7 shrink-0 bg-transparent text-lg leading-none outline-none'
      />
      <AutoTextarea
        ref={ref}
        value={block.text}
        placeholder='안내할 내용'
        onChange={(event) => onTextChange(block, 'text', event.target.value)}
        onKeyDown={(event) => onTextKeyDown(event, block, 'text')}
        className='text-sm leading-relaxed'
      />
    </div>
  )
}

/** 목록: 항목마다 한 줄. Enter로 다음 항목, 빈 항목에서 Enter면 목록을 끝내고 문단으로 */
export function ListEditable({ block }: { block: ListBlock }) {
  const { update, focusSibling, insertParagraphAfter, toParagraph, remove } = useEditor()
  const refs = useRef<(HTMLTextAreaElement | null)[]>([])
  const pending = useRef<{ index: number; position: FocusPosition } | null>(null)

  const focus = useCallback(
    (position: FocusPosition) =>
      position === 'end' || (typeof position === 'number' && position > 0)
        ? placeCaret(refs.current[block.items.length - 1] ?? null, 'end')
        : placeCaret(refs.current[0] ?? null, 'start'),
    [block.items.length],
  )
  useFocusRegistration(block.id, focus)

  // 항목을 더하거나 뺀 뒤 커서 옮기기
  const focusItem = (index: number, position: FocusPosition) => {
    pending.current = { index, position }
    requestAnimationFrame(() => {
      if (!pending.current) return
      placeCaret(refs.current[pending.current.index] ?? null, pending.current.position)
      pending.current = null
    })
  }

  const setItems = (items: string[]) => update({ ...block, items })

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (event.nativeEvent.isComposing) return
    const element = event.currentTarget
    const { selectionStart: start, selectionEnd: end, value } = element
    const items = block.items

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!value) {
        // 빈 항목에서 Enter: 목록을 끝내고 아래에 문단
        const rest = items.filter((_, itemIndex) => itemIndex !== index)
        if (rest.length === 0) return toParagraph(block.id)
        setItems(rest)
        return insertParagraphAfter(block.id)
      }
      const next = items.slice()
      next.splice(index, 1, value.slice(0, start), value.slice(end))
      setItems(next)
      return focusItem(index + 1, 'start')
    }
    if (event.key === 'Backspace' && start === 0 && end === 0) {
      if (items.length === 1 && !value) {
        event.preventDefault()
        return toParagraph(block.id)
      }
      if (index > 0) {
        event.preventDefault()
        const previous = items[index - 1]
        const next = items.slice()
        next.splice(index - 1, 2, previous + value)
        setItems(next)
        return focusItem(index - 1, previous.length)
      }
      if (!items.some(Boolean)) {
        event.preventDefault()
        return remove(block.id, -1)
      }
    }
    if (event.key === 'ArrowUp' && start === 0 && end === 0) {
      if (index > 0) {
        event.preventDefault()
        return placeCaret(refs.current[index - 1], 'end')
      }
      if (focusSibling(block.id, -1)) event.preventDefault()
    }
    if (event.key === 'ArrowDown' && start === value.length) {
      if (index < items.length - 1) {
        event.preventDefault()
        return placeCaret(refs.current[index + 1], 'start')
      }
      if (focusSibling(block.id, 1)) event.preventDefault()
    }
  }

  const Tag = block.style === 'number' ? 'ol' : 'ul'
  return (
    <Tag
      className={classNames(
        'my-1 space-y-1 pl-6 text-[15px] md:text-lg',
        block.style === 'number' ? 'list-decimal' : 'list-disc',
      )}
    >
      {block.items.map((item, index) => (
        <li key={index} className='pl-1 leading-relaxed marker:text-ink/40'>
          <AutoTextarea
            ref={(element) => {
              refs.current[index] = element
            }}
            value={item}
            placeholder='항목'
            onChange={(event) => {
              const next = block.items.slice()
              next[index] = event.target.value.replace(/\n/g, '')
              setItems(next)
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            className='leading-relaxed'
          />
        </li>
      ))}
    </Tag>
  )
}
