/**
 * 技能视觉效果
 * 为主动技能提供华丽的视觉反馈
 */

import * as THREE from 'three'

/**
 * 创建技能效果
 * @param {string} skillType - 技能类型 'airstrike' | 'freeze' | 'lightning'
 * @param {THREE.Vector3|Array} target - 目标位置或目标数组
 * @param {THREE.Group} scene - 场景对象
 * @param {number} duration - 持续时间（可选）
 */
export function createSkillEffect(skillType, target, scene, duration) {
  switch (skillType) {
    case 'airstrike':
      return createAirstrikeEffect(target, scene)
    case 'freeze':
      return createFreezeEffect(target, scene, duration)
    case 'lightning':
      return createLightningEffect(target, scene)
    default:
      console.warn(`未知技能类型: ${skillType}`)
  }
}

/**
 * 空袭效果：导弹下落 + 爆炸
 */
function createAirstrikeEffect(targetPosition, scene) {
  // 1. 创建目标指示圈
  const indicatorGeometry = new THREE.RingGeometry(2.3, 2.5, 32)
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: '#ff0000',
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
  indicator.rotation.x = -Math.PI / 2
  indicator.position.copy(targetPosition)
  indicator.position.y = 0.1
  scene.add(indicator)

  // 指示圈闪烁动画
  let opacity = 0.6
  let direction = -1
  const blinkInterval = setInterval(() => {
    opacity += direction * 0.1
    if (opacity <= 0.2 || opacity >= 0.8) direction *= -1
    indicatorMaterial.opacity = opacity
  }, 50)

  // 2. 创建导弹（从天而降）
  const missileGeometry = new THREE.ConeGeometry(0.2, 1, 8)
  const missileMaterial = new THREE.MeshStandardMaterial({
    color: '#ff4500',
    emissive: '#ff4500',
    emissiveIntensity: 0.5,
  })
  const missile = new THREE.Mesh(missileGeometry, missileMaterial)
  missile.position.copy(targetPosition)
  missile.position.y = 10 // 从高空开始
  missile.rotation.x = Math.PI // 头朝下
  scene.add(missile)

  // 导弹下落动画
  import('gsap').then(({ default: gsap }) => {
    gsap.to(missile.position, {
      y: targetPosition.y,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        // 移除导弹
        scene.remove(missile)
        missileGeometry.dispose()
        missileMaterial.dispose()

        // 创建爆炸效果
        createExplosion(targetPosition, scene, 2.5)
      },
    })
  })

  // 0.5秒后移除指示圈
  setTimeout(() => {
    clearInterval(blinkInterval)
    scene.remove(indicator)
    indicatorGeometry.dispose()
    indicatorMaterial.dispose()
  }, 500)
}

/**
 * 爆炸效果
 */
function createExplosion(position, scene, radius) {
  // 爆炸光球
  const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color: '#ff6600',
    transparent: true,
    opacity: 1,
  })
  const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial)
  explosion.position.copy(position)
  explosion.position.y += 0.5
  scene.add(explosion)

  // 爆炸扩散环
  const ringGeometry = new THREE.RingGeometry(0.1, radius, 32)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: '#ff4500',
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.copy(position)
  ring.position.y = 0.1
  scene.add(ring)

  // 动画
  import('gsap').then(({ default: gsap }) => {
    // 光球扩大并淡出
    gsap.to(explosion.scale, {
      x: 3,
      y: 3,
      z: 3,
      duration: 0.5,
    })
    gsap.to(explosionMaterial, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        scene.remove(explosion)
        explosionGeometry.dispose()
        explosionMaterial.dispose()
      },
    })

    // 扩散环放大并淡出
    gsap.to(ring.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.6,
    })
    gsap.to(ringMaterial, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        scene.remove(ring)
        ringGeometry.dispose()
        ringMaterial.dispose()
      },
    })
  })
}

/**
 * 冰冻效果：冰冻圈 + 持续效果
 */
