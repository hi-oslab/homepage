import Header from '@/components/dom/layout/Header'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Page(props) {
  return (
    <>
      <Header title={props.title} />
      <div className='pt-12 bg-black flex flex-col justify-center items-center w-screen h-full min-h-screen'>
        <Image src='/img/efm.png' alt='EFM-OSL' width={1419 / 2} height={1419 / 2} />
      </div>
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'Momo' } }
}
