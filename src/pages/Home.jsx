import { useRef } from 'react'
import ControlPanel from '../components/ControlPanel'
import VaseCanvas from '../components/VaseCanvas'
import { useVaseStore } from '../stores/vaseStore'

export default function Home() {
  const meshRef = useRef()
  const appearance = useVaseStore((s) => s.appearance)

  return (
    <div className="flex h-full">
      {/* Left panel — control panel */}
      <div className="w-80 min-w-[320px] bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
        <ControlPanel meshRef={meshRef} />
      </div>

      {/* Right panel — 3D canvas */}
      <div className="flex-1">
        <VaseCanvas meshRef={meshRef} appearance={appearance} />
      </div>
    </div>
  )
}
