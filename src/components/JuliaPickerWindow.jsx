import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useVaseStore } from '../stores/vaseStore'
import JuliaViewer from './JuliaViewer'
import SliderRow from './SliderRow'

export default function JuliaPickerWindow() {
  const { vaseData, settings, focusedJuliaIndex, setFocusedJuliaIndex, setVaseData } = useVaseStore()
  const [edgeView, setEdgeView] = useState('bottom')
  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState(540)

  const mod = vaseData?.modifiers?.[focusedJuliaIndex]

  const updateFields = useCallback(
    (updates) => {
      if (!vaseData || focusedJuliaIndex == null) return
      const newData = JSON.parse(JSON.stringify(vaseData))
      Object.entries(updates).forEach(([k, v]) => {
        newData.modifiers[focusedJuliaIndex][k] = v
      })
      setVaseData(newData)
    },
    [vaseData, focusedJuliaIndex, setVaseData]
  )

  const updateField = useCallback((k, v) => updateFields({ [k]: v }), [updateFields])

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const rect = containerRef.current.getBoundingClientRect()
      const s = Math.max(240, Math.min(760, Math.floor(Math.min(rect.width - 48, rect.height - 160))))
      setCanvasSize(s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setFocusedJuliaIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFocusedJuliaIndex])

  const close = useCallback(() => setFocusedJuliaIndex(null), [setFocusedJuliaIndex])

  const resetView = useCallback(() => {
    updateFields({ offset_x: 0, offset_y: 0, view_scale: 60 })
  }, [updateFields])

  if (!mod || !settings) return null

  const isEdge = mod.type === 'julia_edge_find'
  const title = isEdge ? 'julia edge' : 'julia radial'

  const twist = vaseData.modifiers
    .filter((m) => m.type === 'twist')
    .reduce((s, m) => s + (m.value ?? 0), 0)

  const showTop = isEdge && edgeView === 'top'
  const renderCx = showTop ? (mod.c_x_top ?? mod.c_x) : mod.c_x
  const renderCy = showTop ? (mod.c_y_top ?? mod.c_y) : mod.c_y
  const renderIter = showTop ? (mod.iterations_top ?? mod.iterations) : mod.iterations

  const bottomMarker = { c_x: mod.c_x, c_y: mod.c_y }
  const topMarker = isEdge ? { c_x: mod.c_x_top ?? mod.c_x, c_y: mod.c_y_top ?? mod.c_y } : null

  const clamp = (v, s) => Math.max(s.min, Math.min(s.max, v))

  const handleBottomMarker = (cx, cy) => {
    updateFields({
      c_x: clamp(cx, settings.julia_c_x),
      c_y: clamp(cy, settings.julia_c_y),
    })
  }

  const handleTopMarker = (cx, cy) => {
    if (!isEdge) return
    updateFields({
      c_x_top: clamp(cx, settings.julia_c_x),
      c_y_top: clamp(cy, settings.julia_c_y),
    })
  }

  const rRange = settings.julia_r_sample

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">{title}</span>
          <span className="text-xs text-gray-500">modifier {focusedJuliaIndex + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="px-2 py-0.5 bg-gray-700 rounded text-xs hover:bg-gray-600"
          >
            reset view
          </button>
          <button
            onClick={close}
            className="px-2 py-0.5 text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Close picker"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 overflow-hidden">
        <div className="rounded overflow-hidden ring-1 ring-gray-700">
          <JuliaViewer
            c_x={renderCx}
            c_y={renderCy}
            iterations={renderIter}
            r_bottom={mod.r_bottom}
            r_top={mod.r_top}
            phase={mod.phase}
            twist={twist}
            flip={mod.flip}
            folds={mod.folds ?? 2}
            offset_x={mod.offset_x || 0}
            offset_y={mod.offset_y || 0}
            view_scale={mod.view_scale || 60}
            size={canvasSize}
            interactive
            bottomMarker={bottomMarker}
            topMarker={topMarker}
            rBottomRange={rRange}
            rTopRange={rRange}
            onOffsetChange={(ox, oy) => updateFields({ offset_x: ox, offset_y: oy })}
            onScaleChange={(s) => updateField('view_scale', s)}
            onBottomMarkerChange={handleBottomMarker}
            onTopMarkerChange={handleTopMarker}
            onRBottomChange={(r) => updateField('r_bottom', r)}
            onRTopChange={(r) => updateField('r_top', r)}
            onPhaseChange={(p) => updateField('phase', p)}
          />
        </div>

        <div className="w-full max-w-[560px] space-y-2 text-xs">
          {isEdge && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16">render</span>
              <button
                onClick={() => setEdgeView('bottom')}
                className={`px-2 py-0.5 rounded ${edgeView === 'bottom' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >bottom</button>
              <button
                onClick={() => setEdgeView('top')}
                className={`px-2 py-0.5 rounded ${edgeView === 'top' ? 'bg-orange-500' : 'bg-gray-700 hover:bg-gray-600'}`}
              >top</button>
              <span className="text-gray-500 ml-2">(both c markers stay draggable)</span>
            </div>
          )}
          <SliderRow
            label="iter"
            name="picker_iter"
            value={renderIter}
            min={settings.julia_iterations.min}
            max={settings.julia_iterations.max}
            step={settings.julia_iterations.step}
            onChange={(v) => updateField(showTop ? 'iterations_top' : 'iterations', v)}
          />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16">flip</span>
            <button
              onClick={() => updateField('flip', mod.flip === 1 ? -1 : 1)}
              className={`px-2 py-0.5 rounded ${mod.flip === -1 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {mod.flip === 1 ? 'normal' : 'flipped'}
            </button>
          </div>
          <div className="text-[11px] text-gray-500 pt-1">
            drag crosshair → c.x / c.y · drag white dot → phase + r&nbsp;bottom · drag orange dot → r&nbsp;top · drag empty → pan · wheel → zoom
          </div>
        </div>
      </div>
    </div>
  )
}
