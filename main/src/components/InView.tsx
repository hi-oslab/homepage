'use client'

import classNames from 'classnames'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export const InView = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -100px 0px' })

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.section
      ref={ref}
      className={classNames('w-full relative', className ? className : 'px-4 py-4 md:px-8 md:py-8 min-h-dvh h-fit')}
      variants={animationVariants}
      initial='hidden'
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}
