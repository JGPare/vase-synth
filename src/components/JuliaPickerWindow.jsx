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

  const isEdge = mod?.type === 'julia_edge_find'

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const rect = containerRef.current.getBoundingClientRect()
      const availW = rect.width - 32
      const availH = rect.height * 0.55
      const s = Math.max(160, Math.min(760, Math.floor(Math.min(availW, availH))))
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

  const defaultViewScale = 120

  const resetView = useCallback(() => {
    updateFields({ offset_x: 0, offset_y: 0, view_scale: defaultViewScale })
  }, [updateFields, defaultViewScale])

  if (!mod || !settings) return null

  const title = isEdge ? 'julia edge' : 'julia radial'

  const twist = vaseData.modifiers
    .filter((m) => m.type === 'twist')
    .reduce((s, m) => s + (m.value ?? 0), 0)

  const showTop = isEdge && edgeView === 'top'
  const renderCx = showTop ? (mod.c_x_top ?? mod.c_x) : mod.c_x
  const renderCy = showTop ? (mod.c_y_top ?? mod.c_y) : mod.c_y
  const renderIter = showTop ? (mod.iterations_top ?? mod.iterations) : mod.iterations

  const bottomMarker = !isEdge || edgeView === 'bottom' ? { c_x: mod.c_x, c_y: mod.c_y } : null
  const topMarker = isEdge && edgeView === 'top' ? { c_x: mod.c_x_top ?? mod.c_x, c_y: mod.c_y_top ?? mod.c_y } : null

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

      <div className="shrink-0 flex items-center justify-center p-4">
        <div className="rounded overflow-hidden ring-1 ring-gray-700">
          <JuliaViewer
            c_x={renderCx}
            c_y={renderCy}
            iterations={renderIter}
            r_bottom={mod.r_bottom}
            r_top={mod.r_top}
            phase={mod.phase}
            twist={twist}
            flip={isEdge ? 1 : mod.flip}
            power={mod.power ?? 2}
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
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 text-xs space-y-2">
        {isEdge ? (<>
          <div className="border border-gray-700 rounded p-2 space-y-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-gray-400 flex-1">c / iter</span>
              <button
                onClick={() => setEdgeView('bottom')}
                className={`px-2 py-0.5 rounded ${edgeView === 'bottom' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >bottom</button>
              <button
                onClick={() => setEdgeView('top')}
                className={`px-2 py-0.5 rounded ${edgeView === 'top' ? 'bg-orange-500' : 'bg-gray-700 hover:bg-gray-600'}`}
              >top</button>
            </div>
            {showTop ? (<>
              <SliderRow label="c.x" name="picker_c_x_top" value={mod.c_x_top ?? mod.c_x}
                min={settings.julia_c_x.min} max={settings.julia_c_x.max} step={settings.julia_c_x.step}
                onChange={(v) => updateField('c_x_top', v)} />
              <SliderRow label="c.y" name="picker_c_y_top" value={mod.c_y_top ?? mod.c_y}
                min={settings.julia_c_y.min} max={settings.julia_c_y.max} step={settings.julia_c_y.step}
                onChange={(v) => updateField('c_y_top', v)} />
              <SliderRow label="iter" name="picker_iter_top" value={mod.iterations_top ?? mod.iterations}
                min={settings.julia_iterations.min} max={settings.julia_iterations.max} step={settings.julia_iterations.step}
                onChange={(v) => updateField('iterations_top', v)} />
            </>) : (<>
              <SliderRow label="c.x" name="picker_c_x" value={mod.c_x}
                min={settings.julia_c_x.min} max={settings.julia_c_x.max} step={settings.julia_c_x.step}
                onChange={(v) => updateField('c_x', v)} />
              <SliderRow label="c.y" name="picker_c_y" value={mod.c_y}
                min={settings.julia_c_y.min} max={settings.julia_c_y.max} step={settings.julia_c_y.step}
                onChange={(v) => updateField('c_y', v)} />
              <SliderRow label="iter" name="picker_iter" value={mod.iterations}
                min={settings.julia_iterations.min} max={settings.julia_iterations.max} step={settings.julia_iterations.step}
                onChange={(v) => updateField('iterations', v)} />
            </>)}
            <SliderRow label="r bottom" name="picker_r_bottom" value={mod.r_bottom}
              min={rRange.min} max={rRange.max} step={rRange.step}
              onChange={(v) => updateField('r_bottom', v)} />
            <SliderRow label="r top" name="picker_r_top" value={mod.r_top}
              min={rRange.min} max={rRange.max} step={rRange.step}
              onChange={(v) => updateField('r_top', v)} />
            <SliderRow label="threshold" name="picker_threshold" value={mod.threshold}
              min={settings.julia_edge_threshold?.min ?? 0} max={settings.julia_edge_threshold?.max ?? 100} step={settings.julia_edge_threshold?.step ?? 1}
              onChange={(v) => updateField('threshold', v)} />
            <SliderRow label="power" name="picker_power" value={mod.power ?? 2}
              min={settings.julia_edge_power?.min ?? 2} max={settings.julia_edge_power?.max ?? 8} step={settings.julia_edge_power?.step ?? 1}
              onChange={(v) => updateField('power', v)} />
            <SliderRow label="repetitions" name="picker_repetitions" value={mod.repetitions ?? 1}
              min={settings.julia_edge_repetitions?.min ?? 1} max={settings.julia_edge_repetitions?.max ?? 5} step={settings.julia_edge_repetitions?.step ?? 0.5}
              onChange={(v) => updateField('repetitions', v)} />
            <SliderRow label="phase" name="picker_phase" value={mod.phase}
              min={settings.julia_phase.min} max={settings.julia_phase.max} step={settings.julia_phase.step}
              onChange={(v) => updateField('phase', v)} />
          </div>
          <div className="text-[11px] text-gray-500 pt-1">
            drag crosshair → c.x / c.y · drag white dot → phase + r&nbsp;bottom · drag orange dot → r&nbsp;top · drag empty → pan · wheel → zoom
          </div>
        </>) : (<>
          <div className="border border-gray-700 rounded p-2 space-y-1">
            <SliderRow label="amount" name="picker_mag" value={mod.mag}
              min={settings.julia_mag.min} max={settings.julia_mag.max} step={settings.julia_mag.step}
              onChange={(v) => updateField('mag', v)} />
            <SliderRow label="c.x" name="picker_c_x" value={mod.c_x}
              min={settings.julia_c_x.min} max={settings.julia_c_x.max} step={settings.julia_c_x.step}
              onChange={(v) => updateField('c_x', v)} />
            <SliderRow label="c.y" name="picker_c_y" value={mod.c_y}
              min={settings.julia_c_y.min} max={settings.julia_c_y.max} step={settings.julia_c_y.step}
              onChange={(v) => updateField('c_y', v)} />
            <SliderRow label="iter" name="picker_iter" value={mod.iterations}
              min={settings.julia_iterations.min} max={settings.julia_iterations.max} step={settings.julia_iterations.step}
              onChange={(v) => updateField('iterations', v)} />
            <SliderRow label="r bottom" name="picker_r_bottom" value={mod.r_bottom}
              min={rRange.min} max={rRange.max} step={rRange.step}
              onChange={(v) => updateField('r_bottom', v)} />
            <SliderRow label="r top" name="picker_r_top" value={mod.r_top}
              min={rRange.min} max={rRange.max} step={rRange.step}
              onChange={(v) => updateField('r_top', v)} />
            <SliderRow label="freq" name="picker_freq" value={mod.freq}
              min={settings.julia_freq.min} max={settings.julia_freq.max} step={settings.julia_freq.step}
              onChange={(v) => updateField('freq', v)} />
            <div className="flex items-center gap-2 py-0.5">
              <span className="text-gray-400 w-16">flip</span>
              <button
                onClick={() => updateField('flip', mod.flip === 1 ? -1 : 1)}
                className={`px-2 py-0.5 rounded ${mod.flip === -1 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {mod.flip === 1 ? 'normal' : 'flipped'}
              </button>
            </div>
            <SliderRow label="phase" name="picker_phase" value={mod.phase}
              min={settings.julia_phase.min} max={settings.julia_phase.max} step={settings.julia_phase.step}
              onChange={(v) => updateField('phase', v)} />
          </div>
          <div className="text-[11px] text-gray-500 pt-1">
            drag crosshair → c.x / c.y · drag white dot → phase + r&nbsp;bottom · drag orange dot → r&nbsp;top · drag empty → pan · wheel → zoom
          </div>
        </>)}
      </div>
    </div>
  )
}
