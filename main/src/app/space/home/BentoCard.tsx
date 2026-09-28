'use client'

import classNames from 'classnames'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BLOCK_PAD, surfaceClass } from '@/components/admin/styles'

/**
 * 홈의 카드 한 칸: 올리면 살짝 들린다 (나타나는 모션은 page.tsx의 PopIn이 맡는다)
 * - className: 바깥(그리드 칸 차지 등 배치용, page.tsx에서 넘긴다)
 * - bodyClassName: 카드 안쪽 모양
 */
export function BentoCard({
  href,
  tone = 'light',
  className,
  bodyClassName,
  children,
}: {
  /** (예전 등장 순서, 지금은 쓰지 않음 · PopIn이 무작위로) */
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
      whileHover={href ? { y: -3 } : undefined}
      className={classNames(
        'flex h-full flex-col gap-3 transition-shadow',
        BLOCK_PAD,
        surfaceClass(tone === 'dark' ? 'inverse' : 'solid'),
        href && 'hover:shadow-[0_12px_32px_rgb(var(--shadow-rgb)/0.08)]',
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
