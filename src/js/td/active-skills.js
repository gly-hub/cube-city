/**
 * 主动技能系统
 * 提供空袭、冰冻、闪电链三种主动技能
 */

import * as THREE from 'three'
import { createSkillEffect } from './skill-effects.js'

// 技能配置
export const SKILL_CONFIG = {
  airstrike: {
    id: 'airstrike',
    name: '空袭',
    nameEn: 'Airstrike',
    icon: '🚀',
    damage: 150,
    radius: 2.5,
    cooldown: 60, // 秒
    cost: 100,
    description: '对区域内所有敌人造成大量伤害',
  },
  freeze: {
    id: 'freeze',
    name: '冰冻',
    nameEn: 'Freeze',
    icon: '❄️',
    duration: 3, // 秒
    radius: 3.0,
    cooldown: 45,
    cost: 80,
    description: '冻结区域内所有敌人3秒',
  },
  lightning: {
    id: 'lightning',
    name: '闪电链',
    nameEn: 'Lightning Chain',
    icon: '⚡',
    damage: 80,
    maxTargets: 5,
    jumpRange: 1.5,
    damageDecay: 0.8, // 每次跳跃衰减20%
    cooldown: 30,
    cost: 60,
    description: '链式攻击最多5个目标',
  },
}

/**
 * 基础技能类
 */
export class ActiveSkill {
  constructor(config) {
    this.id = config.id
    this.name = config.name
    this.nameEn = config.nameEn
    this.icon = config.icon
    this.cooldown = config.cooldown
    this.cost = config.cost
    this.description = config.description
    this.lastUsedTime = 0
    this.isActive = false
  }

  /**
   * 检查技能是否可用
   * @param {number} currentCredits - 当前金币
   * @returns {boolean}
   */
  canUse(currentCredits) {
    const now = Date.now()
    const cooldownReady = (now - this.lastUsedTime) >= (this.cooldown * 1000)
    const hasEnoughCredits = currentCredits >= this.cost
    return cooldownReady && hasEnoughCredits
  }

  /**
   * 获取剩余冷却时间
   * @returns {number} 剩余秒数
   */
  getRemainingCooldown() {
    if (this.lastUsedTime === 0) return 0 // 从未使用过
    const elapsed = (Date.now() - this.lastUsedTime) / 1000
    const remaining = Math.max(0, this.cooldown - elapsed)
    return remaining
  }

  /**
   * 获取冷却进度（0-1）
   * @returns {number}
   */
  getCooldownProgress() {
    const remaining = this.getRemainingCooldown()
    return 1 - (remaining / this.cooldown)
  }

  /**
   * 开始冷却
   */
  startCooldown() {
    this.lastUsedTime = Date.now()
  }

  /**
   * 激活技能（子类实现）
   * @param {THREE.Vector3} targetPosition - 目标位置
   * @param {object} world - TowerDefenseWorld 实例
   */
  activate(targetPosition, world) {
    throw new Error('activate() must be implemented by subclass')
  }
}

/**
 * 空袭技能
 */
export class AirstrikeSkill extends ActiveSkill {
  constructor() {
    super(SKILL_CONFIG.airstrike)
    this.damage = SKILL_CONFIG.airstrike.damage
    this.radius = SKILL_CONFIG.airstrike.radius
  }

  activate(targetPosition, world) {
    console.log('🚀 空袭技能激活！位置:', targetPosition)

    // 创建视觉效果
    createSkillEffect('airstrike', targetPosition, world.root)

    // 0.5秒后应用伤害（导弹下落时间）
    setTimeout(() => {
      let hitCount = 0
      world.enemies.forEach(enemy => {
        if (!enemy || !enemy.isAlive) return

        const enemyPos = enemy.getPosition()
        const dist = targetPosition.distanceTo(enemyPos)

        if (dist <= this.radius) {
          enemy.takeDamage(this.damage)
          hitCount++

          // 伤害飘字
          import('./tower-attack-utils.js').then(({ createDamageText }) => {
            createDamageText(enemyPos, this.damage, true, world.root)
          })
        }
      })

      console.log(`空袭命中 ${hitCount} 个敌人`)

      // 触发事件
      world.experience.eventBus.emit('skill:airstrike-hit', {
        position: targetPosition,
        hitCount,
        damage: this.damage,
      })
    }, 500)

    this.startCooldown()
  }
}

/**
 * 冰冻技能
 */
export class FreezeSkill extends ActiveSkill {
  constructor() {
    super(SKILL_CONFIG.freeze)
    this.duration = SKILL_CONFIG.freeze.duration
    this.radius = SKILL_CONFIG.freeze.radius
  }

  activate(targetPosition, world) {
    console.log('❄️ 冰冻技能激活！位置:', targetPosition)

    // 创建视觉效果
    createSkillEffect('freeze', targetPosition, world.root, this.duration)

    let frozenCount = 0
    world.enemies.forEach(enemy => {
      if (!enemy || !enemy.isAlive) return

      const enemyPos = enemy.getPosition()
      const dist = targetPosition.distanceTo(enemyPos)

      if (dist <= this.radius) {
        enemy.applyFreeze(this.duration)
        frozenCount++
      }
    })

    console.log(`冰冻了 ${frozenCount} 个敌人`)

    // 触发事件
    world.experience.eventBus.emit('skill:freeze-applied', {
      position: targetPosition,
      frozenCount,
      duration: this.duration,
    })

    this.startCooldown()
  }
}

/**
 * 闪电链技能
 */
