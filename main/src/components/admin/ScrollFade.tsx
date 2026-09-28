'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * 안쪽 스크롤 영역. 더 볼 내용이 있는 쪽 가장자리를 흐리게 지워서 스크롤할 수 있다는 걸 알려준다.
 * - 맨 위: 아래만 · 가운데: 위아래 · 맨 아래: 위만 흐림
 * - 배경색을 칠하지 않고 내용 자체를 투명하게 지우므로(mask) 흰 블록 · 회색 면 · 다크모드 어디서나 맞는다
 * 스크롤 높이(max-h · flex-1 등)와 overflow-y-auto는 className으로 준다.
 */
export function ScrollFade({
  className,
  fade = 28,
  children,
}: {
  className?: string
  /** 흐려지는 길이(px) */
  fade?: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const top = element.scrollTop > 1
      const bottom = element.scrollTop + element.clientHeight < element.scrollHeight - 1
      setEdges((current) => (current.top === top && current.bottom === bottom ? current : { top, bottom }))
    }
    update()
    element.addEventListener('scroll', update, { passive: true })
    // 크기가 바뀌거나 항목이 추가 · 삭제되면 다시 잰다
    const resize = new ResizeObserver(update)
    resize.observe(element)
    const mutation = new MutationObserver(update)
    mutation.observe(element, { childList: true, subtree: true })
    return () => {
      element.removeEventListener('scroll', update)
      resize.disconnect()
      mutation.disconnect()
    }
  }, [])

  const mask = `linear-gradient(to bottom, ${edges.top ? 'transparent' : '#000'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edges.bottom ? 'transparent' : '#000'} 100%)`

  return (
    <div ref={ref} className={cn('overscroll-contain', className)} style={{ maskImage: mask, WebkitMaskImage: mask }}>
      {children}
    </div>
  )
}
