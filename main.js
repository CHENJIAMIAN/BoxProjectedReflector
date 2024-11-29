import { applyBoxProjectedEnvMap } from './applyBoxProjectedEnvMap.js'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EnvironmentMapCamera } from './EnvironmentMapCamera.js'

let camera, scene, renderer, controls
let floorMesh, floorMaterial // Define floorMesh and floorMaterial outside the function to access them later
let environmentMapCamera, clonedFloor, clonedFloorMat

init()
render()

function init () {

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.body.appendChild(renderer.domElement)

    // Scene
    scene = new THREE.Scene()
    scene.fog = new THREE.Fog('purple', 0, 130)

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 40)
    camera.position.set(0, 5, 10)

    // Ambient Light
    const ambientLight = new THREE.AmbientLight('white', 3.1)
    scene.add(ambientLight)

    // Spot Lights
    const spotLight1 = new THREE.SpotLight('white', 10)
    spotLight1.position.set(-200, 220, -100)
    spotLight1.angle = 0.1
    spotLight1.castShadow = true
    spotLight1.shadow.mapSize.set(2048, 2048)
    spotLight1.shadow.bias = -0.000001
    scene.add(spotLight1)

    const spotLight2 = new THREE.SpotLight('white', 1)
    spotLight2.position.set(-250, 120, -200)
    spotLight2.angle = 0.1
    spotLight2.castShadow = true
    spotLight2.shadow.mapSize.set(50, 50)
    spotLight2.shadow.bias = -0.000001
    scene.add(spotLight2)

    const spotLight3 = new THREE.SpotLight('white', 1)
    spotLight3.position.set(250, 120, 200)
    spotLight3.angle = 0.1
    spotLight3.castShadow = true
    spotLight3.shadow.mapSize.set(50, 50)
    spotLight3.shadow.bias = -0.000001
    scene.add(spotLight3)

    // Court and Floor
    loadCourt()

    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    // controls.minPolarAngle = Math.PI / 2
    // controls.maxPolarAngle = Math.PI / 2
    controls.target.set(0, -1, 0)

    // Environment
    new RGBELoader()
        .load('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/hdris/noon-grass/noon_grass_1k.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping
            scene.background = texture
            scene.environment = texture
        })

    // GUI for Floor Controls
    const gui = new GUI()
    const floorConfig = {
        up: -0.5,
        scale: 27,
        roughness: 0.06,
        envMapIntensity: 1
    }

    gui.add(floorConfig, 'up', -10, 10).onChange(() => {
        updateFloor(floorConfig)
    })
    gui.add(floorConfig, 'scale', 0, 50).onChange(() => {
        updateFloor(floorConfig)
    })
    gui.add(floorConfig, 'roughness', 0, 0.15, 0.001).onChange(() => {
        updateFloor(floorConfig)
    })
    gui.add(floorConfig, 'envMapIntensity', 0, 5).onChange(() => {
        updateFloor(floorConfig)
    })

    window.addEventListener('resize', onWindowResize)
}
function loadCourt () {
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://fastly.jsdelivr.net/gh/mrdoob/three.js@master/examples/jsm/libs/draco/gltf/') // Use a CDN or your local path
    loader.setDRACOLoader(dracoLoader)
    loader.load('/court.glb', (gltf) => {
        const courtScene = gltf.scene
        courtScene.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true
                object.receiveShadow = true
                if (object.material) {
                    object.material.envMapIntensity = 0.1
                }

            }
        })
        const floor = courtScene.getObjectByName('GymFloor_ParquetShader_0')
        if (floor) {
            clonedFloor = floor.clone()
            floor.parent.remove(floor)
        }

        scene.add(courtScene)

        loadFloor()
    })
}



async function loadFloor () {
    const floorGeometry = clonedFloor.geometry

    floorMaterial = new THREE.MeshStandardMaterial({
        map: clonedFloor.material.map,
        normalMap: clonedFloor.material.normalMap,
        metalness: 0.0,
        normalScale: new THREE.Vector2(0.25, -0.25),
        color: '#aaa',
        roughness: 0.06,
        envMapIntensity: 1
    })
    window.floorMaterial = floorMaterial
    clonedFloor.material.normalMap.encoding = THREE.LinearEncoding
    clonedFloor.material.normalMap.needsUpdate = true

    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
    floorMesh.receiveShadow = true
    floorMesh.position.set(-13.68, -0.467, 17.52)
    floorMesh.scale.setScalar(0.02)

    // Create Cube Camera
    environmentMapCamera = new EnvironmentMapCamera(2048, 0.1, 1000, {
        // frames: 1
    })
    environmentMapCamera.setScene(scene)
    environmentMapCamera.setRenderer(renderer)
    environmentMapCamera.position.set(0, 0.5, 0)
    environmentMapCamera.add(floorMesh)
    scene.add(environmentMapCamera)

    environmentMapCamera.update(renderer, scene)
    floorMaterial.envMap = environmentMapCamera.getTexture()
}

function updateFloor (config) {
    if (!floorMesh || !floorMaterial) return

    // Update Floor Material
    floorMaterial.roughness = config.roughness
    floorMaterial.envMapIntensity = config.envMapIntensity

    // Apply Box Projected Env Map
    const projectionPosition = new THREE.Vector3(0, config.up, 0)
    const scale = config.scale
    const projectionSize = new THREE.Vector3(scale, scale, scale)
    applyBoxProjectedEnvMap(floorMaterial, projectionPosition, projectionSize)

    environmentMapCamera.update(renderer, scene)
}

function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render () {
    renderer.render(scene, camera)
}

function animate () {
    requestAnimationFrame(animate)

    render()
}

animate()