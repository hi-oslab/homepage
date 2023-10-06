import { MotionModal } from '@/styles/common.styles'
import Image from 'next/image'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface BannerProps {
  view?: boolean
  title: string
  image_src?: string
  children: React.ReactNode
  noti: boolean
}

export default function Banner(
  props: BannerProps = {
    view: true,
    title: 'NOTICE',
    image_src: null,
    children: null,
    noti: false,
  },
) {
  const { title, image_src, children, noti } = props

  const [isModal, setIsModal] = useState<boolean>(props.view)

  return (
    <>
      <AnimatePresence>
        {isModal && (
          <MotionModal className='fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-30 backdrop-blur-xs w-full h-full flex flex-col justify-start md:justify-center items-center p-10'>
            <div className='border-t-2 flex flex-col gap-8 justify-center items-center relative bg-white border-black p-10 '>
              <p className='text-xl gap-2 flex flex-row '>{title}</p>
              <button
                className='absolute top-0 right-0 p-2 text-black text-3xl hover:text-gray-400 '
                onClick={() => {
                  setIsModal(false)
                }}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
              {image_src && <Image src={image_src} width={500} height={500} alt='banner_image' />}
              {children}
            </div>
          </MotionModal>
        )}
      </AnimatePresence>
      <div className=' m-2 w-fit h-fit flex flex-col justify-center items-center bg-black'>
        <button
          onClick={() => {
            setIsModal(true)
          }}
          className=' w-fit h-fit p-2 text-xl bg-white border-b-2 border-black hover:-translate-x-[4px] hover:-translate-y-[2px] '>
          {noti && <div className='fixed top-0 right-0 rounded-full z-10 w-fit h-4 px-1 text-xs bg-red-500'>new</div>}
          Notice
        </button>
      </div>
    </>
  )
}
