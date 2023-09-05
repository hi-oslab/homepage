import { useEffect, useRef, useState } from 'react'
import { TypeAnimation } from 'react-type-animation'
import { AnimatePresence, motion } from 'framer-motion'

interface SplashScreenProps {
  isVisible?: boolean
}

export default function SplashScreen(props: SplashScreenProps) {
  const { isVisible } = props

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            layout={true}
            initial={{
              opacity: 1,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
            }}
            exit={{
              opacity: 0,
            }}
            className='w-screen h-screen z-50 bg-black flex justify-center items-center fixed top-0 left-0'>
            <div className=' flex flex-row gap-2 text-center text-2xl hover:bg-black hover:text-white  py-2 px-4 w-fit font-bold text-black dark:text-white'>
              <TypeAnimation
                cursor={false}
                sequence={['ESCAPE FROM MIRRORS', 3000]}
                wrapper='span'
                speed={10}
                repeat={Infinity}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
