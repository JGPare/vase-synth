

export default class VaseModel {
  constructor(params) {
      this.height = params.height
      this.width = params.width
      this.heightSegments = params.heightSegments
      this.radialSegments = params.radialSegments
      this.slope = params.slope
      this.thickness = params.thickness
      this.modifiers = params.modifiers
      this.color = params.color

      this.baseThickness = this.width / 2 * this.thickness
      this.solid = this.thickness == 1 ? true : false
  }
}