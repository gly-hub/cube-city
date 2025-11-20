import * as THREE from 'three'
import { getTowerConfig } from './tower-config.js'

/**
 * 防御塔工厂 - 负责创建防御塔的 3D 模型
 */
export default class TowerFactory {
  /**
   * 创建防御塔的 3D 模型
   * @param {string} towerType - 塔类型
   * @param {number} level - 塔等级
   * @returns {THREE.Group} 塔的 3D 模型
   */
  static createTowerMesh(towerType, level = 1) {
    const towerConfig = getTowerConfig(towerType, level)
    
    if (!towerConfig) {
      console.error('无效的塔类型:', towerType)
      return this.createDefaultTower()
    }
    
    const { visual, type } = towerConfig
    const baseColor = visual?.baseColor || '#64748b'
    const turretColor = visual?.turretColor || '#475569'
    
    // 创建塔组
    const towerGroup = new THREE.Group()
    
    // 基座
    const baseGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8)
    const baseMat = new THREE.MeshStandardMaterial({ color: baseColor })
    const base = new THREE.Mesh(baseGeom, baseMat)
    base.position.y = 0
    base.castShadow = true
    towerGroup.add(base)
    
    // 塔身
    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ color: turretColor })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.position.y = 0.55
    body.castShadow = true
    towerGroup.add(body)
    
    // 根据类型添加特殊装饰
    switch (type) {
      case 'slow':
        // 减速塔：顶部加冰晶
        const iceGeom = new THREE.OctahedronGeometry(0.15)
        const iceMat = new THREE.MeshStandardMaterial({ 
          color: '#60a5fa',
          emissive: '#3b82f6',
          emissiveIntensity: 0.3
        })
        const ice = new THREE.Mesh(iceGeom, iceMat)
        ice.position.y = 1.0
        towerGroup.add(ice)
        break
        
      case 'aoe':
        // 范围塔：顶部加炮管
        const cannonGeom = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6)
        const cannonMat = new THREE.MeshStandardMaterial({ color: '#dc2626' })
        const cannon = new THREE.Mesh(cannonGeom, cannonMat)
        cannon.position.y = 1.1
        cannon.rotation.x = Math.PI / 4
        towerGroup.add(cannon)
        break
        
      case 'sniper':
        // 狙击塔：长炮管
        const rifleGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6)
        const rifleMat = new THREE.MeshStandardMaterial({ color: '#7c3aed' })
        const rifle = new THREE.Mesh(rifleGeom, rifleMat)
        rifle.position.y = 1.2
        rifle.rotation.x = Math.PI / 6
        towerGroup.add(rifle)
        break
        
      case 'support':
        // 辅助塔：顶部加光环
        const ringGeom = new THREE.TorusGeometry(0.3, 0.05, 8, 16)
        const ringMat = new THREE.MeshStandardMaterial({ 
          color: '#6ee7b7',
          emissive: '#10b981',
          emissiveIntensity: 0.5
        })
        const ring = new THREE.Mesh(ringGeom, ringMat)
        ring.position.y = 1.0
        ring.rotation.x = Math.PI / 2
        towerGroup.add(ring)
        
        // 辅助塔的光环动画（在 update 中旋转）
        ring.userData.isAnimated = true
        break
        
      case 'antiAir':
        // 防空塔：多个小炮管
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2
          const gunGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6)
          const gunMat = new THREE.MeshStandardMaterial({ color: '#d97706' })
          const gun = new THREE.Mesh(gunGeom, gunMat)
          gun.position.set(
            Math.cos(angle) * 0.2,
            0.9,
            Math.sin(angle) * 0.2
          )
          gun.rotation.x = Math.PI / 3
          gun.rotation.z = -angle
          towerGroup.add(gun)
        }
        break
    }
    
    // 保存配置到 userData
    towerGroup.userData.towerConfig = towerConfig
    
    return towerGroup
  }
  
  /**
   * 创建默认塔模型（用于错误情况）
   */
  static createDefaultTower() {
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8)
    const material = new THREE.MeshStandardMaterial({ color: '#4299e1' })
    const tower = new THREE.Mesh(geometry, material)
    tower.castShadow = true
    return tower
  }
  
  /**
   * 创建子弹模型
   * @param {object} towerConfig - 塔配置
   * @returns {THREE.Mesh} 子弹模型
   */
  static createProjectile(towerConfig) {
    const visual = towerConfig.visual || {}
    const projectileColor = visual.projectileColor || '#fbbf24'
    
    let geometry
    let material
    
    // 根据塔类型创建不同的子弹
    switch (towerConfig.type) {
      case 'slow':
        // 冰弹：冰蓝色球体
        geometry = new THREE.SphereGeometry(0.12, 8, 8)
        material = new THREE.MeshStandardMaterial({ 
          color: projectileColor,
          emissive: projectileColor,
          emissiveIntensity: 0.5
        })
        break
        
      case 'aoe':
        // 榴弹：大一点的球体
        geometry = new THREE.SphereGeometry(0.15, 8, 8)
        material = new THREE.MeshStandardMaterial({ 
          color: projectileColor,
          emissive: '#f97316',
          emissiveIntensity: 0.3
        })
        break
        
      case 'sniper':
        // 狙击弹：细长的圆柱
        geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6)
        material = new THREE.MeshStandardMaterial({ 
          color: projectileColor,
          emissive: projectileColor,
          emissiveIntensity: 0.8
        })
        break
        
      case 'antiAir':
        // 导弹：锥形
        geometry = new THREE.ConeGeometry(0.08, 0.25, 6)
        material = new THREE.MeshStandardMaterial({ 
          color: projectileColor,
          emissive: '#f59e0b',
          emissiveIntensity: 0.4
        })
        break
        
      default:
        // 默认：普通球体
        geometry = new THREE.SphereGeometry(0.1, 8, 8)
        material = new THREE.MeshStandardMaterial({ 
          color: projectileColor,
          emissive: projectileColor,
          emissiveIntensity: 0.4
        })
    }
    
    const projectile = new THREE.Mesh(geometry, material)
    projectile.castShadow = false
    
    return projectile
  }
  
  /**
   * 创建范围指示器（显示塔的射程）
   * @param {number} range - 射程
   * @param {string} color - 颜色
   * @returns {THREE.Mesh} 范围指示器
   */
  static createRangeIndicator(range, color = '#4299e1') {
    const geometry = new THREE.RingGeometry(range - 0.05, range + 0.05, 64)
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.05
    
    return ring
  }
}



