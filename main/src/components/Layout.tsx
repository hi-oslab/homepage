// Layout.tsx
/**
 * Layout
 * - Layout은 페이지의 전체적인 레이아웃을 담당하는 컴포넌트입니다.
 * - children으로 받은 컴포넌트를 렌더링합니다.
 * @param children : React.ReactNode
 * @returns {JSX.Element} JSX.Element
 * @example
 * return (
 *    <Layout>
 *      <ScrollReset />
      <Header />
 *      <Component />
 *      <Footer />
 *    </Layout>
 * )
 **/

'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import classNames from 'classnames'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = (props: LayoutProps) => {
  const { children } = props
  const pathname = usePathname()
  // 멤버 스페이스는 자체 사이드바를 쓰므로 푸터를 숨긴다
  const isMemberSpace = pathname.startsWith('/space')

  return (
    <div className={classNames('w-screen h-fit')}>
      <ScrollReset />
      <Header />
      <div className='w-full min-h-dvh h-fit bg-paper pt-header'>{children}</div>
      {!isMemberSpace && <Footer />}
    </div>
  )
}

/**
 * 새 페이지로 이동하면 맨 위에서 시작한다.
 * (Next 기본 동작은 로딩 화면·고정 헤더 때문에 이전 스크롤 위치가 남는 경우가 있다)
 * 뒤로/앞으로 가기는 브라우저가 원래 위치를 복원하도록 건드리지 않는다.
 */
const ScrollReset = () => {
  const pathname = usePathname()
  const fromHistory = useRef(false)

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (fromHistory.current) {
      fromHistory.current = false
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
