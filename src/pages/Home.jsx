import { useRef, useState } from 'react'
import ControlPanel from '../components/ControlPanel'
import VaseCanvas from '../components/VaseCanvas'
import { useVaseStore } from '../stores/vaseStore'

export default function Home() {
  const meshRef = useRef()
  const appearance = useVaseStore((s) => s.appearance)
  const [spinSpeed, setSpinSpeed] = useState(0.5)

  return (
    <div className="flex h-full">
      {/* Left panel — control panel */}
      <div className="w-80 min-w-[320px] bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
        <ControlPanel meshRef={meshRef} spinSpeed={spinSpeed} setSpinSpeed={setSpinSpeed} />
      </div>

      {/* Right panel — 3D canvas */}
      <div className="flex-1">
        <VaseCanvas meshRef={meshRef} appearance={appearance} spinSpeed={spinSpeed} />
      </div>
    </div>
  )
}
