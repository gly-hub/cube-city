import { useGameState } from '@/stores/useGameState.js'
import * as THREE from 'three'
import Camera from './camera.js'
import Renderer from './renderer.js'
import sources from './sources.js'
import Debug from './utils/debug.js'
import { eventBus } from './utils/event-bus.js'
import IMouse from './utils/imouse.js'
import Resources from './utils/resources.js'
import Sizes from './utils/sizes.js'
import Stats from './utils/stats.js'
import Time from './utils/time.js'
import PhysicsWorld from './world/physics-world.js'
import World from './world/world.js'
import TowerDefenseWorld from './td/tower-defense-world.js'
import LevelSystem from './utils/level-system.js'
import QuestSystem from './utils/quest-system.js'
import AchievementSystem from './utils/achievement-system.js'
import TechSystem from './utils/tech-system.js'

let instance

export default class Experience {
  constructor(canvas) {
    // Singleton
    if (instance) {
      return instance
    }

    instance = this

    // Global access
    window.Experience = this

    this.canvas = canvas

    // 事件总线
    this.eventBus = eventBus

    // Panel
    this.debug = new Debug()
    this.stats = new Stats()
    this.sizes = new Sizes(this.canvas)
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.camera = new Camera(true)
    this.renderer = new Renderer()
    this.resources = new Resources(sources)
    this.physics = new PhysicsWorld()
    this.iMouse = new IMouse()
    this.world = new World()
    this.tdWorld = new TowerDefenseWorld()
    this.gameState = useGameState()

    // 监听场景切换事件
    this.eventBus.on('scene:change', (scene) => {
      console.log('Scene switching to:', scene)
      this.switchScene(scene)
    })
    
    // 初始化时根据当前场景设置显示状态
    // 延迟执行，确保 world 和 tdWorld 都已初始化
    setTimeout(() => {
      console.log('初始化场景:', this.gameState.currentScene)
      this.switchScene(this.gameState.currentScene)
    }, 100)

    // 初始化关卡系统、任务系统、成就系统和科技系统
    this.levelSystem = new LevelSystem()
    this.questSystem = new QuestSystem()
    this.achievementSystem = new AchievementSystem()
    this.techSystem = new TechSystem()
    
    // 初始化科技系统
    this.techSystem.init(this.gameState)
    
    // 将系统挂载到全局，方便访问
    window.levelSystem = this.levelSystem
    window.questSystem = this.questSystem
    window.achievementSystem = this.achievementSystem
    window.techSystem = this.techSystem

    // 启动关卡检测
    this.levelSystem.start()

    // 等待资源加载完成后，刷新任务和成就进度（扫描现有建筑）
    this.resources.on('ready', () => {
      // 延迟一下确保 metadata 已初始化
      setTimeout(() => {
        if (this.questSystem) {
          this.questSystem.refreshAllQuests()
        }
        if (this.achievementSystem) {
          this.achievementSystem.refreshAllAchievements()
        }
        if (this.techSystem) {
          this.techSystem.refreshAllTechEffects()
        }
      }, 500)
    })

    this.sizes.on('resize', () => {
      this.resize()
    })

    this.time.on('tick', () => {
      this.update()
    })
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
  }

  switchScene(sceneName) {
    console.log('Experience.switchScene:', sceneName)
    if (sceneName === 'CITY') {
      this.tdWorld.hide()
      this.world.show()
    } else if (sceneName === 'TD') {
      this.world.hide()
      this.tdWorld.show()
    }
    // 相机切换由 Camera 类监听 scene:change 事件自动处理
  }

  update() {
    this.camera.update()
    
    // 根据当前场景更新对应的世界
    if (this.gameState.currentScene === 'CITY') {
    this.world.update()
    } else if (this.gameState.currentScene === 'TD') {
      this.tdWorld.update()
    }

    this.renderer.update() // 切换为手动更新
    this.stats.update()
    this.iMouse.update()
    
    // 定期检查指标类成就（每5秒检查一次）
    if (this.time && this.time.elapsed % 5000 < 100) {
      if (this.achievementSystem) {
        this.achievementSystem.checkMetricAchievements()
      }
    }
  }
}
