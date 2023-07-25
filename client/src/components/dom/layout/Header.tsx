import * as S from './styles'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import MenuModal from './MenuModal'
import { AnimatePresence } from 'framer-motion'

const Header = ({ title, height }: { title: string; height: number }) => {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState<Boolean>(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const updateScroll = () => {
    setScrollPosition(window.scrollY || document.documentElement.scrollTop)
  }
  useEffect(() => {
    window.addEventListener('scroll', updateScroll)
  }, [])

  return (
    <>
      <S.Header h={height} scrollPosition={scrollPosition}>
        <S.HeaderLogo
          onClick={() => {
            //if present page is index.tsx, do nothing
            router.pathname === '/' ? router.reload() : router.push('/')
          }}>
          {title}
        </S.HeaderLogo>
        <S.MenuButton>
          <div
            onClick={() => {
              setIsMenuOpen(!isMenuOpen)
            }}>
            {!isMenuOpen ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-10 h-10'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-10 h-10'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            )}
          </div>
        </S.MenuButton>
      </S.Header>
      <AnimatePresence>
        {isMenuOpen && (
          <MenuModal
            onHandleMenu={(isMenuOpen: boolean) => {
              setIsMenuOpen(isMenuOpen)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
