import VaseModel from "./VaseModel"
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

// note this is a static class
export default class VaseGenerator
{
  static generateVase(vaseData) {
    const generic = { ...vaseData.generic0, ...vaseData.generic1 }
    const modifiers = vaseData.modifiers.filter(m => m.enabled !== false).map(m => ({ ...m }))

    return this.createFromObjects(generic, modifiers)
  }

  static createFromObjects(generic, modifiers) {
    let params = {
        height: parseFloat(generic.height),
        width: parseFloat(generic.width),
        heightSegments: parseInt(generic.vertical_steps),
        radialSegments: parseInt(generic.radial_steps),
        slope: Math.PI / 4 * (parseFloat(generic.slope) / 100 - 0.5),
        thickness: parseFloat(generic.thickness) / 100,
    }

    modifiers.forEach(mod => {
        if (mod.type === 'sin_radial' || mod.type === 'tri_radial') {
            mod.mag = parseFloat(mod.mag) / 20
            mod.freq = parseFloat(mod.freq)
            mod.twist = parseFloat(mod.twist || 0) / params.height
            mod.phase = parseFloat(mod.phase) / 100
        } else if (mod.type === 'sin_vertical' || mod.type === 'tri_vertical') {
            mod.mag = parseFloat(mod.mag) / 20
            mod.freq = parseFloat(mod.freq) / params.height
            mod.phase = parseFloat(mod.phase) / 100
        } else if (mod.type === 'julia_radial') {
            mod.mag = parseFloat(mod.mag) / 20
            mod.c_x = parseFloat(mod.c_x) / 100
            mod.c_y = parseFloat(mod.c_y) / 100
            mod.iterations = parseInt(mod.iterations)
            mod.flip = parseFloat(mod.flip)
            mod.freq = parseFloat(mod.freq)
            mod.phase = parseFloat(mod.phase) / 100
            mod.twist = parseFloat(mod.twist || 0) * Math.PI / 100
            mod.offset_x = parseFloat(mod.offset_x || 0)
            mod.offset_y = parseFloat(mod.offset_y || 0)
            mod.view_scale = parseFloat(mod.view_scale || 60)
            // r_bottom / r_top are complex-space radii (slider 0-200 → 0-2.0).
            // view_scale is picker UI state only; it must not change geometry.
            mod.r_bottom = parseFloat(mod.r_bottom) / 100
            mod.r_top = parseFloat(mod.r_top) / 100
        } else if (mod.type === 'julia_edge_find') {
            mod.c_x = parseFloat(mod.c_x) / 100
            mod.c_y = parseFloat(mod.c_y) / 100
            mod.iterations = parseInt(mod.iterations)
            mod.c_x_top = mod.c_x_top !== undefined ? parseFloat(mod.c_x_top) / 100 : mod.c_x
            mod.c_y_top = mod.c_y_top !== undefined ? parseFloat(mod.c_y_top) / 100 : mod.c_y
            mod.iterations_top = mod.iterations_top !== undefined ? parseInt(mod.iterations_top) : mod.iterations
            mod.threshold = parseFloat(mod.threshold)
            mod.phase = parseFloat(mod.phase) / 100
            mod.twist = parseFloat(mod.twist || 0) * Math.PI / 100
            mod.offset_x = parseFloat(mod.offset_x || 0)
            mod.offset_y = parseFloat(mod.offset_y || 0)
            mod.view_scale = parseFloat(mod.view_scale || 60)
            mod.r_bottom = parseFloat(mod.r_bottom) / 100
            mod.r_top    = parseFloat(mod.r_top)    / 100
            mod.power = parseInt(mod.power || 2)
            mod.repetitions = parseFloat(mod.repetitions || 1)
            mod.amount = parseFloat(mod.amount ?? 100) / 100
        } else if (mod.type === 'twist') {
            mod.value = parseFloat(mod.value || 0)
        } else if (mod.type === 'sin_twist') {
            mod.mag = parseFloat(mod.mag || 0) * 4 * Math.PI / 100
            mod.freq = parseFloat(mod.freq || 1)
        }
    })
    params.modifiers = modifiers
    return new VaseModel(params)
  }
  
