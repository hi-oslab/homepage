'use client'

import { useState, useEffect } from 'react'

type Props = {
  lines?: string[]
}

const DEFAULT_LINES = [
  '> initializing...',
  '> connecting to notion api...',
  '> fetching data...',
  '> rendering...',
]

export function ConsoleLoading({ lines = DEFAULT_LINES }: Props) {
  const [visibleCount, setVisibleCount] = useState(1) // 첫 줄은 즉시 표시
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const lineId = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= lines.length) { clearInterval(lineId); return prev }
        return prev + 1
      })
    }, 200)

    const progressId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(progressId); return prev }
        return Math.min(prev + Math.floor(Math.random() * 8) + 4, 90)
      })
    }, 120)

    return () => { clearInterval(lineId); clearInterval(progressId) }
  }, [lines.length])

  const filled = Math.round((progress / 100) * 20)
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)

  return (
    <div className='w-full min-h-dvh p-8 font-mono text-sm'>
      <div className='space-y-1.5'>
        {lines.slice(0, visibleCount).map((line, i) => (
          <p key={i} className='text-neutral-400'>{line}</p>
        ))}
        <div className='flex items-center gap-2 text-neutral-600 pt-2'>
          <span>[{bar}]</span>
          <span>{progress}%</span>
        </div>
        <span className='cursor-blink inline-block text-white'>▊</span>
      </div>
    </div>
  )
}
