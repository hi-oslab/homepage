'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GoX } from 'react-icons/go'

/** 전체 화면 미리보기 모달. Esc 또는 닫기 버튼으로 닫힌다 */
export function PreviewModal({
  open,
  onClose,
  title,
  meta,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className='fixed inset-0 z-[70] flex flex-col bg-ink/40 p-2 md:p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role='dialog'
          aria-modal='true'
          aria-label={title}
        >
          <motion.div
            className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-paper'
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex shrink-0 items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white'>
              <div className='flex min-w-0 items-center gap-3 text-sm'>
                <span className='shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[11px]'>미리보기</span>
                <span className='truncate'>{title}</span>
                {meta && <span className='hidden shrink-0 text-xs text-white/50 sm:inline'>{meta}</span>}
              </div>
              <button
                type='button'
                onClick={onClose}
                className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white'
              >
                <kbd className='hidden font-sans sm:inline'>Esc</kbd>
                <GoX size={16} />
              </button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto'>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
