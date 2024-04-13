import Banner from '@/components/Banner'
import Header from '@/components/dom/layout/Header'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { AiOutlineInstagram, AiOutlineMail } from 'react-icons/ai'

export default function Page(props) {
  const router = useRouter()
  const [page, setPage] = useState<string>('index')

  return (
    <>
      {page === 'index' ? (
        <>
          <div className='w-full h-[100svh] flex justify-center items-center gap-4 px-2 flex-col '>
            <div className='flex flex-row gap-0 md:gap-10 w-full justify-between items-center '>
              <div className='flex flex-col gap-1'>
                <button
                  className='md:hidden ml-0.5 flex flex-col justify-start items-start text-lg hover:border-b-2 hover:border-black'
                  onClick={() => {
                    router.push('/')
                    // window.open('https://hi-oslab.github.io/')
                    // setPage('home')
                  }}>
                  {props.title}
                </button>
                <div className='flex flex-row gap-2 md:ml-2'>
                  <button
                    onClick={() => {
                      window.open('https://www.instagram.com/opensource_lab/')
                    }}
                    className='text-2xl md:text-3xl active:text-gray-400 md:hover:text-gray-400 '>
                    <AiOutlineInstagram />
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = 'mailto:hi.oslab@gmail.com'
                    }}
                    className='text-2xl md:text-3xl md:hover:text-gray-400  active:text-gray-400'>
                    <AiOutlineMail />
                  </button>
                </div>
              </div>
              <button
                className='hidden md:flex flex-col justify-center items-center p-2 text-3xl hover:border-b-2 hover:border-black'
                onClick={() => {
                  router.push('/')
                  // window.open('https://hi-oslab.github.io/')
                  // setPage('home')
                }}>
                <p className='text-xs'>Hongik univ. Interactive media art crew</p>
                {props.title}
              </button>

              <Banner title='Notice' noti={true}>
                <span className='text-lg md:text-xl'>Open Source Lab 웹 페이지 리뉴얼 예정</span>
                <p className='text-sm md:text-lg'>2024.04 ~ 2024.07</p>
              </Banner>
            </div>
            <div className='w-full  h-full flex flex-col justify-center items-center '>
              <iframe
                className='w-full h-full '
                src='https://hi-oslab.github.io/'
                frameBorder='0'
                allowTransparency={true}
                allow='encrypted-media'></iframe>
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
