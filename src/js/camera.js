import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import Experience from './experience.js'
import { useGameState } from '@/stores/useGameState.js'

export default class Camera {
  constructor(orthographic = false) {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas
    this.orthographic = orthographic
    this.debug = this.experience.debug
    this.debugActive = this.experience.debug.active
    this.eventBus = this.experience.eventBus

    /* ---------- 固定点位 ---------- */
    this.fixedPoints = [
      new THREE.Vector3(18, 10, 18),
      new THREE.Vector3(18, 10, -2),
      new THREE.Vector3(-2, 10, -2),
      new THREE.Vector3(-2, 10, 18),
    ]
    this.currentIndex = 0 // 当前点位索引
    this.target = new THREE.Vector3(8, 0, 8)

    // 塔防模式的相机设置（使用和内城一致的2.5D等距视角）
    // 外城地图是 16x16，中心在 (0, 0, 0)
    // 内城视角：从 (18, 10, 18) 看向 (8, 0, 8)，相对偏移 (10, 10, 10)
    // 外城使用类似的比例：从 (12, 8, 12) 看向 (0, 0, 0)，保持相同的视角角度
    this.tdPosition = new THREE.Vector3(12, 8, 12) // 等距视角，类似内城，适配 16x16 地图
    this.tdTarget = new THREE.Vector3(0, 0, 0) // 地图中心

    this.isRotating = false // 是否正在切换动画
    this.initialAngle = null // 记录"初始角"，仅作为标记，不强制使用

    this.setInstance()
    this.setControls()
    this.setDebug()
    this.setKeyboardControls()

    // 监听场景切换
    this.eventBus.on('scene:change', (scene) => {
      this.handleSceneChange(scene)
    })
  }

  /* -------------------------------------------------- */
  /*  其余函数保持不变（setInstance / setControls ……）  */
  /* -------------------------------------------------- */

  setInstance() {
    const gameState = useGameState()
    
    if (this.orthographic) {
      const aspect = this.sizes.aspect
      this.frustumSize = 10
      this.instance = new THREE.OrthographicCamera(
        -this.frustumSize * aspect,
        this.frustumSize * aspect,
        this.frustumSize,
        -this.frustumSize,
        -50,
        100,
      )
    }
    else {
      this.instance = new THREE.PerspectiveCamera(
        34,
        this.sizes.width / this.sizes.height,
        0.1,
        100,
      )
    }

    // 根据当前场景设置初始相机位置
    if (gameState.currentScene === 'TD') {
      // 外城：使用 TD 视角
      this.instance.position.copy(this.tdPosition)
      this.instance.lookAt(this.tdTarget)
      console.log('相机初始化：外城视角', this.tdPosition)
    } else {
      // 内城：使用固定点位 0
      this.instance.position.copy(this.fixedPoints[this.currentIndex])
      this.instance.lookAt(this.target)
      console.log('相机初始化：内城视角', this.fixedPoints[this.currentIndex])
    }
    
    this.scene.add(this.instance)
  }

  setControls() {
    const gameState = useGameState()
    
    // 根据当前场景确定初始 target
    const initialTarget = gameState.currentScene === 'TD' ? this.tdTarget : this.target
    
    // 鼠标自由旋转（OrbitControls）
    this.orbitControls = new OrbitControls(this.instance, this.canvas)
    this.orbitControls.enableDamping = true
    this.orbitControls.enableZoom = false
    this.orbitControls.enableRotate = true // 允许鼠标旋转
    this.orbitControls.dampingFactor = 0.3
    this.orbitControls.target.copy(initialTarget)

    // 锁定垂直极角：当前相机 -> 目标点的方向
    const offset = new THREE.Vector3().subVectors(this.instance.position, initialTarget)
    const polarAngle = offset.angleTo(new THREE.Vector3(0, 1, 0))
    this.orbitControls.minPolarAngle = polarAngle
    this.orbitControls.maxPolarAngle = polarAngle

    // 缩放（TrackballControls）
    this.trackballControls = new TrackballControls(this.instance, this.canvas)
    this.trackballControls.noRotate = true
    this.trackballControls.noPan = true
    this.trackballControls.noZoom = false
    this.trackballControls.zoomSpeed = 1
    this.trackballControls.minZoom = 0.5
    this.trackballControls.maxZoom = 2
    this.trackballControls.target.copy(initialTarget)
    this.trackballControls.handleResize()
    
    console.log('Controls 初始化完成, target:', initialTarget, 'scene:', gameState.currentScene)
  }

