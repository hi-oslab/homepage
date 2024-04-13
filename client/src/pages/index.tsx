import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Page(props) {
  const router = useRouter()
  const [page, setPage] = useState<string>('index')

  return (
    <>
      <div className='w-full h-[100svh] flex justify-start items-center gap-4 px-2 flex-col '>
        <button
          className='hidden md:flex flex-col justify-center items-center p-2 text-3xl hover:border-b-2 hover:border-black'
          onClick={() => {
            router.push('/')
          }}>
          <p className='text-xs'>Hongik univ. Interactive media art crew</p>
          {props.title}
        </button>
      </div>
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'Open Source Lab' } }
}
