'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { Html, OrbitControls } from '@react-three/drei'
import { Model } from './Model'

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className='size-full'>
      <Canvas
        shadows
        camera={{ position: [0, 0, 1], fov: 50 }}
        eventSource={containerRef as React.RefObject<HTMLElement>}
      >
        <Suspense
          fallback={
            <Html center>
              <div className='space-y-1 text-left font-mono text-sm text-neutral-400'>
                <p>&gt; initializing 3d scene...</p>
                <p>&gt; loading model<span className='cursor-blink'>▊</span></p>
              </div>
            </Html>
          }
        >
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[5, 5, 5]}
            color='#ffffff'
            intensity={2}
            castShadow
            shadow-bias={-0.001}
            shadow-normalBias={0.05}
          />
          <directionalLight position={[-5, 3, -5]} color='#ffffff' intensity={1} />
          <Model position={[0, -0.2, 0]} receiveShadow />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
