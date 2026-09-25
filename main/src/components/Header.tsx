'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MainMotionTitle } from './MainMotionTitle'
import classNames from 'classnames'
import { RandomizedTextEffect } from './RandomizedTextEffect'
import { ImageTitle } from './ImageTitle'
import { IoMailOutline, IoMenu } from 'react-icons/io5'
import { NotchMenu } from './NotchMenu'

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => setMobileOpen((previous) => !previous), [])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMobileOpen])

  const goHome = () => {
    setMobileOpen(false)
    router.push('/')
  }

  return (
    <>
      <NotchMenu />
      {/* <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: 'auto' }}
        className={classNames(
          'fixed left-1/2 bottom-0 z-40 h-fit -translate-x-1/2',
          'rounded-t-2xl bg-black shadow-xl',
          'px-4 py-2 text-base font-mono text-white md:px-6',
          'flex flex-col items-center gap-1.5',
        )}
      >
        <div className='flex w-full flex-row items-center justify-between gap-6 md:gap-12'>
          <nav className='hidden flex-1 flex-row items-center justify-between gap-4 md:flex'>
            <div className={classNames('cursor-pointer text-2xl')}>About</div>
          </nav>
          <nav className='hidden flex-1 flex-row items-center justify-between gap-4 md:flex'>
            <div className={classNames('cursor-pointer text-2xl')}>Members</div>
          </nav>
          <nav className='hidden flex-1 flex-row items-center justify-between gap-4 md:flex'>
            <div className={classNames('cursor-pointer text-2xl')}>Works</div>
          </nav>
          <nav className='hidden flex-1 flex-row items-center justify-between gap-4 md:flex'>
            <div className={classNames('cursor-pointer text-2xl')}>Contact</div>
          </nav>

          <motion.button
            type='button'
            aria-label={isMobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            className='block md:hidden'
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={toggleMobile}
          >
            <motion.svg
              animate={{ rotate: isMobileOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className='size-8'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <motion.path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d={isMobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.svg>
          </motion.button>
        </div>
        <AnimatePresence>
          {isMobileOpen && (
            <motion.nav
              initial={{ height: 0 }}
              animate={{ height: `calc(100dvh - 4rem)` }}
              exit={{ height: 0 }}
              transition={{ duration: 0.5 }}
              className='z-10 flex w-full col-span-full flex-col justify-start'
            >
              {[
                { name: 'ABOUT', path: '/about' },
                { name: 'MEMBERS', path: '/members' },
              ].map((item) => (
                <button
                  type='button'
                  key={item.name}
                  className={classNames('flex h-fit w-full cursor-pointer flex-row items-center justify-between')}
                  onClick={() => {
                    router.push(item.path)
                    setMobileOpen(false)
                  }}
                >
                  <div className={classNames('px-1', pathname === item.path ? 'bg-black text-white' : '')}>
                    <RandomizedTextEffect text={item.name} />
                  </div>
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header> */}
    </>
  )
}
