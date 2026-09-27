'use client'

import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * 글 길이만큼 높이가 늘어나는 테두리 없는 입력칸 (블록 에디터의 글 블록용)
 * field-sizing은 Safari · Firefox가 아직 지원하지 않아 scrollHeight로 맞춘다.
 */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, value, ...props }, forwarded) => {
    const inner = useRef<HTMLTextAreaElement | null>(null)

    const resize = useCallback(() => {
      const element = inner.current
      if (!element) return
      element.style.height = '0px'
      element.style.height = `${element.scrollHeight}px`
    }, [])

    useLayoutEffect(resize, [value, resize])
    // 폭이 바뀌면 줄바꿈이 달라지므로 다시 맞춘다
    useLayoutEffect(() => {
      const element = inner.current
      if (!element || typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(resize)
      observer.observe(element)
      return () => observer.disconnect()
    }, [resize])

    return (
      <textarea
        ref={(element) => {
          inner.current = element
          if (typeof forwarded === 'function') forwarded(element)
          else if (forwarded) forwarded.current = element
        }}
        rows={1}
        value={value}
        className={cn(
          'block w-full resize-none overflow-hidden bg-transparent p-0 outline-none placeholder:text-ink/25',
          className,
        )}
        {...props}
      />
    )
  },
)
AutoTextarea.displayName = 'AutoTextarea'
