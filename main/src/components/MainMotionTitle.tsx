'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import classNames from 'classnames'

interface MainMotionTitleProps {
  className?: string
  onClick?: () => void
  animate?: boolean
  layout?: 'stacked' | 'inline'
  align?: 'start' | 'center'
  /** 1은 기본 속도, 2는 2배 빠르게, 0.5는 절반 속도로 재생합니다. */
  speed?: number
  cursorColor?: string
}

const TEXTS_IMAGES = [
  { src: '01.png', text: 'O' },
  { src: '02.png', text: 'P' },
  { src: '03.png', text: 'E' },
  { src: '04.png', text: 'N' },
  { src: '05.png', text: 'S' },
  { src: '06.png', text: 'O' },
  { src: '07.png', text: 'U' },
  { src: '08.png', text: 'R' },
  { src: '09.png', text: 'C' },
  { src: '10.png', text: 'E' },
  { src: '11.png', text: 'L' },
  { src: '12.png', text: 'A' },
  { src: '13.png', text: 'B' },
]

const WORD_RANGES = [
  { start: 0, end: 4 },
  { start: 4, end: 10 },
  { start: 10, end: 13 },
]

// 글자별 타이핑 딜레이(ms): 사람이 치는 것처럼 불규칙하게, 단어 사이(OPEN|SOURCE|LAB)는 조금 쉬었다가
const TYPING_START_DELAY = 400
const TYPING_DELAYS = [110, 140, 90, 130, 320, 120, 100, 150, 90, 120, 340, 130, 110]
// 타이핑이 끝난 뒤 커서가 깜빡이다 사라지기까지의 시간(ms)
const CURSOR_LINGER = 2400

export const MainMotionTitle = ({
  className,
  onClick,
  animate = true,
  layout = 'inline',
  align = 'start',
  speed = 1,
  cursorColor = 'black',
}: MainMotionTitleProps) => {
  const [typedCount, setTypedCount] = useState(animate ? 0 : TEXTS_IMAGES.length)
  const [showCursor, setShowCursor] = useState(animate)
  const isTyping = typedCount < TEXTS_IMAGES.length

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(TEXTS_IMAGES.length)
      setShowCursor(false)
      return
    }

    setTypedCount(0)
    setShowCursor(true)
    const timers: number[] = []
    const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
    let elapsed = TYPING_START_DELAY / safeSpeed
    TYPING_DELAYS.forEach((delay, index) => {
      timers.push(window.setTimeout(() => setTypedCount(index + 1), elapsed))
      elapsed += delay / safeSpeed
    })
    timers.push(window.setTimeout(() => setShowCursor(false), elapsed + CURSOR_LINGER / safeSpeed))
    return () => timers.forEach(window.clearTimeout)
  }, [animate, speed])

  const renderImages = (start: number, end: number) =>
    TEXTS_IMAGES.slice(start, Math.min(typedCount, end)).map((image, index) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={start + index}
        src={'/img/main/' + image.src}
        className='h-full w-auto shrink-0 transition-transform duration-300 ease-in-out hover:scale-110'
        alt={image.text}
      />
    ))

  const cursor = showCursor && (
    <motion.span
      key='cursor'
      aria-hidden
      style={{ backgroundColor: cursorColor }}
      className='ml-[0.3%] h-[85%] w-[2px] shrink-0'
      initial={{ opacity: 1 }}
      // 타이핑 중에는 계속 켜져 있고, 멈추면 깜빡임
      animate={isTyping ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={isTyping ? { duration: 0 } : { duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity }}
    />
  )

  const activeWordIndex = WORD_RANGES.findIndex(({ end }) => typedCount < end)
  const cursorWordIndex = activeWordIndex === -1 ? WORD_RANGES.length - 1 : activeWordIndex

  return (
    <motion.div
      onClick={onClick}
      aria-label='Open Source Lab'
      style={{ aspectRatio: layout === 'stacked' ? '3914 / 2520' : '9176 / 840' }}
      transition={{ duration: 0.5 }}
      className={classNames(
        'flex h-auto min-w-0 max-w-full cursor-pointer',
        layout === 'stacked' ? 'flex-col items-center' : 'flex-row items-center',
        align === 'center' ? 'justify-center' : 'justify-start',
        className,
      )}
    >
      {layout === 'stacked' ? (
        WORD_RANGES.map(({ start, end }, wordIndex) => (
          <div key={start} className='flex h-1/3 flex-row items-center justify-start'>
            {renderImages(start, end)}
            <AnimatePresence>{cursorWordIndex === wordIndex && cursor}</AnimatePresence>
          </div>
        ))
      ) : (
        <>
          {renderImages(0, 4)}
          {typedCount >= 4 && <span aria-hidden className='h-full aspect-1/2 shrink-0' />}
          {renderImages(4, 10)}
          {typedCount >= 10 && <span aria-hidden className='h-full aspect-1/2 shrink-0' />}
          {renderImages(10, 13)}
          <AnimatePresence>{cursor}</AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
