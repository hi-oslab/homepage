'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GoX } from 'react-icons/go'

export type LightboxImage = { url: string; alt: string }

export function ImageLightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  useEffect(() => {
    if (!image) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [image, onClose])

  if (!image || typeof document === 'undefined') return null

  return createPortal(
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm md:p-8'
      role='dialog'
      aria-modal='true'
      aria-label={image.alt || '이미지 전체보기'}
      onClick={onClose}
    >
      <button
        type='button'
        onClick={onClose}
        className='absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 md:right-5 md:top-5'
        aria-label='전체보기 닫기'
      >
        <GoX size={22} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt}
        className='max-h-full max-w-full object-contain'
        onClick={(event) => event.stopPropagation()}
      />
      {image.alt && (
        <p className='pointer-events-none absolute inset-x-12 bottom-4 text-center text-xs text-white/70 md:bottom-6'>
          {image.alt}
        </p>
      )}
    </div>,
    document.body,
  )
}
