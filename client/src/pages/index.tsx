import { Model } from '@/components/canvas/Model'
import Scene, { Common } from '@/components/canvas/Scene'
import { Sky, OrbitControls, Stage, Environment } from '@react-three/drei'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { TypeAnimation } from 'react-type-animation'

export default function Page(props) {
  const router = useRouter()

  const ref = useRef()

  const [isHovered, setIsHovered] = useState(false)
  const [active, setActive] = useState(false)
  const [banner, setBanner] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          window.open(
            'https://docs.google.com/forms/d/e/1FAIpQLScJM7D5iMDB58d_rtXuZ6JG5-bVmuPCIU2PcRQ4MRbwfCmcNA/viewform?usp=sf_link',
          )
        }}
        className='fixed bottom-0 right-0 z-20 bg-[#0000FF] text-[#FFFF00] text-center text-xl p-4  w-fit font-semibold'>
        <span className='animate-pulse border-2 px-2 py-1 md:hover:bg-white md:hover:text-[#0000FF] active:bg-white active:text-[#0000FF]'>
          리크루트 지원하기
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
          <Common color={'#000000'} />
          <ambientLight intensity={1} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {/* 
          //@ts-ignore */}
          <Stage controls={ref} environment={null}>
            {/* <Environment files='/data/texture.png' background /> */}
            <Model scale={0.15} />
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
      {banner && (
        <div className='fixed z-10 bg-white bg-opacity-30 backdrop-blur-sm text-white w-full h-screen flex justify-center items-center'>
          <div className='flex flex-col justify-center items-center gap-4 text-xl'>
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
                '오픈소스랩 리크루트 페이지가 곧 공개됩니다!',
                1000, // wait 1s before replacing "Mice" with "Hamsters"
              ]}
              wrapper='span'
              speed={50}
              style={{ fontSize: '1em', display: 'inline-block' }}
              className=' px-2 bg-white text-black'
              repeat={Infinity}
            />
            <Image src='/img/poster.png' className='shadow-lg' width={350.8} height={496.1} alt={'poster'} />
          </div>
          <button
            onClick={() => {
              setBanner(false)
            }}
            className='fixed bottom-0 right-0 z-10 text-black bg-white text-left px-2 w-fit md:hover:opacity-50 active:opacity-50'>
            v.0.0.1
          </button>
        </div>
      )}
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'RECRUIT' } }
}
