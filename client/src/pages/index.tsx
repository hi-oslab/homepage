import Banner from '@/components/Banner'
import Header from '@/components/dom/layout/Header'
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
          <div className=' w-full h-screen flex justify-center items-center gap-4 flex-col '>
            <div className='flex flex-col md:flex-row gap-0 md:gap-10 w-full justify-between items-center '>
              <div className='flex flex-row gap-2 m-2'>
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
              <button
                className=' p-2 text-3xl hover:border-b-2 hover:border-black'
                onClick={() => {
                  router.push('/')
                  // window.open('https://hi-oslab.github.io/')
                  // setPage('home')
                }}>
                <p className='text-xs'>Hongik univ. Interactive media art crew</p>
                {props.title}
              </button>

              <Banner title='NOTICE' noti={false}>
                <div className='flex flex-col gap-2 justify-center items-center'>
                  <p className='text-lg'>Welcome to Open Source Lab</p>
                </div>
              </Banner>
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
