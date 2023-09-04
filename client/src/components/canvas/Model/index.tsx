import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'
import { LayerMaterial, Depth, Fresnel } from 'lamina'

type GLTFResult = GLTF & {
  nodes: {
    O: THREE.Mesh
    P: THREE.Mesh
    E: THREE.Mesh
    N: THREE.Mesh
    S: THREE.Mesh
    O_1: THREE.Mesh
    U: THREE.Mesh
    R: THREE.Mesh
    C: THREE.Mesh
    E_1: THREE.Mesh
    L: THREE.Mesh
    A: THREE.Mesh
    B: THREE.Mesh
    plastic_band: THREE.Mesh
    Ear_piece_plastic: THREE.Mesh
    Ear_piece_rubber: THREE.Mesh
    Plastic_holder: THREE.Mesh
    Cube001: THREE.Mesh
    Cube002: THREE.Mesh
    Sphere: THREE.Mesh
    Cylinder002: THREE.Mesh
    O_2: THREE.Mesh
    P_1: THREE.Mesh
    E_2: THREE.Mesh
    N_1: THREE.Mesh
    S_1: THREE.Mesh
    O_3: THREE.Mesh
    U_1: THREE.Mesh
    R_1: THREE.Mesh
    C_1: THREE.Mesh
    E_3: THREE.Mesh
    L_1: THREE.Mesh
    A_1: THREE.Mesh
    B_1: THREE.Mesh
    plastic_band_1: THREE.Mesh
    Ear_piece_plastic_1: THREE.Mesh
    Ear_piece_rubber_1: THREE.Mesh
    Plastic_holder_1: THREE.Mesh
    Cube001_1: THREE.Mesh
    Cube002_1: THREE.Mesh
    Sphere_1: THREE.Mesh
    Cylinder002_1: THREE.Mesh
    O_4: THREE.Mesh
    P_2: THREE.Mesh
    E_4: THREE.Mesh
    N_2: THREE.Mesh
    S_2: THREE.Mesh
    O_5: THREE.Mesh
    U_2: THREE.Mesh
    R_2: THREE.Mesh
    C_2: THREE.Mesh
    E_5: THREE.Mesh
    L_2: THREE.Mesh
    A_2: THREE.Mesh
    B_2: THREE.Mesh
    plastic_band_2: THREE.Mesh
    Ear_piece_plastic_2: THREE.Mesh
    Ear_piece_rubber_2: THREE.Mesh
    Plastic_holder_2: THREE.Mesh
    Cube001_2: THREE.Mesh
    Cube002_2: THREE.Mesh
    Sphere_2: THREE.Mesh
    Cylinder002_2: THREE.Mesh
  }
  materials: {}
}

type ActionName = 'animation_0'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

