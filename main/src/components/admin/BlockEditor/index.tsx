'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { Block } from '@/types/blocks'
import { createBlock, extractVimeoId, extractYoutubeId, serializeBlocks } from '@/lib/blocks'
import { uploadImage } from '@/lib/storage'
import classNames from 'classnames'
import { BlockItem } from './BlockItem'
import { GRID_COLUMNS, PlusMenu, SlashMenu } from './BlockMenu'
import { EditorContext, type EditorApi, type FocusPosition } from './context'
import { filterEntries, TEXT_TYPES, type MenuEntry } from './menu'

/*
 * 프로젝트 본문 블록 에디터 — 글 쓰듯이
 * - Enter: 새 문단 (커서 뒤 글은 새 문단으로) · Shift+Enter: 문단 안 줄바꿈
 * - 빈 블록에서 Backspace: 지우기 · 문단 맨 앞에서 Backspace: 윗 문단과 합치기 · ↑↓: 블록 사이 이동
 * - '/': 블록 메뉴 · '# ' '## ' '### ' '---': 제목 · 구분선으로 바로 바꾸기
 * - 이미지를 붙여넣거나 끌어다 놓으면 이미지 블록, 빈 문단에 유튜브 · 비메오 주소를 붙여넣으면 영상 블록
 * 저장 형식(Block[])은 그대로다.
 */

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  projectId: string
  onDeleteImage: (url: string) => Promise<boolean>
  onPersistContent: (content: string) => Promise<void>
  onActiveBlockChange?: (blockId: string) => void
}

/** 글 속성 하나로 이루어진 블록 (나누기 · 합치기 대상) */
type SingleText = Extract<Block, { type: 'paragraph' | 'heading' | 'quote' | 'callout' }>
const SINGLE_TEXT = new Set<Block['type']>(['paragraph', 'heading', 'quote', 'callout', 'section-index'])
const textOf = (block: Block) =>
  block.type === 'section-index' ? block.title : 'text' in block ? (block as SingleText).text : ''

const newParagraph = (text = ''): Block => ({ ...(createBlock('paragraph') as Extract<Block, { type: 'paragraph' }>), text })
const isUrl = (text: string) => /^https?:\/\/\S+$/.test(text)

