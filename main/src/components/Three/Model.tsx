import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
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
  // Add any additional props if needed
}

export function Model(props: ModelProps & ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/pcjr.glb') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.pcjr.geometry}>
        <meshStandardMaterial attach='material' color='#000' roughness={0.0} metalness={0.5} envMapIntensity={1} />
      </mesh>
      <mesh castShadow receiveShadow geometry={nodes.pcjr_1.geometry}>
        <meshStandardMaterial attach='material' color='#fff' roughness={0.1} metalness={0.8} envMapIntensity={1} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/pcjr.glb')
