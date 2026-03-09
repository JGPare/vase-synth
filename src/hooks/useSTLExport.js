import { useCallback } from 'react'
import * as THREE from 'three'
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import { useVaseStore } from '../stores/vaseStore'

const exporter = new STLExporter()
const SCALE = 0.02

function save(blob, filename) {
  const link = document.createElement('a')
  link.style.display = 'none'
  document.body.appendChild(link)
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  document.body.removeChild(link)
}

function saveString(text, filename) {
  save(new Blob([text], { type: 'text/plain' }), filename)
}

function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: 'application/octet-stream' }), filename)
}

export function useSTLExport(meshRef) {
  const incrementDownloads = useVaseStore((s) => s.incrementDownloads)
  const vaseName = useVaseStore((s) => s.vaseName)

  const exportASCII = useCallback(() => {
    if (!meshRef?.current) return
    const vaseMesh = meshRef.current
    const tempMesh = new THREE.Mesh(vaseMesh.geometry, vaseMesh.material)
    tempMesh.scale.set(1 / SCALE, 1 / SCALE, 1 / SCALE)

    tempMesh.geometry.rotateX(Math.PI / 2)
    const result = exporter.parse(tempMesh)
    tempMesh.geometry.rotateX(-Math.PI / 2)

    saveString(result, vaseName + '.stl')
    incrementDownloads()
  }, [meshRef, vaseName, incrementDownloads])

  const exportBinary = useCallback(() => {
    if (!meshRef?.current) return
    const vaseMesh = meshRef.current
    const tempMesh = new THREE.Mesh(vaseMesh.geometry, vaseMesh.material)
    tempMesh.scale.set(1 / SCALE, 1 / SCALE, 1 / SCALE)

    tempMesh.geometry.rotateX(Math.PI / 2)
    const result = exporter.parse(tempMesh, { binary: true })
    tempMesh.geometry.rotateX(-Math.PI / 2)

    saveArrayBuffer(result, vaseName + '.stl')
    incrementDownloads()
  }, [meshRef, vaseName, incrementDownloads])

  return { exportASCII, exportBinary }
}
