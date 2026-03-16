'use client'

import { useRef, useState, useEffect } from 'react'
import { useInView } from 'framer-motion'

const CODE = `# Delicious Source ^^* - Discovery Creative Extension
오소랩 = "괴짜 창의력 폭발!"
핵심가치 = ["Discovery", "Creativity", "Extension"]
for 가치 in 핵심가치: print(f"{가치} - 오소랩 모드 ON!")
print("Delicious Source^^*")
print("오소랩 방향: 창의력 무한 확장!")`

function TypingCode() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(CODE.slice(0, i))
      if (i >= CODE.length) {
        clearInterval(id)
        setDone(true)
      }
    }, 18)
    return () => clearInterval(id)
  }, [isInView])

  return (
    <div ref={ref} className='relative whitespace-pre-wrap font-mono text-xs text-neutral-300'>
      <code className='invisible'>{CODE}▊</code>
      <code className='absolute inset-0'>
        {displayed}
        <span className={done ? 'cursor-blink' : 'opacity-100'}>▊</span>
      </code>
    </div>
  )
}

const CONTACTS = [
  { label: '@opensource_lab', href: 'https://www.instagram.com/opensource_lab/' },
  { label: 'hi.oslab@gmail.com', href: 'mailto:hi.oslab@gmail.com' },
]

export const Footer = () => {
  return (
    <footer className='h-fit w-full bg-black p-4 text-white md:p-8'>
      {/* ── 터미널 윈도우 ── */}
      <div className='w-full border border-neutral-800 font-mono'>
        {/* 타이틀바 */}
        <div className='flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2'>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='text-xs text-neutral-600'>●</span>
          <span className='ml-3 text-xs tracking-widest text-neutral-600'>OSL TERMINAL</span>
          <span className='ml-auto text-xs text-neutral-700'>python delicious_source.py</span>
        </div>

        {/* 코드 영역 */}
        <div className='p-4 md:p-6'>
          <p className='mb-3 text-xs text-neutral-600'>$ python delicious_source.py</p>
          <TypingCode />
        </div>
      </div>

      {/* ── 하단 정보 ── */}
      <div className='mt-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
        {/* 연락처 */}
        <div className='flex flex-col gap-1.5 font-mono'>
          {CONTACTS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-neutral-500 transition-colors hover:text-white'
            >
              <span className='mr-1 text-neutral-700'>&gt;</span>
              {item.label}
            </a>
          ))}
        </div>

        {/* 저작권 + 로고 */}
        <div className='flex flex-col items-start gap-2 md:items-end'>
          <span className='text-2xl leading-none'>●▲☰</span>
          <p className='text-xs text-neutral-700'>© {new Date().getFullYear()} Open Source Lab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
