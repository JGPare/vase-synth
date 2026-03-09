import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VaseMesh from './VaseMesh'

export default function VaseCanvas({ meshRef, appearance }) {
  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 35, near: 1, far: 15 }}
      shadows
      gl={{ antialias: true }}
    >
      <color attach="background" args={[0x596869]} />
      <fog attach="fog" args={[0x596869, 8, 15]} />

      {/* Lights — matching original */}
      <hemisphereLight args={[0x8d7c7c, 0x494966, 3]} />
      <ambientLight intensity={0.5} />
      <ShadowedLight position={[1, 1, 1]} color={0xffffff} intensity={2} />
      <ShadowedLight position={[0, 1, 1]} color={0x90e0ef} intensity={2} />
      <ShadowedLight position={[1, 1, 0]} color={0xf72585} intensity={2} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshPhongMaterial color={0x363946} depthWrite={false} />
      </mesh>

      {/* Grid */}
      <gridHelper args={[200, 400, 0x000000, 0x000000]} material-opacity={0.2} material-transparent />

      {/* Vase */}
      <VaseMesh meshRef={meshRef} appearance={appearance} />

      {/* Controls */}
      <OrbitControls target={[0, 0.5, 0]} minDistance={2} maxDistance={8} />
    </Canvas>
  )
}

function ShadowedLight({ position, color, intensity }) {
  return (
    <directionalLight
      position={position}
      color={color}
      intensity={intensity}
      castShadow
      shadow-camera-left={-2}
      shadow-camera-right={2}
      shadow-camera-top={2}
      shadow-camera-bottom={-2}
      shadow-camera-near={1}
      shadow-camera-far={4}
      shadow-bias={-0.002}
    />
  )
}
