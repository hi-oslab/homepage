'use client'

import { useEffect } from 'react'

/** 글을 열면 조회 1회를 기록한다 (같은 방문자는 서버가 하루 한 번만 센다) */
export function ViewCounter({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch('/api/lab/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
      keepalive: true,
    }).catch(() => undefined)
  }, [articleId])
  return null
}
