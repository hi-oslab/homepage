'use client'

import { useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@/types/blocks'
import { BLOCK_TYPE_LABELS } from '@/types/blocks'
import {
  HeadingBlockField,
  ParagraphBlockField,
  QuoteBlockField,
  CalloutBlockField,
  SectionIndexBlockField,
} from './fields/TextBlocks'
import { MediaBlockField, GalleryBlockField } from './fields/MediaBlocks'
import { LinkBlockField, EmbedBlockField } from './fields/LinkBlocks'
import { CodeBlockField, HtmlBlockField } from './fields/CodeBlocks'
import { ListBlockField } from './fields/ListBlock'
import { LegacyMarkdownBlockField } from './fields/LegacyMarkdownBlock'
import { GoCopy, GoTrash } from 'react-icons/go'
import { iconButtonClass } from '@/components/admin/ui'

// 툴바 버튼은 블록에 마우스를 올리거나 포커스했을 때만 보인다
const TOOLBAR_BUTTON = 'opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100'

// 블록 안 입력 필드 간격. 이 규칙이 필드 자체의 margin 클래스보다 뒤에 생성되므로
// 필드에서 간격을 바꾸려면 mb-0! 처럼 !를 붙인다 (ListBlock, MediaBlocks)
const BODY = [
  '[&_:where(textarea,input[type=text],input[type=url])]:mb-1.5',
  '[&_:where(select)]:mr-1.5 [&_:where(select)]:mb-1.5 [&_:where(select)]:inline-block [&_:where(select)]:w-auto',
  '[&_hr]:my-2 [&_hr]:h-px [&_hr]:border-0 [&_hr]:bg-border',
].join(' ')

interface BlockItemProps {
  block: Block
  projectId: string
  autoFocus?: boolean
  onChange: (block: Block) => void
  onRemove: () => void
  onDuplicate: () => void
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
  onActivate?: (blockId: string) => void
}

export const BlockItem = ({
  block,
  projectId,
  autoFocus,
  onChange,
  onRemove,
  onDuplicate,
  onDeleteImage,
  onActivate,
}: BlockItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const bodyRef = useRef<HTMLDivElement>(null)

  // 새로 추가된 블록이면 바로 타이핑할 수 있도록 첫 입력 필드에 포커스한다
  useEffect(() => {
    if (!autoFocus) return
    const field = bodyRef.current?.querySelector<HTMLElement>('textarea, input[type="text"], input[type="url"]')
    field?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='group/block relative rounded-xl bg-surface pt-3 pr-4 pb-3.5 pl-10'
      data-editor-block-id={block.id}
      onPointerDownCapture={() => onActivate?.(block.id)}
      onFocusCapture={() => onActivate?.(block.id)}
    >
      <button
        type='button'
        className='absolute inset-y-0 left-0 flex w-8 cursor-grab touch-none items-center justify-center rounded-l-xl text-ink/20 transition-colors hover:bg-field hover:text-ink'
        {...attributes}
        {...listeners}
        title='드래그해서 순서 변경'
      >
        ⠿
      </button>

      <div className='mb-1.5 flex h-6 items-center gap-0.5'>
        <span className='flex-1 text-xs text-mute'>{BLOCK_TYPE_LABELS[block.type]}</span>
        <button type='button' onClick={onDuplicate} title='복제' className={iconButtonClass({ size: 'sm' }, TOOLBAR_BUTTON)}>
          <GoCopy size={13} />
        </button>
        <button
          type='button'
          onClick={onRemove}
          title='삭제'
          className={iconButtonClass({ danger: true, size: 'sm' }, TOOLBAR_BUTTON)}
        >
          <GoTrash size={13} />
        </button>
      </div>

      <div className={BODY} ref={bodyRef}>
        <BlockFields block={block} projectId={projectId} onChange={onChange} onDeleteImage={onDeleteImage} />
      </div>
    </div>
  )
}

function BlockFields({
  block,
  projectId,
  onChange,
  onDeleteImage,
}: {
  block: Block
  projectId: string
  onChange: (block: Block) => void
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
}) {
  switch (block.type) {
    case 'section-index':
      return <SectionIndexBlockField block={block} onChange={onChange} />
    case 'heading':
      return <HeadingBlockField block={block} onChange={onChange} />
    case 'paragraph':
      return <ParagraphBlockField block={block} onChange={onChange} />
    case 'quote':
      return <QuoteBlockField block={block} onChange={onChange} />
    case 'callout':
      return <CalloutBlockField block={block} onChange={onChange} />
    case 'media':
      return <MediaBlockField block={block} onChange={onChange} projectId={projectId} onDeleteImage={onDeleteImage} />
    case 'gallery':
      return <GalleryBlockField block={block} onChange={onChange} projectId={projectId} onDeleteImage={onDeleteImage} />
    case 'link':
      return <LinkBlockField block={block} onChange={onChange} />
    case 'embed':
      return <EmbedBlockField block={block} onChange={onChange} />
    case 'code':
      return <CodeBlockField block={block} onChange={onChange} />
    case 'html':
      return <HtmlBlockField block={block} onChange={onChange} />
    case 'list':
      return <ListBlockField block={block} onChange={onChange} />
    case 'divider':
      return <hr />
    case 'legacy-markdown':
      return <LegacyMarkdownBlockField block={block} onChange={onChange} />
  }
}
