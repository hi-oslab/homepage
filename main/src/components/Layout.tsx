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
 *      <Header />
 *      <Component />
 *      <Footer />
 *    </Layout>
 * )
 **/

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import { ComputerStatusBar } from './ComputerStatusBar'
import classNames from 'classnames'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = (props: LayoutProps) => {
  const { children } = props
  const pathname = usePathname()
  // 어드민은 자체 사이드바를 쓰므로 노치 메뉴와 푸터를 숨긴다
  const isAdmin = pathname.startsWith('/admin')
  // 로그인/가입 화면은 폼이 하단에 있어 노치 메뉴만 숨긴다
  const isAuth = pathname.startsWith('/login') || pathname.startsWith('/join')

  return (
    <div className={classNames('w-screen h-fit')}>
      <ComputerStatusBar />
      {!isAdmin && !isAuth && <Header />}
      <div className='w-full min-h-dvh h-fit bg-paper pt-7'>{children}</div>
      {!isAdmin && <Footer />}
    </div>
  )
}
