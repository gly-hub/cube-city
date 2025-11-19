import * as THREE from 'three'

export default class Projectile {
  constructor(startPos, target, damage = 10, speed = 10) {
    this.position = startPos.clone()
    this.target = target // 目标敌人对象 (Mesh)
    this.damage = damage
    this.speed = speed
    this.isDead = false

    // 创建简单的子弹模型
    const geometry = new THREE.SphereGeometry(0.2, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: '#ffff00' })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
  }

  update(dt) {
    if (this.isDead) return

    // 如果目标已经死亡或消失，子弹也销毁
    if (!this.target || !this.target.parent || this.target.userData.health <= 0) {
      this.isDead = true
      return
    }

    const targetPos = this.target.position
    const direction = new THREE.Vector3().subVectors(targetPos, this.position).normalize()
    const distance = this.position.distanceTo(targetPos)
    const moveDist = this.speed * dt

    if (moveDist >= distance) {
      // 击中目标
      this.position.copy(targetPos)
      this.mesh.position.copy(this.position)
      this.hit()
    } else {
      // 移动
      this.position.add(direction.multiplyScalar(moveDist))
      this.mesh.position.copy(this.position)
    }
  }

  hit() {
    this.isDead = true
    if (this.target && this.target.userData) {
      this.target.userData.health -= this.damage
      // 简单的受击反馈：变白一下
      if (this.target.material) {
        const oldColor = this.target.material.color.getHex()
        this.target.material.color.setHex(0xffffff)
        setTimeout(() => {
          if (this.target && this.target.material) {
            this.target.material.color.setHex(oldColor)
          }
        }, 50)
      }
    }
  }
}