export const BlockEditor = ({
  blocks,
  onChange,
  projectId,
  onDeleteImage,
  onPersistContent,
  onActiveBlockChange,
}: BlockEditorProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [slash, setSlash] = useState<{ blockId: string; query: string; index: number } | null>(null)
  // ＋ 메뉴를 연 블록
  const [plusFor, setPlusFor] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // 비동기 작업(업로드 등) 뒤에도 최신 블록을 쓰도록
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks
  const commit = useCallback(
    (next: Block[]) => {
      blocksRef.current = next
      onChange(next)
    },
    [onChange],
  )

  /* ─── 커서 옮기기: 블록이 그려진 뒤에 등록된 방법으로 ─── */

  const focusFns = useRef(new Map<string, (position: FocusPosition) => void>())
  const pendingFocus = useRef<{ id: string; position: FocusPosition } | null>(null)
  const [focusTick, setFocusTick] = useState(0)

  const registerFocus = useCallback((id: string, focus: (position: FocusPosition) => void) => {
    focusFns.current.set(id, focus)
    return () => {
      if (focusFns.current.get(id) === focus) focusFns.current.delete(id)
    }
  }, [])

  const focusBlock = useCallback((id: string, position: FocusPosition) => {
    pendingFocus.current = { id, position }
    setFocusTick((tick) => tick + 1)
  }, [])

  // 자식 블록의 등록(effect)이 먼저 끝난 뒤 실행된다
  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    const focus = focusFns.current.get(pending.id)
    if (!focus) return
    pendingFocus.current = null
    focus(pending.position)
  }, [blocks, focusTick])

  /* ─── 블록 조작 ─── */

  const indexOf = (id: string) => blocksRef.current.findIndex((block) => block.id === id)

  const update = useCallback((block: Block) => commit(blocksRef.current.map((item) => (item.id === block.id ? block : item))), [commit])

  const replace = (id: string, block: Block, focus?: FocusPosition) => {
    commit(blocksRef.current.map((item) => (item.id === id ? block : item)))
    if (focus !== undefined && TEXT_TYPES.has(block.type)) focusBlock(block.id, focus)
  }

  const insertAfter = (id: string | null, inserted: Block[], focus?: FocusPosition) => {
    const next = blocksRef.current.slice()
    const at = id === null ? next.length : indexOf(id) + 1
    next.splice(at, 0, ...inserted)
    commit(next)
    const first = inserted[0]
    if (focus !== undefined && first && TEXT_TYPES.has(first.type)) focusBlock(first.id, focus)
  }

  /** 가까운 글 블록 찾기 (이미지 등은 건너뛴다) */
  const siblingText = (id: string, direction: -1 | 1) => {
    const list = blocksRef.current
    for (let index = indexOf(id) + direction; index >= 0 && index < list.length; index += direction) {
      if (TEXT_TYPES.has(list[index].type)) return list[index]
    }
    return null
  }

  const focusSibling = (id: string, direction: -1 | 1) => {
    const sibling = siblingText(id, direction)
    if (!sibling) return false
    focusBlock(sibling.id, direction < 0 ? 'end' : 'start')
    return true
  }

  const remove = (id: string, focus: -1 | 1 = -1) => {
    const target = siblingText(id, focus) ?? siblingText(id, focus === -1 ? 1 : -1)
    commit(blocksRef.current.filter((block) => block.id !== id))
    if (target) focusBlock(target.id, focus === -1 ? 'end' : 'start')
    if (slash?.blockId === id) setSlash(null)
  }

  const duplicate = (id: string) => {
    const source = blocksRef.current[indexOf(id)]
    if (!source) return
    insertAfter(id, [{ ...structuredClone(source), id: createBlock(source.type).id }])
  }

  const insertParagraphAfter = (id: string, text = '') => insertAfter(id, [newParagraph(text)], 'start')
  const toParagraph = (id: string, text = '') => replace(id, { ...newParagraph(text), id }, 'start')

  /* ─── 블록 메뉴 ─── */

  const slashEntries = slash ? filterEntries(slash.query) : []

  /** '/' 메뉴에서 고르면 그 문단을 고른 블록으로 바꾼다 */
  const chooseFromSlash = (entry: MenuEntry) => {
    if (!slash) return
    const created = entry.create()
    replace(slash.blockId, created, 'start')
    setSlash(null)
  }

  /** ＋ 메뉴에서 고르면 그 블록 아래에 넣는다 (빈 문단이면 그 자리를 바꾼다) */
  const chooseFromPlus = (afterId: string, entry: MenuEntry) => {
    const after = blocksRef.current[indexOf(afterId)]
    const created = entry.create()
    if (after?.type === 'paragraph' && !after.text.trim()) replace(afterId, created, 'start')
    else insertAfter(afterId, [created], 'start')
    setPlusFor(null)
  }

  /* ─── 글 블록 키 · 입력 ─── */

  const onTextKeyDown: EditorApi['onTextKeyDown'] = (event, block, field) => {
    if (event.nativeEvent.isComposing) return
    const { selectionStart: start, selectionEnd: end, value } = event.currentTarget

    // '/' 메뉴가 열려 있으면 메뉴 조작
    if (slash?.blockId === block.id) {
      // 격자: ←→ 한 칸, ↑↓ 한 줄
      const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: GRID_COLUMNS, ArrowUp: -GRID_COLUMNS }
      if (event.key in steps) {
        event.preventDefault()
        const last = Math.max(slashEntries.length - 1, 0)
        return setSlash({ ...slash, index: Math.min(Math.max(slash.index + steps[event.key], 0), last) })
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const entry = slashEntries[slash.index]
        return entry ? chooseFromSlash(entry) : setSlash(null)
      }
      if (event.key === 'Escape') {
        // 모달 안에서도 메뉴만 닫히도록
        event.preventDefault()
        event.stopPropagation()
        return setSlash(null)
      }
    }

    // Enter: 커서 위치에서 나눠 아래에 새 문단 (문단 · 인용 · 콜아웃은 Shift+Enter로 줄바꿈)
    if (event.key === 'Enter') {
      const multiline = block.type === 'paragraph' || block.type === 'quote' || block.type === 'callout'
      if (multiline && event.shiftKey) return
      event.preventDefault()
      const before = value.slice(0, start)
      const after = value.slice(end)
      commit(
        (() => {
          const next = blocksRef.current.map((item) => (item.id === block.id ? { ...item, [field]: before } : item))
          next.splice(indexOf(block.id) + 1, 0, newParagraph(after))
          return next
        })() as Block[],
      )
      const inserted = blocksRef.current[indexOf(block.id) + 1]
      return focusBlock(inserted.id, 'start')
    }

    if (event.key === 'Backspace' && start === 0 && end === 0) {
      // 빈 블록: 문단이 아니면 문단으로, 문단이면 지우기
      if (!value) {
        event.preventDefault()
        return block.type === 'paragraph' ? remove(block.id, -1) : toParagraph(block.id)
      }
      // 문단 맨 앞: 윗 블록이 글 한 칸짜리면 합치기
      const previous = blocksRef.current[indexOf(block.id) - 1]
      if (block.type === 'paragraph' && previous && SINGLE_TEXT.has(previous.type)) {
        event.preventDefault()
        const previousText = textOf(previous)
        const previousField = previous.type === 'section-index' ? 'title' : 'text'
        commit(
          blocksRef.current
            .filter((item) => item.id !== block.id)
            .map((item) => (item.id === previous.id ? ({ ...item, [previousField]: previousText + value } as Block) : item)),
        )
        return focusBlock(previous.id, previousText.length)
      }
    }

    if (event.key === 'ArrowUp' && start === 0 && end === 0 && focusSibling(block.id, -1)) event.preventDefault()
    if (event.key === 'ArrowDown' && start === value.length && focusSibling(block.id, 1)) event.preventDefault()
  }

  const onTextChange: EditorApi['onTextChange'] = (block, field, value) => {
    if (block.type === 'paragraph') {
      // '/'로 시작하면 블록 메뉴 (띄어쓰기 · 줄바꿈 전까지 찾기)
      if (/^\/\S*$/.test(value)) setSlash({ blockId: block.id, query: value.slice(1), index: 0 })
      else if (slash?.blockId === block.id) setSlash(null)

      // 마크다운식 단축키: 줄 맨 앞에서 입력하면 블록으로 바꾼다
      const heading = value.match(/^(#{1,3}) ([\s\S]*)$/)
      if (heading) {
        const level = heading[1].length as 1 | 2 | 3
        return replace(block.id, { id: block.id, type: 'heading', level, text: heading[2] }, heading[2].length)
      }
      if (value === '---') {
        replace(block.id, { id: block.id, type: 'divider' })
        return insertAfter(block.id, [newParagraph()], 'start')
      }
    }
    update({ ...block, [field]: value } as Block)
  }

  /* ─── 붙여넣기 · 끌어다 놓기 ─── */

  /** 이미지 파일마다 이미지 블록을 만들고 올린 뒤 주소를 채운다 */
  const insertImages = (files: File[], afterId: string | null) => {
    const created = files.map(() => createBlock('media') as Extract<Block, { type: 'media' }>)
    insertAfter(afterId, created)
    created.forEach(async (block, index) => {
      try {
        const url = await uploadImage(files[index], 'project-media', `projects/${projectId}`)
        const current = blocksRef.current.find((item) => item.id === block.id)
        if (current?.type === 'media') update({ ...current, url, urls: [url] })
      } catch (error) {
        console.error(error)
        alert('이미지를 올리지 못했어요')
      }
    })
  }

  const onPaste = (event: React.ClipboardEvent) => {
    const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'))
    if (images.length) {
      event.preventDefault()
      return insertImages(images, activeId)
    }
    // 빈 문단에 주소만 붙여넣으면: 유튜브 · 비메오는 영상, 그 밖은 링크 카드
    const text = event.clipboardData.getData('text/plain').trim()
    const target = activeId ? blocksRef.current[indexOf(activeId)] : null
    if (!target || target.type !== 'paragraph' || target.text.trim() || !isUrl(text)) return
    event.preventDefault()
    const youtubeId = extractYoutubeId(text) ?? undefined
    const vimeoId = youtubeId ? undefined : (extractVimeoId(text) ?? undefined)
    const block: Block =
      youtubeId || vimeoId
        ? { id: target.id, type: 'media', mediaType: 'video', url: text, youtubeId, vimeoId, caption: '' }
        : { id: target.id, type: 'link', url: text, style: 'bookmark', title: '', description: '', image: '' }
    replace(target.id, block)
    insertAfter(target.id, [newParagraph()], 'start')
  }

  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files')

  const onDrop = (event: React.DragEvent) => {
    // 이미지 블록 · 갤러리 안에 놓은 건 그 블록이 처리한다
    if (event.defaultPrevented || !hasFiles(event)) return
    const images = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    if (!images.length) return
    event.preventDefault()
    const over = (event.target as HTMLElement).closest<HTMLElement>('[data-block-id]')?.dataset.blockId ?? null
    insertImages(images, over)
  }

  /* ─── 기타 ─── */

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = indexOf(String(active.id))
    const to = indexOf(String(over.id))
    if (from !== -1 && to !== -1) commit(arrayMove(blocksRef.current, from, to))
  }

  // 블록 안 이미지 하나를 서버에서 지우고, 그 결과를 바로 저장한다 (저장 버튼을 잊어도 안전하게)
  const deleteImage = async (id: string, url: string, patch: (block: Block) => Block): Promise<boolean> => {
    const ok = await onDeleteImage(url)
    if (!ok) return false
    const next = blocksRef.current.map((block) => (block.id === id ? patch(block) : block))
    commit(next)
    await onPersistContent(serializeBlocks(next))
    return true
  }

  /** 이어 쓰기: 마지막이 빈 문단이면 거기로, 아니면 새 문단 */
  const continueWriting = () => {
    const last = blocksRef.current.at(-1)
    if (last?.type === 'paragraph' && !last.text.trim()) return focusBlock(last.id, 'end')
    insertAfter(null, [newParagraph()], 'start')
  }

  const api: EditorApi = {
    registerFocus,
    onTextKeyDown,
    onTextChange,
    update,
    focusSibling,
    insertParagraphAfter,
    toParagraph,
    remove,
  }

  return (
    <EditorContext.Provider value={api}>
      <div
        ref={rootRef}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(event) => hasFiles(event) && event.preventDefault()}
        onFocusCapture={(event) => {
          const id = (event.target as HTMLElement).closest<HTMLElement>('[data-block-id]')?.dataset.blockId
          if (!id) return
          setActiveId(id)
          onActiveBlockChange?.(id)
        }}
        onBlurCapture={(event) => {
          // 에디터 밖으로 나가면 '/' 메뉴 닫기
          if (!rootRef.current?.contains(event.relatedTarget as Node)) setSlash(null)
        }}
        // 블록 사이 간격
        className='flex flex-col gap-2'
      >
        <DndContext id='block-editor' sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                projectId={projectId}
                active={block.id === activeId}
                onPlus={() => setPlusFor((current) => (current === block.id ? null : block.id))}
                onDuplicate={() => duplicate(block.id)}
                onDeleteImage={(url, patch) => deleteImage(block.id, url, patch)}
                menu={
                  slash?.blockId === block.id ? (
                    <SlashMenu
                      anchorId={block.id}
                      entries={slashEntries}
                      query={slash.query}
                      activeIndex={slash.index}
                      onHover={(index) => setSlash({ ...slash, index })}
                      onSelect={chooseFromSlash}
                    />
                  ) : null
                }
                plusMenu={
                  plusFor === block.id ? (
                    <PlusMenu anchorId={block.id} onSelect={(entry) => chooseFromPlus(block.id, entry)} onClose={() => setPlusFor(null)} />
                  ) : null
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* 본문이 비어 있으면 빈 문단처럼 보이는 줄, 있으면 마지막 블록 아래 빈 곳을 눌러 이어 쓰기 */}
        <button
          type='button'
          onClick={continueWriting}
          aria-label='본문 이어 쓰기'
          className={classNames(
            'w-full cursor-text pl-[54px] text-left md:pl-16',
            blocks.length === 0 ? 'py-1.5 text-[15px] text-ink/25 md:text-base' : 'min-h-20',
          )}
        >
          {blocks.length === 0 && "글을 쓰거나 '/'로 이미지 · 영상 · 제목 넣기"}
        </button>
      </div>
    </EditorContext.Provider>
  )
}
