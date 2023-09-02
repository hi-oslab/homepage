import Scene from '@/components/canvas/Scene'
import { Sky, OrbitControls, Sphere, Plane } from '@react-three/drei'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Page(props) {
  const router = useRouter()

  const [isHovered, setIsHovered] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          router.push('/')
        }}
        className='fixed left-0 z-10 text-black bg-white w-fit md:hover:opacity-50 active:opacity-50'>
        LOGO
      </button>
      <div className='fixed right-0 z-10 text-black bg-white w-fit md:hover:opacity-50 active:opacity-50'>
        All rights reserved © 2023 by SEJIN
      </div>
      <div className='fixed z-0 w-full h-screen'>
        <Scene>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Sky sunPosition={[100, 20, 100]} />
          {/* 
          //@ts-ignore */}
          <Sphere
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            onClick={() => setActive(!active)}
            args={[1, 32, 32]}
            position={[0, 0, 0]}>
            {
              //@ts-ignore
              <meshStandardMaterial color={isHovered ? 'hotpink' : 'orange'} />
            }
          </Sphere>
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={0} maxDistance={100} />
        </Scene>
      </div>
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'Home' } }
}
