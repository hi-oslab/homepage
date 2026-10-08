'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSpacePresence } from '../../SpacePresenceProvider'

type Stats = {
  todayVisitors: number
  currentVisitors: number
  averageVisitors: number
  myAverageVisits: number
  myPosts: number
  myComments: number
}

const ITEMS: { key: keyof Stats; label: string; suffix?: string }[] = [
  { key: 'todayVisitors', label: '오늘 방문자', suffix: '명' },
  { key: 'currentVisitors', label: '현재 방문자', suffix: '명' },
  { key: 'averageVisitors', label: '평균 방문자', suffix: '명/일' },
  { key: 'myAverageVisits', label: '내 평균', suffix: '회/일' },
  { key: 'myPosts', label: '작성 글', suffix: '개' },
  { key: 'myComments', label: '작성 댓글', suffix: '개' },
]

export function VisitStatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)
  const { onlineCount, ready: presenceReady } = useSpacePresence()

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/space/visit', { method: 'POST', cache: 'no-store' })
      if (response.ok) setStats((await response.json()) as Stats)
    } catch {
      // 일시적인 네트워크 오류에는 이전 집계값을 유지한다.
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return (
    <div className='flex w-full flex-wrap pt-3 sm:grid-cols-6'>
      {ITEMS.map(({ key, label, suffix }, index) => (
        <div
          key={key}
          className={`min-w-0 px-2 py-1 flex gap-2 md:gap-3 flex-row justify-start items-center text-left sm:px-3`}
        >
          <div className='truncate text-[10px] text-mute sm:text-xs'>{label}</div>
          <div className='mt-0.5 text-sm font-medium tabular-nums sm:text-base'>
            {stats || (key === 'currentVisitors' && presenceReady)
              ? (key === 'currentVisitors' && presenceReady ? onlineCount : stats![key]).toLocaleString('ko-KR', {
                  maximumFractionDigits: 1,
                })
              : '—'}
            {(stats || (key === 'currentVisitors' && presenceReady)) && (
              <span className='ml-0.5 text-[10px] font-normal text-mute sm:text-xs'>{suffix}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
