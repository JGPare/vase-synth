import { useState, useEffect, useCallback } from 'react'
import { useVaseStore } from '../stores/vaseStore'
import SliderRow from './SliderRow'
import ExportPanel from './ExportPanel'

export default function ControlPanel({ meshRef, spinSpeed, setSpinSpeed }) {
  const {
    settings,
    vaseData,
    vaseName,
    access,
    appearance,
    loadSettings,
    setVaseData,
    setVaseName,
    setAccess,
    setAppearance,
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

  const addModifier = () => {
    if (!vaseData || vaseData.modifiers.length >= 6) return
    const newData = JSON.parse(JSON.stringify(vaseData))
    newData.modifiers.push({ type: 'sin_radial', mag: 0, freq: 10, twist: 0, phase: 0 })
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
      newData.modifiers[i] = { type: newType, mag: 0, freq: 10, twist: 0, phase: 0 }
    } else {
      newData.modifiers[i] = { type: newType, mag: 0, freq: 10, phase: 0 }
    }
    setVaseData(newData)
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
            : 'tri_vertical'
          return (
            <div key={i} className="mb-3">
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
                </select>
                <button
                  onClick={() => removeModifier(i)}
                  className="text-gray-500 hover:text-red-400 text-xs px-1"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
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
                {isRadial && (
                  <SliderRow
                    label="twist" name={`m${i}_twist`}
                    value={mod.twist}
                    min={settings.radial_twist.min} max={settings.radial_twist.max} step={settings.radial_twist.step}
                    onChange={(v) => updateField('modifiers', 'twist', v, i)}
                  />
                )}
                <SliderRow
                  label="phase" name={`m${i}_phase`}
                  value={mod.phase}
                  min={settings[`${prefix}_phase`].min} max={settings[`${prefix}_phase`].max} step={settings[`${prefix}_phase`].step}
                  onChange={(v) => updateField('modifiers', 'phase', v, i)}
                />
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
