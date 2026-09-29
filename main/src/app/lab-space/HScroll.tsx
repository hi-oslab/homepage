'use client'

import classNames from 'classnames'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GoArrowLeft, GoArrowRight } from 'react-icons/go'

/**
 * 가로로 넘기는 줄 (Best · Recommend)
 * 스크롤바는 사이트 전체에서 숨겨져 있으므로, 넘길 수 있는 쪽을 화살표 버튼과 가장자리 그러데이션으로 알려 준다
 */
export function HScroll({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const element = ref.current
    if (!element) return
    setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // 한 번에 보이는 너비의 80%씩
  const move = (direction: 1 | -1) =>
    ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className='relative'>
      <ul
        ref={ref}
        onScroll={measure}
        aria-label={label}
        className='-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 md:-mx-8 md:scroll-px-8 md:gap-6 md:px-8'
      >
        {children}
      </ul>
      {/* 가장자리 그러데이션: 더 있다는 표시 */}
      <span
        aria-hidden
        className={classNames(
          'pointer-events-none absolute inset-y-0 -left-4 w-12 bg-linear-to-r from-paper to-transparent transition-opacity md:-left-8',
          edges.start ? 'opacity-0' : 'opacity-100',
        )}
      />
      <span
        aria-hidden
        className={classNames(
          'pointer-events-none absolute inset-y-0 -right-4 w-12 bg-linear-to-l from-paper to-transparent transition-opacity md:-right-8',
          edges.end ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* 화살표 (마우스 화면에서만) */}
      {!(edges.start && edges.end) && (
        <div className='absolute -top-11 right-0 hidden gap-1 md:flex'>
          <button
            type='button'
            aria-label='이전'
            disabled={edges.start}
            onClick={() => move(-1)}
            className='flex size-7 items-center justify-center rounded-full border border-ink/15 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30'
          >
            <GoArrowLeft size={13} />
          </button>
          <button
            type='button'
            aria-label='다음'
            disabled={edges.end}
            onClick={() => move(1)}
            className='flex size-7 items-center justify-center rounded-full border border-ink/15 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30'
          >
            <GoArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
