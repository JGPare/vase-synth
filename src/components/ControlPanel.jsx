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
      radial: vaseData.radial,
      vertical: vaseData.vertical,
    }
    saveVase(data)
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

      {/* Radial modifiers */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Radial Modifiers</h3>
        {vaseData.radial.map((r, i) => (
          <div key={i} className="mb-2">
            <span className="text-xs text-gray-500">radial {i + 1}</span>
            <div className="space-y-1">
              <SliderRow
                label="amount" name={`r${i}_mag`}
                value={r.mag}
                min={settings.radial_mag.min} max={settings.radial_mag.max} step={settings.radial_mag.step}
                onChange={(v) => updateField('radial', 'mag', v, i)}
              />
              <SliderRow
                label="freq" name={`r${i}_freq`}
                value={r.freq}
                min={settings.radial_freq.min} max={settings.radial_freq.max} step={settings.radial_freq.step}
                onChange={(v) => updateField('radial', 'freq', v, i)}
              />
              <SliderRow
                label="twist" name={`r${i}_twist`}
                value={r.twist}
                min={settings.radial_twist.min} max={settings.radial_twist.max} step={settings.radial_twist.step}
                onChange={(v) => updateField('radial', 'twist', v, i)}
              />
              <SliderRow
                label="phase" name={`r${i}_phase`}
                value={r.phase}
                min={settings.radial_phase.min} max={settings.radial_phase.max} step={settings.radial_phase.step}
                onChange={(v) => updateField('radial', 'phase', v, i)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Vertical modifiers */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Vertical Modifiers</h3>
        {vaseData.vertical.map((v, i) => (
          <div key={i} className="mb-2">
            <span className="text-xs text-gray-500">vertical {i + 1}</span>
            <div className="space-y-1">
              <SliderRow
                label="amount" name={`v${i}_mag`}
                value={v.mag}
                min={settings.vertical_mag.min} max={settings.vertical_mag.max} step={settings.vertical_mag.step}
                onChange={(val) => updateField('vertical', 'mag', val, i)}
              />
              <SliderRow
                label="freq" name={`v${i}_freq`}
                value={v.freq}
                min={settings.vertical_freq.min} max={settings.vertical_freq.max} step={settings.vertical_freq.step}
                onChange={(val) => updateField('vertical', 'freq', val, i)}
              />
              <SliderRow
                label="phase" name={`v${i}_phase`}
                value={v.phase}
                min={settings.vertical_phase.min} max={settings.vertical_phase.max} step={settings.vertical_phase.step}
                onChange={(val) => updateField('vertical', 'phase', val, i)}
              />
            </div>
          </div>
        ))}
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