export class LightningSkill extends ActiveSkill {
  constructor() {
    super(SKILL_CONFIG.lightning)
    this.damage = SKILL_CONFIG.lightning.damage
    this.maxTargets = SKILL_CONFIG.lightning.maxTargets
    this.jumpRange = SKILL_CONFIG.lightning.jumpRange
    this.damageDecay = SKILL_CONFIG.lightning.damageDecay
  }

  activate(targetPosition, world) {
    console.log('⚡ 闪电链技能激活！位置:', targetPosition)

    // 找到最近的敌人作为起点
    let closestEnemy = null
    let minDist = Infinity

    world.enemies.forEach(enemy => {
      if (!enemy || !enemy.isAlive) return

      const enemyPos = enemy.getPosition()
      const dist = targetPosition.distanceTo(enemyPos)

      if (dist < minDist) {
        minDist = dist
        closestEnemy = enemy
      }
    })

    if (!closestEnemy) {
      console.log('闪电链未找到目标')
      return
    }

    // 执行链式攻击
    const chainTargets = this.findChainTargets(closestEnemy, world.enemies)
    let currentDamage = this.damage

    chainTargets.forEach((enemy, index) => {
      // 延迟施加伤害，创建跳跃动画
      setTimeout(() => {
        if (enemy.isAlive) {
          enemy.takeDamage(currentDamage)

          // 伤害飘字
          import('./tower-attack-utils.js').then(({ createDamageText }) => {
            createDamageText(enemy.getPosition(), currentDamage, false, world.root)
          })

          // 下一次伤害衰减
          currentDamage *= this.damageDecay
        }
      }, index * 100) // 每次跳跃延迟100ms
    })

    // 创建闪电链视觉效果
    createSkillEffect('lightning', chainTargets, world.root)

    console.log(`闪电链命中 ${chainTargets.length} 个目标`)

    // 触发事件
    world.experience.eventBus.emit('skill:lightning-chain', {
      targets: chainTargets.length,
      totalDamage: this.calculateTotalDamage(chainTargets.length),
    })

    this.startCooldown()
  }

  /**
   * 查找闪电链目标
   * @param {Enemy} startEnemy - 起始敌人
   * @param {Array<Enemy>} allEnemies - 所有敌人
   * @returns {Array<Enemy>} 链式目标列表
   */
  findChainTargets(startEnemy, allEnemies) {
    const targets = [startEnemy]
    const visited = new Set([startEnemy])

    let currentEnemy = startEnemy

    while (targets.length < this.maxTargets) {
      let nextEnemy = null
      let minDist = Infinity

      // 找到最近的未访问敌人
      allEnemies.forEach(enemy => {
        if (!enemy || !enemy.isAlive || visited.has(enemy)) return

        const currentPos = currentEnemy.getPosition()
        const enemyPos = enemy.getPosition()
        const dist = currentPos.distanceTo(enemyPos)

        if (dist <= this.jumpRange && dist < minDist) {
          minDist = dist
          nextEnemy = enemy
        }
      })

      if (!nextEnemy) break // 没有更多目标

      targets.push(nextEnemy)
      visited.add(nextEnemy)
      currentEnemy = nextEnemy
    }

    return targets
  }

  /**
   * 计算总伤害
   */
  calculateTotalDamage(targetCount) {
    let total = 0
    let damage = this.damage
    for (let i = 0; i < targetCount; i++) {
      total += damage
      damage *= this.damageDecay
    }
    return Math.round(total)
  }
}

/**
 * 技能系统管理器
 */
export class SkillSystem {
  constructor(world) {
    this.world = world
    this.skills = {
      airstrike: new AirstrikeSkill(),
      freeze: new FreezeSkill(),
      lightning: new LightningSkill(),
    }
    this.activeSkillId = null // 当前选择的技能
  }

  /**
   * 选择技能（进入目标选择模式）
   * @param {string} skillId
   * @returns {boolean} 是否成功选择
   */
  selectSkill(skillId) {
    const skill = this.skills[skillId]
    if (!skill) return false

    // 修复：credits 在 gameState 根级别，不在 metadata 中
    const credits = this.world.gameState.credits || 0
    if (!skill.canUse(credits)) return false

    this.activeSkillId = skillId
    return true
  }

  /**
   * 取消技能选择
   */
  cancelSkill() {
    this.activeSkillId = null
  }

  /**
   * 使用技能
   * @param {THREE.Vector3} targetPosition
   * @returns {boolean} 是否成功使用
   */
  useSkill(targetPosition) {
    if (!this.activeSkillId) return false

    const skill = this.skills[this.activeSkillId]
    // 修复：credits 在 gameState 根级别
    const credits = this.world.gameState.credits || 0

    if (!skill.canUse(credits)) {
      this.activeSkillId = null
      return false
    }

    // 扣除金币
    this.world.gameState.updateCredits(-skill.cost)

    // 激活技能
    skill.activate(targetPosition, this.world)

    // 清除选择状态
    this.activeSkillId = null

    return true
  }

  /**
   * 获取所有技能状态
   */
  getSkillsStatus() {
    // 修复：credits 在 gameState 根级别
    const credits = this.world.gameState.credits || 0
    return Object.values(this.skills).map(skill => ({
      id: skill.id,
      name: skill.name,
      nameEn: skill.nameEn,
      icon: skill.icon,
      cost: skill.cost,
      cooldown: skill.cooldown,
      remainingCooldown: skill.getRemainingCooldown(),
      progress: skill.getCooldownProgress(),
      canUse: skill.canUse(credits),
      isActive: this.activeSkillId === skill.id,
    }))
  }
}

