import { useVaseStore } from '../stores/vaseStore'

// trackInteraction: while dragged, the slider sets the global `interacting` flag
// so the mesh renders a fast low-res preview. Pass false for sliders that don't
// affect geometry (spin) or whose effect the preview cap would hide (resolution).
// No onBlur reset: blur from a previously-focused slider fires right after
// pointerdown on the next one and would cancel the new drag's flag.
export default function SliderRow({ label, name, value, min, max, step, onChange, trackInteraction = true }) {
  const setInteracting = useVaseStore((s) => s.setInteracting)
  const interactionProps = trackInteraction
    ? {
        onPointerDown: () => setInteracting(true),
        onPointerUp: () => setInteracting(false),
        onPointerCancel: () => setInteracting(false),
      }
    : {}
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
        {...interactionProps}
        className="flex-1 cursor-pointer"
      />
      <span className="text-xs text-gray-300 w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}
