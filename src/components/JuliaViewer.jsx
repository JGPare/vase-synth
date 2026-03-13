import { useRef, useEffect, useState, useCallback } from 'react'

export default function JuliaViewer({ c_x, c_y, iterations, r_sample, flip, offset_x, offset_y, view_scale, onOffsetChange, onScaleChange }) {
  const canvasRef = useRef(null)
  const [viewX, setViewX] = useState(-(offset_x || 0))
  const [viewY, setViewY] = useState(-(offset_y || 0))
  const [scale, setScale] = useState(view_scale || 60)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const viewRef = useRef({ x: -(offset_x || 0), y: -(offset_y || 0) })

  const SIZE = 240
  const BASE_SCALE = 60
  const cr = c_x / 100
  const ci = c_y / 100
  const rs = r_sample / 100

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(SIZE, SIZE)
    const data = imageData.data

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        let zr = (px - SIZE / 2) / scale - viewX
        let zi = (py - SIZE / 2) / scale - viewY
        if (flip === -1) zi = -zi

        let iter = 0
        while (iter < iterations && zr * zr + zi * zi < 4) {
          const newZr = zr * zr - zi * zi + cr
          zi = 2 * zr * zi + ci
          zr = newZr
          iter++
        }

        const idx = (py * SIZE + px) * 4
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

    // Draw sample circle — fixed in screen space; Julia set pans/zooms under it
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, rs * BASE_SCALE, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [cr, ci, iterations, rs, flip, viewX, viewY, scale])

  const commitOffset = useCallback((vx, vy) => {
    onOffsetChange?.(-vx, -vy)
  }, [onOffsetChange])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const next = Math.min(500, Math.max(10, scale * (e.deltaY < 0 ? 1.1 : 0.9)))
    setScale(next)
    onScaleChange?.(next)
  }, [scale, onScaleChange])

  const onMouseDown = useCallback((e) => {
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return
    const dx = (e.clientX - lastPos.current.x) / scale
    const dy = (e.clientY - lastPos.current.y) / scale
    viewRef.current = { x: viewRef.current.x + dx, y: viewRef.current.y + dy }
    setViewX(v => v + dx)
    setViewY(v => v + dy)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [scale])

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    commitOffset(viewRef.current.x, viewRef.current.y)
  }, [commitOffset])

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{ width: SIZE, height: SIZE, display: 'block', cursor: 'crosshair' }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  )
}
