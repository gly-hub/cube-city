import * as THREE from 'three'
import Building from '../building.js'

export default class ThemePark extends Building {
  constructor(type = 'theme_park', level = 1, direction = 0, options = {}) {
    super(type, level, direction, options)

    // 使用新的配置系统，大部分状态效果已在配置文件中定义
    this.statusConfig = [
      // 继承基础的状态配置（包括道路检查和配置文件中的所有效果）
      ...super.getDefaultStatusConfig(),
      // 缺少电力（全局状态检查）
      {
        statusType: 'MISSING_POWER',
        condition: (building, gs) => gs.power > gs.maxPower,
        effect: { type: 'missPower', offsetY: 0.8 },
      },
      // 升级提示
      {
        statusType: 'UPGRADE',
        condition: (building, gs) => {
          const upgradeInfo = building.upgrade()
          return upgradeInfo && gs.credits >= building.getCost()
        },
        effect: { type: 'upgrade', offsetY: 0.7 },
      },
    ]
  }

  /**
   * 获取主题公园的缩放配置（根据等级）
   * @returns {object} { x, y, z } 缩放值
   */
  getScaleConfig() {
    // 根据等级设置不同的缩放比例
    // 等级越高，模型越大，体现主题公园的规模感
    const scaleConfigs = {
      1: { x: 1.2, y: 1.2, z: 1.2 }, // 1级：小型游乐园，稍大于默认
      2: { x: 1.4, y: 1.6, z: 1.4 }, // 2级：大型主题公园，更大
      3: { x: 1.6, y: 2.3, z: 1.6 }, // 3级：世界级主题公园，最大
    }
    return scaleConfigs[this.level] || scaleConfigs[1]
  }

  // 重写 initModel 方法，使用可调节的缩放值
  initModel() {
    const modelName = `${this.type}_level${this.level}`
    const modelResource = this.resources.items[modelName]
    if (modelResource && modelResource.scene) {
      const mesh = this.initMeshFromResource(modelResource)
      mesh.position.set(0, 0, 0)

      // 根据等级获取缩放配置
      const scale = this.getScaleConfig()
      mesh.scale.set(scale.x, scale.y, scale.z)

      // 设置朝向
      const angle = (this.direction % 4) * 90
      mesh.rotation.y = THREE.MathUtils.degToRad(angle)
      // 禁止建筑被选中
      mesh.raycast = () => {}
      this.setMesh(mesh)
    }
    else {
      // 没有资源时，使用占位体
      const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
      const material = new THREE.MeshStandardMaterial({ color: '#bdae93' })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(0, 0.4, 0)
      this.setMesh(mesh)
    }
  }

  getCost() {
    return this.options.buildingData?.cost || 0
  }

  // 重写 update 方法以调用新的轮循系统
  update() {
    // 调用父类的新轮循逻辑
    super.update()
  }
}
