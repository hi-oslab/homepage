'use client'

import { Reorder, useDragControls } from 'framer-motion'
import { useEffect, useState, useTransition } from 'react'
import { GoChevronDown, GoChevronUp, GoGrabber } from 'react-icons/go'
import { Modal } from '@/components/admin/Modal'
import { buttonClass, iconButtonClass } from '@/components/admin/ui'
import { callAction } from '@/lib/call-action'
import type { CommunityPost } from '@/lib/community-types'
import { setPinOrderAction } from '../community/actions'

/** 고정 공지 순서 바꾸기 (운영자): 끌어서 옮기거나 ↑↓, 저장하면 라운지 맨 위 순서가 바뀐다 */
export function PinOrderModal({
  open,
  posts,
  onClose,
  onSaved,
  onMessage,
}: {
  open: boolean
  /** 지금 화면 순서 그대로의 고정 공지 */
  posts: CommunityPost[]
  onClose: () => void
  /** 저장된 순서 (id 목록) */
  onSaved: (ids: string[]) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
}) {
  const [order, setOrder] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  // 열 때마다 지금 순서로 채운다
  useEffect(() => {
    if (open) setOrder(posts.map((post) => post.id))
  }, [open, posts])

  const byId = new Map(posts.map((post) => [post.id, post]))
  const move = (index: number, step: -1 | 1) =>
    setOrder((current) => {
      const next = [...current]
      const target = index + step
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const changed = order.some((id, index) => posts[index]?.id !== id)
  const save = () =>
    startTransition(async () => {
      const result = await callAction(() => setPinOrderAction(order))
      if ('message' in result) return onMessage(result.message, 'error')
      onSaved(order)
      onMessage('고정 공지 순서를 바꿨어요')
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='고정 공지 순서'
      meta='위에 있을수록 라운지 맨 앞에 보여요'
      footer={
        <>
          <button type='button' onClick={onClose} className={buttonClass('ghost', 'sm')}>
            취소
          </button>
          <button
            type='button'
            disabled={!changed || isPending}
            onClick={save}
            className={buttonClass('primary', 'sm', 'ml-auto')}
          >
            {isPending ? '저장 중…' : '순서 저장'}
          </button>
        </>
      }
    >
      <Reorder.Group axis='y' values={order} onReorder={setOrder} className='flex flex-col gap-1.5'>
        {order.map((id, index) => {
          const post = byId.get(id)
          if (!post) return null
          return (
            <PinRow
              key={id}
              id={id}
              index={index}
              total={order.length}
              title={post.title || post.body || '제목 없음'}
              author={post.author_name}
              onMove={(step) => move(index, step)}
            />
          )
        })}
      </Reorder.Group>
    </Modal>
  )
}

function PinRow({
  id,
  index,
  total,
  title,
  author,
  onMove,
}: {
  id: string
  index: number
  total: number
  title: string
  author: string
  onMove: (step: -1 | 1) => void
}) {
  // 손잡이로만 끌기 (글자를 고르거나 버튼을 누를 때 끌리지 않게)
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      className='flex items-center gap-2 rounded-inner bg-ink/[0.04] py-2 pr-1.5 pl-1 text-sm'
    >
      <span
        onPointerDown={(event) => controls.start(event)}
        aria-label='끌어서 순서 바꾸기'
        className='flex size-7 shrink-0 cursor-grab touch-none items-center justify-center text-mute active:cursor-grabbing'
      >
        <GoGrabber size={16} />
      </span>
      <span className='w-5 shrink-0 text-xs text-mute tabular-nums'>{index + 1}</span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate'>{title}</span>
        <span className='truncate text-xs text-mute'>{author}</span>
      </span>
      <button
        type='button'
        aria-label='위로'
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className={iconButtonClass({}, 'disabled:opacity-30')}
      >
        <GoChevronUp size={14} />
      </button>
      <button
        type='button'
        aria-label='아래로'
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        className={iconButtonClass({}, 'disabled:opacity-30')}
      >
        <GoChevronDown size={14} />
      </button>
    </Reorder.Item>
  )
}
