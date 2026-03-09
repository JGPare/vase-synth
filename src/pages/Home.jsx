import { useRef, useState, useEffect } from 'react'
import ControlPanel from '../components/ControlPanel'
import IndexList from '../components/IndexList'
import VaseCanvas from '../components/VaseCanvas'
import { useVaseStore } from '../stores/vaseStore'
import { useAuthStore } from '../stores/authStore'

export default function Home() {
  const meshRef = useRef()
  const appearance = useVaseStore((s) => s.appearance)
  const [spinSpeed, setSpinSpeed] = useState(0.5)
  const [activeTab, setActiveTab] = useState('edit')

  const { access, setAccess, getIndex, indexList, loadVase } = useVaseStore()
  const { isAuthenticated } = useAuthStore()

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'load') getIndex()
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-80 min-w-[320px] bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
        {/* Tab strip */}
        <div className="flex border-b border-gray-700 shrink-0">
          {['edit', 'load'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'edit' ? (
            <ControlPanel meshRef={meshRef} spinSpeed={spinSpeed} setSpinSpeed={setSpinSpeed} />
          ) : (
            <div className="h-full overflow-y-auto p-3 space-y-3">
              <select
                value={access}
                onChange={(e) => { setAccess(e.target.value); getIndex() }}
                className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-full"
              >
                <option value="public">Public</option>
                {isAuthenticated && <option value="private">Private</option>}
              </select>
              <IndexList
                indexList={indexList}
                onClose={() => setActiveTab('edit')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right panel — 3D canvas */}
      <div className="flex-1">
        <VaseCanvas meshRef={meshRef} appearance={appearance} spinSpeed={spinSpeed} />
      </div>
    </div>
  )
}
