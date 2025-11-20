/**
 * 外城塔防 - 怪物类
 * 
 * 封装怪物的所有属性和行为
 */

import * as THREE from 'three'
import { calculateEnemyStats } from './enemy-types.js'
import EnemyModelFactory from './enemy-model-factory.js'

export default class Enemy {
  /**
   * 创建一个怪物实例
   * @param {string} enemyType - 怪物类型
   * @param {number} wave - 当前波次
   * @param {Array<THREE.Vector3>} path - 怪物的移动路径
   * @param {THREE.Scene} scene - 场景对象
   * @param {EnemyModelFactory} modelFactory - 模型工厂实例
   */
  constructor(enemyType, wave, path, scene, modelFactory) {
    // 计算属性
    this.stats = calculateEnemyStats(enemyType, wave)
    if (!this.stats) {
      throw new Error(`无法创建怪物: ${enemyType}`)
    }
    
    // 移动相关
    this.path = path
    this.pathIndex = 0
    this.progress = 0
    
    // 战斗相关
    this.health = this.stats.health
    this.maxHealth = this.stats.maxHealth
    this.isAlive = true
    
    // 状态效果（可扩展）
    this.effects = {
      slow: { active: false, multiplier: 1.0, duration: 0 },      // 减速效果
      poison: { active: false, dps: 0, duration: 0 },             // 中毒效果
      freeze: { active: false, duration: 0 },                      // 冰冻效果
      burn: { active: false, dps: 0, duration: 0 },               // 燃烧效果
    }
    
    // ===== 特殊怪物状态 =====
    this.isStealthed = false          // 隐身状态
    this.stealthTimer = 0              // 隐身计时器
    this.healTimer = 0                 // 治疗计时器
    this.time = 0                      // 存活时间（秒）
    
    // 创建 3D 模型（使用模型工厂）
    this.modelFactory = modelFactory
    if (modelFactory) {
      this.mesh = modelFactory.createEnemyModel(enemyType, this.stats)
    } else {
      // 备用方案：简单立方体
      const geometry = new THREE.BoxGeometry(this.stats.size, this.stats.size, this.stats.size)
      const material = new THREE.MeshStandardMaterial({
        color: this.stats.color,
        metalness: 0.3,
        roughness: 0.7,
      })
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
    }
    
    this.mesh.position.copy(path[0])
    
    // 飞行单位：调整初始高度
    if (this.stats.special?.isFlying) {
      this.mesh.position.y += this.stats.special.altitude
    }
    
    // 存储引用到 userData 供其他系统使用
    this.mesh.userData = {
      enemyInstance: this,  // 引用回 Enemy 实例
      type: this.stats.type,
      name: this.stats.name,
    }
    
    // 添加到场景
    scene.add(this.mesh)
  }
  
  /**
   * 受到伤害
   * @param {number} damage - 伤害值
   * @returns {boolean} 是否死亡
   */
  takeDamage(damage) {
    if (!this.isAlive) return true
    
    // 应用防御减伤
    const actualDamage = damage * (1 - this.stats.defense)
    this.health -= actualDamage
    
    // 视觉反馈：受伤时闪烁
    this.flashDamage()
    
    if (this.health <= 0) {
      this.health = 0
      this.isAlive = false
      return true
    }
    
    return false
  }
  
