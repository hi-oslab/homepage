'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ConsoleLoading } from './ConsoleLoading'

const ROUTE_LINES: Record<string, string[]> = {
  '/about': [
    '> initializing about page...',
    '> connecting to open source lab...',
    '> fetching crew members...',
    '> rendering...',
  ],
  '/work': [
    '> initializing work page...',
    '> connecting to open source lab...',
    '> fetching projects...',
    '> rendering...',
  ],
  '/contact': [
    '> initializing contact page...',
    '> rendering...',
  ],
}

const getLines = (pathname: string) => {
  if (ROUTE_LINES[pathname]) return ROUTE_LINES[pathname]
  if (pathname.startsWith('/work/')) return [
    '> loading project...',
    '> connecting to open source lab...',
    '> fetching content blocks...',
    '> rendering...',
  ]
  return [
    '> initializing...',
    '> rendering...',
  ]
}

const MIN_DURATION = 900 // ms

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const isFirst = useRef(true)

  useEffect(() => {
    // 첫 렌더(초기 로드)는 스킵 — loading.tsx가 담당
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    setLines(getLines(pathname))
    setVisible(true)

    const timer = setTimeout(() => setVisible(false), MIN_DURATION)
    return () => clearTimeout(timer)
  }, [pathname])

  if (visible) return <ConsoleLoading lines={lines} />
  return <>{children}</>
}
