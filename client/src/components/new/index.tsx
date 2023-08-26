import Scene from '@/components/canvas/Scene'
import { Sky, OrbitControls, Sphere, Plane, OrthographicCamera, Stage } from '@react-three/drei'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Model from './poster/model'
import { Perf } from 'r3f-perf'

const New = () => {
  const router = useRouter()

  const [isHovered, setIsHovered] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <>
      <div className='fixed z-0 w-full h-screen'>
        <Scene>
          <ambientLight intensity={0.2} />
          <Sky sunPosition={[100, 20, 100]} />
          {/* //@ts-ignore */}
          <Stage environment='city' intensity={0.5}>
            <Model scale={10} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={Math.PI / 2}
              minAzimuthAngle={-Math.PI / 5}
              maxAzimuthAngle={Math.PI / 5}
            />
          </Stage>
          <Perf />
        </Scene>
      </div>
    </>
  )
}

export default New
