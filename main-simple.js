import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EnvironmentMapCamera } from './EnvironmentMapCamera.js'
import { applyBoxProjectedEnvMap } from './applyBoxProjectedEnvMap.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// --- Main Scene ---
window.THREE = THREE
const scene = new THREE.Scene()
window.scene = scene
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// 添加环境光，参数为光的颜色和强度
// const ambientLight = new THREE.AmbientLight(0xffffff, 1) // 白色光，强度为0.5
// scene.add(ambientLight)

// 其余的 Three.js 场景设置代码...
// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)
controls.update()

// Load HDR environment map
const rgbeLoader = new RGBELoader()
rgbeLoader.load('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/hdris/noon-grass/noon_grass_1k.hdr', (hdrEquirect) => {
    // Set the HDR texture as the scene's background and environment
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping
    scene.background = hdrEquirect
    scene.environment = hdrEquirect


    // !important 此时才有环境
    environmentMapCamera.render(renderer, scene) // Render the cubemap first

    window.environmentMapCamera = environmentMapCamera
    window.planeMaterial = planeMaterial

    planeMaterial.envMap = environmentMapCamera.getTexture()
    planeMaterial.envMapIntensity = 0.1
    planeMaterial.needsUpdate = true
})

// Cube Camera
const environmentMapCamera = new EnvironmentMapCamera(2048, 0.1, 10, {
    // frames: 1
}) // Declare outside so it can be used later
environmentMapCamera.setScene(scene)
environmentMapCamera.setRenderer(renderer)

// 创建立方体几何体
const cubeGeometry = new THREE.BoxGeometry(1, 8, 1)
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 'red',/*  side: THREE.DoubleSide */ })
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.position.set(3, 4, 0) // 设置立方体的位置
scene.add(cube)

const cubeGeometry2 = new THREE.BoxGeometry(1, 8, 1)
const cubeMaterial2 = new THREE.MeshBasicMaterial({ color: 'green',/*  side: THREE.DoubleSide */ })
const cube2 = new THREE.Mesh(cubeGeometry2, cubeMaterial2)
cube2.position.set(0, 4, 3) // 设置立方体的位置
scene.add(cube2)

const directionalLight = new THREE.DirectionalLight('red', 0.5) // 白色的光
directionalLight.position.set(5, 10, 5) // 设置聚光灯的位置
scene.add(directionalLight)

// Plane Geometry and Material
const planeGeometry = new THREE.PlaneGeometry(22, 22)
const planeMaterial = new THREE.MeshStandardMaterial({ /* color: new THREE.Color('green'), */ roughness: 0.06, metalness: 0.8 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.set(-Math.PI / 2, 0, 0)
environmentMapCamera.add(plane)
scene.add(environmentMapCamera)

// Apply Box Projected Env Map
const projectionPosition = new THREE.Vector3(0, -0.5, 0)
const scale = 50
const projectionSize = new THREE.Vector3(scale, scale / .0010, scale)
applyBoxProjectedEnvMap(planeMaterial, projectionPosition, projectionSize)


camera.position.z = 5

function animate () {
    requestAnimationFrame(animate)

    renderer.render(scene, camera)

    // !important 此时才有环境
    // environmentMapCamera.render(renderer, scene) // Render the cubemap first
}

animate()