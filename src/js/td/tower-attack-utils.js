/**
 * 塔防系统 - 攻击逻辑辅助函数
 * 
 * 提供目标选择、特殊效果处理等核心功能
 */

import * as THREE from 'three'
import { TargetPriority } from './tower-config.js'

/**
 * 根据塔的攻击优先级选择目标
 * @param {THREE.Mesh} tower - 塔对象
 * @param {Array} enemies - 敌人数组
 * @param {THREE.Vector3} towerPosition - 塔的世界坐标
 * @returns {Enemy|null} 选中的目标
 */
export function findTarget(tower, enemies, towerPosition) {
  const { range, targetPriority, canTargetGround } = tower.userData
  
  let candidates = []
  
  // 筛选候选目标
  for (const enemy of enemies) {
    if (!enemy || !enemy.isAlive) continue
    
    // 飞行单位检查
    const isFlying = enemy.stats?.special?.isFlying || false
    
    // 如果塔只能打飞行单位（防空塔）
    if (targetPriority === TargetPriority.FLYING && !isFlying) {
      continue
    }
    
    // 如果塔不能打地面单位，且敌人不是飞行单位
    if (canTargetGround === false && !isFlying) {
      continue
    }
    
    // 隐身检查
    if (enemy.isStealthed) {
      continue
    }
    
    // 距离检查
    const enemyPos = enemy.getPosition()
    const dist = towerPosition.distanceTo(enemyPos)
    if (dist <= range) {
      candidates.push({ enemy, dist })
    }
  }
  
  if (candidates.length === 0) return null
  
  // 根据优先级排序
  switch (targetPriority) {
    case TargetPriority.NEAREST:
      return candidates.sort((a, b) => a.dist - b.dist)[0].enemy
      
    case TargetPriority.FARTHEST:
      return candidates.sort((a, b) => b.dist - a.dist)[0].enemy
      
    case TargetPriority.STRONGEST:
      return candidates.sort((a, b) => b.enemy.health - a.enemy.health)[0].enemy
      
    case TargetPriority.WEAKEST:
      return candidates.sort((a, b) => a.enemy.health - b.enemy.health)[0].enemy
      
    case TargetPriority.FASTEST:
      return candidates.sort((a, b) => {
        const speedA = a.enemy.getCurrentSpeed()
        const speedB = b.enemy.getCurrentSpeed()
        return speedB - speedA
      })[0].enemy
      
    case TargetPriority.FLYING:
      // 飞行优先：只打飞行单位
      const flying = candidates.filter(c => c.enemy.stats?.special?.isFlying)
      return flying.length > 0 ? flying[0].enemy : null
      
    default:
      // 默认最近
      return candidates.sort((a, b) => a.dist - b.dist)[0].enemy
  }
}

/**
 * 应用子弹击中效果
 * @param {object} projectileData - 子弹数据
 * @param {Enemy} enemy - 被击中的敌人
 * @param {Array} allEnemies - 所有敌人（用于AOE）
 * @param {THREE.Scene} scene - 场景（用于特效）
 * @returns {object} 伤害信息 { damage, isCrit, affectedCount }
 */
export function applyHitEffects(projectileData, enemy, allEnemies, scene) {
  let finalDamage = projectileData.damage
  let isCrit = false
  let affectedCount = 1
  
  // 暴击检测
  if (projectileData.critChance && Math.random() < projectileData.critChance) {
    isCrit = true
    finalDamage *= projectileData.critMultiplier
  }
  
  // 减速效果
  if (projectileData.slowEffect) {
    enemy.applySlow(
      projectileData.slowEffect.multiplier,
      projectileData.slowEffect.duration
    )
  }
  
  // AOE 伤害
  if (projectileData.aoeRadius) {
    const hitPos = enemy.getPosition()
    const aoeRadius = projectileData.aoeRadius
    
    // 对范围内所有敌人造成伤害
    allEnemies.forEach((otherEnemy) => {
      if (!otherEnemy || !otherEnemy.isAlive) return
      
      const dist = hitPos.distanceTo(otherEnemy.getPosition())
      if (dist <= aoeRadius) {
        otherEnemy.takeDamage(finalDamage)
        if (otherEnemy !== enemy) {
          affectedCount++
        }
      }
    })
    
    // 创建AOE视觉效果
    createAOEEffect(hitPos, aoeRadius, scene)
  } else {
    // 单体伤害
    enemy.takeDamage(finalDamage)
  }
  
  return { damage: finalDamage, isCrit, affectedCount }
}

/**
 * 创建AOE爆炸效果
 * @param {THREE.Vector3} position - 爆炸位置
 * @param {number} radius - 爆炸半径
 * @param {THREE.Scene} scene - 场景
 */
function createAOEEffect(position, radius, scene) {
  // 创建爆炸圆环
  const geometry = new THREE.RingGeometry(0.1, radius, 32)
  const material = new THREE.MeshBasicMaterial({
    color: '#f97316',
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.position.copy(position)
  ring.position.y += 0.1
  ring.rotation.x = -Math.PI / 2
  scene.add(ring)
  
  // 动画：扩散并淡出
  import('gsap').then(({ default: gsap }) => {
    gsap.to(ring.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.5,
      ease: 'power2.out'
    })
    
    gsap.to(material, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        scene.remove(ring)
        geometry.dispose()
        material.dispose()
      }
    })
  })
}

