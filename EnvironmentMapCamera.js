import * as THREE from 'three'

class EnvironmentMapCamera extends THREE.Group {
    constructor(resolution = 256, near = 0.1, far = 1000, options = {}) {
        super()
        this.resolution = resolution
        this.near = near
        this.far = far
        this.envMap = options.envMap || null
        this.fog = options.fog || null
        this.frames = options.frames || Infinity
        this.scene = options.scene || null
        this.renderer = options.renderer || null

        this.camera = new THREE.CubeCamera(this.near, this.far, this.createRenderTarget())
        this.add(this.camera)
        this.originalFog = null
        this.originalBackground = null
        this.count = 0
    }

    createRenderTarget () {
        const fbo = new THREE.WebGLCubeRenderTarget(this.resolution)
        fbo.texture.type = THREE.HalfFloatType
        return fbo
    }

    setScene (scene) {
        this.scene = scene
    }

    setRenderer (renderer) {
        this.renderer = renderer
    }

    update () {
        if (!this.renderer || !this.scene) {
            console.warn('EnvironmentMapCamera: Renderer and scene must be set before updating.')
            return
        }

        this.originalFog = this.scene.fog
        this.originalBackground = this.scene.background
        this.scene.background = this.envMap || this.originalBackground
        this.scene.fog = this.fog || this.originalFog
        this.visible = false
        this.camera.update(this.renderer, this.scene)
        this.visible = true

        this.scene.fog = this.originalFog
        this.scene.background = this.originalBackground
    }

    render (renderer, scene) {

        if (this.frames === Infinity || this.count < this.frames) {
            this.update()
            this.count++
        }
    }

    getTexture () {
        return this.camera.renderTarget.texture
    }

    get fbo () {
        return this.camera.renderTarget
    }

    get cameraCube () {
        return this.camera
    }


}
export { EnvironmentMapCamera }
