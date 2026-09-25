import * as THREE from 'three'
import type { ReactNode } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

type GLTFResult = GLTF & {
  nodes: {
    pcjr: THREE.Mesh
    pcjr_1: THREE.Mesh
  }
  materials: {
    lambert5: THREE.MeshStandardMaterial
    lambert4: THREE.MeshStandardMaterial
  }
}

interface ModelProps {
  children?: ReactNode
}

export function Model({ children, ...props }: ModelProps & ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/pcjr.glb') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.pcjr.geometry}>
        <meshStandardMaterial attach='material' color='#fff' roughness={0.0} metalness={0.5} envMapIntensity={1} />
      </mesh>
      <mesh castShadow receiveShadow geometry={nodes.pcjr_1.geometry}>
        <meshStandardMaterial attach='material' color='#ffffff' roughness={0.1} metalness={0.8} envMapIntensity={1} />
      </mesh>
      {children && (
        <Html transform position={[0, 0.2877, 0.138]} scale={0.03} className='pointer-events-auto'>
          <div className='h-[230px] w-[304px] overflow-y-scroll rounded-[10px] bg-black text-white shadow-inner'>
            {children}
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload('/models/pcjr.glb')
