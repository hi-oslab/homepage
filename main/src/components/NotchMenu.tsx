'use client'

import classNames from 'classnames'
import { motion, MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const menuItems = [
  { label: 'About', path: '/about' },
  { label: 'Members', path: '/members' },
  { label: 'Works', path: '/work' },
  { label: 'Lab', path: '/lab-space' },
  { label: 'Contact', path: '/contact' },
]

// 노치 형태(패딩/라운드/코너) 전환용 스프링: 살짝 튀는 Dynamic Island 느낌
const notchSpring = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 } as const
// 독 확대용 스프링: 가볍고 빠르게 커서를 따라감
const dockSpring = { mass: 0.1, stiffness: 170, damping: 12 }

const MAGNIFY_RANGE = 140 // px, 커서에서 이 거리까지 확대 영향
const MAGNIFY_SCALE = 1.5

export const NotchMenu = () => {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const mouseX = useMotionValue(Infinity)

  const onHandleRoute = (path: string) => {
    setExpanded(false)
    mouseX.set(Infinity)
    router.push(path)
  }

  // 좁은 화면에서는 노치 여백을 줄여 화면 밖으로 넘치지 않게
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const cornerSize = expanded ? 16 : 10
  const paddingX = compact ? 16 : expanded ? 40 : 24

  return (
    <motion.nav
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.4 }, y: notchSpring }}
      onMouseEnter={() => setExpanded(true)}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => {
        setExpanded(false)
        mouseX.set(Infinity)
      }}
      className='fixed bottom-0 left-1/2 z-40 flex -translate-x-1/2 flex-row items-end justify-center'
    >
      <motion.svg
        xmlns='http://www.w3.org/2000/svg'
        className='-mr-px rotate-90'
        viewBox='0 0 51 50'
        fill='none'
        initial={false}
        animate={{ width: cornerSize, height: cornerSize }}
        transition={notchSpring}
      >
        <path d='M51 0V50H50C50 22.3858 27.6142 0 0 0H51Z' fill='black' />
      </motion.svg>
      <motion.div
        initial={false}
        animate={{
          paddingTop: expanded ? 16 : 12,
          paddingBottom: expanded ? 14 : 10,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          gap: compact ? 12 : expanded ? 24 : 16,
          borderTopLeftRadius: expanded ? 16 : 12,
          borderTopRightRadius: expanded ? 16 : 12,
        }}
        transition={notchSpring}
        className='flex flex-row items-end justify-center bg-black'
      >
        {menuItems.map((item) => (
          <DockItem
            key={item.label}
            label={item.label}
            active={pathname === item.path || pathname.startsWith(`${item.path}/`)}
            mouseX={mouseX}
            magnify={!reduceMotion}
            onClick={() => onHandleRoute(item.path)}
          />
        ))}
      </motion.div>
      <motion.svg
        xmlns='http://www.w3.org/2000/svg'
        className='-ml-px -rotate-90'
        viewBox='0 0 51 50'
        fill='none'
        initial={false}
        animate={{ width: cornerSize, height: cornerSize }}
        transition={notchSpring}
      >
        <path d='M0 0V50H1C1 22.3858 23.3858 0 51 0H0Z' fill='black' />
      </motion.svg>
    </motion.nav>
  )
}

const DockItem = ({
  label,
  active,
  mouseX,
  magnify,
  onClick,
}: {
  label: string
  active: boolean
  mouseX: MotionValue<number>
  magnify: boolean
  onClick: () => void
}) => {
  const ref = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [base, setBase] = useState<{ width: number; height: number } | null>(null)

  // 라벨 원래 크기 측정 (transform은 offsetWidth에 영향 없음, 폰트 로드 후 재측정)
  useLayoutEffect(() => {
    const el = labelRef.current
    if (!el) return
    const measure = () => setBase({ width: el.offsetWidth, height: el.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return x - bounds.x - bounds.width / 2
  })
  const targetScale = useTransform(distance, [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE], [1, magnify ? MAGNIFY_SCALE : 1, 1])
  const scale = useSpring(targetScale, dockSpring)
  // 확대된 만큼 자리를 차지해서 이웃 아이템을 자연스럽게 밀어냄
  const width = useTransform(scale, (s) => (base ? base.width * s : 'auto'))
  const height = useTransform(scale, (s) => (base ? base.height * s : 'auto'))

  return (
    <motion.button
      ref={ref}
      style={{ width, height }}
      onClick={onClick}
      className='relative flex items-end justify-center'
    >
      <motion.span
        ref={labelRef}
        style={{ scale, transformOrigin: 'bottom center' }}
        className={classNames(
          'block whitespace-nowrap text-[0.95rem] leading-none sm:text-[1.25rem] transition-colors duration-200 hover:text-white',
          active ? 'text-white' : 'text-[#888888]',
        )}
      >
        {label}
      </motion.span>
    </motion.button>
  )
}
