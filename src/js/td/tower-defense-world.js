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

    // 游戏状态
    this.wave = 1
    this.baseHealth = 10
    this.isWaveActive = false
    this.enemiesToSpawn = 0
    this.spawnInterval = 1500
    this.lastSpawnTime = 0

    // 射线检测器
    this.raycaster = new THREE.Raycaster()

    // 初始化
    this.init()
    
    // 监听点击事件
    window.addEventListener('click', this.handleClick.bind(this))
    
    // 监听事件
    this.experience.eventBus.on('td:start-wave', () => {
      this.startWave()
    })
    this.experience.eventBus.on('td:select-tower-type', (towerType) => {
      // 选中塔类型时，可以高亮可放置区域
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
    this.city = new TDCity()
    this.root.add(this.city.root)
    // 路径点从 city 中获取
    this.pathPoints = this.city.pathPoints
    console.log('外城创建完成，路径点数量:', this.pathPoints.length)
  }

  handleClick() {
    if (!this.root.visible || !this.city) {
      console.log('外城未显示或城市未创建', { visible: this.root.visible, city: !!this.city })
      return
    }

    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.experience.camera.instance)
    
    // 检测点击的是哪个 tile
    const allTiles = []
    this.city.meshes.forEach(row => {
      row.forEach(tile => {
        if (tile.grassMesh) allTiles.push(tile.grassMesh)
      })
    })

    console.log('检测到的 tile 数量:', allTiles.length)

    const intersects = this.raycaster.intersectObjects(allTiles)

    console.log('射线检测结果:', intersects.length, '个交点')

    if (intersects.length > 0) {
      const tileMesh = intersects[0].object
      const tile = tileMesh.userData

      console.log('点击的 tile:', tile, '类型:', tile?.type, '已有塔:', tile?.hasTower)

      if (tile && tile instanceof TDTile && tile.type === 'base' && !tile.hasTower) {
        console.log('可以放置防御塔')
        this.placeTower(tile)
      } else {
        console.log('无法放置防御塔:', {
          isTDTile: tile instanceof TDTile,
          type: tile?.type,
          hasTower: tile?.hasTower
        })
      }
    }
  }

  placeTower(tile) {
    const towerType = this.gameState.selectedTowerType
    console.log('尝试放置防御塔，选中的类型:', towerType)
    if (!towerType) {
      console.log('未选择防御塔类型')
      this.experience.eventBus.emit('toast:add', {
        message: '请先选择防御塔类型',
        type: 'warning'
      })
      return
    }

    if (this.gameState.credits < towerType.cost) {
      this.experience.eventBus.emit('toast:add', {
        message: `金币不足！需要 ${towerType.cost} 金币`,
        type: 'error'
      })
      return
    }

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
      tile: tile // 保存对 tile 的引用
    }

    // 将塔添加到 tile（这样塔会跟随 tile 的位置）
    tile.setTower(tower)
    tile.hasTower = true
    
    // 同时添加到 towers 数组用于更新逻辑
    this.towers.push(tower)

    // 放置动画
    tower.scale.set(0, 0, 0)
    import('gsap').then(({ default: gsap }) => {
      gsap.to(tower.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.7)' })
    })

    // 清除选中状态
    this.gameState.setSelectedTowerType(null)
  }

  startWave() {
    if (this.isWaveActive) return
    
    this.isWaveActive = true
    this.enemiesToSpawn = 5 + this.wave * 2
    this.spawnInterval = Math.max(500, 1500 - this.wave * 100)
    
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
      this.isWaveActive = false
      this.wave++
      this.experience.eventBus.emit('td:wave-completed', { nextWave: this.wave })
      this.experience.eventBus.emit('toast:add', {
        message: `第 ${this.wave - 1} 波防守成功！`,
        type: 'success'
      })
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
      this.updateTower(tower)
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
    this.experience.eventBus.emit('td:base-damaged', { health: this.baseHealth })
    
    if (this.baseHealth <= 0) {
      this.gameOver()
    }
  }

  gameOver() {
    this.isWaveActive = false
    this.experience.eventBus.emit('td:game-over')
    this.experience.eventBus.emit('toast:add', {
      message: '基地被摧毁！防守失败',
      type: 'error'
    })
    this.resetGame()
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
    this.root.visible = true
    if (this.city) {
      this.city.show()
      console.log('外城城市已显示，tile 数量:', this.city.meshes.length)
    } else {
      console.warn('外城城市未创建')
    }
    
    // 确保环境光显示（外城和内城共用同一个环境系统）
    const world = this.experience.world
    if (world && world.environment) {
      if (world.environment.sunLight) world.environment.sunLight.visible = true
      if (world.environment.ambientLight) world.environment.ambientLight.visible = true
      if (world.environment.hemisphereLight) world.environment.hemisphereLight.visible = true
    }
  }

  hide() {
    this.root.visible = false
    if (this.city) {
      this.city.hide()
    }
    // 注意：不隐藏环境光，因为内城可能也需要使用
  }

  destroy() {
    window.removeEventListener('click', this.handleClick.bind(this))
    this.scene.remove(this.root)
  }
}
