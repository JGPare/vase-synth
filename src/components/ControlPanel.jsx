import { useState, useEffect, useCallback } from 'react'
import { useVaseStore } from '../stores/vaseStore'
import SliderRow from './SliderRow'
import ExportPanel from './ExportPanel'
import JuliaViewer from './JuliaViewer'

export default function ControlPanel({ meshRef, spinSpeed, setSpinSpeed }) {
  const {
    settings,
    vaseData,
    vaseName,
    access,
    appearance,
    focusedJuliaIndex,
    loadSettings,
    setVaseData,
    setVaseName,
    setAccess,
    setAppearance,
    setFocusedJuliaIndex,
    saveVase,
    loadRandom,
    loadDefault,
    deleteVase,
  } = useVaseStore()

  const [vaseColor, setVaseColor] = useState('#560bad')

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Sync color from loaded appearance
  useEffect(() => {
    if (appearance && appearance !== '0' && appearance !== '') {
      const hex = '#' + Number(appearance).toString(16).padStart(6, '0')
      setVaseColor(hex)
    }
  }, [appearance])

  const updateField = useCallback(
    (group, key, value, index) => {
      if (!vaseData) return
      const newData = JSON.parse(JSON.stringify(vaseData))
      if (index !== undefined) {
        newData[group][index][key] = value
      } else {
        newData[group][key] = value
      }
      setVaseData(newData)
    },
    [vaseData, setVaseData]
  )

  const updateFields = useCallback(
    (group, updates, index) => {
      if (!vaseData) return
      const newData = JSON.parse(JSON.stringify(vaseData))
      Object.entries(updates).forEach(([key, value]) => {
        if (index !== undefined) newData[group][index][key] = value
        else newData[group][key] = value
      })
      setVaseData(newData)
    },
    [vaseData, setVaseData]
  )

  const handleSave = () => {
    if (!vaseData) return
    const data = {
      name: vaseName,
      access,
      appearance: parseInt(vaseColor.replace('#', ''), 16),
      generic0: vaseData.generic0,
      generic1: vaseData.generic1,
      modifiers: vaseData.modifiers,
    }
    saveVase(data)
  }

  const isJuliaType = (t) => t === 'julia_radial' || t === 'julia_edge_find'

  const addModifier = () => {
    if (!vaseData || vaseData.modifiers.length >= 6) return
    const newData = JSON.parse(JSON.stringify(vaseData))
    newData.modifiers.push({ type: 'sin_radial', mag: 0, freq: 10, phase: 0 })
    setVaseData(newData)
  }

  const removeModifier = (i) => {
    if (!vaseData) return
    const newData = JSON.parse(JSON.stringify(vaseData))
    newData.modifiers.splice(i, 1)
    setVaseData(newData)
  }

  const changeModifierType = (i, newType) => {
    if (!vaseData) return
    const newData = JSON.parse(JSON.stringify(vaseData))
    const isRadial = newType === 'sin_radial' || newType === 'tri_radial'
    if (isRadial) {
      newData.modifiers[i] = { type: newType, mag: 0, freq: 10, phase: 0 }
    } else if (newType === 'julia_radial') {
      newData.modifiers[i] = { type: 'julia_radial', mag: 30, c_x: -7, c_y: 27, r_bottom: 80, r_top: 120, iterations: 20, flip: 1, freq: 1, phase: 0, offset_x: 0, offset_y: 0, view_scale: 60 }
    } else if (newType === 'julia_edge_find') {
      newData.modifiers[i] = { type: 'julia_edge_find', c_x: -7, c_y: 27, c_x_top: -7, c_y_top: 27, r_bottom: 30, r_top: 150, iterations: 20, iterations_top: 20, threshold: 90, power: 2, repetitions: 1, phase: 0, offset_x: 0, offset_y: 0, view_scale: 120 }
    } else if (newType === 'twist') {
      newData.modifiers[i] = { type: 'twist', value: 0 }
    } else if (newType === 'sin_twist') {
      newData.modifiers[i] = { type: 'sin_twist', mag: 12, freq: 1 }
    } else {
      newData.modifiers[i] = { type: newType, mag: 0, freq: 10, phase: 0 }
    }
    setVaseData(newData)
    if (isJuliaType(newType)) setFocusedJuliaIndex(i)
  }

  const handleColorChange = (e) => {
    setVaseColor(e.target.value)
    setAppearance(parseInt(e.target.value.replace('#', ''), 16))
  }

  if (!settings || !vaseData) {
    return <div className="p-4 text-gray-400">Loading...</div>
  }

  return (
    <div className="control-panel h-full overflow-y-auto p-3 space-y-4">
      {/* Name + Access */}
      <div className="flex gap-2">
        <input
          type="text"
          value={vaseName}
          onChange={(e) => setVaseName(e.target.value)}
          className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm"
          placeholder="Vase name"
        />
        <select
          value={access}
          onChange={(e) => setAccess(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => { loadDefault(); setVaseName('Untitled') }} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">
          New
        </button>
        <button onClick={handleSave} className="px-3 py-1 bg-purple-700 rounded text-sm hover:bg-purple-600">
          Save
        </button>
        <button onClick={loadRandom} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">
          Random
        </button>
        <button onClick={() => deleteVase(vaseName)} className="px-3 py-1 bg-red-900 rounded text-sm hover:bg-red-800">
          Delete
        </button>
      </div>

      {/* Generic 0: height, width, thickness */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Dimensions</h3>
        <div className="space-y-1">
          <SliderRow
            label="height" name="height"
            value={vaseData.generic0.height}
            min={settings.height.min} max={settings.height.max} step={settings.height.step}
            onChange={(v) => updateField('generic0', 'height', v)}
          />
          <SliderRow
            label="width" name="width"
            value={vaseData.generic0.width}
            min={settings.width.min} max={settings.width.max} step={settings.width.step}
            onChange={(v) => updateField('generic0', 'width', v)}
          />
          <SliderRow
            label="thickness" name="thickness"
            value={vaseData.generic0.thickness}
            min={settings.thickness.min} max={settings.thickness.max} step={settings.thickness.step}
            onChange={(v) => updateField('generic0', 'thickness', v)}
          />
          <SliderRow
            label="slope" name="slope"
            value={vaseData.generic1.slope}
            min={settings.slope.min} max={settings.slope.max} step={settings.slope.step}
            onChange={(v) => updateField('generic1', 'slope', v)}
          />
        </div>
      </div>

      {/* Generic 1: steps, slope */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Resolution</h3>
        <div className="space-y-1">
          <SliderRow
            label="vertical" name="vertical_steps"
            value={vaseData.generic1.vertical_steps}
            min={settings.vertical_steps.min} max={settings.vertical_steps.max} step={settings.vertical_steps.step}
            onChange={(v) => updateField('generic1', 'vertical_steps', v)}
          />
          <SliderRow
            label="radial" name="radial_steps"
            value={vaseData.generic1.radial_steps}
            min={settings.radial_steps.min} max={settings.radial_steps.max} step={settings.radial_steps.step}
            onChange={(v) => updateField('generic1', 'radial_steps', v)}
          />
        </div>
      </div>

      {/* Modifiers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Modifiers</h3>
          <button
            onClick={addModifier}
            disabled={vaseData.modifiers.length >= 6}
            className="px-2 py-0.5 bg-gray-700 rounded text-xs hover:bg-gray-600 disabled:opacity-40"
          >
            + Add
          </button>
        </div>
        {vaseData.modifiers.map((mod, i) => {
          const isRadial = mod.type === 'sin_radial' || mod.type === 'tri_radial'
          const prefix = mod.type === 'sin_radial' ? 'radial'
            : mod.type === 'sin_vertical' ? 'vertical'
            : mod.type === 'tri_radial' ? 'tri_radial'
            : mod.type === 'tri_vertical' ? 'tri_vertical'
            : 'radial'
          const isFocusedJulia = (mod.type === 'julia_radial' || mod.type === 'julia_edge_find') && focusedJuliaIndex === i
          return (
            <div
              key={i}
              className={`mb-3 ${isFocusedJulia ? 'ring-2 ring-purple-500/60 rounded p-1 -m-1' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <select
                  value={mod.type}
                  onChange={(e) => changeModifierType(i, e.target.value)}
                  className="bg-gray-700 text-white rounded px-1 py-0.5 text-xs flex-1"
                >
                  <option value="sin_radial">sin radial</option>
                  <option value="sin_vertical">sin vertical</option>
                  <option value="tri_radial">tri radial</option>
                  <option value="tri_vertical">tri vertical</option>
                  <option value="julia_radial">julia radial</option>
                  <option value="julia_edge_find">julia edge</option>
                  <option value="twist">twist</option>
                  <option value="sin_twist">sin twist</option>
                </select>
                <button
                  onClick={() => removeModifier(i)}
                  className="text-gray-500 hover:text-red-400 text-xs px-1"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
                {mod.type === 'julia_edge_find' ? (
                  <button
                    onClick={() => setFocusedJuliaIndex(i)}
                    className={`w-full text-left px-2 py-1 rounded text-xs border ${focusedJuliaIndex === i ? 'border-purple-400 bg-purple-900/30 text-purple-200' : 'border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700'}`}
                  >
                    {focusedJuliaIndex === i ? 'editing in picker →' : 'click to open picker'}
                  </button>
                ) : mod.type === 'julia_radial' ? (
                  <>
                    <SliderRow label="amount" name={`m${i}_mag`} value={mod.mag}
                      min={settings.julia_mag.min} max={settings.julia_mag.max} step={settings.julia_mag.step}
                      onChange={(v) => updateField('modifiers', 'mag', v, i)} />
                    <SliderRow label="c.x" name={`m${i}_c_x`} value={mod.c_x}
                      min={settings.julia_c_x.min} max={settings.julia_c_x.max} step={settings.julia_c_x.step}
                      onChange={(v) => updateField('modifiers', 'c_x', v, i)} />
                    <SliderRow label="c.y" name={`m${i}_c_y`} value={mod.c_y}
                      min={settings.julia_c_y.min} max={settings.julia_c_y.max} step={settings.julia_c_y.step}
                      onChange={(v) => updateField('modifiers', 'c_y', v, i)} />
                    <SliderRow label="r bottom" name={`m${i}_r_bottom`} value={mod.r_bottom}
                      min={settings.julia_r_sample.min} max={settings.julia_r_sample.max} step={settings.julia_r_sample.step}
                      onChange={(v) => updateField('modifiers', 'r_bottom', v, i)} />
                    <SliderRow label="r top" name={`m${i}_r_top`} value={mod.r_top}
                      min={settings.julia_r_sample.min} max={settings.julia_r_sample.max} step={settings.julia_r_sample.step}
                      onChange={(v) => updateField('modifiers', 'r_top', v, i)} />
                    <SliderRow label="iter" name={`m${i}_iterations`} value={mod.iterations}
                      min={settings.julia_iterations.min} max={settings.julia_iterations.max} step={settings.julia_iterations.step}
                      onChange={(v) => updateField('modifiers', 'iterations', v, i)} />
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="text-xs text-gray-400 w-16">flip</span>
                      <button
                        onClick={() => updateField('modifiers', 'flip', mod.flip === 1 ? -1 : 1, i)}
                        className={`px-2 py-0.5 rounded text-xs ${mod.flip === -1 ? 'bg-purple-600' : 'bg-gray-600'}`}
                      >
                        {mod.flip === 1 ? 'normal' : 'flipped'}
                      </button>
                    </div>
                    <SliderRow label="freq" name={`m${i}_freq`} value={mod.freq}
                      min={settings.julia_freq.min} max={settings.julia_freq.max} step={settings.julia_freq.step}
                      onChange={(v) => updateField('modifiers', 'freq', v, i)} />
                    <SliderRow label="phase" name={`m${i}_phase`} value={mod.phase}
                      min={settings.julia_phase.min} max={settings.julia_phase.max} step={settings.julia_phase.step}
                      onChange={(v) => updateField('modifiers', 'phase', v, i)} />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setFocusedJuliaIndex(i)}
                        className="rounded overflow-hidden ring-1 ring-gray-600 hover:ring-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        title="Open Julia picker"
                      >
                        <JuliaViewer
                          c_x={mod.c_x}
                          c_y={mod.c_y}
                          iterations={mod.iterations}
                          r_bottom={mod.r_bottom}
                          r_top={mod.r_top}
                          phase={mod.phase}
                          twist={vaseData.modifiers.filter(m => m.type === 'twist').reduce((sum, m) => sum + (m.value ?? 0), 0)}
                          flip={mod.flip}
                          offset_x={mod.offset_x || 0}
                          offset_y={mod.offset_y || 0}
                          view_scale={mod.view_scale || 60}
                          size={80}
                        />
                      </button>
                      <span className="text-[11px] text-gray-500">
                        {focusedJuliaIndex === i ? 'editing in picker →' : 'click to open picker'}
                      </span>
                    </div>
                  </>
                ) : mod.type === 'twist' ? (
                  <>
                    <SliderRow label="value" name={`m${i}_value`} value={mod.value ?? 0}
                      min={settings.twist_value.min} max={settings.twist_value.max} step={settings.twist_value.step}
                      onChange={(v) => updateField('modifiers', 'value', v, i)} />
                  </>
                ) : mod.type === 'sin_twist' ? (
                  <>
                    <SliderRow label="amount" name={`m${i}_mag`} value={mod.mag ?? 50}
                      min={settings.sin_twist_mag.min} max={settings.sin_twist_mag.max} step={settings.sin_twist_mag.step}
                      onChange={(v) => updateField('modifiers', 'mag', v, i)} />
                    <SliderRow label="freq" name={`m${i}_freq`} value={mod.freq ?? 1}
                      min={settings.sin_twist_freq.min} max={settings.sin_twist_freq.max} step={settings.sin_twist_freq.step}
                      onChange={(v) => updateField('modifiers', 'freq', v, i)} />
                  </>
                ) : (
                  <>
                    <SliderRow
                      label="amount" name={`m${i}_mag`}
                      value={mod.mag}
                      min={settings[`${prefix}_mag`].min} max={settings[`${prefix}_mag`].max} step={settings[`${prefix}_mag`].step}
                      onChange={(v) => updateField('modifiers', 'mag', v, i)}
                    />
                    <SliderRow
                      label="freq" name={`m${i}_freq`}
                      value={mod.freq}
                      min={settings[`${prefix}_freq`].min} max={settings[`${prefix}_freq`].max} step={settings[`${prefix}_freq`].step}
                      onChange={(v) => updateField('modifiers', 'freq', v, i)}
                    />
                    <SliderRow
                      label="phase" name={`m${i}_phase`}
                      value={mod.phase}
                      min={settings[`${prefix}_phase`].min} max={settings[`${prefix}_phase`].max} step={settings[`${prefix}_phase`].step}
                      onChange={(v) => updateField('modifiers', 'phase', v, i)}
                    />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Color + Export */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Appearance</h3>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-xs text-gray-400">Color</label>
          <input
            type="color"
            value={vaseColor}
            onChange={handleColorChange}
            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
          />
        </div>
        <SliderRow
          label="spin"
          name="spin_speed"
          value={spinSpeed}
          min={-1}
          max={1}
          step={0.25}
          onChange={setSpinSpeed}
        />
      </div>

      <ExportPanel meshRef={meshRef} />
    </div>
  )
}