  /**
   * 受伤闪烁效果
   */
  flashDamage() {
    // ===== 修复：支持 Group 和 Mesh =====
    // 如果是 Group，遍历所有子网格
    if (this.mesh.isGroup) {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          const originalColor = child.material.color.clone()
          child.material.color.setHex(0xffffff)
          
          setTimeout(() => {
            if (child.material) {
              child.material.color.copy(originalColor)
            }
          }, 100)
        }
      })
    } else if (this.mesh.isMesh) {
      // 如果是单个 Mesh
      const originalColor = this.mesh.material.color.clone()
      this.mesh.material.color.setHex(0xffffff)
      
      setTimeout(() => {
        if (this.mesh.material) {
          this.mesh.material.color.copy(originalColor)
        }
      }, 100)
    }
  }
  
  /**
   * 应用减速效果
   * @param {number} multiplier - 速度倍率 (0-1)
   * @param {number} duration - 持续时间（秒）
   */
  applySlow(multiplier, duration) {
    this.effects.slow = {
      active: true,
      multiplier: Math.min(this.effects.slow.multiplier, multiplier), // 取最强的减速
      duration: Math.max(this.effects.slow.duration, duration),
    }
  }
  
  /**
   * 应用中毒效果
   * @param {number} dps - 每秒伤害
   * @param {number} duration - 持续时间（秒）
   */
  applyPoison(dps, duration) {
    this.effects.poison = {
      active: true,
      dps,
      duration,
    }
  }
  
  /**
   * 应用冰冻效果
   * @param {number} duration - 持续时间（秒）
   */
  applyFreeze(duration) {
    this.effects.freeze = {
      active: true,
      duration,
    }
  }
  
  /**
   * 应用燃烧效果
   * @param {number} dps - 每秒伤害
   * @param {number} duration - 持续时间（秒）
   */
  applyBurn(dps, duration) {
    this.effects.burn = {
      active: true,
      dps,
      duration,
    }
  }
  
  /**
   * 获取当前实际速度（考虑所有效果）
   * @returns {number} 当前速度
   */
  getCurrentSpeed() {
    let speed = this.stats.speed
    
    // 冰冻：完全停止
    if (this.effects.freeze.active) {
      return 0
    }
    
    // 减速
    if (this.effects.slow.active) {
      speed *= this.effects.slow.multiplier
    }
    
    return speed
  }
  
  /**
   * 更新怪物状态
   * @param {number} dt - 帧时间（秒）
   * @returns {boolean} 是否到达终点
   */
  update(dt) {
    if (!this.isAlive) return false
    
    // 更新存活时间
    this.time += dt
    
    // 更新状态效果
    this.updateEffects(dt)
    
    // 更新特殊怪物行为
    this.updateSpecialBehaviors(dt)
    
    // 更新动画
    if (this.modelFactory) {
      const currentSpeed = this.getCurrentSpeed()
      this.modelFactory.updateAnimation(this.mesh, dt, currentSpeed)
    }
    
    // 更新移动
    return this.updateMovement(dt)
  }
  
  /**
   * 更新状态效果
   * @param {number} dt - 帧时间（秒）
   */
  updateEffects(dt) {
    // 更新减速
    if (this.effects.slow.active) {
      this.effects.slow.duration -= dt
      if (this.effects.slow.duration <= 0) {
        this.effects.slow.active = false
        this.effects.slow.multiplier = 1.0
      }
    }
    
    // 更新中毒
    if (this.effects.poison.active) {
      this.takeDamage(this.effects.poison.dps * dt)
      this.effects.poison.duration -= dt
      if (this.effects.poison.duration <= 0) {
        this.effects.poison.active = false
      }
    }
    
    // 更新冰冻
    if (this.effects.freeze.active) {
      this.effects.freeze.duration -= dt
      if (this.effects.freeze.duration <= 0) {
        this.effects.freeze.active = false
      }
    }
    
    // 更新燃烧
    if (this.effects.burn.active) {
      this.takeDamage(this.effects.burn.dps * dt)
      this.effects.burn.duration -= dt
      if (this.effects.burn.duration <= 0) {
        this.effects.burn.active = false
      }
    }
  }
  
  /**
   * 更新移动
   * @param {number} dt - 帧时间（秒）
   * @returns {boolean} 是否到达终点
   */
  updateMovement(dt) {
    if (!this.path || this.path.length === 0) return true
    
    const targetIndex = this.pathIndex + 1
    if (targetIndex >= this.path.length) {
      return true // 到达终点
    }
    
    const currentPoint = this.path[this.pathIndex]
    const targetPoint = this.path[targetIndex]
    const dist = currentPoint.distanceTo(targetPoint)
    
    // 获取当前实际速度
    const currentSpeed = this.getCurrentSpeed()
    const moveDist = currentSpeed * dt
    this.progress += moveDist / dist
    
    if (this.progress >= 1) {
      this.pathIndex++
      this.progress = 0
      this.mesh.position.copy(targetPoint)
      
      // 飞行单位：保持高度
      if (this.stats.special?.isFlying) {
        this.mesh.position.y += this.stats.special.altitude
      }
      
      // 递归更新，处理高速单位一帧移动多个点的情况
      if (this.pathIndex + 1 < this.path.length) {
        return this.updateMovement(0)
      }
    } else {
      this.mesh.position.lerpVectors(currentPoint, targetPoint, this.progress)
      
      // 飞行单位：保持高度
      if (this.stats.special?.isFlying) {
        this.mesh.position.y += this.stats.special.altitude
      }
    }
    
    return false
  }
  
  /**
   * 获取当前位置
   * @returns {THREE.Vector3} 当前位置
   */
  getPosition() {
    return this.mesh.position.clone()
  }
  
  /**
   * 销毁怪物
   * @param {THREE.Scene} scene - 场景对象
   */
  destroy(scene) {
    scene.remove(this.mesh)
    
    // 使用模型工厂清理资源
    if (this.modelFactory) {
      this.modelFactory.dispose(this.mesh)
    } else {
      // 备用清理
      if (this.mesh.geometry) this.mesh.geometry.dispose()
      if (this.mesh.material) this.mesh.material.dispose()
    }
    
    this.isAlive = false
  }
  
  /**
   * 获取血量百分比
   * @returns {number} 0-1 的血量百分比
   */
  getHealthPercent() {
    return this.health / this.maxHealth
  }
  
  /**
   * 是否正在被减速
   * @returns {boolean}
   */
  isSlowed() {
    return this.effects.slow.active
  }
  
  /**
   * 是否正在被冰冻
   * @returns {boolean}
   */
  isFrozen() {
    return this.effects.freeze.active
  }
  
  /**
   * 是否正在中毒
   * @returns {boolean}
   */
  isPoisoned() {
    return this.effects.poison.active
  }
  
  /**
   * 是否正在燃烧
   * @returns {boolean}
   */
  isBurning() {
    return this.effects.burn.active
  }
  
  /**
   * 治疗
   * @param {number} amount - 治疗量
   */
  heal(amount) {
    if (!this.isAlive) return
    
    this.health = Math.min(this.health + amount, this.maxHealth)
    
    // 视觉反馈：绿色闪光
    this.flashHeal()
  }
  
  /**
   * 治疗闪光效果
   */
  flashHeal() {
    const meshes = []
    
    if (this.mesh.isGroup) {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          meshes.push({ mesh: child, originalColor: child.material.color.clone() })
        }
      })
    } else if (this.mesh.isMesh && this.mesh.material) {
      meshes.push({ mesh: this.mesh, originalColor: this.mesh.material.color.clone() })
    }
    
    // 变绿
    meshes.forEach(({ mesh }) => {
      if (mesh.material) {
        mesh.material.color.setHex(0x22c55e)
      }
    })
    
    // 0.2秒后恢复
    setTimeout(() => {
      meshes.forEach(({ mesh, originalColor }) => {
        if (mesh.material) {
          mesh.material.color.copy(originalColor)
        }
      })
    }, 200)
  }
  
  /**
   * 更新特殊怪物行为
   * @param {number} dt - 帧时间（秒）
   */
  updateSpecialBehaviors(dt) {
    if (!this.stats.special) return
    
    // ===== 隐身单位 =====
    if (this.stats.special.stealthCycle) {
      this.updateStealthBehavior(dt)
    }
    
    // ===== 治疗单位 =====
    if (this.stats.special.healRange) {
      this.updateHealBehavior(dt)
    }
    
    // 飞行单位的行为已在 updateMovement 中处理
  }
  
  /**
   * 更新隐身行为
   * @param {number} dt - 帧时间（秒）
   */
  updateStealthBehavior(dt) {
    const { stealthCycle, stealthDuration, opacity } = this.stats.special
    
    this.stealthTimer += dt
    
    // 循环计时器
    if (this.stealthTimer >= stealthCycle) {
      this.stealthTimer = 0
    }
    
    // 判断是否在隐身时间内
    const shouldBeStealth = this.stealthTimer < stealthDuration
    
    // 状态切换
    if (shouldBeStealth && !this.isStealthed) {
      this.enterStealth(opacity)
    } else if (!shouldBeStealth && this.isStealthed) {
      this.exitStealth()
    }
  }
  
  /**
   * 进入隐身状态
   * @param {number} opacity - 隐身透明度
   */
  enterStealth(opacity) {
    this.isStealthed = true
    
    // 设置透明度
    if (this.mesh.isGroup) {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true
          child.material.opacity = opacity
        }
      })
    } else if (this.mesh.material) {
      this.mesh.material.transparent = true
      this.mesh.material.opacity = opacity
    }
  }
  
  /**
   * 退出隐身状态
   */
  exitStealth() {
    this.isStealthed = false
    
    // 恢复不透明
    if (this.mesh.isGroup) {
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = 1.0
          child.material.transparent = false
        }
      })
    } else if (this.mesh.material) {
      this.mesh.material.opacity = 1.0
      this.mesh.material.transparent = false
    }
  }
  
  /**
   * 更新治疗行为
   * @param {number} dt - 帧时间（秒）
   * @param {Array<Enemy>} allEnemies - 所有敌人（需要从外部传入）
   */
  updateHealBehavior(dt, allEnemies = []) {
    const { healInterval } = this.stats.special
    
    this.healTimer += dt
    
    if (this.healTimer >= healInterval) {
      this.healTimer = 0
      this.performHeal(allEnemies)
    }
  }
  
  /**
   * 执行治疗
   * @param {Array<Enemy>} allEnemies - 所有敌人
   */
  performHeal(allEnemies) {
    const { healRange, healAmount } = this.stats.special
    const myPos = this.getPosition()
    
    // 治疗周围的怪物
    for (const otherEnemy of allEnemies) {
      if (!otherEnemy || otherEnemy === this || !otherEnemy.isAlive) continue
      
      const dist = myPos.distanceTo(otherEnemy.getPosition())
      if (dist <= healRange) {
        otherEnemy.heal(healAmount)
        
        // 可选：创建治疗连线效果
        // this.createHealEffect(myPos, otherEnemy.getPosition())
      }
    }
  }
}

