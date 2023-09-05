import Header from '@/components/dom/layout/Header'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AiOutlineInstagram, AiOutlineMail } from 'react-icons/ai'
import { MotionModal } from '../styles/common.styles'
import Image from 'next/image'
import SplashScreen from '@/components/dom/SplashScreen'
import { useRouter } from 'next/router'

export default function Page(props) {
  const router = useRouter()

  const [isModal, setIsModal] = useState<boolean>(true)
  const [isSplashScreenEnd, setIsSplashScreenEnd] = useState<boolean>(true)

  useEffect(() => {
    setTimeout(() => {
      setIsSplashScreenEnd(false)
    }, 3000)
  }, [])

  const pages = [
    {
      title: 'Intro',
      path: '/intro',
    },
    {
      title: 'Yes or No, Really?',
      path: '/yes-or-no-really',
    },
    {
      title: 'Rainbow Reflection',
      path: '/rainbow-reflection',
    },
    {
      title: 'Momo',
      path: '/momo',
    },
    {
      title: 'Happy Box',
      path: '/happy-box',
    },
    {
      title: 'Paranormal Sapiens',
      path: '/paranormal-sapiens',
    },
  ]
  return (
    <>
      <SplashScreen isVisible={isSplashScreenEnd} />
      <Header title={props.title} />
      <div className='pt-12 bg-black flex flex-col justify-center items-center w-screen h-full min-h-screen'>
        <div className=' w-full h-full p-10 grid grid-cols-1 md:grid-cols-2 gap-4'>
          {pages.map((page, index) => (
            <div
              key={index}
              className='flex flex-col w-full h-full min-h-[300px] border-4 border-white bg-black justify-between items-center'>
              <div className='h-3/5 w-full text-4xl bg-white flex justify-center items-center'>{page.title}</div>
              <button
                onClick={() => {
                  router.push(page.path)
                }}
                className='flex flex-col mb-4 border-2 border-white bg-white text-black justify-center items-center px-4 py-1 w-fit h-fit active:bg-black active:text-white md:hover:bg-black md:hover:text-white'>
                🫵 Go to {page.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'EFM' } }
}
