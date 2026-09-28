'use client'

import { useLayoutEffect } from 'react'

/**
 * Members 3D 씬 동안 페이지 스크롤을 막는다 (휠은 씬의 줌). 다른 페이지로 나가면 원래대로.
 * 검은 배경은 씬 자체가 칠하고, 헤더는 Header가 /members에서만 검은 버전으로 바꾼다 (사이트 테마는 건드리지 않는다).
 */
export function SceneTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const previous = { html: root.style.overflow, body: document.body.style.overflow }
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous.html
      document.body.style.overflow = previous.body
    }
  }, [])
  return null
}
