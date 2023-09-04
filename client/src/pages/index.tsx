import { Model } from '@/components/canvas/Model'
import Scene, { Common } from '@/components/canvas/Scene'
import { Sky, OrbitControls, Stage, Environment } from '@react-three/drei'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { AiOutlineHome } from 'react-icons/ai'

export default function Page(props) {
  const router = useRouter()

  const ref = useRef()

  const [isHovered, setIsHovered] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          window.open('https://hioslab.com')
        }}
        className='fixed top-0 right-0 z-20 bg-[#0000FF] text-[#FFFF00] text-center text-md p-2  w-fit'>
        <span className='px-1 flex flex-row justify-center items-center gap-1 md:hover:bg-[#FFFF00] md:hover:text-[#0000FF] active:bg-[#FFFF00] active:text-[#0000FF]'>
          <AiOutlineHome /> hisoslab.com
        </span>
      </button>
      <button
        onClick={() => {
          window.open(
            'https://docs.google.com/forms/d/e/1FAIpQLScJM7D5iMDB58d_rtXuZ6JG5-bVmuPCIU2PcRQ4MRbwfCmcNA/viewform?usp=sf_link',
          )
        }}
        className='fixed bottom-0 right-0 z-20 bg-[#0000FF] text-[#FFFF00] text-center text-xl p-4  w-fit font-semibold'>
        <span className='active:bg-[#0000FF] animate-pulse active:border-2 active:border-[#FFFF00] active:text-[#FFFF00] md:hover:bg-[#0000FF] md:hover:border-2 md:hover:border-[#FFFF00] px-2 py-1 bg-[#FFFF00] text-[#0000FF]'>
          오픈소스랩 지원하기
        </span>
      </button>
      <div key='top/4' className='fixed top-0 left-0 z-10 w-full h-4 text-left text-black bg-[#0000FF]'></div>
      <div key='left/16' className='fixed top-0 left-0 z-10 w-16 h-full px-2 text-black bg-[#0000FF]'>
        <div className='fixed z-20 origin-left -rotate-90 bottom-0 left-8 flex flex-col w-[900px] h-10 text-[#FFFF00] text-md font-semibold'>
          <div className=''> OPEN SOURCE LAB 2023-2 RECRUITING PERFORMANCE</div>
          <div className=''> CO-DING-A-DING-A-LING</div>
        </div>
        <div className='fixed z-20 origin-left -rotate-90 top-40 left-8 w-40 h-10 text-[#FFFF00] text-md text-right font-semibold'>
          23.09.05 TUE
        </div>
      </div>
      <div key='right/4' className='fixed top-0 right-0 z-10 w-4 h-full text-left text-black bg-[#0000FF]'></div>
      <div key='bottom/4' className='fixed bottom-0 left-0 z-10 w-full h-4 text-left text-black bg-[#0000FF]'></div>
      <div className='fixed z-0 w-full h-screen pointer-events-none'>
        <Scene>
          <Common color={'#000033'} />
          <ambientLight intensity={1} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {/* 
          //@ts-ignore */}
          <Stage controls={ref} environment={null}>
            <Environment
              background
              files={[
                './data/texture.png',
                './data/texture.png',
                './data/texture.png',
                './data/texture.png',
                './data/texture.png',
                './data/texture.png',
              ]}
            />
            <Model scale={0.3} />
          </Stage>

          <OrbitControls
            ref={ref}
            autoRotate={true}
            autoRotateSpeed={5}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0}
            maxDistance={100}
          />
        </Scene>
      </div>
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'RECRUIT' } }
}
