import Header from '@/components/dom/layout/Header'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { AiOutlineInstagram, AiOutlineMail } from 'react-icons/ai'
import { MotionModal } from '../styles/common.styles'
import Image from 'next/image'

export default function Page(props) {
  const [page, setPage] = useState<string>('index')
  const [isModal, setIsModal] = useState<boolean>(true)

  return (
    <>
      <AnimatePresence>
        {isModal ? (
          <MotionModal>
            <div className='fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-30 backdrop-blur-sm w-full h-full flex flex-col justify-start md:justify-center items-center p-10'>
              <div className='border-2 rounded-xl flex flex-col gap-8 justify-center items-center relative bg-black border-black p-10 '>
                <p className='text-xl gap-2 flex flex-row text-white'>
                  <span className='text-lg '>🪞</span> 거울에서 도망치기
                </p>
                <button
                  className='absolute top-0 right-0 p-2 text-white text-3xl hover:text-gray-400 '
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
                <Image src='/popup/poster.png' width={500} height={500} alt='poster' />
                <button
                  className='bg-white text-black rounded-xl py-2 px-4 md:hover:bg-black md:hover:text-white border-white border-2 active:bg-black active:text-white'
                  // onClick={() => {
                  //   window.open('https://recruit.hioslab.com')
                  // }}
                >
                  전시링크가 곧 오픈됩니다.
                </button>
              </div>
            </div>
          </MotionModal>
        ) : (
          <>
            <MotionModal>
              <button
                onClick={() => {
                  setIsModal(true)
                }}
                className='fixed z-20 top-0 right-0 p-2 m-2 w-fit h-fit border-2 border-black bg-black text-white rounded-xl active:bg-white active:text-black md:hover:bg-white md:hover:text-black'>
                <div className='fixed top-0 right-0 rounded-full z-30 w-fit h-4 px-1 text-xs bg-red-500'>new</div>
                공지
              </button>
            </MotionModal>
          </>
        )}
      </AnimatePresence>
      {page === 'index' ? (
        <>
          <div className=' w-full h-screen flex justify-center items-center gap-4 flex-col '>
            <div className='flex flex-col md:flex-row gap-0 md:gap-10 justify-center items-center '>
              <button
                className=' p-2 text-3xl hover:text-gray-400'
                onClick={() => {
                  window.open('https://hi-oslab.github.io/')
                  // setPage('home')
                }}>
                <p className='text-xs'>Hongik univ. Interactive media art crew</p>
                {props.title}
              </button>
              <div className='flex flex-row gap-4'>
                <button
                  onClick={() => {
                    window.open('https://www.instagram.com/opensource_lab/')
                  }}
                  className='text-3xl hover:text-gray-400 '>
                  <AiOutlineInstagram />
                </button>
                <button
                  onClick={() => {
                    window.location.href = 'mailto:hi.oslab@gmail.com'
                  }}
                  className='text-3xl hover:text-gray-400 '>
                  <AiOutlineMail />
                </button>
              </div>
            </div>
            <div className='w-full  h-full flex flex-col justify-center items-center '>
              <iframe
                className='w-full h-full border '
                src='https://hi-oslab.github.io/'
                frameBorder='0'
                allowTransparency={true}
                allow='encrypted-media'></iframe>
              <a className='text-xxs text-black opacity-70 underline px-2' href='https://hi-oslab.github.io/'>
                hi-oslab.github.io
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          <Header title={props.title} height={80} />
          <div className='mt-20 text-white flex flex-col justify-start w-screen h-full gap-10 py-20'></div>
        </>
      )}
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'Open Source Lab' } }
}
