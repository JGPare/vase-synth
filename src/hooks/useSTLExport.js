import { useCallback } from 'react'
import * as THREE from 'three'
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import { useVaseStore } from '../stores/vaseStore'
import VaseGenerator from '../lib/VaseGenerator'

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

export function useSTLExport() {
  const incrementDownloads = useVaseStore((s) => s.incrementDownloads)
  const vaseName = useVaseStore((s) => s.vaseName)
  const vaseData = useVaseStore((s) => s.vaseData)

  const doExport = useCallback((binary) => {
    if (!vaseData) return
    // Generate fresh at full resolution: the displayed mesh comes from the
    // async worker and may be a reduced drag preview or behind the latest edits.
    const vase = VaseGenerator.generateVase(vaseData)
    const geometry = VaseGenerator.generateGeometry(vase)
    const tempMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial())
    tempMesh.scale.set(1 / SCALE, 1 / SCALE, 1 / SCALE)

    geometry.rotateX(Math.PI / 2)
    const result = exporter.parse(tempMesh, binary ? { binary: true } : undefined)
    geometry.dispose()

    if (binary) {
      saveArrayBuffer(result, vaseName + '.stl')
    } else {
      saveString(result, vaseName + '.stl')
    }
    incrementDownloads()
  }, [vaseData, vaseName, incrementDownloads])

  const exportASCII = useCallback(() => doExport(false), [doExport])
  const exportBinary = useCallback(() => doExport(true), [doExport])

  return { exportASCII, exportBinary }
}
