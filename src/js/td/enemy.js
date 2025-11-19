/**
 * 外城塔防 - 怪物类
 * 
 * 封装怪物的所有属性和行为
 */

import * as THREE from 'three'
import { calculateEnemyStats, createEnemyMesh } from './enemy-types.js'

export default class Enemy {
  /**
   * 创建一个怪物实例
   * @param {string} enemyType - 怪物类型
   * @param {number} wave - 当前波次
   * @param {Array<THREE.Vector3>} path - 怪物的移动路径
   * @param {THREE.Scene} scene - 场景对象
   */
  constructor(enemyType, wave, path, scene) {
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
    
    // 创建 3D 模型
    this.mesh = createEnemyMesh(this.stats)
    this.mesh.position.copy(path[0])
    
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
    const originalColor = this.mesh.material.color.clone()
    this.mesh.material.color.setHex(0xffffff)
    
    setTimeout(() => {
      this.mesh.material.color.copy(originalColor)
    }, 100)
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
    
    // 更新状态效果
    this.updateEffects(dt)
    
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
      
      // 递归更新，处理高速单位一帧移动多个点的情况
      if (this.pathIndex + 1 < this.path.length) {
        return this.updateMovement(0)
      }
    } else {
      this.mesh.position.lerpVectors(currentPoint, targetPoint, this.progress)
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
    if (this.mesh.geometry) this.mesh.geometry.dispose()
    if (this.mesh.material) this.mesh.material.dispose()
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
}

