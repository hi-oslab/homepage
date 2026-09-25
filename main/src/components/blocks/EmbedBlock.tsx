'use client'

import type { EmbedBlock as EmbedBlockType } from '@/types/blocks'
import classNames from 'classnames'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GoX } from 'react-icons/go'

export function EmbedBlock({ block, className }: { block: EmbedBlockType; className?: string }) {
  const [viewportAspectRatio, setViewportAspectRatio] = useState<string>()
  const [isExpanded, setIsExpanded] = useState(false)
  const closeEmbed = useCallback(() => setIsExpanded(false), [])

  useEffect(() => {
    const updateViewportAspectRatio = () => {
      setViewportAspectRatio(`${window.innerWidth} / ${window.innerHeight}`)
    }

    updateViewportAspectRatio()
    window.addEventListener('resize', updateViewportAspectRatio)
    return () => window.removeEventListener('resize', updateViewportAspectRatio)
  }, [])

  useEffect(() => {
    if (!isExpanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEmbed()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeEmbed, isExpanded])

  if (!block.url) return null

  return (
    <>
      <div
        style={{ aspectRatio: viewportAspectRatio }}
        className={classNames(
          'relative my-12 aspect-video w-full overflow-hidden rounded-sm bg-neutral-500/10 md:my-20',
          className,
        )}
      >
        <iframe
          src={block.url}
          title={block.title || 'embed'}
          loading='lazy'
          tabIndex={-1}
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 h-full w-full'
        />
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[1px]'>
          <button
            type='button'
            onClick={() => setIsExpanded(true)}
            className='rounded-full bg-black px-5 py-2.5 font-pretendard text-sm font-semibold text-white transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
          >
            확인해보기
          </button>
        </div>
      </div>

      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className='fixed inset-0 z-[100] flex flex-col bg-white'
            role='dialog'
            aria-modal='true'
            aria-label={block.title || '임베드 전체보기'}
          >
            <header className='relative z-10 flex h-14 shrink-0 items-center justify-end border-b border-black/10 bg-white px-3 md:h-16 md:px-5'>
              <button
                type='button'
                onClick={closeEmbed}
                autoFocus
                className='flex items-center gap-1.5 rounded-full bg-black px-4 py-2 font-pretendard text-xs font-semibold text-white transition-colors hover:bg-black/75 md:text-sm'
                aria-label='임베드 전체보기 닫기'
              >
                <GoX size={18} aria-hidden='true' />
                임베드 끄기
              </button>
            </header>
            <iframe src={block.url} title={block.title || 'embed'} className='min-h-0 w-full flex-1 border-0' />
          </div>,
          document.body,
        )}
    </>
  )
}
