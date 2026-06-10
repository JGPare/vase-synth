import { useRef, useEffect, useState, useCallback } from 'react'
import { useVaseStore } from '../stores/vaseStore'

export default function JuliaViewer({
  c_x,
  c_y,
  iterations,
  r_bottom,
  r_top,
  phase,
  twist,
  flip,
  power = 2,
  offset_x,
  offset_y,
  view_scale,
  size = 240,
  interactive = false,
  bottomMarker = null,
  topMarker = null,
  rBottomRange,
  rTopRange,
  onOffsetChange,
  onScaleChange,
  onBottomMarkerChange,
  onTopMarkerChange,
  onRBottomChange,
  onRTopChange,
  onPhaseChange,
}) {
  const canvasRef = useRef(null)
  const setInteracting = useVaseStore((s) => s.setInteracting)
  const [viewX, setViewX] = useState(-(offset_x || 0))
  const [viewY, setViewY] = useState(-(offset_y || 0))
  const [scale, setScale] = useState(view_scale || 60)
  const [hoverZone, setHoverZone] = useState('pan')
  const dragMode = useRef(null)
  const lastPos = useRef({ x: 0, y: 0 })
  const viewRef = useRef({ x: -(offset_x || 0), y: -(offset_y || 0) })

  // r_bottom/r_top are complex-space radii (slider value / 100). Draw at r * scale pixels
  // so the rings represent the actual geometry sampling circles and grow/shrink with zoom.
  const cr = c_x / 100
  const ci = c_y / 100
  const bm = bottomMarker ? { cr: bottomMarker.c_x / 100, ci: bottomMarker.c_y / 100 } : null
  const tm = topMarker ? { cr: topMarker.c_x / 100, ci: topMarker.c_y / 100 } : null

  useEffect(() => {
    viewRef.current = { x: -(offset_x || 0), y: -(offset_y || 0) }
    setViewX(-(offset_x || 0))
    setViewY(-(offset_y || 0))
  }, [offset_x, offset_y])

  useEffect(() => {
    setScale(view_scale || 60)
  }, [view_scale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(size, size)
    const data = imageData.data

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        let zr = (px - size / 2) / scale - viewX
        let zi = (py - size / 2) / scale - viewY
        if (flip === -1) zi = -zi

        let iter = 0
        if (power === 2) {
          while (iter < iterations && zr * zr + zi * zi < 4) {
            const newZr = zr * zr - zi * zi + cr
            zi = 2 * zr * zi + ci
            zr = newZr
            iter++
          }
        } else {
          while (iter < iterations && zr * zr + zi * zi < 4) {
            const rn = Math.pow(Math.sqrt(zr * zr + zi * zi), power)
            const theta = Math.atan2(zi, zr) * power
            const newZr = rn * Math.cos(theta) + cr
            zi = rn * Math.sin(theta) + ci
            zr = newZr
            iter++
          }
        }

        const idx = (py * size + px) * 4
        if (iter === iterations) {
          data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 255
        } else {
          const t = iter / iterations
          data[idx] = Math.floor(9 * (1 - t) * t * t * t * 255)
          data[idx + 1] = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255)
          data[idx + 2] = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255)
          data[idx + 3] = 255
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)

    const rb = (r_bottom / 100) * scale
    const rt = (r_top / 100) * scale
    const phaseAngle = (phase / 100) * 2 * Math.PI
    const topAngle = phaseAngle + (twist / 100) * Math.PI

    // Bottom circle — solid white
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, rb, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = Math.max(1, size / 200)
    ctx.setLineDash([])
    ctx.stroke()

    // Top circle — dashed white
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, rt, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = Math.max(1, size / 200)
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Bottom dot — white
    const bDotX = size / 2 + rb * Math.cos(phaseAngle)
    const bDotY = size / 2 + flip * rb * Math.sin(phaseAngle)
    ctx.beginPath()
    ctx.arc(bDotX, bDotY, Math.max(3, size / 80), 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.fill()

    // Top dot — orange
    const tDotX = size / 2 + rt * Math.cos(topAngle)
    const tDotY = size / 2 + flip * rt * Math.sin(topAngle)
    ctx.beginPath()
    ctx.arc(tDotX, tDotY, Math.max(3, size / 80), 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,160,50,1)'
    ctx.fill()

    if (interactive) {
      const drawCrosshair = (zr, zi, color) => {
        const px = size / 2 + (zr + viewX) * scale
        const py = size / 2 + (flip * zi + viewY) * scale
        const r = Math.max(5, size / 50)
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1.5, size / 250)
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(px, py, r, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(px - r - 3, py); ctx.lineTo(px + r + 3, py)
        ctx.moveTo(px, py - r - 3); ctx.lineTo(px, py + r + 3)
        ctx.stroke()
        return { px, py }
      }

      const b = bm ? drawCrosshair(bm.cr, bm.ci, 'rgba(255,255,255,1)') : null
      const t = tm ? drawCrosshair(tm.cr, tm.ci, 'rgba(255,160,50,1)') : null
      if (b && t) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(b.px, b.py); ctx.lineTo(t.px, t.py)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

  }, [cr, ci, bm?.cr, bm?.ci, tm?.cr, tm?.ci, iterations, r_bottom, r_top, phase, twist, flip, power, viewX, viewY, scale, size, interactive])

  const getCanvasPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * size,
      y: ((e.clientY - rect.top) / rect.height) * size,
    }
  }, [size])

  const hitTest = useCallback(
    (pos) => {
      if (!interactive) return 'pan'
      const cx = size / 2
      const cy = size / 2
      const hitR = Math.max(8, size / 40)

      if (bm) {
        const bPx = cx + (bm.cr + viewX) * scale
        const bPy = cy + (flip * bm.ci + viewY) * scale
        if ((pos.x - bPx) ** 2 + (pos.y - bPy) ** 2 < hitR * hitR) return 'c_bottom'
      }

      if (tm) {
        const tPx = cx + (tm.cr + viewX) * scale
        const tPy = cy + (flip * tm.ci + viewY) * scale
        if ((pos.x - tPx) ** 2 + (pos.y - tPy) ** 2 < hitR * hitR) return 'c_top'
      }

      const rb = (r_bottom / 100) * scale
      const rt = (r_top / 100) * scale
      const phaseAngle = (phase / 100) * 2 * Math.PI
      const topAngle = phaseAngle + (twist / 100) * Math.PI

      // bottom dot (priority over ring)
      const bDotX = cx + rb * Math.cos(phaseAngle)
      const bDotY = cy + flip * rb * Math.sin(phaseAngle)
      if ((pos.x - bDotX) ** 2 + (pos.y - bDotY) ** 2 < hitR * hitR) return 'dot_bottom'

      // top dot
      const tDotX = cx + rt * Math.cos(topAngle)
      const tDotY = cy + flip * rt * Math.sin(topAngle)
      if ((pos.x - tDotX) ** 2 + (pos.y - tDotY) ** 2 < hitR * hitR) return 'dot_top'

      // rings
      const distFromCenter = Math.hypot(pos.x - cx, pos.y - cy)
      const ringTolerance = Math.max(4, size / 60)
      if (Math.abs(distFromCenter - rb) < ringTolerance) return 'ring_bottom'
      if (Math.abs(distFromCenter - rt) < ringTolerance) return 'ring_top'

      return 'pan'
    },
    [interactive, size, bm?.cr, bm?.ci, tm?.cr, tm?.ci, viewX, viewY, scale, flip, r_bottom, r_top, phase, twist]
  )

  const clampR = useCallback(
    (r, range) => {
      if (!range) return Math.max(0, r)
      return Math.max(range.min, Math.min(range.max, r))
    },
    []
  )

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const next = Math.min(5000, Math.max(10, scale * (e.deltaY < 0 ? 1.1 : 0.9)))
    setScale(next)
    onScaleChange?.(next)
  }, [scale, onScaleChange])

  const onMouseDown = useCallback((e) => {
    const pos = getCanvasPos(e)
    const zone = hitTest(pos)
    dragMode.current = zone
    lastPos.current = { x: e.clientX, y: e.clientY, canvasX: pos.x, canvasY: pos.y }
    setInteracting(true)
  }, [getCanvasPos, hitTest, setInteracting])

  const onMouseMove = useCallback((e) => {
    const pos = getCanvasPos(e)
    if (!dragMode.current) {
      setHoverZone(hitTest(pos))
      return
    }

    const mode = dragMode.current
    const cx = size / 2
    const cy = size / 2

    if (mode === 'pan') {
      const dx = (e.clientX - lastPos.current.x) / scale
      const dy = (e.clientY - lastPos.current.y) / scale
      viewRef.current = { x: viewRef.current.x + dx, y: viewRef.current.y + dy }
      setViewX((v) => v + dx)
      setViewY((v) => v + dy)
      lastPos.current = { ...lastPos.current, x: e.clientX, y: e.clientY }
      return
    }

    if (mode === 'c_bottom' && onBottomMarkerChange) {
      const newCr = (pos.x - cx) / scale - viewX
      const newCi = flip * ((pos.y - cy) / scale - viewY)
      onBottomMarkerChange(Math.round(newCr * 100), Math.round(newCi * 100))
      return
    }

    if (mode === 'c_top' && onTopMarkerChange) {
      const newCr = (pos.x - cx) / scale - viewX
      const newCi = flip * ((pos.y - cy) / scale - viewY)
      onTopMarkerChange(Math.round(newCr * 100), Math.round(newCi * 100))
      return
    }

    if (mode === 'dot_bottom') {
      const dx = pos.x - cx
      const dy = pos.y - cy
      if (onPhaseChange) {
        const angle = Math.atan2(flip * dy, dx)
        let p = (angle / (2 * Math.PI)) * 100
        if (p < 0) p += 100
        onPhaseChange(Math.round(p))
      }
      if (onRBottomChange) {
        const rPx = Math.hypot(dx, dy)
        const r = (rPx / scale) * 100
        onRBottomChange(Math.round(clampR(r, rBottomRange)))
      }
      return
    }

    if (mode === 'dot_top' && onRTopChange) {
      const dx = pos.x - cx
      const dy = pos.y - cy
      const rPx = Math.hypot(dx, dy)
      const r = (rPx / scale) * 100
      onRTopChange(Math.round(clampR(r, rTopRange)))
      return
    }

    if (mode === 'ring_bottom' && onRBottomChange) {
      const dx = pos.x - cx
      const dy = pos.y - cy
      const rPx = Math.hypot(dx, dy)
      const r = (rPx / scale) * 100
      onRBottomChange(Math.round(clampR(r, rBottomRange)))
      return
    }

    if (mode === 'ring_top' && onRTopChange) {
      const dx = pos.x - cx
      const dy = pos.y - cy
      const rPx = Math.hypot(dx, dy)
      const r = (rPx / scale) * 100
      onRTopChange(Math.round(clampR(r, rTopRange)))
      return
    }
  }, [getCanvasPos, hitTest, size, scale, flip, viewX, viewY, rBottomRange, rTopRange, clampR, onBottomMarkerChange, onTopMarkerChange, onPhaseChange, onRBottomChange, onRTopChange])

  const onMouseUp = useCallback(() => {
    if (dragMode.current === 'pan') {
      onOffsetChange?.(-viewRef.current.x, -viewRef.current.y)
    }
    setInteracting(false)
    dragMode.current = null
  }, [onOffsetChange, setInteracting])

  // If the picker unmounts mid-drag (e.g. Escape closes the window while the
  // button is held), mouseup never fires — don't leave the flag stuck true.
  useEffect(() => () => setInteracting(false), [setInteracting])

  const cursor = !interactive
    ? 'default'
    : hoverZone === 'c_bottom' || hoverZone === 'c_top'
    ? 'crosshair'
    : hoverZone === 'dot_bottom' || hoverZone === 'dot_top' || hoverZone === 'ring_bottom' || hoverZone === 'ring_top'
    ? 'grab'
    : 'move'

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block', cursor, touchAction: 'none' }}
      onWheel={interactive ? onWheel : undefined}
      onMouseDown={interactive ? onMouseDown : undefined}
      onMouseMove={interactive ? onMouseMove : undefined}
      onMouseUp={interactive ? onMouseUp : undefined}
      onMouseLeave={interactive ? onMouseUp : undefined}
    />
  )
}
