'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { BLOCK_TYPE_LABELS, INSERTABLE_BLOCK_TYPES, type BlockType } from '@/types/blocks'
import { buttonClass } from '@/components/admin/ui'

const BLOCK_TYPE_ICONS: Record<string, string> = {
  'section-index': '§',
  heading: 'H',
  paragraph: '¶',
  media: '🖼',
  gallery: '▦',
  link: '🔗',
  code: '</>',
  html: '⌘',
  divider: '—',
  quote: '❝',
  list: '☰',
  embed: '⧉',
  callout: '💡',
}

interface AddBlockMenuProps {
  onInsert: (type: BlockType) => void
  variant?: 'default' | 'inline'
  label?: string
}

export const AddBlockMenu = ({ onInsert, variant = 'default', label = '블록 추가' }: AddBlockMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className='relative flex' ref={ref}>
      {variant === 'inline' ? (
        <div className='group/add flex h-7 w-full items-center justify-center gap-3'>
          <div className='h-px flex-1 bg-transparent transition-colors group-hover/add:bg-border' />
          <button
            type='button'
            onClick={() => setOpen((v) => !v)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm transition-all group-hover/add:opacity-100 focus-visible:opacity-100 ${
              open ? 'bg-ink text-white opacity-100' : 'bg-tile text-muted opacity-0 hover:bg-ink hover:text-white'
            }`}
            title={label}
            aria-label={label}
          >
            +
          </button>
          <div className='h-px flex-1 bg-transparent transition-colors group-hover/add:bg-border' />
        </div>
      ) : (
        <button type='button' onClick={() => setOpen((v) => !v)} className={buttonClass('primary')}>
          + {label}
        </button>
      )}

      {open && (
        <ul
          className={cn(
            'absolute top-[calc(100%+4px)] z-40 grid min-w-[260px] list-none grid-cols-2 gap-0.5 rounded-[10px] bg-ink p-1.5 text-white',
            variant === 'inline' && 'left-1/2 -translate-x-1/2',
          )}
        >
          {INSERTABLE_BLOCK_TYPES.map((type) => (
            <li key={type}>
              <button
                type='button'
                onClick={() => {
                  onInsert(type)
                  setOpen(false)
                }}
                className='flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[13px] text-white/75 hover:bg-white/10 hover:text-white'
              >
                <span className='flex w-5 justify-center text-white/40'>{BLOCK_TYPE_ICONS[type]}</span>
                {BLOCK_TYPE_LABELS[type]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
