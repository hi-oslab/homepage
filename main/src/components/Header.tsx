'use client'
import React, { useEffect } from 'react'
import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Logo from '@/img/logo.svg'
import { motion, AnimatePresence } from 'framer-motion'

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [isMobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), [])
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'auto'
  }, [isMobileOpen])

  const goHome = () => {
    setMobileOpen(false)
    router.push('/')
  }

  const navItems = [
    { name: 'Info', path: '/info' },
    { name: 'Contact', path: '/contact' },
    { name: 'Work', path: '/work' },
    { name: 'Lab Space', path: '/lab-space' },
  ]

  return (
    <>
      <header className='fixed top-0 inset-x-0 w-full h-fit text-white mix-blend-difference px-4 md:px-9 py-4 md:py-8 flex flex-row justify-between items-center z-50'>
        <div className='w-fit h-fit flex flex-row gap-16 items-center justify-start'>
          <div className='cursor-pointer hover:text-gray-500' onClick={goHome}>
            <Logo className='h-4 md:h-6 w-auto' />
          </div>
          <nav className='ml-auto hidden md:block'>
            <ul className='flex flex-row gap-12'>
              {navItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className={`text-lg hover:text-gray-500 uppercase transition-all duration-300 ease-in-out ${pathname === item.path ? 'font-bold' : ''}`}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className='hidden md:flex w-fit h-fit flex-row gap-6 items-center justify-end'>
          <a
            href='https://www.instagram.com/opensource_lab/'
            className='text-lg uppercase hover:text-gray-500 transition-all duration-300 ease-in-out'
          >
            Instagram
          </a>
        </div>
        <motion.button
          className='block md:hidden'
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={toggleMobile}
        >
          <motion.svg
            animate={{ rotate: isMobileOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            {isMobileOpen ? (
              <motion.path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.svg>
        </motion.button>
      </header>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='fixed inset-0 w-full z-10 h-dvh pt-16 flex flex-col justify-start bg-white'
            >
              {navItems.map((item, idx) => (
                <div
                  key={item.name}
                  className='px-4 py-4 w-full h-fit text-sm font-medium flex flex-row justify-between items-center active:opacity-70 transition-all cursor-pointer'
                  onClick={() => {
                    router.push(item.path)
                    setMobileOpen(false)
                  }}
                >
                  <span className='text-black'>{item.name}</span>
                </div>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
