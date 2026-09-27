'use client'

import classNames from 'classnames'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GoCopy, GoGrabber, GoPlus, GoTrash } from 'react-icons/go'
import type { Block } from '@/types/blocks'
import { BLOCK_TYPE_LABELS } from '@/types/blocks'
import { iconButtonClass } from '@/components/admin/ui'
import { MediaBlockField, GalleryBlockField } from './fields/MediaBlocks'
import { LinkBlockField, EmbedBlockField } from './fields/LinkBlocks'
import { CodeBlockField, HtmlBlockField } from './fields/CodeBlocks'
import { LegacyMarkdownBlockField } from './fields/LegacyMarkdownBlock'
import {
  CalloutEditable,
  HeadingEditable,
  ListEditable,
  ParagraphEditable,
  QuoteEditable,
  SectionEditable,
} from './Editables'
import { useEditor } from './context'

/*
 * 블록 한 줄: [＋ ⠿] 내용 [종류 전환 · 복제 · 삭제]
 * 글 블록은 테두리 없이 바로 편집하고, 이미지 · 영상 · 링크처럼 입력이 필요한 블록은 옅은 카드 안에 입력칸을 둔다.
 * 조작 버튼은 마우스를 올리거나 블록 안에 커서가 있을 때만 보인다.
 */
export function BlockItem({
  block,
  projectId,
  active,
  menu,
  plusMenu,
  onPlus,
  onDuplicate,
  onDeleteImage,
}: {
  block: Block
  projectId: string
  /** 커서가 이 블록 안에 있는지 */
  active: boolean
  /** '/'를 쳤을 때 뜨는 메뉴 (입력 위치 위쪽) */
  menu?: React.ReactNode
  /** ＋ 버튼으로 연 블록 보관함 (블록 위쪽에 뜬다) */
  plusMenu?: React.ReactNode
  onPlus: () => void
  onDuplicate: () => void
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
}) {
  const { update, remove } = useEditor()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  // 조작 버튼은 마우스를 올리거나 편집 중인 블록에만
  const controls = classNames(
    'transition-opacity group-hover/block:opacity-100',
    active ? 'opacity-100' : 'opacity-0 focus-within:opacity-100',
  )
  // ＋ · ⠿ 공통 모양 (올렸을 때 색도 같게)
  const handleButton = iconButtonClass({}, 'size-7 text-ink/60 hover:bg-tile hover:text-ink')

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-block-id={block.id}
      className={classNames(
        'group/block relative flex gap-1 rounded-xl transition-[background-color,box-shadow] md:gap-2',
        // 옮기는 동안 한 덩어리로 보이도록 바탕 · 그림자, 평소에는 올리면 옅은 바탕
        isDragging ? 'z-20 bg-surface shadow-[0_10px_30px_rgba(17,17,17,0.16)] ring-1 ring-ink/5' : 'hover:bg-field/60',
      )}
    >
      {/* 왼쪽: 아래에 추가 · 끌어서 이동 */}
      <div className={classNames('flex shrink-0 items-start pt-1 md:w-14 md:justify-end', controls)}>
        <button type='button' data-plus-button onClick={onPlus} title='아래에 블록 추가' className={handleButton}>
          <GoPlus size={16} />
        </button>
        <button
          type='button'
          title='끌어서 순서 바꾸기'
          {...attributes}
          {...listeners}
          className={classNames(handleButton, 'cursor-grab touch-none active:cursor-grabbing')}
        >
          <GoGrabber size={16} />
        </button>
      </div>

      {/* 내용 */}
      <div className='relative min-w-0 flex-1'>
        <BlockContent block={block} projectId={projectId} active={active} onChange={update} onDeleteImage={onDeleteImage} />
        {menu}
      </div>
      {plusMenu}

      {/* 오른쪽: 종류 전환 · 복제 · 삭제 */}
      <div className={classNames('flex shrink-0 items-start gap-0.5 pt-1.5', controls)}>
        {block.type === 'heading' && (
          // 누를 때마다 H1 → H2 → H3
          <button
            type='button'
            onClick={() => update({ ...block, level: block.level === 3 ? 1 : ((block.level + 1) as 2 | 3) })}
            title='제목 크기 바꾸기'
            className={iconButtonClass({ size: 'sm' }, 'text-[10px] font-semibold')}
          >
            H{block.level}
          </button>
        )}
        {block.type === 'list' && (
          <button
            type='button'
            onClick={() => update({ ...block, style: block.style === 'bullet' ? 'number' : 'bullet' })}
            title={block.style === 'bullet' ? '번호 목록으로' : '글머리 목록으로'}
            className={iconButtonClass({ size: 'sm' }, 'text-[10px] font-semibold')}
          >
            {block.style === 'bullet' ? '1.' : '•'}
          </button>
        )}
        <button type='button' onClick={onDuplicate} title='복제' className={iconButtonClass({ size: 'sm' })}>
          <GoCopy size={13} />
        </button>
        <button type='button' onClick={() => remove(block.id, -1)} title='삭제' className={iconButtonClass({ danger: true, size: 'sm' })}>
          <GoTrash size={13} />
        </button>
      </div>
    </div>
  )
}

function BlockContent({
  block,
  projectId,
  active,
  onChange,
  onDeleteImage,
}: {
  block: Block
  projectId: string
  active: boolean
  onChange: (block: Block) => void
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
}) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphEditable block={block} active={active} />
    case 'heading':
      return <HeadingEditable block={block} />
    case 'section-index':
      return <SectionEditable block={block} />
    case 'quote':
      return <QuoteEditable block={block} />
    case 'callout':
      return <CalloutEditable block={block} />
    case 'list':
      return <ListEditable block={block} />
    case 'divider':
      return (
        <div className='flex h-8 items-center justify-center' aria-label='구분선'>
          <span className='size-1.5 rounded-full bg-ink/25' />
        </div>
      )
    default:
      // 입력이 필요한 블록: 옅은 카드 안에 입력칸
      return (
        <div className='my-1.5 flex flex-col gap-2 rounded-xl bg-paper p-4'>
          <span className='text-xs text-mute'>{BLOCK_TYPE_LABELS[block.type]}</span>
          <div className='flex flex-col gap-1.5'>
            {block.type === 'media' && (
              <MediaBlockField block={block} onChange={onChange} projectId={projectId} onDeleteImage={onDeleteImage} />
            )}
            {block.type === 'gallery' && (
              <GalleryBlockField block={block} onChange={onChange} projectId={projectId} onDeleteImage={onDeleteImage} />
            )}
            {block.type === 'link' && <LinkBlockField block={block} onChange={onChange} />}
            {block.type === 'embed' && <EmbedBlockField block={block} onChange={onChange} />}
            {block.type === 'code' && <CodeBlockField block={block} onChange={onChange} />}
            {block.type === 'html' && <HtmlBlockField block={block} onChange={onChange} />}
            {block.type === 'legacy-markdown' && <LegacyMarkdownBlockField block={block} onChange={onChange} />}
          </div>
        </div>
      )
  }
}