export function Model(props: JSX.IntrinsicElements['group']) {
  const group = useRef<THREE.Group>()
  const { nodes, materials, animations } = useGLTF(
    'https://hi-oslab.s3.ap-northeast-2.amazonaws.com/poster.gltf',
  ) as GLTFResult
  const { actions } = useAnimations<GLTFActions>(animations, group)
  const texture = useLoader(THREE.TextureLoader, '/data/texture.png')
  const Material = new THREE.MeshPhysicalMaterial({
    color: 0x000,
    specular: 1,
    roughness: 0,
    materials: 1,
    clearcoat: 2,
    clearcoatRoughness: 0,
    reflectivity: 1,
    envMapIntensity: 1,
    map: texture,
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <group>
        <group name='headphone' position={[-144.742, 193.259, -368.155]} rotation={[-1.423, -0.655, 1.954]}>
          <group name='MoText' position={[0.899, 66.638, 9.444]}>
            <group name='Text'>
              <group name='1' position={[-30.796, 0, 0]}>
                <group name='OPEN'>
                  <mesh name='O' castShadow receiveShadow geometry={nodes.O.geometry} material={Material}></mesh>
                  <mesh
                    name='P'
                    castShadow
                    receiveShadow
                    geometry={nodes.P.geometry}
                    material={Material}
                    position={[5.327, 0, 0]}></mesh>
                  <mesh
                    name='E'
                    castShadow
                    receiveShadow
                    geometry={nodes.E.geometry}
                    material={Material}
                    position={[9.55, 0, 0]}></mesh>
                  <mesh
                    name='N'
                    castShadow
                    receiveShadow
                    geometry={nodes.N.geometry}
                    material={Material}
                    position={[13.521, 0, 0]}></mesh>
                </group>
                <group name='SOURCE' position={[19.941, 0, 0]}>
                  <mesh name='S' castShadow receiveShadow geometry={nodes.S.geometry} material={Material}></mesh>
                  <mesh
                    name='O_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.O_1.geometry}
                    material={Material}
                    position={[4.071, 0, 0]}></mesh>
                  <mesh
                    name='U'
                    castShadow
                    receiveShadow
                    geometry={nodes.U.geometry}
                    material={Material}
                    position={[9.398, 0, 0]}></mesh>
                  <mesh
                    name='R'
                    castShadow
                    receiveShadow
                    geometry={nodes.R.geometry}
                    material={Material}
                    position={[14.065, 0, 0]}></mesh>
                  <mesh
                    name='C'
                    castShadow
                    receiveShadow
                    geometry={nodes.C.geometry}
                    material={Material}
                    position={[18.585, 0, 0]}></mesh>
                  <mesh
                    name='E_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.E_1.geometry}
                    material={Material}
                    position={[22.984, 0, 0]}></mesh>
                </group>
                <group name='LAB' position={[48.473, 0, 0]}>
                  <mesh name='L' castShadow receiveShadow geometry={nodes.L.geometry} material={Material}></mesh>
                  <mesh
                    name='A'
                    castShadow
                    receiveShadow
                    geometry={nodes.A.geometry}
                    material={Material}
                    position={[3.732, 0, 0]}></mesh>
                  <mesh
                    name='B'
                    castShadow
                    receiveShadow
                    geometry={nodes.B.geometry}
                    material={Material}
                    position={[9.065, 0, 0]}></mesh>
                </group>
              </group>
            </group>
          </group>
          <mesh
            name='plastic_band'
            castShadow
            receiveShadow
            geometry={nodes.plastic_band.geometry}
            material={Material}
            position={[0, 68.594, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Ear_piece_plastic'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_plastic.geometry}
            material={Material}
            rotation={[-Math.PI / 2, Math.PI / 2, 0]}
            scale={100}></mesh>
          <mesh
            name='Ear_piece_rubber'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_rubber.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Plastic_holder'
            castShadow
            receiveShadow
            geometry={nodes.Plastic_holder.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Cube001'
            castShadow
            receiveShadow
            geometry={nodes.Cube001.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={37.292}></mesh>
          <mesh
            name='Cube002'
            castShadow
            receiveShadow
            geometry={nodes.Cube002.geometry}
            material={Material}
            position={[0, 68.594, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Sphere'
            castShadow
            receiveShadow
            geometry={nodes.Sphere.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9.424, 9.424, 5.969]}></mesh>
          <mesh
            name='Cylinder002'
            castShadow
            receiveShadow
            geometry={nodes.Cylinder002.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
        </group>
        <group name='headphone2' position={[37.831, -65.4, -241.386]} rotation={[-1.534, -1.165, -1.891]}>
          <group name='MoText_1' position={[1.711, 126.78, 17.968]}>
            <group name='Text_1'>
              <group name='1_1' position={[-58.589, 0, 0]}>
                <group name='OPEN_1'>
                  <mesh name='O_2' castShadow receiveShadow geometry={nodes.O_2.geometry} material={Material}></mesh>
                  <mesh
                    name='P_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.P_1.geometry}
                    material={Material}
                    position={[10.134, 0, 0]}></mesh>
                  <mesh
                    name='E_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.E_2.geometry}
                    material={Material}
                    position={[18.169, 0, 0]}></mesh>
                  <mesh
                    name='N_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.N_1.geometry}
                    material={Material}
                    position={[25.725, 0, 0]}></mesh>
                </group>
                <group name='SOURCE_1' position={[37.937, 0, 0]}>
                  <mesh name='S_1' castShadow receiveShadow geometry={nodes.S_1.geometry} material={Material}></mesh>
                  <mesh
                    name='O_3'
                    castShadow
                    receiveShadow
                    geometry={nodes.O_3.geometry}
                    material={Material}
                    position={[7.745, 0, 0]}></mesh>
                  <mesh
                    name='U_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.U_1.geometry}
                    material={Material}
                    position={[17.88, 0, 0]}></mesh>
                  <mesh
                    name='R_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.R_1.geometry}
                    material={Material}
                    position={[26.758, 0, 0]}></mesh>
                  <mesh
                    name='C_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.C_1.geometry}
                    material={Material}
                    position={[35.359, 0, 0]}></mesh>
                  <mesh
                    name='E_3'
                    castShadow
                    receiveShadow
                    geometry={nodes.E_3.geometry}
                    material={Material}
                    position={[43.727, 0, 0]}></mesh>
                </group>
                <group name='LAB_1' position={[92.221, 0, 0]}>
                  <mesh name='L_1' castShadow receiveShadow geometry={nodes.L_1.geometry} material={Material}></mesh>
                  <mesh
                    name='A_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.A_1.geometry}
                    material={Material}
                    position={[7.101, 0, 0]}></mesh>
                  <mesh
                    name='B_1'
                    castShadow
                    receiveShadow
                    geometry={nodes.B_1.geometry}
                    material={Material}
                    position={[17.246, 0, 0]}></mesh>
                </group>
              </group>
            </group>
          </group>
          <mesh
            name='plastic_band_1'
            castShadow
            receiveShadow
            geometry={nodes.plastic_band_1.geometry}
            material={Material}
            position={[0, 130.502, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Ear_piece_plastic_1'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_plastic_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, Math.PI / 2, 0]}
            scale={100}></mesh>
          <mesh
            name='Ear_piece_rubber_1'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_rubber_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Plastic_holder_1'
            castShadow
            receiveShadow
            geometry={nodes.Plastic_holder_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Cube001_1'
            castShadow
            receiveShadow
            geometry={nodes.Cube001_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={37.292}></mesh>
          <mesh
            name='Cube002_1'
            castShadow
            receiveShadow
            geometry={nodes.Cube002_1.geometry}
            material={Material}
            position={[0, 130.502, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Sphere_1'
            castShadow
            receiveShadow
            geometry={nodes.Sphere_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9.424, 9.424, 5.969]}></mesh>
          <mesh
            name='Cylinder002_1'
            castShadow
            receiveShadow
            geometry={nodes.Cylinder002_1.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
        </group>
        <group name='headphone1' position={[-36.81, 39.488, -279.6]} rotation={[0, -0.715, 0]}>
          <group name='MoText_2' position={[1.397, 103.545, 14.675]}>
            <group name='Text_2'>
              <group name='1_2' position={[-47.851, 0, 0]}>
                <group name='OPEN_2'>
                  <mesh name='O_4' castShadow receiveShadow geometry={nodes.O_4.geometry} material={Material}></mesh>
                  <mesh
                    name='P_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.P_2.geometry}
                    material={Material}
                    position={[8.277, 0, 0]}></mesh>
                  <mesh
                    name='E_4'
                    castShadow
                    receiveShadow
                    geometry={nodes.E_4.geometry}
                    material={Material}
                    position={[14.839, 0, 0]}></mesh>
                  <mesh
                    name='N_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.N_2.geometry}
                    material={Material}
                    position={[21.01, 0, 0]}></mesh>
                </group>
                <group name='SOURCE_2' position={[30.984, 0, 0]}>
                  <mesh name='S_2' castShadow receiveShadow geometry={nodes.S_2.geometry} material={Material}></mesh>
                  <mesh
                    name='O_5'
                    castShadow
                    receiveShadow
                    geometry={nodes.O_5.geometry}
                    material={Material}
                    position={[6.326, 0, 0]}></mesh>
                  <mesh
                    name='U_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.U_2.geometry}
                    material={Material}
                    position={[14.603, 0, 0]}></mesh>
                  <mesh
                    name='R_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.R_2.geometry}
                    material={Material}
                    position={[21.854, 0, 0]}></mesh>
                  <mesh
                    name='C_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.C_2.geometry}
                    material={Material}
                    position={[28.879, 0, 0]}></mesh>
                  <mesh
                    name='E_5'
                    castShadow
                    receiveShadow
                    geometry={nodes.E_5.geometry}
                    material={Material}
                    position={[35.713, 0, 0]}></mesh>
                </group>
                <group name='LAB_2' position={[75.319, 0, 0]}>
                  <mesh name='L_2' castShadow receiveShadow geometry={nodes.L_2.geometry} material={Material}></mesh>
                  <mesh
                    name='A_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.A_2.geometry}
                    material={Material}
                    position={[5.799, 0, 0]}></mesh>
                  <mesh
                    name='B_2'
                    castShadow
                    receiveShadow
                    geometry={nodes.B_2.geometry}
                    material={Material}
                    position={[14.085, 0, 0]}></mesh>
                </group>
              </group>
            </group>
          </group>
          <mesh
            name='plastic_band_2'
            castShadow
            receiveShadow
            geometry={nodes.plastic_band_2.geometry}
            material={Material}
            position={[0, 106.584, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Ear_piece_plastic_2'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_plastic_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, Math.PI / 2, 0]}
            scale={100}></mesh>
          <mesh
            name='Ear_piece_rubber_2'
            castShadow
            receiveShadow
            geometry={nodes.Ear_piece_rubber_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Plastic_holder_2'
            castShadow
            receiveShadow
            geometry={nodes.Plastic_holder_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
          <mesh
            name='Cube001_2'
            castShadow
            receiveShadow
            geometry={nodes.Cube001_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={37.292}></mesh>
          <mesh
            name='Cube002_2'
            castShadow
            receiveShadow
            geometry={nodes.Cube002_2.geometry}
            material={Material}
            position={[0, 106.584, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={35.228}></mesh>
          <mesh
            name='Sphere_2'
            castShadow
            receiveShadow
            geometry={nodes.Sphere_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9.424, 9.424, 5.969]}></mesh>
          <mesh
            name='Cylinder002_2'
            castShadow
            receiveShadow
            geometry={nodes.Cylinder002_2.geometry}
            material={Material}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}></mesh>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('https://hi-oslab.s3.ap-northeast-2.amazonaws.com/poster.gltf')
