'use client'

import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { Block, BlockType } from '@/types/blocks'
import { createBlock, serializeBlocks } from '@/lib/blocks'
import { BlockItem } from './BlockItem'
import { AddBlockMenu } from './AddBlockMenu'

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  projectId: string
  onDeleteImage: (url: string) => Promise<boolean>
  onPersistContent: (content: string) => Promise<void>
  onActiveBlockChange?: (blockId: string) => void
}

export const BlockEditor = ({
  blocks,
  onChange,
  projectId,
  onDeleteImage,
  onPersistContent,
  onActiveBlockChange,
}: BlockEditorProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  // 방금 추가한 블록의 id — 해당 블록만 마운트 시 자동 포커스한다
  const [justInsertedId, setJustInsertedId] = useState<string | null>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onChange(arrayMove(blocks, oldIndex, newIndex))
  }

  const insertAt = (index: number, type: BlockType) => {
    const block = createBlock(type)
    const next = blocks.slice()
    next.splice(index, 0, block)
    onChange(next)
    setJustInsertedId(block.id)
  }

  const updateAt = (index: number, block: Block) => {
    const next = blocks.slice()
    next[index] = block
    onChange(next)
  }

  const removeAt = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
  }

  const duplicateAt = (index: number) => {
    const source = blocks[index]
    const copy = { ...source, id: createBlock(source.type).id }
    const next = blocks.slice()
    next.splice(index + 1, 0, copy)
    onChange(next)
  }

  // 블록 안의 이미지 하나를 "서버에서 삭제" — 스토리지에서 즉시 지우고,
  // 해당 블록도 패치한 뒤 그 결과를 바로 DB에 저장한다 (저장 버튼을 잊어도 안전하게).
  const deleteImageAt = async (index: number, url: string, patch: (block: Block) => Block): Promise<boolean> => {
    const ok = await onDeleteImage(url)
    if (!ok) return false

    const next = blocks.slice()
    next[index] = patch(next[index])
    onChange(next)
    await onPersistContent(serializeBlocks(next))
    return true
  }

  return (
    <div className='block-editor pb-12'>
      {blocks.length > 0 && (
        <AddBlockMenu variant='inline' label='맨 위에 추가' onInsert={(type) => insertAt(0, type)} />
      )}

      <DndContext id='block-editor' sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <div key={block.id}>
              <BlockItem
                block={block}
                projectId={projectId}
                autoFocus={block.id === justInsertedId}
                onChange={(updated) => updateAt(index, updated)}
                onRemove={() => removeAt(index)}
                onDuplicate={() => duplicateAt(index)}
                onDeleteImage={(url, patch) => deleteImageAt(index, url, patch)}
                onActivate={onActiveBlockChange}
              />
              <AddBlockMenu variant='inline' label='이 아래에 추가' onInsert={(type) => insertAt(index + 1, type)} />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length > 0 && (
        <div className='pt-3'>
          <AddBlockMenu label='블록 추가' onInsert={(type) => insertAt(blocks.length, type)} />
        </div>
      )}

      {blocks.length === 0 && (
        <div className='flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center'>
          <p className='text-sm text-muted'>본문이 비어 있어요. 문단, 이미지, 영상 등을 블록으로 쌓아 보세요.</p>
          <AddBlockMenu label='첫 블록 추가' onInsert={(type) => insertAt(0, type)} />
        </div>
      )}
    </div>
  )
}
