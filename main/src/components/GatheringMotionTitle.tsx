'use client'

import { useRef } from 'react'
import classNames from 'classnames'
import { motion, MotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'

interface GatheringMotionTitleProps {
  className?: string
  onClick?: () => void
  animate?: boolean
  /** 1은 기본 스크롤 속도, 2는 절반의 스크롤 거리에서 모션을 완성합니다. */
  speed?: number
  /** 스톱모션의 프레임 수입니다. 값이 작을수록 더 뚝뚝 끊깁니다. */
  steps?: number
  /** 타이틀 영역을 기준으로 한 각 글자의 시작 좌표(%)와 회전값입니다. */
  scatteredPositions?: ScatteredPosition[]
}

export interface ScatteredPosition {
  x: number
  y: number
  rotate?: number
}

const TEXTS_IMAGES = [
  { src: '01.png', text: 'O', width: 752 },
  { src: '02.png', text: 'P', width: 600 },
  { src: '03.png', text: 'E', width: 586 },
  { src: '04.png', text: 'N', width: 654 },
  { src: '05.png', text: 'S', width: 682 },
  { src: '06.png', text: 'O', width: 662 },
  { src: '07.png', text: 'U', width: 758 },
  { src: '08.png', text: 'R', width: 558 },
  { src: '09.png', text: 'C', width: 610 },
  { src: '10.png', text: 'E', width: 644 },
  { src: '11.png', text: 'L', width: 706 },
  { src: '12.png', text: 'A', width: 580 },
  { src: '13.png', text: 'B', width: 544 },
]

const WORD_RANGES = [
  { start: 0, end: 4 },
  { start: 4, end: 10 },
  { start: 10, end: 13 },
]

const TITLE_WIDTH = 3914
const LETTER_SCALE = 0.8
const LETTER_HEIGHT = (100 / 3) * LETTER_SCALE

// 각 단어의 실제 너비를 기준으로 행마다 가운데 정렬된 최종 좌표를 만듭니다.
const FINAL_POSITIONS = WORD_RANGES.flatMap(({ start, end }, rowIndex) => {
  const letters = TEXTS_IMAGES.slice(start, end)
  const wordWidth = letters.reduce((total, letter) => total + letter.width * LETTER_SCALE, 0)
  let x = (TITLE_WIDTH - wordWidth) / 2

  return letters.map((letter) => {
    const position = {
      x: (x / TITLE_WIDTH) * 100,
      y: (rowIndex / 3) * 100 + (100 / 3 - LETTER_HEIGHT) / 2,
      width: ((letter.width * LETTER_SCALE) / TITLE_WIDTH) * 100,
    }
    x += letter.width * LETTER_SCALE
    return position
  })
})

const SCATTER_OFFSETS = [
  { x: -28, y: -3, rotate: -12 }, // O
  { x: -10, y: -2, rotate: -20 }, // P
  { x: 12, y: -2, rotate: 14 }, // E
  { x: 28, y: 2, rotate: -8 }, // N
  { x: -20, y: 10, rotate: 0 }, // S
  { x: -10, y: -3, rotate: -13 }, // O
  { x: -6, y: 15, rotate: -15 }, // U
  { x: 1, y: -5, rotate: 0 }, // R
  { x: 10, y: 12, rotate: 12 }, // C
  { x: 20, y: 0, rotate: -7 }, // E
  { x: -24, y: 4, rotate: 13 }, // L
  { x: 5, y: 2, rotate: -12 }, // A
  { x: 35, y: 4, rotate: 8 }, // B
]

export const DEFAULT_SCATTERED_POSITIONS: ScatteredPosition[] = FINAL_POSITIONS.map((position, index) => ({
  x: position.x + SCATTER_OFFSETS[index].x,
  y: position.y + SCATTER_OFFSETS[index].y,
  rotate: SCATTER_OFFSETS[index].rotate,
}))

interface GatheringLetterProps {
  index: number
  progress: MotionValue<number>
  enabled: boolean
  start: ScatteredPosition
}

const GatheringLetter = ({ index, progress, enabled, start }: GatheringLetterProps) => {
  const image = TEXTS_IMAGES[index]
  const end = FINAL_POSITIONS[index]
  const left = useTransform(progress, (value) => `${enabled ? start.x + (end.x - start.x) * value : end.x}%`)
  const top = useTransform(progress, (value) => `${enabled ? start.y + (end.y - start.y) * value : end.y}%`)
  const rotate = useTransform(progress, (value) => (enabled ? (start.rotate ?? 0) * (1 - value) : 0))

  return (
    <motion.img
      whileHover={{ rotate: enabled ? (start.rotate ?? 0) * 0.5 : 0, scale: 1.05 }}
      src={'/img/main/' + image.src}
      className='absolute origin-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
      style={{ left, top, width: `${end.width}%`, height: `${LETTER_HEIGHT}%`, rotate }}
      alt={image.text}
    />
  )
}

export const GatheringMotionTitle = ({
  className,
  onClick,
  animate = true,
  speed = 1,
  steps = 8,
  scatteredPositions = DEFAULT_SCATTERED_POSITIONS,
}: GatheringMotionTitleProps) => {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
  const safeSteps = Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 8
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const steppedProgress = useTransform(scrollYProgress, (value) => {
    const acceleratedProgress = Math.min(1, value * safeSpeed)
    return Math.round(acceleratedProgress * safeSteps) / safeSteps
  })
  const enabled = animate && !reduceMotion

  return (
    <section ref={sectionRef} className='relative h-[200dvh] w-full '>
      <div className='sticky top-0 flex h-dvh w-full items-start justify-center overflow-hidden'>
        <div
          onClick={onClick}
          aria-label='Open Source Lab'
          className={classNames('relative aspect-3914/2520 h-auto w-[min(80%,155.32dvh)] cursor-pointer', className)}
        >
          {TEXTS_IMAGES.map((image, index) => (
            <GatheringLetter
              key={image.src}
              index={index}
              progress={steppedProgress}
              enabled={enabled}
              start={scatteredPositions[index] ?? DEFAULT_SCATTERED_POSITIONS[index]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
