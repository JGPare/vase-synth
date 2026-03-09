export default function SliderRow({ label, name, value, min, max, step, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>}
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 cursor-pointer"
      />
      <span className="text-xs text-gray-300 w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}
