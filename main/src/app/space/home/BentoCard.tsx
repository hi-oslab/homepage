'use client'

import classNames from 'classnames'
import { motion } from 'framer-motion'
import Link from 'next/link'

/** 홈의 카드 한 칸: 차례로 떠오르며 나타나고, 올리면 살짝 들린다 */
export function BentoCard({
  index = 0,
  href,
  tone = 'light',
  className,
  children,
}: {
  /** 나타나는 순서 */
  index?: number
  /** 카드 전체를 누르면 갈 곳 */
  href?: string
  tone?: 'light' | 'dark'
  className?: string
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
        className,
      )}
    >
      {children}
    </motion.div>
  )
  return href ? (
    <Link href={href} className='block h-full'>
      {body}
    </Link>
  ) : (
    body
  )
}
