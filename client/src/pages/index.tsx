import { Model } from '@/components/canvas/Model'
import Scene from '@/components/canvas/Scene'
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
  const [banner, setBanner] = useState(true)

  return (
    <>
      <button
        onClick={() => {
          router.push('/')
        }}
        className='fixed left-0 z-10 text-black bg-white text-left px-2 w-fit md:hover:opacity-50 active:opacity-50'>
        RECRUIT <br /> : Open Source Lab
      </button>
      <div className='fixed bottom-0 right-0 z-10 px-2 text-black bg-white w-fit md:hover:opacity-50 active:opacity-50'>
        All rights reserved © 2023 by <a href='https://www.instagram.com/opensource_lab/'>Open Source Lab</a>
      </div>
      <div className='fixed z-0 w-full h-screen'>
        <Scene>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Sky sunPosition={[100, 20, 100]} />
          {/* 
          //@ts-ignore */}
          <Stage controls={ref} environment={null}>
            {/* <Environment files='/data/texture.png' background /> */}
            <Model scale={0.15} />
          </Stage>
          <OrbitControls
            ref={ref}
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
