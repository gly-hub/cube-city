import * as THREE from 'three'
import Building from '../building.js'

export default class School extends Building {
  constructor(type = 'school', level = 1, direction = 0, options = {}) {
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

  // 重写 initModel 方法，使用更大的缩放值
  initModel() {
    const modelName = `${this.type}_level${this.level}`
    const modelResource = this.resources.items[modelName]
    if (modelResource && modelResource.scene) {
      const mesh = this.initMeshFromResource(modelResource)
      mesh.position.set(0, 0, 0)
      // 学校使用更大的缩放值，使其显示更明显
      mesh.scale.set(1.0, 1.0, 1.0)
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

