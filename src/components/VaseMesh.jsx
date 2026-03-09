import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVaseStore } from '../stores/vaseStore'
import VaseGenerator from '../lib/VaseGenerator'

const SCALE = 0.02
const DEFAULT_COLOR = 0x560bad

export default function VaseMesh({ meshRef, appearance, spinSpeed = 0.5 }) {
  const internalRef = useRef()
  const ref = meshRef || internalRef
  const vaseData = useVaseStore((s) => s.vaseData)

  const geometry = useMemo(() => {
    if (!vaseData) return null
    const vase = VaseGenerator.generateVase(vaseData)
    const geom = VaseGenerator.generateGeometry(vase)
    geom.computeBoundingBox()
    return geom
  }, [vaseData])

  const yOffset = useMemo(() => {
    if (!geometry || !geometry.boundingBox) return 0
    return SCALE * -geometry.boundingBox.min.y
  }, [geometry])

  const color = useMemo(() => {
    if (appearance && appearance !== '0' && appearance !== 0 && appearance !== '') {
      return appearance
    }
    return DEFAULT_COLOR
  }, [appearance])

  // Rotation animation
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * spinSpeed
    }
  })

  if (!geometry) return null

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      scale={[SCALE, SCALE, SCALE]}
      position={[0, yOffset, 0]}
      castShadow
      receiveShadow
    >
      <meshPhongMaterial
        color={color}
        emissive={0x000000}
        specular={0x111111}
        shininess={0.5}
        flatShading
      />
    </mesh>
  )
}
