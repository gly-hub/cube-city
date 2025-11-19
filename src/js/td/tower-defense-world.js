import * as THREE from 'three'
import Experience from '../experience.js'
import { useGameState } from '@/stores/useGameState.js'
import TDCity from './td-city.js'
import TDTile from './td-tile.js'

export default class TowerDefenseWorld {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time
    this.debug = this.experience.debug
    this.iMouse = this.experience.iMouse
    this.gameState = useGameState()

    // 塔防世界的根容器
    this.root = new THREE.Group()
    this.scene.add(this.root)
    this.root.visible = false

    this.enemies = []
    this.towers = []
    this.projectiles = []
    this.pathPoints = []

    // 游戏状态（从 gameState 读取，支持持久化）
    this.wave = this.gameState.tdGameData.wave
    this.baseHealth = this.gameState.tdGameData.baseHealth
    this.isWaveActive = this.gameState.tdGameData.isWaveActive
    this.enemiesToSpawn = 0
    this.spawnInterval = 1500
    this.lastSpawnTime = 0
    
    // 用于检测是否是刷新后的初始化
    this.isInitialLoad = true

    // 拖拽状态
    this.draggingTowerType = null
    this.dragPreview = null

    // 射线检测器
    this.raycaster = new THREE.Raycaster()

    // 初始化
    this.init()
    
    // 绑定事件处理方法（保存引用以便后续移除）
    this.boundHandleClick = this.handleClick.bind(this)
    this.boundHandleDragOver = this.handleDragOver.bind(this)
    this.boundHandleDrop = this.handleDrop.bind(this)
    this.boundHandleDragLeave = this.handleDragLeave.bind(this)
    
    // 注意：事件监听器在 show() 时添加，在 hide() 时移除，避免干扰内城
    this.eventListenersAttached = false
    