  setDebug() {
    if (this.debugActive) {
      const folder = this.debug.ui.addFolder({ title: 'Camera', expanded: false })
      folder.addBinding(this.instance, 'position', { label: 'Position' })
        .on('change', () => this.instance.lookAt(this.target))
    }
  }

  resize() {
    if (this.orthographic) {
      const aspect = this.sizes.width / this.sizes.height
      this.instance.left = -this.frustumSize * aspect
      this.instance.right = this.frustumSize * aspect
      this.instance.top = this.frustumSize
      this.instance.bottom = -this.frustumSize
      this.instance.updateProjectionMatrix()
    }
    else {
      this.instance.aspect = this.sizes.width / this.sizes.height
      this.instance.updateProjectionMatrix()
    }
    this.trackballControls.handleResize()
  }

  update() {
    this.orbitControls.update()
    this.trackballControls.update()
  }

  /* -------------------------------------------------- */
  /*              键盘切换逻辑（核心改动）               */
  /* -------------------------------------------------- */
  setKeyboardControls() {
    window.addEventListener('keydown', (ev) => {
      // 如果是外城模式，禁用键盘旋转
      if (this.experience.gameState.currentScene === 'TD') return

      if (this.isRotating)
        return

      if (ev.key === 'ArrowLeft') {
        this.snapToNextPoint(-1) // 逆时针
      }
      else if (ev.key === 'ArrowRight') {
        this.snapToNextPoint(1) // 顺时针
      }
    })
  }

  snapToNextPoint(step) {
    // 1. 找到离当前相机最近的点位
    const pos = this.instance.position
    let closest = 0
    let minDist = pos.distanceTo(this.fixedPoints[0])

    for (let i = 1; i < this.fixedPoints.length; i++) {
      const d = pos.distanceTo(this.fixedPoints[i])
      if (d < minDist) {
        minDist = d
        closest = i
      }
    }

    // 2. 计算下一个点位索引
    const next = (closest + step + this.fixedPoints.length) % this.fixedPoints.length

    // 3. 执行动画
    this.animateTo(this.fixedPoints[next], this.target)
  }

  animateTo(targetPos, lookAtTarget) {
    this.isRotating = true

    gsap.to(this.instance.position, {
      duration: 0.7,
      ease: 'power2.inOut',
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      onUpdate: () => {
        this.instance.lookAt(lookAtTarget)
        // 同步控制器
        this.orbitControls.target.copy(lookAtTarget)
        this.trackballControls.target.copy(lookAtTarget)
      },
      onComplete: () => {
        this.isRotating = false
        this.orbitControls.update()
        this.trackballControls.update()
      },
    })
  }

  handleSceneChange(scene) {
    if (scene === 'TD') {
      // 切换到塔防视角：使用和内城一致的2.5D等距视角
      this.animateTo(this.tdPosition, this.tdTarget)
      // 保持和内城相同的旋转和角度限制
      this.orbitControls.enableRotate = true
      // 计算等距视角的极角（和内城保持一致）
      const offset = new THREE.Vector3().subVectors(this.tdPosition, this.tdTarget)
      const polarAngle = offset.angleTo(new THREE.Vector3(0, 1, 0))
      this.orbitControls.minPolarAngle = polarAngle
      this.orbitControls.maxPolarAngle = polarAngle
      // 更新控制器的目标点
      this.orbitControls.target.copy(this.tdTarget)
    } else {
      // 切换回内城视角
      this.animateTo(this.fixedPoints[this.currentIndex], this.target)
      // 恢复旋转和角度限制
      this.orbitControls.enableRotate = true
      const offset = new THREE.Vector3().subVectors(this.fixedPoints[this.currentIndex], this.target)
      const polarAngle = offset.angleTo(new THREE.Vector3(0, 1, 0))
      this.orbitControls.minPolarAngle = polarAngle
      this.orbitControls.maxPolarAngle = polarAngle
      // 更新控制器的目标点
      this.orbitControls.target.copy(this.target)
    }
  }
}
