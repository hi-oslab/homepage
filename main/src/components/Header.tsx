'use client'
import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Logo from '@/img/logo.svg'

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: 'Info', path: '/info' },
    { name: 'Contact', path: '/contact' },
    { name: 'Work', path: '/work' },
    { name: 'Lab Space', path: '/lab-space' },
  ]

  return (
    <header className='fixed top-0 inset-x-0 w-full h-fit text-white mix-blend-difference px-9 py-8 flex flex-row justify-between items-center z-50'>
      <div className='w-fit h-fit flex flex-row gap-16 items-center justify-start'>
        <div className='cursor-pointer hover:text-gray-500' onClick={() => router.push('/')}>
          <Logo className='h-6 w-auto' />
        </div>
        <nav className='ml-auto'>
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
      <div className='w-fit h-fit flex flex-row gap-6 items-center justify-end'>
        <a
          href='https://www.instagram.com/opensource_lab/'
          className='text-lg uppercase hover:text-gray-500 transition-all duration-300 ease-in-out'
        >
          Instagram
        </a>
      </div>
    </header>
  )
}
