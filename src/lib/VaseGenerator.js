import VaseModel from "./VaseModel"
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

// note this is a static class
export default class VaseGenerator
{
  static generateVase(vaseData) {
    const generic = { ...vaseData.generic0, ...vaseData.generic1 }
    const modifiers = vaseData.modifiers.map(m => ({ ...m }))

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
            mod.twist = parseFloat(mod.twist) / params.height
            mod.phase = parseFloat(mod.phase) / 100
        } else if (mod.type === 'sin_vertical' || mod.type === 'tri_vertical') {
            mod.mag = parseFloat(mod.mag) / 20
            mod.freq = parseFloat(mod.freq) / params.height
            mod.phase = parseFloat(mod.phase) / 100
        } else if (mod.type === 'julia_radial') {
            mod.mag = parseFloat(mod.mag) / 20
            mod.c_x = parseFloat(mod.c_x) / 100
            mod.c_y = parseFloat(mod.c_y) / 100
            mod.r_sample = parseFloat(mod.r_sample) / 100
            mod.iterations = parseInt(mod.iterations)
            mod.flip = parseFloat(mod.flip)
            mod.freq = parseFloat(mod.freq)
            mod.phase = parseFloat(mod.phase) / 100
            mod.rotate_c = parseFloat(mod.rotate_c) * Math.PI / 100
            mod.offset_x = parseFloat(mod.offset_x || 0)
            mod.offset_y = parseFloat(mod.offset_y || 0)
            mod.view_scale = parseFloat(mod.view_scale || 60)
            // effective r_sample in complex units: fixed pixel radius / current zoom
            mod.r_sample = mod.r_sample * 60 / mod.view_scale
        }
    })
    params.modifiers = modifiers
    return new VaseModel(params)
  }
  
  static generateGeometry(vase) {

    let geometry = vase.solid ? this.generateSolidGeometry(vase) : this.generateHollowGeometry(vase)
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
  
  static juliaIter(zr, zi, cr, ci, maxIter) {
    let iter = 0
    while (iter < maxIter && zr*zr + zi*zi < 4) {
        const newZr = zr*zr - zi*zi + cr; zi = 2*zr*zi + ci; zr = newZr; iter++
    }
    return iter
  }

  static transformGeometry(geometry, vase) {
    var position = geometry.attributes.position
  
    for (var i = 0; i < position.count; i++) {
        const x = position.getX(i)
        const y = position.getY(i)
        const z = position.getZ(i)
  
        const cylinderical = new THREE.Cylindrical()
        cylinderical.setFromCartesianCoords(x, y, z)
  
        vase.modifiers.forEach(modifier => {
            if (modifier.type === 'sin_radial') {
                cylinderical.radius += modifier.mag * Math.sin(modifier.freq * cylinderical.theta
                    + modifier.twist * cylinderical.y
                    + modifier.phase * 2 * Math.PI)
            } else if (modifier.type === 'sin_vertical') {
                cylinderical.radius += modifier.mag * Math.sin(modifier.freq * cylinderical.y
                    + modifier.phase * 2 * Math.PI)
            } else if (modifier.type === 'tri_radial') {
                const arg = modifier.freq * cylinderical.theta
                    + modifier.twist * cylinderical.y
                    + modifier.phase * 2 * Math.PI
                cylinderical.radius += modifier.mag * (2 / Math.PI) * Math.asin(Math.sin(arg))
            } else if (modifier.type === 'tri_vertical') {
                const arg = modifier.freq * cylinderical.y
                    + modifier.phase * 2 * Math.PI
                cylinderical.radius += modifier.mag * (2 / Math.PI) * Math.asin(Math.sin(arg))
            } else if (modifier.type === 'julia_radial') {
                const arg = modifier.freq * cylinderical.theta + modifier.phase * 2 * Math.PI
                const t = (cylinderical.y + vase.height / 2) / vase.height
                const angle = modifier.rotate_c * t
                const cr = modifier.c_x * Math.cos(angle) - modifier.c_y * Math.sin(angle)
                const ci = modifier.c_x * Math.sin(angle) + modifier.c_y * Math.cos(angle)
                const zr = modifier.offset_x + modifier.r_sample * Math.cos(arg)
                const zi = modifier.offset_y + modifier.flip * modifier.r_sample * Math.sin(arg)
                const iter = VaseGenerator.juliaIter(zr, zi, cr, ci, modifier.iterations)
                cylinderical.radius += modifier.mag * (iter / modifier.iterations)
            }
        })
  
        const cartisian = new THREE.Vector3()
        cartisian.setFromCylindrical(cylinderical)
  
        position.setXYZ(i, cartisian.x, cartisian.y, cartisian.z)
    }
  }
}