  static generateGeometry(vase) {
    const edgeMod = vase.modifiers.find(m => m.type === 'julia_edge_find')
    let geometry = edgeMod
      ? this.generateJuliaEdgeGeometry(vase, edgeMod)
      : (vase.solid ? this.generateSolidGeometry(vase) : this.generateHollowGeometry(vase))
    this.transformGeometry(geometry, vase)
    return geometry
  }
  
  static generateSolidGeometry(vase) {
    const cylinderProperties = {
        radiusTop: Math.max(vase.width + vase.height * vase.slope, 0),
        radiusBottom: vase.width,
        height: vase.height,
        radialSegments: vase.radialSegments,
        heightSegments: vase.heightSegments,
        openEnded: false,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
  
    const geometry = new THREE.CylinderGeometry(
        cylinderProperties.radiusTop,
        cylinderProperties.radiusBottom,
        cylinderProperties.height,
        cylinderProperties.radialSegments,
        cylinderProperties.heightSegments,
        cylinderProperties.openEnded,
        cylinderProperties.thetaStart,
        cylinderProperties.thetaLength
    )
  
    return geometry
  }
  
  static generateHollowGeometry(vase) {
    const outsideCylinderProperties = {
        radiusTop: Math.max(vase.width + vase.height * vase.slope, 0),
        radiusBottom: vase.width,
        height: vase.height,
        radialSegments: vase.radialSegments,
        heightSegments: vase.heightSegments,
        openEnded: true,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
    const insideCylinderProperties = {
        radiusTop: outsideCylinderProperties.radiusTop * (1 - vase.thickness),
        radiusBottom: outsideCylinderProperties.radiusBottom * (1 - vase.thickness),
        height: vase.height - vase.baseThickness,
        radialSegments: vase.radialSegments,
        heightSegments: vase.heightSegments,
        openEnded: true,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
  
    const upperRingProperties = {
        innerRadius: insideCylinderProperties.radiusTop,
        outerRadius: outsideCylinderProperties.radiusTop,
        thetaSegments: vase.radialSegments,
        phiSegments: 1,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
  
    const insideLowerCircleProperties = {
        radius: insideCylinderProperties.radiusBottom,
        segments: vase.radialSegments,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
  
    const outsideLowerCircleProperties = {
        radius: outsideCylinderProperties.radiusBottom,
        segments: vase.radialSegments,
        thetaStart: 0,
        thetaLength: 2 * Math.PI
    }
  
    const outsideGeometry = new THREE.CylinderGeometry(
        outsideCylinderProperties.radiusTop,
        outsideCylinderProperties.radiusBottom,
        outsideCylinderProperties.height,
        outsideCylinderProperties.radialSegments,
        outsideCylinderProperties.heightSegments,
        outsideCylinderProperties.openEnded,
        outsideCylinderProperties.thetaStart,
        outsideCylinderProperties.thetaLength
    )
  
    const insideGeometry = new THREE.CylinderGeometry(
        insideCylinderProperties.radiusTop,
        insideCylinderProperties.radiusBottom,
        insideCylinderProperties.height,
        insideCylinderProperties.radialSegments,
        insideCylinderProperties.heightSegments,
        insideCylinderProperties.openEnded,
        insideCylinderProperties.thetaStart,
        insideCylinderProperties.thetaLength
    )
    insideGeometry.scale(-1, -1, -1) // fixes normals for inside surface
    insideGeometry.rotateX(Math.PI) // fixes top and bottom orientation from scale
    insideGeometry.translate(0, vase.baseThickness / 2, 0)
  
    const upperGeometry = new THREE.RingGeometry(
        upperRingProperties.innerRadius,
        upperRingProperties.outerRadius,
        upperRingProperties.thetaSegments,
        upperRingProperties.phiSegments,
        upperRingProperties.thetaStart,
        upperRingProperties.thetaLength
    )
    upperGeometry.rotateX(-Math.PI / 2)
    upperGeometry.rotateY(-Math.PI / 2)
    upperGeometry.translate(0, vase.height / 2, 0)
  
    const insideLowerGeometry = new THREE.CircleGeometry(
        insideLowerCircleProperties.radius,
        insideLowerCircleProperties.segments,
        insideLowerCircleProperties.thetaStart,
        insideLowerCircleProperties.thetaLength
    )
    insideLowerGeometry.rotateX(-Math.PI / 2)
    insideLowerGeometry.rotateY(-Math.PI / 2)
    insideLowerGeometry.translate(0, -vase.height / 2 + vase.baseThickness, 0)
  
    const outsideLowerGeometry = new THREE.CircleGeometry(
        outsideLowerCircleProperties.radius,
        outsideLowerCircleProperties.segments,
        outsideLowerCircleProperties.thetaStart,
        outsideLowerCircleProperties.thetaLength
    )
    outsideLowerGeometry.rotateX(Math.PI / 2)
    outsideLowerGeometry.rotateY(-Math.PI / 2)
    outsideLowerGeometry.translate(0, -vase.height / 2, 0)
  
    let geometry = BufferGeometryUtils.mergeGeometries(
      [insideGeometry,
       outsideGeometry,
       upperGeometry,
       insideLowerGeometry,
       outsideLowerGeometry])

    geometry = BufferGeometryUtils.mergeVertices(geometry, 1e-2)
    return geometry
  }
  
  // Returns the largest iso-contour polygon as [{x, y}, ...] in complex coords
  static juliaContour(c_x, c_y, iterations, targetIter, gridSize, offset_x, offset_y, r_top, power = 2) {
    const N = gridSize + 1
    const iters = new Float32Array(N * N)
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const zr = offset_x + (i / gridSize * 2 - 1) * r_top
        const zi = offset_y + (j / gridSize * 2 - 1) * r_top
        iters[j * N + i] = power === 2
          ? VaseGenerator.juliaIter(zr, zi, c_x, c_y, iterations)
          : VaseGenerator.juliaIterN(zr, zi, c_x, c_y, iterations, power)
      }
    }

    // Marching squares: case index = bit3=TL, bit2=TR, bit1=BR, bit0=BL
    // Edges per cell: 0=top, 1=right, 2=bottom, 3=left
    const msEdgeTable = [
      [],            [[3,2]], [[2,1]], [[3,1]],
      [[1,0]], [[3,0],[1,2]], [[2,0]], [[3,0]],
      [[0,3]],  [[0,2]], [[2,3],[0,1]], [[0,1]],
      [[1,3]],  [[1,2]],      [[2,3]],      [],
    ]

    // Canonical edge key: H_ci_row (horizontal, between col ci and ci+1 at row)
    //                     V_col_cj (vertical, at col between row cj and cj+1)
    const cellEdgeKey = (ci, cj, edge) => {
      if (edge === 0) return `H_${ci}_${cj+1}`
      if (edge === 1) return `V_${ci+1}_${cj}`
      if (edge === 2) return `H_${ci}_${cj}`
                      return `V_${ci}_${cj}`
    }

    const edgePtCache = new Map()
    const getEdgePt = (key) => {
      if (edgePtCache.has(key)) return edgePtCache.get(key)
      const us = key.indexOf('_'), vs = key.indexOf('_', us + 1)
      const type = key[0]
      const a = parseInt(key.slice(us + 1, vs)), b = parseInt(key.slice(vs + 1))
      let pt
      if (type === 'H') {
        const vA = iters[b * N + a], vB = iters[b * N + (a + 1)]
        const t = Math.abs(vB - vA) < 1e-9 ? 0.5 : Math.max(0, Math.min(1, (targetIter - vA) / (vB - vA)))
        const xA = offset_x + (a / gridSize * 2 - 1) * r_top
        const xB = offset_x + ((a + 1) / gridSize * 2 - 1) * r_top
        const y  = offset_y + (b / gridSize * 2 - 1) * r_top
        pt = { x: xA + t * (xB - xA), y }
      } else {
        const vA = iters[b * N + a], vB = iters[(b + 1) * N + a]
        const t = Math.abs(vB - vA) < 1e-9 ? 0.5 : Math.max(0, Math.min(1, (targetIter - vA) / (vB - vA)))
        const x  = offset_x + (a / gridSize * 2 - 1) * r_top
        const yA = offset_y + (b / gridSize * 2 - 1) * r_top
        const yB = offset_y + ((b + 1) / gridSize * 2 - 1) * r_top
        pt = { x, y: yA + t * (yB - yA) }
      }
      edgePtCache.set(key, pt)
      return pt
    }

    // Build adjacency graph (each iso-contour node has degree 2)
    const adjacency = new Map()
    for (let cj = 0; cj < gridSize; cj++) {
      for (let ci = 0; ci < gridSize; ci++) {
        const vBL = iters[cj * N + ci],      vBR = iters[cj * N + (ci + 1)]
        const vTR = iters[(cj+1) * N + (ci+1)], vTL = iters[(cj+1) * N + ci]
        const idx = ((vTL >= targetIter ? 1 : 0) << 3) | ((vTR >= targetIter ? 1 : 0) << 2) |
                    ((vBR >= targetIter ? 1 : 0) << 1) |  (vBL >= targetIter ? 1 : 0)
        for (const [e0, e1] of msEdgeTable[idx]) {
          const k0 = cellEdgeKey(ci, cj, e0), k1 = cellEdgeKey(ci, cj, e1)
          getEdgePt(k0); getEdgePt(k1)
          if (!adjacency.has(k0)) adjacency.set(k0, [])
          if (!adjacency.has(k1)) adjacency.set(k1, [])
          adjacency.get(k0).push(k1)
          adjacency.get(k1).push(k0)
        }
      }
    }

    if (adjacency.size === 0) {
      console.warn('[julia_edge] contour fallback — no marching-squares crossings', {
        c_x, c_y, iterations, targetIter, r_top, offset_x, offset_y, power,
      })
      const pts = []
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * 2 * Math.PI
        pts.push({ x: offset_x + r_top * 0.5 * Math.cos(a), y: offset_y + r_top * 0.5 * Math.sin(a) })
      }
      return pts
    }

    // Trace closed polygons
    const visited = new Set()
    const polygons = []
    for (const startKey of adjacency.keys()) {
      if (visited.has(startKey)) continue
      const poly = [startKey]
      visited.add(startKey)
      let current = startKey
      while (true) {
        const neighbors = adjacency.get(current)
        let next = null
        for (const nb of neighbors) {
          if (!visited.has(nb)) { next = nb; break }
        }
        if (next === null) break
        poly.push(next)
        visited.add(next)
        current = next
      }
      if (poly.length > 2) polygons.push(poly.map(k => getEdgePt(k)))
    }

    if (polygons.length === 0) {
      console.warn('[julia_edge] contour fallback — no closed polygons traced', {
        c_x, c_y, iterations, targetIter, r_top, offset_x, offset_y, power,
        adjacencySize: adjacency.size,
      })
      const pts = []
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * 2 * Math.PI
        pts.push({ x: offset_x + r_top * 0.5 * Math.cos(a), y: offset_y + r_top * 0.5 * Math.sin(a) })
      }
      return pts
    }

    // Pick largest polygon by arc length
    let bestPoly = null, bestLen = -1
    for (const poly of polygons) {
      let len = 0
      const n = poly.length
      for (let i = 0; i < n; i++) {
        const dx = poly[(i+1) % n].x - poly[i].x, dy = poly[(i+1) % n].y - poly[i].y
        len += Math.sqrt(dx*dx + dy*dy)
      }
      if (len > bestLen) { bestLen = len; bestPoly = poly }
    }
    console.log('[julia_edge] contour traced', {
      targetIter, r_top, polygonsFound: polygons.length, bestLen: bestLen.toFixed(4),
      bestPoints: bestPoly.length,
    })
    return bestPoly
  }

  // Resample closed contour to N arc-length-uniform points, starting nearest to startAngle from (cx,cy)
  static resampleContour(contour, N, startAngle, cx, cy) {
    const n = contour.length
    if (n < 2) {
      const pts = []
      for (let i = 0; i < N; i++) pts.push({ x: cx, y: cy })
      return pts
    }

    let startIdx = 0, bestDiff = Infinity
    for (let i = 0; i < n; i++) {
      const angle = Math.atan2(contour[i].y - cy, contour[i].x - cx)
      const diff = Math.abs(((angle - startAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)
      if (diff < bestDiff) { bestDiff = diff; startIdx = i }
    }

    // Reorder to start at startIdx
    const ordered = []
    for (let i = 0; i < n; i++) ordered.push(contour[(startIdx + i) % n])

    // Cumulative arc lengths (closed: last segment wraps to [0])
    const arcLens = [0]
    for (let i = 0; i < n; i++) {
      const nx = ordered[(i + 1) % n], cx2 = ordered[i]
      const dx = nx.x - cx2.x, dy = nx.y - cx2.y
      arcLens.push(arcLens[i] + Math.sqrt(dx*dx + dy*dy))
    }
    const totalLen = arcLens[n]

    const result = []
    for (let k = 0; k < N; k++) {
      const target = k / N * totalLen
      let lo = 0, hi = n - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (arcLens[mid + 1] < target) lo = mid + 1
        else hi = mid
      }
      const segLen = arcLens[lo + 1] - arcLens[lo]
      const t = segLen < 1e-12 ? 0 : (target - arcLens[lo]) / segLen
      const a = ordered[lo], b = ordered[(lo + 1) % n]
      result.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
    }
    return result
  }

  static generateJuliaEdgeGeometry(vase, modifier) {
    const { heightSegments, radialSegments, height, width, slope, thickness, baseThickness } = vase
    const R = radialSegments

    const GRID = 128
    const targetIterBottom = Math.round(modifier.threshold / 100 * modifier.iterations)
    const targetIterTop    = Math.round(modifier.threshold / 100 * modifier.iterations_top)
    const numPlanes = Math.max(2, Math.round(2 * (modifier.repetitions || 1)))
    const numSegments = numPlanes - 1
    console.log('[julia_edge] generate', {
      threshold: modifier.threshold,
      iterations: modifier.iterations,
      iterations_top: modifier.iterations_top,
      targetIterBottom,
      targetIterTop,
      r_bottom_effective: modifier.r_bottom.toFixed(4),
      r_top_effective: modifier.r_top.toFixed(4),
      view_scale: modifier.view_scale,
      c_x: modifier.c_x, c_y: modifier.c_y,
      c_x_top: modifier.c_x_top, c_y_top: modifier.c_y_top,
      offset_x: modifier.offset_x, offset_y: modifier.offset_y,
      power: modifier.power,
      repetitions: modifier.repetitions,
      numPlanes,
    })

    const cx = modifier.offset_x, cy = modifier.offset_y

    // Marching squares winding is non-deterministic; normalize each contour to CW
    // so the mesh normals are consistent (outer wall faces out, top cap faces up).
    const signedArea = (c) => {
      let a = 0
      for (let i = 0; i < c.length; i++) {
        const j = (i + 1) % c.length
        a += (c[i].x - cx) * (c[j].y - cy) - (c[j].x - cx) * (c[i].y - cy)
      }
      return a
    }
    const ensureCW = (c) => signedArea(c) < 0 ? c : [...c].reverse()

    const contourBottomCW = ensureCW(VaseGenerator.juliaContour(
      modifier.c_x, modifier.c_y, modifier.iterations, targetIterBottom,
      GRID, modifier.offset_x, modifier.offset_y, modifier.r_top, modifier.power
    ))
    const contourTopCW = ensureCW(VaseGenerator.juliaContour(
      modifier.c_x_top, modifier.c_y_top, modifier.iterations_top, targetIterTop,
      GRID, modifier.offset_x, modifier.offset_y, modifier.r_top, modifier.power
    ))

    const rotateContour = (contour, angle) => {
      if (Math.abs(angle) <= 1e-10) return contour
      const cosA = Math.cos(angle), sinA = Math.sin(angle)
      return contour.map(p => {
        const dx = p.x - cx, dy = p.y - cy
        return { x: cx + dx * cosA - dy * sinA, y: cy + dx * sinA + dy * cosA }
      })
    }

    const rawTwistLinear = vase.modifiers
      .filter(m => m.type === 'twist')
      .reduce((sum, m) => sum + m.value, 0)
    const sinTwistAngle = (t) => vase.modifiers
      .filter(m => m.type === 'sin_twist')
      .reduce((sum, m) => sum + m.mag * Math.sin(m.freq * t * 2 * Math.PI), 0)

    // Build outer slices: rotate + resample the B and T contours, blend with a global
    // cosine wave of frequency `numSegments / 2` over height. tBlend is C∞ continuous,
    // so consecutive plane crossings have matching tangents — no creases.
    const outerSlices = []
    for (let j = 0; j <= heightSegments; j++) {
      const tGlobal = j / heightSegments
      const y = -height / 2 + j * height / heightSegments
      const rotAngle = (modifier.twist + rawTwistLinear * Math.PI / 100) * tGlobal + sinTwistAngle(tGlobal)
      const startAngle = modifier.phase * 2 * Math.PI + rotAngle

      const tBlend = (1 - Math.cos(numSegments * Math.PI * tGlobal)) / 2

      const resampledBottom = VaseGenerator.resampleContour(rotateContour(contourBottomCW, rotAngle), R, startAngle, cx, cy)
      const resampledTop    = VaseGenerator.resampleContour(rotateContour(contourTopCW,    rotAngle), R, startAngle, cx, cy)
      const lerped = resampledBottom.map((p, i) => ({
        x: p.x + tBlend * (resampledTop[i].x - p.x),
        y: p.y + tBlend * (resampledTop[i].y - p.y),
      }))
      const scale = (width + tGlobal * height * slope) / modifier.r_top
      const amount = modifier.amount
      outerSlices.push(lerped.map(p => {
        if (amount >= 1) return { x: p.x * scale, y, z: p.y * scale }
        const lx = p.x - cx
        const ly = p.y - cy
        const r = Math.hypot(lx, ly)
        if (r < 1e-9) return { x: cx * scale, y, z: cy * scale }
        const newR = modifier.r_top + amount * (r - modifier.r_top)
        const k = newR / r
        return {
          x: (cx + lx * k) * scale,
          y,
          z: (cy + ly * k) * scale,
        }
      }))
    }

    // Inner slices: scale toward vase axis
    const innerSlices = outerSlices.map(slice =>
      slice.map(p => ({ x: p.x * (1 - thickness), y: p.y, z: p.z * (1 - thickness) }))
    )

    // The inner cavity starts at y = -H/2 + baseThickness. To keep the base solid
    // (no inner wall poking through it), we build a dedicated inner-wall strip that
    // starts at the base level, not at the vase bottom. Its first slice is an
    // interpolation of the adjacent outer slices, then shrunk by thickness.
    const innerBaseY = -height / 2 + baseThickness
    const baseFrac = Math.max(0, Math.min(heightSegments, (baseThickness / height) * heightSegments))
    const jBaseLow = Math.max(0, Math.min(heightSegments - 1, Math.floor(baseFrac)))
    const fBase = Math.min(1, Math.max(0, baseFrac - jBaseLow))
    const innerBaseSlice = outerSlices[jBaseLow].map((p, i) => {
      const q = outerSlices[jBaseLow + 1][i]
      const ox = p.x + fBase * (q.x - p.x)
      const oz = p.z + fBase * (q.z - p.z)
      return { x: ox * (1 - thickness), y: innerBaseY, z: oz * (1 - thickness) }
    })

    const positions = []
    const push3 = (p) => positions.push(p.x, p.y, p.z)

    // Outer wall: CCW from outside → outward normals
    for (let j = 0; j < heightSegments; j++) {
      for (let i = 0; i < R; i++) {
        const ni = (i + 1) % R
        const p00 = outerSlices[j][i],    p10 = outerSlices[j][ni]
        const p11 = outerSlices[j+1][ni], p01 = outerSlices[j+1][i]
        push3(p00); push3(p10); push3(p11)
        push3(p00); push3(p11); push3(p01)
      }
    }

    const jTop = heightSegments
    const solid = thickness >= 1

    if (!solid) {
      // Inner wall runs from innerBaseSlice (at y = innerBaseY) up to innerSlices[jTop].
      // Stitch innerBaseSlice → innerSlices[jBaseLow+1] first, then each j → j+1 above.
      const innerWallSlices = [innerBaseSlice]
      for (let j = jBaseLow + 1; j <= heightSegments; j++) innerWallSlices.push(innerSlices[j])

      for (let j = 0; j < innerWallSlices.length - 1; j++) {
        for (let i = 0; i < R; i++) {
          const ni = (i + 1) % R
          const p00 = innerWallSlices[j][i],    p10 = innerWallSlices[j][ni]
          const p11 = innerWallSlices[j+1][ni], p01 = innerWallSlices[j+1][i]
          // reversed winding → inward (toward cavity) normals
          push3(p00); push3(p11); push3(p10)
          push3(p00); push3(p01); push3(p11)
        }
      }
    }

    // Top cap
    if (solid) {
      // Solid: fan from center to outer ring
      const tCenter = { x: 0, y: outerSlices[jTop][0].y, z: 0 }
      for (let i = 0; i < R; i++) {
        const ni = (i + 1) % R
        push3(tCenter); push3(outerSlices[jTop][i]); push3(outerSlices[jTop][ni])
      }
    } else {
      // Hollow: annular ring connecting outer to inner
      for (let i = 0; i < R; i++) {
        const ni = (i + 1) % R
        const po0 = outerSlices[jTop][i],  po1 = outerSlices[jTop][ni]
        const pi0 = innerSlices[jTop][i],  pi1 = innerSlices[jTop][ni]
        push3(po0); push3(po1); push3(pi1)
        push3(po0); push3(pi1); push3(pi0)
      }
    }

    // Bottom cap (solid outer base): CCW from below → downward normals
    const bCenter = { x: 0, y: -height / 2, z: 0 }
    for (let i = 0; i < R; i++) {
      const ni = (i + 1) % R
      push3(bCenter); push3(outerSlices[0][ni]); push3(outerSlices[0][i])
    }

    if (!solid) {
      // Inner base cap: disk at y = innerBaseY whose perimeter matches the inner wall's
      // first ring exactly (innerBaseSlice). CCW from above → upward (into cavity) normals.
      const ibCenter = { x: 0, y: innerBaseY, z: 0 }
      for (let i = 0; i < R; i++) {
        const ni = (i + 1) % R
        push3(ibCenter); push3(innerBaseSlice[i]); push3(innerBaseSlice[ni])
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }

  static juliaIter(zr, zi, cr, ci, maxIter) {
    let iter = 0
    while (iter < maxIter && zr*zr + zi*zi < 4) {
        const newZr = zr*zr - zi*zi + cr; zi = 2*zr*zi + ci; zr = newZr; iter++
    }
    return iter
  }

  static juliaIterN(zr, zi, cr, ci, maxIter, n) {
    let iter = 0
    while (iter < maxIter && zr*zr + zi*zi < 4) {
      const r_z = Math.sqrt(zr*zr + zi*zi)
      const theta = Math.atan2(zi, zr)
      const rn = Math.pow(r_z, n)
      const newZr = rn * Math.cos(n * theta) + cr
      zi = rn * Math.sin(n * theta) + ci
      zr = newZr
      iter++
    }
    return iter
  }

  static transformGeometry(geometry, vase) {
    var position = geometry.attributes.position

    const rawTwistLinear = vase.modifiers
        .filter(m => m.type === 'twist')
        .reduce((sum, m) => sum + m.value, 0)
    const sinTwistAngle = (t) => vase.modifiers
        .filter(m => m.type === 'sin_twist')
        .reduce((sum, m) => sum + m.mag * Math.sin(m.freq * t * 2 * Math.PI), 0)

    for (var i = 0; i < position.count; i++) {
        const x = position.getX(i)
        const y = position.getY(i)
        const z = position.getZ(i)

        const cylinderical = new THREE.Cylindrical()
        cylinderical.setFromCartesianCoords(x, y, z)

        const t = (cylinderical.y + vase.height / 2) / vase.height
        const extraAngle = sinTwistAngle(t)

        vase.modifiers.forEach(modifier => {
            if (modifier.type === 'sin_radial') {
                cylinderical.radius += modifier.mag * Math.sin(modifier.freq * cylinderical.theta
                    + (modifier.twist + rawTwistLinear / vase.height) * cylinderical.y
                    + extraAngle
                    + modifier.phase * 2 * Math.PI)
            } else if (modifier.type === 'sin_vertical') {
                cylinderical.radius += modifier.mag * Math.sin(modifier.freq * cylinderical.y
                    + modifier.phase * 2 * Math.PI)
            } else if (modifier.type === 'tri_radial') {
                const arg = modifier.freq * cylinderical.theta
                    + (modifier.twist + rawTwistLinear / vase.height) * cylinderical.y
                    + extraAngle
                    + modifier.phase * 2 * Math.PI
                cylinderical.radius += modifier.mag * (2 / Math.PI) * Math.asin(Math.sin(arg))
            } else if (modifier.type === 'tri_vertical') {
                const arg = modifier.freq * cylinderical.y
                    + modifier.phase * 2 * Math.PI
                cylinderical.radius += modifier.mag * (2 / Math.PI) * Math.asin(Math.sin(arg))
            } else if (modifier.type === 'julia_radial') {
                const r = modifier.r_bottom + (modifier.r_top - modifier.r_bottom) * t
                const twistAngle = (modifier.twist + rawTwistLinear * Math.PI / 100) * t + extraAngle
                const arg = modifier.freq * cylinderical.theta + modifier.phase * 2 * Math.PI + twistAngle
                const zr = modifier.offset_x + r * Math.cos(arg)
                const zi = modifier.offset_y + modifier.flip * r * Math.sin(arg)
                const iter = VaseGenerator.juliaIter(zr, zi, modifier.c_x, modifier.c_y, modifier.iterations)
                cylinderical.radius += modifier.mag * (iter / modifier.iterations)
            } else if (modifier.type === 'julia_edge_find') {
                // geometry shape already applied in generateJuliaEdgeGeometry; skip here
            } else if (modifier.type === 'twist' || modifier.type === 'sin_twist') {
                // handled via rawTwistLinear / sinTwistAngle pre-computation
            }
        })
  
        const cartisian = new THREE.Vector3()
        cartisian.setFromCylindrical(cylinderical)
  
        position.setXYZ(i, cartisian.x, cartisian.y, cartisian.z)
    }
  }
}

