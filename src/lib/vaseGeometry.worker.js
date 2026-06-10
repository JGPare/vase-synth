import VaseGenerator from './VaseGenerator'

// While the user is dragging, mesh resolution is capped so previews stay fast;
// the full-resolution geometry is regenerated on release.
const PREVIEW_MAX_SEGMENTS = 100

self.onmessage = ({ data: { id, vaseData, quality } }) => {
  try {
    const vase = VaseGenerator.generateVase(vaseData)
    if (quality === 'preview') {
      vase.heightSegments = Math.min(vase.heightSegments, PREVIEW_MAX_SEGMENTS)
      vase.radialSegments = Math.min(vase.radialSegments, PREVIEW_MAX_SEGMENTS)
    }
    const geom = VaseGenerator.generateGeometry(vase)

    const positions = geom.attributes.position.array
    const normals = geom.attributes.normal.array
    // Hollow/solid paths produce indexed geometry (mergeVertices); julia edge path does not.
    const index = geom.index ? geom.index.array : null

    const transfer = [positions.buffer, normals.buffer]
    if (index) transfer.push(index.buffer)
    self.postMessage({ id, positions, normals, index }, transfer)
  } catch (err) {
    self.postMessage({ id, error: String(err) })
  }
}
