'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GoX } from 'react-icons/go'
import { FLOATING, SCRIM, surfaceClass } from './styles'

/** 가운데 뜨는 대화상자. 바깥을 누르거나 Esc로 닫힌다 (모바일에서는 아래에서 올라오는 시트) */
export function Modal({
  open,
  onClose,
  title,
  meta,
  children,
  footer,
  size = 'md',
  tall,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  /** 제목 옆 보조 정보 */
  meta?: React.ReactNode
  children: React.ReactNode
  /** 아래에 고정되는 버튼 영역 */
  footer?: React.ReactNode
  /** md: 설정 · 확인용, lg: 글 읽기 · 쓰기 */
  size?: 'md' | 'lg'
  /** 화면 높이에 가깝게 (글쓰기처럼 긴 내용) */
  tall?: boolean
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
          className={classNames('fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4', SCRIM)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role='dialog'
          aria-modal='true'
        >
          <motion.div
            className={classNames(
              'flex max-h-[92dvh] w-full flex-col overflow-hidden',
              // 글을 읽는 창이라 불투명한 면 (모바일 시트는 아래 모서리를 붙인다)
              surfaceClass('solid', 'rounded-b-none sm:rounded-block'),
              FLOATING,
              size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-2xl',
              tall && 'h-[92dvh]',
            )}
            initial={{ y: 24, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-7 sm:pt-7'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <span className='truncate text-xl font-medium tracking-[-0.03em]'>{title}</span>
                {meta && <span className='truncate text-xs text-mute'>{meta}</span>}
              </div>
              <button
                type='button'
                onClick={onClose}
                aria-label='닫기'
                className='flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-mute transition-colors hover:bg-tile hover:text-ink'
              >
                <kbd className='hidden font-sans sm:inline'>Esc</kbd>
                <GoX size={16} />
              </button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7 sm:pb-7'>{children}</div>
            {footer && (
              // 모바일 시트는 아이폰 하단 안전 영역만큼 더 띄운다
              <div className='flex shrink-0 flex-wrap items-center gap-2 bg-ink/[0.04] px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-7 sm:pb-4'>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
