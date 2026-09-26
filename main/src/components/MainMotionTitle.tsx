'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import classNames from 'classnames'

interface MainMotionTitleProps {
  className?: string
  onClick?: () => void
  animate?: boolean
  layout?: 'stacked' | 'inline'
  align?: 'start' | 'center'
  /** 1은 기본 속도, 2는 2배 빠르게, 0.5는 절반 속도로 재생합니다. */
  speed?: number
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

export const MainMotionTitle = ({
  className,
  onClick,
  animate = true,
  layout = 'inline',
  align = 'start',
  speed = 1.5,
}: MainMotionTitleProps) => {
  const [typedCount, setTypedCount] = useState(animate ? 0 : TEXTS_IMAGES.length)

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(TEXTS_IMAGES.length)
      return
    }

    setTypedCount(0)
    const timers: number[] = []
    const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
    let elapsed = TYPING_START_DELAY / safeSpeed
    TYPING_DELAYS.forEach((delay, index) => {
      timers.push(window.setTimeout(() => setTypedCount(index + 1), elapsed))
      elapsed += delay / safeSpeed
    })
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

  return (
    <motion.div
      onClick={onClick}
      aria-label='Open Source Lab'
      style={{ aspectRatio: layout === 'stacked' ? '3914 / 2520' : '9176 / 840' }}
      transition={{ duration: 0.5 }}
      className={classNames(
        'flex  cursor-pointer',
        layout === 'stacked'
          ? // 폭을 기준으로 크기를 정하고 높이는 aspect-ratio로 계산 (높이 제한은 max-w로 넘겨받는다)
            // min-h-0: 없으면 aspect-ratio 상자가 이미지 원본 높이만큼 늘어난다
            'flex-col items-start w-full h-auto min-h-0 shrink-0'
          : 'flex-row items-center h-auto min-w-0 max-w-full',
        align === 'center' ? 'justify-center' : 'justify-start',
        className,
      )}
    >
      {layout === 'stacked' ? (
        WORD_RANGES.map(({ start, end }) => (
          <div key={start} className='flex h-1/3 flex-row items-center justify-start'>
            {renderImages(start, end)}
          </div>
        ))
      ) : (
        <>
          {renderImages(0, 4)}
          {typedCount >= 4 && <span aria-hidden className='h-full aspect-1/2 shrink-0' />}
          {renderImages(4, 10)}
          {typedCount >= 10 && <span aria-hidden className='h-full aspect-1/2 shrink-0' />}
          {renderImages(10, 13)}
        </>
      )}
    </motion.div>
  )
}
