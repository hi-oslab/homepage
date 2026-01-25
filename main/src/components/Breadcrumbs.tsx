// src/components/Breadcrumbs.tsx
'use client' // 클라이언트 컴포넌트

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Breadcrumbs = () => {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter((segment) => segment)

  return (
    <nav className='w-full uppercase h-fit text-left text-sm opacity-70 '>
      <ul className='flex space-x-0'>
        <li>
          <Link href='/' className='hover:underline opacity-70 '>
            Home
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/')
          const isLast = index === pathSegments.length - 1

          return (
            <li key={href} className='flex items-center'>
              <span className='mx-1.5'>/</span>
              {isLast ? (
                <span className='opacity-100'>{decodeURIComponent(segment)}</span>
              ) : (
                <Link href={href} className='hover:underline opacity-70'>
                  {decodeURIComponent(segment)}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