/**
 * 计算辅助塔的增益效果
 * @param {Array} towers - 所有塔
 * @param {THREE.Mesh} tower - 当前塔
 * @param {THREE.Vector3} towerPosition - 塔的位置
 * @returns {object} 增益效果 { damageMultiplier, rangeBonus, cooldownMultiplier }
 */
export function calculateBuffEffects(towers, tower, towerPosition) {
  let damageMultiplier = 1.0
  let rangeBonus = 0
  let cooldownMultiplier = 1.0
  
  // 遍历所有辅助塔
  for (const otherTower of towers) {
    if (!otherTower || !otherTower.userData.buffEffect) continue
    if (otherTower === tower) continue
    
    const otherPos = new THREE.Vector3()
    otherTower.getWorldPosition(otherPos)
    
    const dist = towerPosition.distanceTo(otherPos)
    const buffRange = otherTower.userData.range
    
    // 如果在辅助范围内
    if (dist <= buffRange) {
      const buff = otherTower.userData.buffEffect
      damageMultiplier *= (1 + buff.damageBonus)
      rangeBonus += tower.userData.range * buff.rangeBonus
      cooldownMultiplier *= (1 - buff.cooldownReduction)
    }
  }
  
  return { damageMultiplier, rangeBonus, cooldownMultiplier }
}

/**
 * 创建伤害飘字
 * @param {THREE.Vector3} position - 位置
 * @param {number} damage - 伤害值
 * @param {boolean} isCrit - 是否暴击
 * @param {THREE.Scene} scene - 场景
 */
export function createDamageText(position, damage, isCrit, scene) {
  // 创建canvas纹理
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  
  // 绘制文字
  ctx.font = isCrit ? 'bold 48px Arial' : 'bold 32px Arial'
  ctx.fillStyle = isCrit ? '#fde047' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`-${Math.round(damage)}`, 64, 32)
  
  // 创建精灵
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  
  sprite.position.copy(position)
  sprite.position.y += 1
  sprite.scale.set(0.5, 0.25, 1)
  
  scene.add(sprite)
  
  // 动画：向上飘并淡出
  import('gsap').then(({ default: gsap }) => {
    gsap.to(sprite.position, {
      y: position.y + 2,
      duration: 1,
      ease: 'power2.out',
    })
    
    gsap.to(sprite.material, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        scene.remove(sprite)
        texture.dispose()
        material.dispose()
      },
    })
  })
}

/**
 * 计算最终伤害（考虑防御）
 * @param {THREE.Mesh} tower - 塔对象
 * @param {Enemy} enemy - 敌人对象
 * @param {number} baseDamage - 基础伤害
 * @returns {number} 最终伤害
 */
export function calculateDamage(tower, enemy, baseDamage) {
  let finalDamage = baseDamage
  
  // 暴击检测（狙击塔）
  if (tower?.userData?.specialEffect === 'critical') {
    if (Math.random() < 0.3) { // 30% 暴击率
      finalDamage *= 2.0
    }
  }
  
  // 应用敌人防御
  const defense = enemy.stats.defense || 0
  finalDamage *= (1 - defense)
  
  return Math.max(1, finalDamage) // 至少造成1点伤害
}

/**
 * 应用特殊效果
 * @param {THREE.Mesh} tower - 塔对象
 * @param {Enemy} enemy - 主要目标
 * @param {Array<Enemy>} allEnemies - 所有敌人
 * @param {number} baseDamage - 基础伤害
 * @param {THREE.Scene} scene - 场景
 */
export function applySpecialEffect(tower, enemy, allEnemies, baseDamage, scene) {
  const specialEffect = tower.userData.specialEffect
  
  switch (specialEffect) {
    case 'slow':
      // 减速效果
      enemy.applySlow(0.5, 2.0) // 减速50%，持续2秒
      break
      
    case 'aoe':
      // AOE范围伤害
      const hitPos = enemy.getPosition()
      const aoeRadius = 1.5
      let affectedCount = 0
      
      allEnemies.forEach((otherEnemy) => {
        if (!otherEnemy || !otherEnemy.isAlive || otherEnemy === enemy) return
        
        const dist = hitPos.distanceTo(otherEnemy.getPosition())
        if (dist <= aoeRadius) {
          const aoeDamage = baseDamage * 0.5 // AOE伤害减半
          otherEnemy.takeDamage(aoeDamage)
          createDamageText(otherEnemy.getPosition(), aoeDamage, false, scene)
          affectedCount++
        }
      })
      
      // 创建AOE视觉效果
      if (affectedCount > 0) {
        createAOEEffect(hitPos, aoeRadius, scene)
      }
      break
      
    // critical 和 buff 效果在其他地方处理
    default:
      break
  }
}


