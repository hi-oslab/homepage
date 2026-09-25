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
      className='block-item'
      data-editor-block-id={block.id}
      onPointerDownCapture={() => onActivate?.(block.id)}
      onFocusCapture={() => onActivate?.(block.id)}
    >
      <button type='button' className='block-drag-handle' {...attributes} {...listeners} title='드래그해서 순서 변경'>
        ⠿
      </button>

      <div className='block-item-toolbar'>
        <span className='block-type-label'>{BLOCK_TYPE_LABELS[block.type]}</span>
        <button type='button' onClick={onDuplicate} title='복제' className='icon-btn'>
          <GoCopy size={13} />
        </button>
        <button type='button' onClick={onRemove} title='삭제' className='icon-btn hover:bg-danger-soft! hover:text-danger!'>
          <GoTrash size={13} />
        </button>
      </div>

      <div className='block-item-body' ref={bodyRef}>
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
