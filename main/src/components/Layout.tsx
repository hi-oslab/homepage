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

import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export const Layout = ({ children }) => {
  return (
    <div className='w-screen min-h-dvh h-fit'>
      <Header />
      {children}
      <Footer />
    </div>
  )
}
