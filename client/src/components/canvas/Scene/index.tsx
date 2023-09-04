import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'
import { Spinner } from '@/components/canvas/Spinner'

export const Loader = () => {
  const progress = Math.floor(useProgress().progress)
  return (
    <Html center>
      <S.SpinnerCover>
        <Spinner progress={progress} />
      </S.SpinnerCover>
    </Html>
  )
}

export const Common = ({ color }) => (
  <>
    {/* @ts-ignore */}
    {color && <color attach='background' args={[color]} />}
  </>
)

const Scene = ({ children, ...props }) => {
  const canvasRef = useRef()
  return (
    <>
      <Canvas {...props} ref={canvasRef} {...props} shadows dpr={[1, 2]} camera={{ fov: 70 }}>
        <Suspense fallback={<Loader />}>
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </>
  )
}

export default Scene
