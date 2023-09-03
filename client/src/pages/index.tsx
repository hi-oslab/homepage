import { Model } from '@/components/canvas/Model'
import Scene from '@/components/canvas/Scene'
import { Sky, OrbitControls, Stage, Plane } from '@react-three/drei'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

export default function Page(props) {
  const router = useRouter()

  const ref = useRef()

  const [isHovered, setIsHovered] = useState(false)
  const [active, setActive] = useState(false)

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
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'RECRUIT' } }
}