function createFreezeEffect(targetPosition, scene, duration) {
  // 1. 冰冻扩散圈
  const freezeGeometry = new THREE.RingGeometry(0.1, 3.0, 32)
  const freezeMaterial = new THREE.MeshBasicMaterial({
    color: '#00ffff',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  })
  const freezeRing = new THREE.Mesh(freezeGeometry, freezeMaterial)
  freezeRing.rotation.x = -Math.PI / 2
  freezeRing.position.copy(targetPosition)
  freezeRing.position.y = 0.1
  scene.add(freezeRing)

  // 2. 持续的冰冻区域
  const areaGeometry = new THREE.CircleGeometry(3.0, 32)
  const areaMaterial = new THREE.MeshBasicMaterial({
    color: '#00bfff',
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
  const freezeArea = new THREE.Mesh(areaGeometry, areaMaterial)
  freezeArea.rotation.x = -Math.PI / 2
  freezeArea.position.copy(targetPosition)
  freezeArea.position.y = 0.05
  scene.add(freezeArea)

  import('gsap').then(({ default: gsap }) => {
    // 扩散动画
    gsap.to(freezeMaterial, {
      opacity: 0.8,
      duration: 0.3,
    })
    gsap.to(freezeMaterial, {
      opacity: 0,
      duration: 0.3,
      delay: 0.3,
      onComplete: () => {
        scene.remove(freezeRing)
        freezeGeometry.dispose()
        freezeMaterial.dispose()
      },
    })

    // 持续区域闪烁
    gsap.to(areaMaterial, {
      opacity: 0.5,
      duration: 0.5,
      repeat: Math.floor(duration * 2),
      yoyo: true,
    })

    // duration 秒后移除
    setTimeout(() => {
      gsap.to(areaMaterial, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          scene.remove(freezeArea)
          areaGeometry.dispose()
          areaMaterial.dispose()
        },
      })
    }, duration * 1000)
  })
}

/**
 * 闪电链效果：电弧连线
 */
function createLightningEffect(targets, scene) {
  if (!Array.isArray(targets) || targets.length < 2) return

  const lines = []

  // 为每对相邻目标创建闪电连线
  for (let i = 0; i < targets.length - 1; i++) {
    const startEnemy = targets[i]
    const endEnemy = targets[i + 1]

    if (!startEnemy || !endEnemy) continue

    const startPos = startEnemy.getPosition().add(new THREE.Vector3(0, 0.5, 0))
    const endPos = endEnemy.getPosition().add(new THREE.Vector3(0, 0.5, 0))

    // 创建闪电线
    const points = [startPos, endPos]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: '#ffff00',
      linewidth: 3,
      transparent: true,
      opacity: 1,
    })
    const line = new THREE.Line(geometry, material)
    scene.add(line)
    lines.push({ line, geometry, material })

    // 延迟显示，创建跳跃效果
    setTimeout(() => {
      import('gsap').then(({ default: gsap }) => {
        // 闪电淡出
        gsap.to(material, {
          opacity: 0,
          duration: 0.3,
          delay: 0.2,
          onComplete: () => {
            scene.remove(line)
            geometry.dispose()
            material.dispose()
          },
        })
      })
    }, i * 100)
  }

  // 为每个目标添加闪光效果
  targets.forEach((enemy, index) => {
    if (!enemy) return

    setTimeout(() => {
      createLightningFlash(enemy.getPosition(), scene)
    }, index * 100)
  })
}

/**
 * 闪电闪光效果
 */
function createLightningFlash(position, scene) {
  const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8)
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: '#ffff00',
    transparent: true,
    opacity: 1,
  })
  const flash = new THREE.Mesh(flashGeometry, flashMaterial)
  flash.position.copy(position)
  flash.position.y += 0.5
  scene.add(flash)

  import('gsap').then(({ default: gsap }) => {
    gsap.to(flash.scale, {
      x: 2,
      y: 2,
      z: 2,
      duration: 0.2,
    })
    gsap.to(flashMaterial, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        scene.remove(flash)
        flashGeometry.dispose()
        flashMaterial.dispose()
      },
    })
  })
}

/**
 * 创建技能范围指示器（用于UI选择目标）
 * @param {number} radius - 范围半径
 * @param {string} color - 颜色
 * @returns {THREE.Mesh} 指示器网格
 */
export function createRangeIndicator(radius, color = '#ffffff') {
  const geometry = new THREE.RingGeometry(radius - 0.1, radius, 32)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const indicator = new THREE.Mesh(geometry, material)
  indicator.rotation.x = -Math.PI / 2
  indicator.visible = false
  return indicator
}




