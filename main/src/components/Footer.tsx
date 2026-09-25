'use client'

import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Menu',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Members', href: '/members' },
      { label: 'Works', href: '/work' },
      { label: 'Lab Space', href: '/lab-space' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Contact',
    links: [{ label: 'hi.oslab@gmail.com', href: 'mailto:hi.oslab@gmail.com' }],
  },
  {
    title: 'Social',
    links: [{ label: 'Instagram', href: 'https://www.instagram.com/opensource_lab/', external: true }],
  },
  {
    title: 'Members only',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Join', href: '/join' },
    ],
  },
]

export const Footer = () => {
  return (
    <footer className='flex w-full flex-col gap-24 bg-ink px-4 pt-16 pb-20 text-white md:gap-40 md:px-8 md:pt-20 md:pb-24'>
      <div className='grid grid-cols-2 gap-x-4 gap-y-10 text-sm md:grid-cols-12 md:gap-x-8'>
        <div className='col-span-2 flex flex-col justify-between gap-6 md:col-span-4'>
          <p className='max-w-xs break-keep leading-snug text-white/50'>
            Interactive media art crew
            <br />
            since 2018.
          </p>
          <p className='text-white/40'>© {new Date().getFullYear()} OSL</p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className='flex flex-col gap-3 md:col-span-2'>
            <span className='text-white/40'>{column.title}</span>
            <ul className='flex flex-col gap-1'>
              {column.links.map((link) => (
                <li key={link.label}>
                  {'external' in link || link.href.startsWith('mailto:') ? (
                    <a
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='transition-colors hover:text-white/50'
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className='transition-colors hover:text-white/50'>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p
        aria-hidden
        className='select-none whitespace-nowrap text-[13.2vw] font-semibold leading-[0.8] tracking-[-0.05em]'
      >
        Open Source Lab
      </p>
    </footer>
  )
}
