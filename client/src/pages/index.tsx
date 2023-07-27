import Header from '@/components/dom/layout/Header'
import { useState } from 'react'
import { AiOutlineInstagram, AiOutlineMail } from 'react-icons/ai'

export default function Page(props) {
  const [page, setPage] = useState<string>('index')

  return (
    <>
      {page === 'index' ? (
        <>
          <div className=' w-full h-screen flex justify-center items-center gap-10 flex-col md:flex-row '>
            <div className='flex flex-col justify-center items-center '>
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
            <div className=' w-64 md:w-0 h-0 md:h-64 border-[0.5px]'></div>
            <div className='w-80  h-60 flex flex-col justify-center items-center '>
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