    // 监听事件
    this.experience.eventBus.on('td:start-wave', () => {
      this.startWave()
    })
    this.experience.eventBus.on('td:drag-start', (towerType) => {
      this.draggingTowerType = towerType
    })
    this.experience.eventBus.on('td:drag-end', () => {
      this.draggingTowerType = null
    })
    this.experience.eventBus.on('td:upgrade-tower', () => {
      this.upgradeTower()
    })
    this.experience.eventBus.on('td:demolish-tower', () => {
      this.demolishSelectedTower()
    })
  }

  init() {
    // 创建环境（光照等）
    this.createEnvironment()
    
    // 等待资源加载完成后再创建城市
    if (this.resources.items.grass) {
      this.createCity()
    } else {
      this.resources.on('ready', () => {
        this.createCity()
      })
    }
  }

  createEnvironment() {
    // 外城使用和内城相同的环境光（通过 World 的环境系统）
    // 这里不需要额外创建，因为两个场景共用同一个 scene
  }

  createCity() {
    console.log('创建外城城市')
    
    // 如果 city 已存在，先清理旧数据
    if (this.city) {
      console.log('清理旧的外城数据')
      this.clearAllTowers()
      if (this.city.root) {
        this.root.remove(this.city.root)
      }
      this.city = null
    }
    
    this.city = new TDCity()
    // 将 city 的 root 添加到 tdWorld 的 root
    this.root.add(this.city.root)
    // 路径点从 city 中获取
    this.pathPoints = this.city.pathPoints
    console.log('外城创建完成，路径点数量:', this.pathPoints.length)
    console.log('外城 root 层级:', this.root.children.length, 'city root 层级:', this.city.root.children.length)

    // 恢复已保存的防御塔
    this.restoreTowers()
  }

  /**
   * 清除所有防御塔（3D 对象和数据）
   */
  clearAllTowers() {
    console.log('清除所有防御塔，当前数量:', this.towers.length)
    
    // 移除所有防御塔的 3D 对象
    while (this.towers.length > 0) {
      const tower = this.towers[0]
      const tile = tower.userData?.tile
      
      if (tile) {
        tile.removeTower()
      } else {
        // 如果没有 tile 引用，直接从场景移除
        if (tower.parent) {
          tower.parent.remove(tower)
        }
        if (tower.geometry) tower.geometry.dispose()
        if (tower.material) tower.material.dispose()
      }
      
      this.towers.shift()
    }
    
    console.log('所有防御塔已清除')
  }

  /**
   * 从持久化数据恢复防御塔
   */
  restoreTowers() {
    const savedTowers = this.gameState.tdGameData.towers || []
    console.log(`正在恢复 ${savedTowers.length} 个防御塔...`)

    // 如果没有保存的防御塔，直接返回
    if (savedTowers.length === 0) {
      console.log('没有需要恢复的防御塔')
      return
    }

    // 确保 city 和 city.getTile 方法存在
    if (!this.city || typeof this.city.getTile !== 'function') {
      console.error('城市未初始化或 getTile 方法不存在，无法恢复防御塔')
      return
    }

    savedTowers.forEach((towerData, index) => {
      try {
        const tile = this.city.getTile(towerData.tileX, towerData.tileY)
        if (!tile) {
          console.warn(`防御塔 ${index}: tile (${towerData.tileX}, ${towerData.tileY}) 不存在`)
          return
        }

        if (tile.type !== 'base') {
          console.warn(`防御塔 ${index}: tile (${towerData.tileX}, ${towerData.tileY}) 不是基础类型，是 ${tile.type}`)
          return
        }

        if (tile.hasTower) {
          console.warn(`防御塔 ${index}: tile (${towerData.tileX}, ${towerData.tileY}) 已经有防御塔了`)
          return
        }

        // 创建防御塔 mesh
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.5, 1, 8),
          new THREE.MeshStandardMaterial({ 
            color: towerData.type === 'basic' ? 0x4a9eff : 
                   towerData.type === 'rapid' ? 0xffb800 : 0xff4757 
          })
        )
        
        // 添加到 tile
        tile.setTower(tower)
        
        // 保存防御塔的完整数据
        tower.userData = {
          id: `tower_${towerData.tileX}_${towerData.tileY}`,
          name: this.getTowerName(towerData.type),
          type: towerData.type,
          damage: towerData.damage,
          range: towerData.range,
          cooldown: towerData.cooldown,
          level: towerData.level,
          cost: towerData.cost,
          lastFireTime: 0,
          tile: tile,
        }
        
        // 添加到 towers 数组（只保存 mesh，保持一致性）
        this.towers.push(tower)
        
        console.log(`恢复防御塔: ${tower.userData.name} 等级 ${tower.userData.level} at (${towerData.tileX}, ${towerData.tileY})`)
      } catch (error) {
        console.error(`恢复防御塔 ${index} 时出错:`, error)
      }
    })

    console.log(`防御塔恢复完成，当前共有 ${this.towers.length} 个防御塔`)
    
    // ===== 修复：检查波次状态 =====
    // 如果 isWaveActive 为 true，但没有敌人和待生成敌人，说明是从战斗中刷新的
    // 这种情况下，应该重置 isWaveActive，要求用户重新开始当前波次
    if (this.isWaveActive && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      console.warn('检测到战斗状态异常（战斗中刷新），重置 isWaveActive，需要重新开始当前波次')
      this.isWaveActive = false
      this.gameState.setTDGameData({ isWaveActive: false })
      
      // 通知 UI 层更新状态
      this.experience.eventBus.emit('td:wave-reset', { wave: this.wave })
    }
  }

  handleClick(event) {
    // 检查当前场景是否为外城
    if (this.gameState.currentScene !== 'TD') {
      return
    }
    
    if (!this.root.visible || !this.city) {
      return
    }

    // 防止事件冒泡（避免与其他点击处理冲突）
    if (event) {
      event.stopPropagation()
    }

    // 防止在处理过程中重复触发
    if (this.isHandlingClick) {
      return
    }
    this.isHandlingClick = true

    try {
      this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.experience.camera.instance)
    
      // 检测点击的对象：同时检测 tile 和 tower
      const allObjects = []
      
      // 添加所有 tile 的 grassMesh
      this.city.meshes.forEach(row => {
        row.forEach(tile => {
          if (tile.grassMesh) {
            allObjects.push(tile.grassMesh)
          }
          // 如果有防御塔，也添加防御塔 mesh（优先检测）
          if (tile.hasTower && tile.towerInstance) {
            allObjects.push(tile.towerInstance)
          }
        })
      })

      const intersects = this.raycaster.intersectObjects(allObjects, true)

      if (intersects.length === 0) {
        // 点击空地：清除选择
        setTimeout(() => {
          this.gameState.setSelectedTower(null)
        }, 0)
        this.isHandlingClick = false
        return
      }

      const clickedObject = intersects[0].object
      let tile = null
      
      // 如果点击的是防御塔，通过 userData 或父级找到 tile
      if (clickedObject.userData && clickedObject.userData.tile) {
        tile = clickedObject.userData.tile
      } else if (clickedObject.userData && clickedObject.userData instanceof TDTile) {
        tile = clickedObject.userData
      } else {
        // 尝试从父级查找
        let parent = clickedObject.parent
        while (parent) {
          if (parent.userData && parent.userData instanceof TDTile) {
            tile = parent.userData
            break
          }
          parent = parent.parent
        }
      }
      
      // 如果还是找不到，尝试从 grassMesh 的 userData 获取
      if (!tile && clickedObject.userData) {
        tile = clickedObject.userData
      }

      if (!tile || !(tile instanceof TDTile)) {
        this.isHandlingClick = false
        return
      }

      // 简化的点击逻辑：点击防御塔显示详情，点击空地清除选择
      if (tile.hasTower && tile.towerInstance) {
        // 点击防御塔：显示详情
        console.log('点击防御塔，坐标:', tile._tileX, tile._tileY)
        this.handleSelectTower(tile)
      } else {
        // 点击空地：清除选择
        setTimeout(() => {
          this.gameState.setSelectedTower(null)
        }, 0)
      }
    } finally {
      // 立即重置标志，但状态更新已通过 setTimeout 延迟
      this.isHandlingClick = false
    }
  }

  // 选中防御塔（显示详情）
  handleSelectTower(tile) {
    const tower = tile.towerInstance
    if (!tower) {
      console.warn('防御塔实例不存在')
      return
    }
    
    // 获取防御塔的实际数据
    const towerType = tower.userData.type
    const towerLevel = tower.userData.level || 1
    
    // 只保存必要的数据，避免循环引用导致响应式死循环
    const towerData = {
      id: towerType,
      name: this.getTowerName(towerType),
      damage: tower.userData.damage || 20,
      range: tower.userData.range || 5,
      cooldown: tower.userData.cooldown || 1000,
      level: towerLevel,
      // 使用实际的建造成本（根据类型和等级计算）
      cost: this.getTowerCost(towerType, towerLevel),
      // 只保存坐标，不保存整个对象
      tileX: tile._tileX,
      tileY: tile._tileY,
      // 保存弱引用标识，用于后续查找
      _tileId: `${tile._tileX}-${tile._tileY}`,
      _towerId: tower.uuid || tower.id
    }
    
    console.log('选中防御塔:', towerData)
    
    // 延迟状态更新，避免在事件处理过程中触发响应式循环
    setTimeout(() => {
      this.gameState.setSelectedTower(towerData)
      this.gameState.setSelectedPosition({ x: tile._tileX, z: tile._tileY })
    }, 0)
  }

  // 选择模式：选中防御塔（保留兼容性）
  handleSelectMode(tile) {
    if (tile.hasTower && tile.towerInstance) {
      const tower = tile.towerInstance
      // 只保存必要的数据，避免循环引用导致响应式死循环
      // 不保存 tile 和 tower 对象本身，而是保存坐标和引用
      const towerData = {
        id: tower.userData.type,
        name: this.getTowerName(tower.userData.type),
        damage: tower.userData.damage,
        range: tower.userData.range,
        cooldown: tower.userData.cooldown,
        level: tower.userData.level || 1,
        cost: this.getTowerCost(tower.userData.type, tower.userData.level || 1),
        // 只保存坐标，不保存整个对象
        tileX: tile._tileX,
        tileY: tile._tileY,
        // 保存弱引用标识，用于后续查找
        _tileId: `${tile._tileX}-${tile._tileY}`,
        _towerId: tower.uuid || tower.id
      }
      
      // 延迟状态更新，避免在事件处理过程中触发响应式循环
      setTimeout(() => {
        this.gameState.setSelectedTower(towerData)
        this.gameState.setSelectedPosition({ x: tile._tileX, z: tile._tileY })
      }, 0)
    } else {
      // 点击空地，清除选择
      setTimeout(() => {
        this.gameState.setSelectedTower(null)
      }, 0)
    }
  }

  // 建造模式：放置防御塔
  handleBuildMode(tile) {
    if (tile.type !== 'base' || tile.hasTower) {
      this.experience.eventBus.emit('toast:add', {
        message: '无法在此位置放置防御塔',
        type: 'warning'
      })
      return
    }
    this.placeTower(tile)
  }

  // 拆除模式：拆除防御塔
  handleDemolishMode(tile) {
    if (!tile.hasTower || !tile.towerInstance) {
      this.experience.eventBus.emit('toast:add', {
        message: '该位置没有防御塔',
        type: 'info'
      })
      return
    }

    const tower = tile.towerInstance
    const towerType = tower.userData.type
    const towerLevel = tower.userData.level || 1
    const refund = Math.floor(this.getTowerCost(towerType, towerLevel) * 0.5) // 50% 退款

    // 确认对话框
    this.experience.eventBus.emit('ui:confirm-action', {
      action: 'demolish',
      title: '确认拆除',
      message: `确定要拆除 ${this.getTowerName(towerType)} 吗？将获得 ${refund} 金币退款。`,
      onConfirm: () => {
        // 退款
        this.gameState.updateCredits(refund)
        // 移除防御塔
        tile.removeTower()
        // 从 towers 数组中移除
        const index = this.towers.indexOf(tower)
        if (index > -1) {
          this.towers.splice(index, 1)
        }
        // ===== 新增：从持久化数据中移除 =====
        this.gameState.removeTowerFromData(selectedTower.tileX, selectedTower.tileY)
        console.log('已从持久化数据中移除防御塔，剩余:', this.gameState.tdGameData.towers.length)
        
        // 清除选择
        this.gameState.setSelectedTower(null)
        this.experience.eventBus.emit('toast:add', {
          message: `已拆除，获得 ${refund} 金币`,
          type: 'success'
        })
      }
    })
  }

  // 获取防御塔名称
  getTowerName(towerType) {
    const names = {
      basic: { zh: '基础塔', en: 'Basic Tower' },
      rapid: { zh: '速射塔', en: 'Rapid Tower' },
      heavy: { zh: '重炮塔', en: 'Heavy Tower' }
    }
    return names[towerType]?.[this.gameState.language] || towerType
  }

  // 获取防御塔成本
  getTowerCost(towerType, level = 1) {
    const baseCosts = {
      basic: 100,
      rapid: 150,
      heavy: 200
    }
    const baseCost = baseCosts[towerType] || 100
    // 升级成本 = 基础成本 * 等级 * 1.5
    return Math.floor(baseCost * level * 1.5)
  }

  // 拖拽悬停处理
  handleDragOver(event) {
    if (!this.draggingTowerType || this.gameState.currentScene !== 'TD') {
      return
    }
    if (!this.root.visible || !this.city) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    
    // 更新鼠标位置（用于射线检测）
    const rect = this.experience.canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // 临时更新 iMouse 的 normalizedMouse（用于预览）
    this.iMouse.normalizedMouse.x = mouse.x
    this.iMouse.normalizedMouse.y = mouse.y
  }

  // 拖拽放置处理
  handleDrop(event) {
    if (!this.draggingTowerType || this.gameState.currentScene !== 'TD') {
      return
    }
    if (!this.root.visible || !this.city) {
      this.draggingTowerType = null
      return
    }
    event.preventDefault()
    
    // 射线检测找到放置位置
    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.experience.camera.instance)
    
    const allTiles = []
    this.city.meshes.forEach(row => {
      row.forEach(tile => {
        if (tile.grassMesh) allTiles.push(tile.grassMesh)
      })
    })

    const intersects = this.raycaster.intersectObjects(allTiles)
    if (intersects.length === 0) {
      this.draggingTowerType = null
      return
    }

    const tileMesh = intersects[0].object
    const tile = tileMesh.userData

    if (!tile || !(tile instanceof TDTile)) {
      this.draggingTowerType = null
      return
    }

    // 检查是否可以放置
    if (tile.type !== 'base' || tile.hasTower) {
      this.experience.eventBus.emit('toast:add', {
        message: '无法在此位置放置防御塔',
        type: 'warning'
      })
      this.draggingTowerType = null
      return
    }

    // 检查金币
    if (this.gameState.credits < this.draggingTowerType.cost) {
      this.experience.eventBus.emit('toast:add', {
        message: `金币不足！需要 ${this.draggingTowerType.cost} 金币`,
        type: 'error'
      })
      this.draggingTowerType = null
      return
    }

    // 放置防御塔
    this.placeTowerFromDrag(tile, this.draggingTowerType)
    this.draggingTowerType = null
  }

  // 拖拽离开处理
  handleDragLeave(event) {
    // 清除拖拽状态
    if (this.draggingTowerType) {
      // 只有在真正离开 canvas 时才清除
      const rect = this.experience.canvas.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || 
          event.clientY < rect.top || event.clientY > rect.bottom) {
        this.draggingTowerType = null
      }
    }
  }

  // 从拖拽放置防御塔
  placeTowerFromDrag(tile, towerType) {
    // 扣除金币
    this.gameState.updateCredits(-towerType.cost)

    // 创建防御塔
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8)
    const material = new THREE.MeshStandardMaterial({ color: '#4299e1' })
    const tower = new THREE.Mesh(geometry, material)
    
    // 塔相对于 tile 的位置（tile 的中心，稍微抬高）
    tower.position.set(0, 0.75, 0)
    tower.castShadow = true

    tower.userData = {
      range: towerType.range,
      damage: towerType.damage,
      cooldown: 1000,
      lastAttackTime: 0,
      type: towerType.id,
      level: 1, // 初始等级为 1
      tile: tile // 保存对 tile 的引用
    }

    // 将塔添加到 tile（这样塔会跟随 tile 的位置）
    tile.setTower(tower)
    tile.hasTower = true
    
    // 在 tower 的 userData 中保存对 tile 的引用（用于点击检测）
    tower.userData.tile = tile
    
    // 同时添加到 towers 数组用于更新逻辑
    this.towers.push(tower)

    // 放置动画
    tower.scale.set(0, 0, 0)
    import('gsap').then(({ default: gsap }) => {
      gsap.to(tower.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.7)' })
    })

    // 延迟状态更新，避免在事件处理过程中触发响应式循环
    setTimeout(() => {
      // 只保存必要的数据，避免循环引用导致响应式死循环
      const towerData = {
        id: towerType.id,
        name: this.getTowerName(towerType.id),
        damage: towerType.damage,
        range: towerType.range,
        cooldown: 1000,
        level: 1,
        cost: towerType.cost,
        // 只保存坐标，不保存整个对象
        tileX: tile._tileX,
        tileY: tile._tileY,
        // 保存弱引用标识，用于后续查找
        _tileId: `${tile._tileX}-${tile._tileY}`,
        _towerId: tower.uuid || tower.id
      }
      
      // 自动选中刚放置的防御塔
      this.gameState.setSelectedTower(towerData)

      // ===== 新增：保存到持久化数据 =====
      this.gameState.addTowerToData({
        type: towerType.id,
        level: 1,
        damage: towerType.damage,
        range: towerType.range,
        cooldown: 1000,
        cost: towerType.cost,
        tileX: tile._tileX,
        tileY: tile._tileY,
      })
      console.log('持久化数据已更新，当前防御塔数量:', this.gameState.tdGameData.towers.length)
      
      this.experience.eventBus.emit('toast:add', {
        message: `已放置 ${this.getTowerName(towerType.id)}`,
        type: 'success'
      })
    }, 0)
  }

  startWave() {
    if (this.isWaveActive) return
    
    console.log(`开始第 ${this.wave} 波`)
    
    this.isWaveActive = true
    this.enemiesToSpawn = 5 + this.wave * 2
    this.spawnInterval = Math.max(500, 1500 - this.wave * 100)
    this.isInitialLoad = false // 标记为非初始加载

    // ===== 新增：保存游戏状态 =====
    this.gameState.setTDGameData({ isWaveActive: true })
    
    this.experience.eventBus.emit('td:wave-started', { wave: this.wave })
  }

  spawnEnemy() {
    if (this.pathPoints.length === 0) {
      console.warn('路径点为空，无法生成敌人')
      return
    }

    const startPos = this.pathPoints[0]
    console.log('生成敌人，起始位置:', startPos.x.toFixed(2), startPos.y.toFixed(2), startPos.z.toFixed(2))
    
    const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const material = new THREE.MeshStandardMaterial({ color: '#e53e3e' })
    const enemy = new THREE.Mesh(geometry, material)
    
    enemy.position.copy(startPos)
    enemy.castShadow = true
    
    enemy.userData = {
      pathIndex: 0,
      speed: 2.0 + (this.wave * 0.1),
      progress: 0,
      health: 100 + (this.wave * 20),
      maxHealth: 100 + (this.wave * 20),
      reward: 10
    }

    this.root.add(enemy)
    this.enemies.push(enemy)
  }

  update() {
    if (!this.root.visible) return

    const dt = this.time.delta / 1000

    // 波次生成逻辑
    if (this.isWaveActive && this.enemiesToSpawn > 0) {
      if (this.time.elapsed - this.lastSpawnTime > this.spawnInterval) {
        this.spawnEnemy()
        this.enemiesToSpawn--
        this.lastSpawnTime = this.time.elapsed
      }
    } else if (this.isWaveActive && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      // ===== 修复：防止刷新后立即触发波次完成 =====
      // 只有在非初始加载状态下，才允许触发波次完成
      if (!this.isInitialLoad) {
        this.isWaveActive = false
        this.wave++

        // ===== 新增：保存游戏状态 =====
        this.gameState.setTDGameData({ 
          wave: this.wave,
          isWaveActive: false
        })

        this.experience.eventBus.emit('td:wave-completed', { nextWave: this.wave })
        this.experience.eventBus.emit('toast:add', {
          message: `第 ${this.wave - 1} 波防守成功！`,
          type: 'success'
        })
      }
    }

    // 更新城市
    if (this.city) {
      this.city.update()
    }

    // 更新敌人
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.updateEnemy(this.enemies[i], dt, i)
    }

    // 更新塔
    this.towers.forEach(tower => {
      // 确保 tower 存在且有 userData
      if (tower && tower.userData) {
        this.updateTower(tower)
      } else if (tower && tower.mesh && tower.mesh.userData) {
        // 如果 tower 是对象格式（从 restoreTowers），则使用 tower.mesh
        this.updateTower(tower.mesh)
      }
    })

    // 更新子弹
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.updateProjectile(this.projectiles[i], dt, i)
    }
  }

  updateEnemy(enemy, dt, index) {
    const data = enemy.userData
    const targetIndex = data.pathIndex + 1
    
    if (targetIndex >= this.pathPoints.length) {
      this.removeEnemy(index)
      this.damageBase(1)
      return
    }

    const currentPoint = this.pathPoints[data.pathIndex]
    const targetPoint = this.pathPoints[targetIndex]
    const dist = currentPoint.distanceTo(targetPoint)
    const moveDist = data.speed * dt
    data.progress += moveDist / dist

    if (data.progress >= 1) {
      data.pathIndex++
      data.progress = 0
      enemy.position.copy(targetPoint)
      if (data.pathIndex + 1 < this.pathPoints.length) {
        enemy.lookAt(this.pathPoints[data.pathIndex + 1])
      }
    } else {
      enemy.position.lerpVectors(currentPoint, targetPoint, data.progress)
    }
  }

  damageBase(amount) {
    this.baseHealth -= amount

    // ===== 新增：保存游戏状态 =====
    this.gameState.setTDGameData({ baseHealth: this.baseHealth })

    this.experience.eventBus.emit('td:base-damaged', { health: this.baseHealth })
    
    if (this.baseHealth <= 0) {
      this.gameOver()
    }
  }

  gameOver() {
    this.isWaveActive = false

    // ===== 新增：保存游戏状态 =====
    this.gameState.setTDGameData({ 
      isWaveActive: false,
      baseHealth: this.baseHealth 
    })

    this.experience.eventBus.emit('td:game-over')
    this.experience.eventBus.emit('toast:add', {
      message: '基地被摧毁！防守失败',
      type: 'error'
    })
    this.resetGame()
  }

  // 升级防御塔
  upgradeTower() {
    const selectedTower = this.gameState.selectedTower
    if (!selectedTower || !selectedTower._tileId) {
      this.experience.eventBus.emit('toast:add', {
        message: '请先选择一个防御塔',
        type: 'warning'
      })
      return
    }

    // 通过坐标查找 tile 和 tower
    console.log('查找防御塔，坐标:', selectedTower.tileX, selectedTower.tileY)
    const tile = this.city.getTile(selectedTower.tileX, selectedTower.tileY)
    console.log('找到的 tile:', tile)
    
    if (!tile) {
      console.error('Tile 不存在，坐标:', selectedTower.tileX, selectedTower.tileY)
      this.experience.eventBus.emit('toast:add', {
        message: `防御塔不存在：无法找到坐标 (${selectedTower.tileX}, ${selectedTower.tileY}) 的 tile`,
        type: 'error'
      })
      return
    }
    
    if (!tile.hasTower || !tile.towerInstance) {
      console.error('Tile 上没有防御塔，hasTower:', tile.hasTower, 'towerInstance:', tile.towerInstance)
      this.experience.eventBus.emit('toast:add', {
        message: '该位置没有防御塔',
        type: 'error'
      })
      return
    }

    const tower = tile.towerInstance
    const currentLevel = tower.userData.level || 1
    const nextLevel = currentLevel + 1
    const upgradeCost = this.getTowerCost(tower.userData.type, nextLevel) - this.getTowerCost(tower.userData.type, currentLevel)

    if (this.gameState.credits < upgradeCost) {
      this.experience.eventBus.emit('toast:add', {
        message: `金币不足！升级需要 ${upgradeCost} 金币`,
        type: 'error'
      })
      return
    }

    // 确认升级
    this.experience.eventBus.emit('ui:confirm-action', {
      action: 'upgrade',
      title: '确认升级',
      message: `确定要升级到 ${nextLevel} 级吗？需要 ${upgradeCost} 金币。`,
      onConfirm: () => {
        // 扣除金币
        this.gameState.updateCredits(-upgradeCost)
        
        // 升级防御塔属性
        tower.userData.level = nextLevel
        tower.userData.damage = Math.floor(tower.userData.damage * 1.2) // 伤害增加 20%
        tower.userData.range = tower.userData.range + 0.5 // 范围增加 0.5
        tower.userData.cooldown = Math.max(500, tower.userData.cooldown - 100) // 冷却减少 100ms

        // ===== 新增：更新持久化数据 =====
        this.gameState.updateTowerInData(selectedTower.tileX, selectedTower.tileY, {
          level: nextLevel,
          damage: tower.userData.damage,
          range: tower.userData.range,
          cooldown: tower.userData.cooldown,
          cost: this.getTowerCost(tower.userData.type, nextLevel),
        })
        console.log('持久化数据已更新')

        // 更新选中状态（只保存数据，不保存对象引用）
        setTimeout(() => {
          this.gameState.setSelectedTower({
            ...selectedTower,
            level: nextLevel,
            damage: tower.userData.damage,
            range: tower.userData.range,
            cooldown: tower.userData.cooldown,
            cost: this.getTowerCost(tower.userData.type, nextLevel)
          })
        }, 0)

        // 升级动画
        import('gsap').then(({ default: gsap }) => {
          gsap.to(tower.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2, yoyo: true, repeat: 1 })
        })

        this.experience.eventBus.emit('toast:add', {
          message: `防御塔已升级到 ${nextLevel} 级！`,
          type: 'success'
        })
      }
    })
  }

  // 拆除选中的防御塔
  demolishSelectedTower() {
    const selectedTower = this.gameState.selectedTower
    if (!selectedTower || !selectedTower._tileId) {
      this.experience.eventBus.emit('toast:add', {
        message: '请先选择一个防御塔',
        type: 'warning'
      })
      return
    }

    // 通过坐标查找 tile 和 tower
    console.log('拆除防御塔，坐标:', selectedTower.tileX, selectedTower.tileY)
    const tile = this.city.getTile(selectedTower.tileX, selectedTower.tileY)
    console.log('找到的 tile:', tile)
    
    if (!tile) {
      console.error('Tile 不存在，坐标:', selectedTower.tileX, selectedTower.tileY)
      this.experience.eventBus.emit('toast:add', {
        message: `防御塔不存在：无法找到坐标 (${selectedTower.tileX}, ${selectedTower.tileY}) 的 tile`,
        type: 'error'
      })
      return
    }
    
    if (!tile.hasTower || !tile.towerInstance) {
      console.error('Tile 上没有防御塔，hasTower:', tile.hasTower, 'towerInstance:', tile.towerInstance)
      this.experience.eventBus.emit('toast:add', {
        message: '该位置没有防御塔',
        type: 'error'
      })
      return
    }

    const tower = tile.towerInstance
    const towerType = tower.userData.type
    const towerLevel = tower.userData.level || 1
    const refund = Math.floor(this.getTowerCost(towerType, towerLevel) * 0.5) // 50% 退款

    // 确认拆除
    this.experience.eventBus.emit('ui:confirm-action', {
      action: 'demolish',
      title: '确认拆除',
      message: `确定要拆除 ${this.getTowerName(towerType)} 吗？将获得 ${refund} 金币退款。`,
      onConfirm: () => {
        console.log('确认拆除防御塔，tile:', tile, 'tower:', tower)
        console.log('tile.hasTower:', tile.hasTower, 'tile.towerInstance:', tile.towerInstance)
        
        // 退款
        this.gameState.updateCredits(refund)
        
        // 从 towers 数组中移除（在 removeTower 之前，因为 removeTower 会清理对象）
        const index = this.towers.indexOf(tower)
        if (index > -1) {
          console.log('从 towers 数组中移除，索引:', index)
          this.towers.splice(index, 1)
        } else {
          console.warn('防御塔不在 towers 数组中')
        }
        
        // 移除防御塔（这会清理几何体和材质）
        console.log('调用 tile.removeTower()')
        tile.removeTower()
        
        // 验证防御塔是否已被移除
        console.log('移除后检查 - tile.hasTower:', tile.hasTower, 'tile.towerInstance:', tile.towerInstance)
        console.log('移除后检查 - grassMesh.children 中是否还有防御塔:', 
          tile.grassMesh?.children?.some(child => child === tower))
        
        // 清除选择
        setTimeout(() => {
          this.gameState.setSelectedTower(null)
        }, 0)
        
        this.experience.eventBus.emit('toast:add', {
          message: `已拆除，获得 ${refund} 金币`,
          type: 'success'
        })
      }
    })
  }

  resetGame() {
    while(this.enemies.length > 0) {
      this.removeEnemy(0)
    }
    while(this.projectiles.length > 0) {
      this.removeProjectile(0)
    }
    this.wave = 1
    this.baseHealth = 10
    this.experience.eventBus.emit('td:base-damaged', { health: this.baseHealth })
  }

  updateTower(tower) {
    // 安全检查：确保 tower 和 userData 存在
    if (!tower || !tower.userData) {
      console.warn('updateTower: tower 或 userData 不存在', tower)
      return
    }

    const now = this.time.elapsed
    if (now - tower.userData.lastAttackTime < tower.userData.cooldown) return

    // 获取塔的世界坐标
    const towerWorldPos = new THREE.Vector3()
    tower.getWorldPosition(towerWorldPos)

    let target = null
    let minDist = Infinity

    for (const enemy of this.enemies) {
      const dist = towerWorldPos.distanceTo(enemy.position)
      if (dist <= tower.userData.range && dist < minDist) {
        minDist = dist
        target = enemy
      }
    }

    if (target) {
      this.shoot(tower, target, towerWorldPos)
      tower.userData.lastAttackTime = now
    }
  }

  shoot(tower, target, towerWorldPos) {
    const geometry = new THREE.SphereGeometry(0.15)
    const material = new THREE.MeshBasicMaterial({ color: '#ffff00' })
    const projectile = new THREE.Mesh(geometry, material)
    
    projectile.position.copy(towerWorldPos)
    projectile.position.y += 0.75
    
    projectile.userData = {
      target: target,
      speed: 10,
      damage: tower.userData.damage
    }

    this.root.add(projectile)
    this.projectiles.push(projectile)
  }

  updateProjectile(projectile, dt, index) {
    const target = projectile.userData.target
    
    if (!this.enemies.includes(target)) {
      this.removeProjectile(index)
      return
    }

    const targetPos = target.position.clone().add(new THREE.Vector3(0, 0.3, 0))
    const dir = new THREE.Vector3().subVectors(targetPos, projectile.position).normalize()
    const dist = projectile.position.distanceTo(targetPos)
    const moveDist = projectile.userData.speed * dt

    if (moveDist >= dist) {
      this.hitEnemy(target, projectile.userData.damage)
      this.removeProjectile(index)
    } else {
      projectile.position.add(dir.multiplyScalar(moveDist))
    }
  }

  hitEnemy(enemy, damage) {
    enemy.userData.health -= damage
    
    const originalColor = enemy.material.color.getHex()
    enemy.material.color.setHex(0xffffff)
    setTimeout(() => {
      if (enemy.material) enemy.material.color.setHex(originalColor)
    }, 50)

    if (enemy.userData.health <= 0) {
      const index = this.enemies.indexOf(enemy)
      if (index !== -1) {
        this.removeEnemy(index)
        this.gameState.updateCredits(enemy.userData.reward)
      }
    }
  }

  removeProjectile(index) {
    const projectile = this.projectiles[index]
    this.root.remove(projectile)
    projectile.geometry.dispose()
    projectile.material.dispose()
    this.projectiles.splice(index, 1)
  }

  removeEnemy(index) {
    const enemy = this.enemies[index]
    this.root.remove(enemy)
    enemy.geometry.dispose()
    enemy.material.dispose()
    this.enemies.splice(index, 1)
  }

  show() {
    console.log('显示外城')
    console.log('外城 root visible:', this.root.visible, 'city exists:', !!this.city)
    
    // 先显示 root
    this.root.visible = true
    
    // 检查是否需要重新创建城市（例如，用户点击了"重新开始新游戏"）
    const savedTowers = this.gameState.tdGameData.towers || []
    if (savedTowers.length === 0 && this.towers.length > 0) {
      console.log('检测到游戏数据已重置，重新创建外城')
      this.createCity()
      // 重置游戏状态
      this.wave = this.gameState.tdGameData.wave
      this.baseHealth = this.gameState.tdGameData.baseHealth
      this.isWaveActive = this.gameState.tdGameData.isWaveActive
      // 清除敌人和子弹
      while (this.enemies.length > 0) {
        this.removeEnemy(0)
      }
      while (this.projectiles.length > 0) {
        this.removeProjectile(0)
      }
      return // 重新创建后直接返回，后续逻辑会在递归调用中执行
    }
    
    if (this.city) {
      // 确保 city 的 root 也在层级中
      if (!this.root.children.includes(this.city.root)) {
        console.warn('city.root 不在 tdWorld.root 中，重新添加')
        this.root.add(this.city.root)
      }
      // 显示 city
      this.city.show()
      console.log('外城城市已显示，tile 数量:', this.city.meshes.length)
      console.log('city.root visible:', this.city.root.visible, 'city.root children:', this.city.root.children.length)
    } else {
      console.warn('外城城市未创建，尝试重新创建')
      // 如果 city 不存在，尝试重新创建
      if (this.resources.items.grass) {
        this.createCity()
        if (this.city) {
          this.city.show()
        }
      } else {
        console.error('资源未加载，无法创建外城')
      }
    }
    
    // 确保环境光显示（外城和内城共用同一个环境系统）
    // 需要等待 environment 初始化完成
    const checkAndEnableLights = () => {
      const world = this.experience.world
      if (world && world.environment) {
        console.log('启用环境光 for 外城')
        if (world.environment.sunLight) {
          world.environment.sunLight.visible = true
          console.log('sunLight enabled, intensity:', world.environment.sunLight.intensity)
        }
        if (world.environment.ambientLight) {
          world.environment.ambientLight.visible = true
          console.log('ambientLight enabled, intensity:', world.environment.ambientLight.intensity)
        }
        if (world.environment.hemisphereLight) {
          world.environment.hemisphereLight.visible = true
          console.log('hemisphereLight enabled, intensity:', world.environment.hemisphereLight.intensity)
        }
      } else {
        console.warn('environment 尚未初始化，等待 100ms 后重试')
        setTimeout(checkAndEnableLights, 100)
      }
    }
    checkAndEnableLights()
    
    // 添加事件监听器（只在显示时添加，避免干扰内城）
    if (!this.eventListenersAttached) {
      this.experience.canvas.addEventListener('click', this.boundHandleClick)
      this.experience.canvas.addEventListener('dragover', this.boundHandleDragOver)
      this.experience.canvas.addEventListener('drop', this.boundHandleDrop)
      this.experience.canvas.addEventListener('dragleave', this.boundHandleDragLeave)
      this.eventListenersAttached = true
      console.log('外城事件监听器已添加')
    }
  }

  hide() {
    this.root.visible = false
    if (this.city) {
      this.city.hide()
    }
    
    // 移除事件监听器（隐藏时移除，避免干扰内城）
    if (this.eventListenersAttached) {
      this.experience.canvas.removeEventListener('click', this.boundHandleClick)
      this.experience.canvas.removeEventListener('dragover', this.boundHandleDragOver)
      this.experience.canvas.removeEventListener('drop', this.boundHandleDrop)
      this.experience.canvas.removeEventListener('dragleave', this.boundHandleDragLeave)
      this.eventListenersAttached = false
      console.log('外城事件监听器已移除')
    }
    
    // 注意：不隐藏环境光，因为内城可能也需要使用
  }

  destroy() {
    // 确保移除所有事件监听器
    this.hide()
    this.scene.remove(this.root)
  }
}
