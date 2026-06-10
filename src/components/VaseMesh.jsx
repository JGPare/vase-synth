import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVaseStore } from '../stores/vaseStore'
import { requestGeometry, subscribe } from '../lib/vaseWorkerClient'

const SCALE = 0.02
const DEFAULT_COLOR = 0x560bad

export default function VaseMesh({ meshRef, appearance, spinSpeed = 0.5 }) {
  const internalRef = useRef()
  const ref = meshRef || internalRef
  const vaseData = useVaseStore((s) => s.vaseData)
  const interacting = useVaseStore((s) => s.interacting)

  const [geometry, setGeometry] = useState(null)
  const lastRequested = useRef({ sig: null, quality: null })

  useEffect(() => {
    if (!vaseData) return
    // Compare by content, ignoring view_scale (picker UI state only — never
    // affects geometry), so wheel-zoom and no-op re-commits don't rebuild.
    const sig = JSON.stringify(vaseData, (k, v) => (k === 'view_scale' ? undefined : v))
    const quality = interacting ? 'preview' : 'full'
    const last = lastRequested.current
    // Same params: only re-request to upgrade preview → full on release;
    // never downgrade the displayed mesh just because a drag started.
    if (sig === last.sig && (quality === last.quality || quality === 'preview')) return
    lastRequested.current = { sig, quality }
    requestGeometry(vaseData, quality)
  }, [vaseData, interacting])

  useEffect(() => {
    // Results arrive in request order (single serial worker), so no
    // stale-result guard is needed.
    return subscribe(({ error, positions, normals, index }) => {
      if (error) {
        console.warn('[vase] geometry generation failed:', error)
        return
      }
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
      if (index) geom.setIndex(new THREE.BufferAttribute(index, 1))
      geom.computeBoundingBox()
      setGeometry(geom)
    })
  }, [])

  useEffect(() => () => { geometry?.dispose() }, [geometry])

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
