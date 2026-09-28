'use client'

import classNames from 'classnames'
import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * 홈의 카드 한 칸: 차례로 떠오르며 나타나고, 올리면 살짝 들린다
 * - className: 바깥(그리드 칸 차지 등 배치용, page.tsx에서 넘긴다)
 * - bodyClassName: 카드 안쪽 모양
 */
export function BentoCard({
  index = 0,
  href,
  tone = 'light',
  className,
  bodyClassName,
  children,
}: {
  /** 나타나는 순서 */
  index?: number
  /** 카드 전체를 누르면 갈 곳 */
  href?: string
  tone?: 'light' | 'dark'
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={href ? { y: -3 } : undefined}
      className={classNames(
        'flex h-full flex-col gap-3 rounded-3xl p-4 transition-shadow md:p-5',
        tone === 'dark' ? 'bg-ink text-white' : 'bg-surface',
        href && 'hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)]',
        bodyClassName,
      )}
    >
      {children}
    </motion.div>
  )
  return (
    <div className={classNames('h-full', className)}>
      {href ? (
        <Link href={href} className='block h-full'>
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  )
}

/** 섹션 카드 공통 props: 배치(className)와 나타나는 순서(index)만 page.tsx가 정한다 */
export type HomeCardProps = { index?: number; className?: string }
