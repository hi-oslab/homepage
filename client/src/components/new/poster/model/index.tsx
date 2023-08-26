import * as THREE from 'three'
import React, { useEffect, useRef, useState } from 'react'
import { useGLTF, useAnimations, MeshReflectorMaterial } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.Mesh
    Plane: THREE.Mesh
    object_3: THREE.Mesh
    object_4: THREE.Mesh
    object_2: THREE.Mesh
    object_1: THREE.Mesh
    Cylinder001: THREE.Mesh
    Cylinder002: THREE.Mesh
  }
  materials: {
    glass_cycle: THREE.MeshPhysicalMaterial
    plane_poster: THREE.MeshStandardMaterial
    scone_mat: THREE.MeshPhysicalMaterial
    ['Material.001']: THREE.MeshPhysicalMaterial
    spere_glass: THREE.MeshPhysicalMaterial
    sphere_mat: THREE.MeshStandardMaterial
    ['glass_cycle.001']: THREE.MeshPhysicalMaterial
  }
}

type ActionName = 'CylinderAction' | 'Cylinder.001Action' | 'Cylinder.002Action'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

const Model = (props: JSX.IntrinsicElements['group']) => {
  const group = useRef<THREE.Group>()
  const { nodes, materials, animations } = useGLTF('/data/efm.glb') as GLTFResult
  //@ts-ignore
  const { actions } = useAnimations<GLTFActions>(animations, group)
  const [animationIndex, setAnimationIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  function playAnimation() {
    const ani01 = 'CylinderAction'
    const ani02 = 'Cylinder.001Action'
    const ani03 = 'Cylinder.002Action'
    const animationList = Object.keys(actions)
    const animationName = animationList[animationIndex]
    if (!isPlaying) {
      if (actions) {
        actions[ani01].play()
        actions[ani02].play()
        actions[ani03].play()
        actions[ani01].setEffectiveTimeScale(2)
        actions[ani02].setEffectiveTimeScale(2)
        actions[ani03].setEffectiveTimeScale(2)

        setIsPlaying(true)
      }
    } else {
      if (actions) {
        const animationList = Object.keys(actions)
        actions[animationName].stop()
        setAnimationIndex((animationIndex + 1) % animationList.length)
        setIsPlaying(false)
      }
    }
  }

  useEffect(() => {
    playAnimation()
  }, [])

  return (
    <group ref={group} {...props} dispose={null}>
      <group name='Scene'>
        <mesh
          name='Cylinder'
          castShadow
          receiveShadow
          geometry={nodes.Cylinder.geometry}
          position={[-0.087, 0.005, 0.24]}
          rotation={[1.132, 0.337, -1.078]}
          material={materials.glass_cycle}
          scale={0.043}>
          <MeshReflectorMaterial
            blur={[300, 30]}
            resolution={2048}
            mixBlur={1}
            mixStrength={80}
            roughness={0}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color='#383838'
            metalness={0.9}
            opacity={0.9}
            transparent
            mirror={0}
          />
        </mesh>
        <mesh
          name='Plane'
          castShadow
          receiveShadow
          geometry={nodes.Plane.geometry}
          material={materials.plane_poster}
          position={[0, 0, -0.057]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <mesh
          name='object_3'
          castShadow
          receiveShadow
          geometry={nodes.object_3.geometry}
          material={materials.scone_mat}
          position={[-0.031, -0.001, 0.077]}
          rotation={[-1.585, 0.848, 2.152]}
          scale={0.004}
        />
        <mesh
          name='object_4'
          castShadow
          receiveShadow
          geometry={nodes.object_4.geometry}
          material={materials['Material.001']}
          position={[-0.069, -0.098, 0.163]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0}
        />
        <mesh
          name='object_2'
          castShadow
          receiveShadow
          geometry={nodes.object_2.geometry}
          material={materials.spere_glass}
          position={[-0.06, 0.02, 0.203]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={-0.001}
        />
        <mesh
          name='object_1'
          castShadow
          receiveShadow
          geometry={nodes.object_1.geometry}
          material={materials.sphere_mat}
          position={[0.123, 0.024, -0.088]}
          rotation={[2.073, 1.265, 1.896]}
          scale={0.005}
        />
        <mesh
          name='Cylinder001'
          castShadow
          receiveShadow
          geometry={nodes.Cylinder001.geometry}
          material={materials.glass_cycle}
          position={[0.062, -0.067, 0.157]}
          rotation={[1.319, -0.327, 0.74]}
          scale={0.018}>
          <MeshReflectorMaterial
            blur={[300, 30]}
            resolution={2048}
            mixBlur={1}
            mixStrength={80}
            roughness={0}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color='#383838'
            metalness={0.9}
            opacity={0.9}
            transparent
            mirror={0}
          />
        </mesh>
        <mesh
          name='Cylinder002'
          castShadow
          receiveShadow
          geometry={nodes.Cylinder002.geometry}
          material={materials['glass_cycle.001']}
          position={[0.07, 0.142, 0.068]}
          rotation={[-0.46, -0.221, 2.793]}
          scale={0.028}>
          <MeshReflectorMaterial
            blur={[300, 30]}
            resolution={2048}
            mixBlur={1}
            mixStrength={80}
            roughness={0}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color='#383838'
            metalness={0.9}
            opacity={0.9}
            transparent
            mirror={0}
          />
        </mesh>
      </group>
    </group>
  )
}

useGLTF.preload('/data/efm.glb')

export default Model
