'use client'

import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'

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

const TITLE_LINES = ['OPEN', 'SOURCE', 'LAB']

type LetterMotion = {
  delay: number
  angle: number
}

const createLetterMotions = (): LetterMotion[] => {
  const order = Array.from({ length: TEXTS_IMAGES.length }, (_, index) => index)

  for (let index = order.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[order[index], order[randomIndex]] = [order[randomIndex], order[index]]
  }

  return order.reduce<LetterMotion[]>((motions, letterIndex, sequenceIndex) => {
    motions[letterIndex] = {
      delay: sequenceIndex * 0.08,
      angle: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
    }
    return motions
  }, [])
}

export const ImageTitle = ({
  className,
  textClassName,
  onClick,
}: {
  className?: string
  textClassName?: string
  onClick?: () => void
}) => {
  const prefersReducedMotion = useReducedMotion()
  const [animation, setAnimation] = useState<{ id: number; letters: LetterMotion[] } | null>(null)

  const play = () => {
    if (prefersReducedMotion) return
    setAnimation((previous) => ({ id: (previous?.id ?? 0) + 1, letters: createLetterMotions() }))
  }

  useEffect(() => {
    play()
    // The first animation should only run once after the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Text = ({ text, className, index }: { text: string; className?: string; index: number }) => {
    const letterMotion = animation?.letters[index]

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <motion.img
        key={`${text}-${animation?.id ?? 0}`}
        src={'/img/main/' + TEXTS_IMAGES[index].src}
        alt={text}
        className={classNames('inline w-auto shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]', className)}
        style={{ transformOrigin: '50% 70%' }}
        initial={{ rotate: 0 }}
        animate={
          letterMotion
            ? { rotate: [0, letterMotion.angle, -letterMotion.angle * 0.7, letterMotion.angle * 0.3, 0] }
            : { rotate: 0 }
        }
        transition={{
          delay: letterMotion?.delay ?? 0,
          duration: 0.32,
          ease: 'easeInOut',
        }}
      />
    )
  }
  const commonTextClassName = classNames('mb-1', textClassName)

  return (
    <div
      aria-label='Open Source Lab'
      onClick={onClick}
      onMouseEnter={play}
      className={classNames(className, 'cursor-pointer')}
    >
      {TITLE_LINES.map((line, lineIndex) => {
        const precedingLetterCount = TITLE_LINES.slice(0, lineIndex).join('').length

        return (
          <span key={line}>
            {Array.from(line).map((text, letterIndex) => (
              <Text
                key={`${text}-${letterIndex}`}
                text={text}
                index={precedingLetterCount + letterIndex}
                className={commonTextClassName}
              />
            ))}
            {lineIndex < TITLE_LINES.length - 1 && <span className='inline-block w-2'> </span>}
          </span>
        )
      })}
    </div>
  )
}
