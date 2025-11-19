import * as THREE from 'three'
import Experience from '../experience.js'
import SimObject from '../components/tiles/sim-object.js'
import { createBuilding } from '../components/tiles/building-factory.js'

// 外城 Tile 类，用于塔防地图，继承 SimObject
export default class TDTile extends SimObject {
  /**
   * @param {number} x
   * @param {number} y
   * @param {object} options
   *   options.type: 'base' | 'road' | 'start' | 'end'
   *   options.hasTower: boolean
   */
  constructor(x, y, { type = 'base', hasTower = false } = {}) {
    const experience = new Experience()
    const resources = experience.resources
    super(x, y, null)
    
    this.experience = experience
    this.resources = resources
    // 保存原始坐标（用于查找）- 使用 _tileX 和 _tileY 避免与 SimObject 的只读 getter 冲突
    this._tileX = x
    this._tileY = y
    this.name = `TDTile-${x}-${y}`
    this.type = type
    this.hasTower = hasTower
    this.towerInstance = null
    this.buildingInstance = null // 道路建筑实例
    this.decorativeBuilding = null // 装饰建筑实例

    // ========== 创建 grass mesh（和内城完全一致） ==========
    const grassResource = resources.items.grass ? resources.items.grass : null
    let grassMesh = null
    
    if (grassResource) {
      grassMesh = this.initMeshFromResource(grassResource)
      // 如果有资源，设置材质属性（和内城一致）
      if (grassMesh && grassMesh.children && grassMesh.children[0] && grassMesh.children[0].material) {
        grassMesh.children[0].material.metalness = Math.random() * 0.5
        grassMesh.children[0].material.roughness = Math.random() * 0.5
      }
    }

    this.grassMesh = grassResource && grassMesh
      ? grassMesh
      : new THREE.Mesh(
        new THREE.BoxGeometry(0.98, 0.2, 0.98),
        new THREE.MeshStandardMaterial({ color: '#579649' }), // 和内城相同的绿色
      )
    this.grassMesh.position.set(0, 0, 0)
    this.grassMesh.scale.set(0.98, 1, 0.98)
    this.grassMesh.userData = this
    this.grassMesh.name = `${this.name}-grass`

    // ========== 创建 ground mesh（上层，用于道路，和内城一致） ==========
    const groundResource = resources.items.ground ? resources.items.ground : null
    let groundMesh = null
    
    if (groundResource) {
      groundMesh = this.initMeshFromResource(groundResource)
    }
    
    // 根据类型决定 ground mesh 的材质
    let groundMaterial = null
    if (type === 'start') {
      // 起点：黄色
      groundMaterial = new THREE.MeshStandardMaterial({ color: '#ecc94b' })
    } else if (type === 'end') {
      // 终点：红色
      groundMaterial = new THREE.MeshStandardMaterial({ color: '#f56565' })
    } else if (type === 'road') {
      // 道路：使用 ground 资源或默认道路颜色
      if (!groundMesh) {
        groundMaterial = new THREE.MeshStandardMaterial({ color: '#a89984' }) // 和内城相同的道路颜色
      }
    } else {
      // 普通草地：使用 ground 资源或默认道路颜色（但默认不显示）
      if (!groundMesh) {
        groundMaterial = new THREE.MeshStandardMaterial({ color: '#a89984' })
      }
    }
    
    this.groundMesh = groundResource && groundMesh
      ? groundMesh
      : new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.2, 1),
        groundMaterial || new THREE.MeshStandardMaterial({ color: '#a89984' }),
      )
    
    // 如果起点或终点，覆盖材质
    if (type === 'start' && this.groundMesh.material) {
      this.groundMesh.material.color.set('#ecc94b')
    } else if (type === 'end' && this.groundMesh.material) {
      this.groundMesh.material.color.set('#f56565')
    }
    
    this.groundMesh.position.set(0, 0.01, 0) // 稍微高于 grass，避免 z-fighting
    this.groundMesh.scale.set(0.98, 1, 0.98)
    this.groundMesh.userData = this
    this.groundMesh.name = `${this.name}-ground`
    
    // 根据类型设置 ground mesh 的可见性
    if (type === 'road' || type === 'start' || type === 'end') {
      this.groundMesh.visible = true // 道路、起点、终点显示 ground
    } else {
      this.groundMesh.visible = false // 普通草地不显示 ground
    }

    this.grassMesh.add(this.groundMesh)

    this.setMesh(this.grassMesh)
    
    // 如果是道路、起点或终点，添加道路建筑实例（等待资源加载完成）
    if (type === 'road' || type === 'start' || type === 'end') {
      // 如果资源已加载，立即创建道路；否则等待资源加载完成
      if (resources.items.road) {
        this.setRoad()
      } else {
        // 等待资源加载完成后再创建道路
        const checkResources = () => {
          if (resources.items.road) {
            this.setRoad()
          } else {
            setTimeout(checkResources, 100)
          }
        }
        checkResources()
      }
    }
  }

  // 添加道路建筑实例（使用内城的道路模型）
  setRoad() {
    this.removeRoad()
    const roadInstance = createBuilding('road', 1, 0, {
      buildingData: null,
      levelData: null,
      position: { x: this._tileX, y: this._tileY }
    })
    if (roadInstance) {
      this.buildingInstance = roadInstance
      this.grassMesh.add(roadInstance)
    }
  }

  // 移除道路建筑实例
  removeRoad() {
    if (this.buildingInstance) {
      this.grassMesh.remove(this.buildingInstance)
      this.buildingInstance = null
    }
  }

  // 刷新道路视图（根据相邻道路自动选择正确的道路模型）
  refreshRoadView(city) {
    if (this.buildingInstance && this.buildingInstance.type === 'road' && this.buildingInstance.refreshView) {
      // Road 类的 refreshView 会检查相邻地块，需要确保它能正确识别外城的道路
      this.buildingInstance.refreshView(city)
    }
  }

  setTower(tower) {
    this.towerInstance = tower
    this.hasTower = true
    if (tower) {
      this.grassMesh.add(tower)
    }
  }

  removeTower() {
    if (this.towerInstance) {
      console.log('开始移除防御塔，towerInstance:', this.towerInstance)
      console.log('防御塔的父级:', this.towerInstance.parent)
      console.log('grassMesh:', this.grassMesh)
      
      // 确保从 grassMesh 中移除（防御塔是通过 setTower 添加到 grassMesh 的）
      if (this.grassMesh && this.grassMesh.children) {
        const index = this.grassMesh.children.indexOf(this.towerInstance)
        if (index > -1) {
          console.log('从 grassMesh 中移除防御塔，索引:', index)
          this.grassMesh.remove(this.towerInstance)
        } else {
          console.warn('防御塔不在 grassMesh.children 中')
        }
      }
      
      // 同时也从父级移除（以防万一）
      if (this.towerInstance.parent) {
        console.log('从父级移除防御塔，父级:', this.towerInstance.parent)
        this.towerInstance.parent.remove(this.towerInstance)
      }
      
      // 清理几何体和材质
      if (this.towerInstance.geometry) {
        this.towerInstance.geometry.dispose()
      }
      if (this.towerInstance.material) {
        if (Array.isArray(this.towerInstance.material)) {
          this.towerInstance.material.forEach(mat => mat.dispose())
        } else {
          this.towerInstance.material.dispose()
        }
      }
      
      // 如果是 Group，清理所有子对象
      if (this.towerInstance.children && this.towerInstance.children.length > 0) {
        this.towerInstance.children.forEach(child => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
        this.towerInstance.clear()
      }
      
      this.towerInstance = null
      this.hasTower = false
      console.log('防御塔移除完成')
    } else {
      console.warn('removeTower 被调用，但 towerInstance 为 null')
    }
  }

  // 设置装饰建筑（类似内城的建筑）
  setBuilding(buildingType, level = 1, direction = 0) {
    this.removeBuilding()
    const buildingInstance = createBuilding(buildingType, level, direction, {
      buildingData: null,
      levelData: null,
      position: { x: this._tileX, y: this._tileY }
    })
    if (buildingInstance) {
      this.decorativeBuilding = buildingInstance
      this.grassMesh.add(buildingInstance)
    }
  }

  // 移除装饰建筑
  removeBuilding() {
    if (this.decorativeBuilding) {
      this.grassMesh.remove(this.decorativeBuilding)
      this.decorativeBuilding = null
    }
  }

  update() {
    if (this.towerInstance && this.towerInstance.update) {
      this.towerInstance.update()
    }
    if (this.decorativeBuilding && this.decorativeBuilding.update) {
      this.decorativeBuilding.update()
    }
  }
}

