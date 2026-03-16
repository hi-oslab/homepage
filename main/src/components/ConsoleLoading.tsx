'use client'

import { useState, useEffect, useRef } from 'react'

type Props = {
  lines?: string[]
}

const DEFAULT_LINES = ['> initializing...', '> connecting to notion api...', '> fetching data...', '> rendering...']

export function ConsoleLoading({ lines = DEFAULT_LINES }: Props) {
  const [visibleCount, setVisibleCount] = useState(1)
  const [progress, setProgress] = useState(8)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lineId = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= lines.length) {
          clearInterval(lineId)
          return prev
        }
        return prev + 1
      })
    }, 200)

    const progressId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressId)
          return prev
        }
        return Math.min(prev + Math.floor(Math.random() * 8) + 4, 90)
      })
    }, 120)

    return () => {
      clearInterval(lineId)
      clearInterval(progressId)
    }
  }, [lines.length])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleCount])

  const filled = Math.round((progress / 100) * 20)
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='mx-4 flex w-full max-w-lg flex-col border border-neutral-800 bg-black font-mono text-sm' style={{ height: '50vh' }}>
        {/* 타이틀바 */}
        <div className='flex shrink-0 items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2'>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='ml-3 text-xs tracking-widest text-neutral-600'>OSL TERMINAL</span>
        </div>
        {/* 스크롤 영역 */}
        <div ref={scrollRef} className='flex-1 overflow-y-auto p-6'>
          <div className='space-y-1.5'>
            {lines.slice(0, visibleCount).map((line, i) => (
              <p key={i} className='text-neutral-400'>
                {line}
              </p>
            ))}
            <div className='flex items-center gap-2 pt-2 text-neutral-600'>
              <span>[{bar}]</span>
              <span>{progress}%</span>
            </div>
            <span className='cursor-blink inline-block text-white'>▊</span>
          </div>
        </div>
      </div>
    </div>
  )
}
