import * as THREE from 'three'
import Projectile from './projectile.js'

export default class Tower {
  constructor(x, z, world) {
    this.world = world
    this.scene = world.root
    this.position = new THREE.Vector3(x, 0.5, z) // 塔的位置
    
    // 属性
    this.range = 6 // 攻击范围
    this.damage = 20 // 伤害
    this.cooldown = 1.0 // 攻击间隔 (秒)
    this.lastAttackTime = 0
    
    // 创建模型
    this.mesh = this.createMesh()
    this.mesh.position.copy(this.position)
    this.scene.add(this.mesh)
    
    // 范围指示器 (选中时显示，这里暂时常驻或不显示)
    // this.rangeIndicator = ...
  }

  createMesh() {
    const group = new THREE.Group()
    
    // 基座
    const baseGeo = new THREE.CylinderGeometry(0.8, 1, 0.5, 8)
    const baseMat = new THREE.MeshStandardMaterial({ color: '#4299e1' })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = 0.25
    base.castShadow = true
    group.add(base)

    // 炮塔
    const turretGeo = new THREE.SphereGeometry(0.6, 8, 8)
    const turretMat = new THREE.MeshStandardMaterial({ color: '#2b6cb0' })
    this.turret = new THREE.Mesh(turretGeo, turretMat)
    this.turret.position.y = 0.8
    group.add(this.turret)

    // 炮管
    const barrelGeo = new THREE.CylinderGeometry(0.1, 0.1, 1)
    const barrelMat = new THREE.MeshStandardMaterial({ color: '#2c5282' })
    this.barrel = new THREE.Mesh(barrelGeo, barrelMat)
    this.barrel.rotation.x = Math.PI / 2
    this.barrel.position.z = 0.5
    this.turret.add(this.barrel)

    return group
  }

  update(dt, time) {
    // 冷却检查
    if (time - this.lastAttackTime < this.cooldown * 1000) return

    // 索敌
    const target = this.findTarget()
    if (target) {
      this.attack(target)
      this.lastAttackTime = time
    }
  }

  findTarget() {
    // 简单的索敌：找范围内最近的敌人
    // 也可以改为找进度最靠前的敌人 (progress 最大)
    let nearest = null
    let minDist = this.range

    for (const enemy of this.world.enemies) {
      const dist = this.position.distanceTo(enemy.position)
      if (dist <= this.range) {
        // 优先攻击走得最远的 (progress 大)
        // 这里简单起见，先攻击最近的
        if (dist < minDist) {
          minDist = dist
          nearest = enemy
        }
      }
    }
    return nearest
  }

  attack(target) {
    // 朝向目标
    this.turret.lookAt(target.position)
    
    // 发射子弹
    // 子弹起始位置：炮管末端
    const spawnPos = new THREE.Vector3()
    this.barrel.getWorldPosition(spawnPos)
    
    const projectile = new Projectile(spawnPos, target, this.damage)
    this.world.addProjectile(projectile)
  }
}

