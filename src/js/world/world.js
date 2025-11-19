import City from '../components/tiles/city.js'
import Experience from '../experience.js'
import Interactor from '../tools/interactor.js'
import Environment from './environment.js'
import SceneMetadata from './scene-metadata.js'
import { useGameState } from '@/stores/useGameState.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.gameState = useGameState()

    // 新增：场景元数据管理器
    this.experience.sceneMetadata = new SceneMetadata()
    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      // 实例化城市地皮
      this.city = new City()

      // 确保初始化时根据当前场景设置可见性
      if (this.gameState.currentScene !== 'CITY') {
        this.hide()
      }

      // 交互系统
      this.interactor = new Interactor(this.city.root)
    })
  }

  update() {
    // 若 city 有 update 行为可调用
    if (this.city && this.city.update) {
      this.city.update()
    }
    if (this.interactor && this.interactor.update) {
      this.interactor.update()
    }
  }

  show() {
    if (this.city && this.city.root) {
      this.city.root.visible = true
    }
    if (this.environment) {
      if (this.environment.sunLight) this.environment.sunLight.visible = true
      if (this.environment.ambientLight) this.environment.ambientLight.visible = true
      if (this.environment.hemisphereLight) this.environment.hemisphereLight.visible = true
    }
  }

  hide() {
    if (this.city && this.city.root) {
      this.city.root.visible = false
    }
    if (this.environment) {
      if (this.environment.sunLight) this.environment.sunLight.visible = false
      if (this.environment.ambientLight) this.environment.ambientLight.visible = false
      if (this.environment.hemisphereLight) this.environment.hemisphereLight.visible = false
    }
  }
}
