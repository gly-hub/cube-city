/**
 * 怪物模型工厂
 *
 * 负责创建不同类型怪物的 3D 模型和动画
 * 支持：
 * 1. GLTF 模型加载（推荐）
 * 2. 程序化生成模型（备用方案）
 * 3. 骨骼动画
 * 4. 程序动画（移动、跳跃、受伤等）
 */

import * as THREE from 'three'

/**
 * 怪物模型配置
 */
const ENEMY_MODEL_CONFIG = {
  scout: {
    // GLTF 模型路径（如果有的话）
    modelPath: null, // 'models/enemies/scout.glb'
    // 程序化生成配置
    proceduralConfig: {
      bodyColor: '#10b981',
      bodyShape: 'capsule', // 'box', 'capsule', 'sphere'
      bodySize: { width: 0.4, height: 0.8, depth: 0.4 },
      hasLegs: true,
      legCount: 2,
      hasArms: true,
      hasHead: true,
      headSize: 0.25,
    },
    // 动画配置
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.15, // 上下摆动幅度
        bobSpeed: 8, // 摆动速度
        tiltAmount: 0.1, // 倾斜幅度
        legSwingAmount: 0.3, // 腿部摆动幅度
      },
      idle: {
        type: 'procedural',
        bobAmount: 0.05,
        bobSpeed: 2,
      },
    },
  },

  tank: {
    modelPath: null,
    proceduralConfig: {
      bodyColor: '#6366f1',
      bodyShape: 'box',
      bodySize: { width: 0.7, height: 0.7, depth: 0.7 },
      hasLegs: true,
      legCount: 4,
      hasArms: false,
      hasHead: false,
      armor: true, // 添加装甲板
    },
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.08,
        bobSpeed: 4,
        tiltAmount: 0.05,
        legSwingAmount: 0.2,
      },
    },
  },

  runner: {
    modelPath: null,
    proceduralConfig: {
      bodyColor: '#f59e0b',
      bodyShape: 'capsule',
      bodySize: { width: 0.35, height: 0.7, depth: 0.35 },
      hasLegs: true,
      legCount: 2,
      hasArms: true,
      hasHead: true,
      headSize: 0.2,
      streamline: true, // 流线型
    },
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.2,
        bobSpeed: 12,
        tiltAmount: 0.15,
        legSwingAmount: 0.4,
        leanForward: 0.2, // 前倾
      },
    },
  },

  armored: {
    modelPath: null,
    proceduralConfig: {
      bodyColor: '#8b5cf6',
      bodyShape: 'box',
      bodySize: { width: 0.6, height: 0.6, depth: 0.6 },
      hasLegs: true,
      legCount: 4,
      hasArms: false,
      hasHead: true,
      headSize: 0.3,
      armor: true,
      heavyArmor: true, // 重型装甲
    },
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.06,
        bobSpeed: 3,
        tiltAmount: 0.03,
        legSwingAmount: 0.15,
      },
    },
  },

  elite: {
    modelPath: null,
    proceduralConfig: {
      bodyColor: '#ec4899',
      bodyShape: 'capsule',
      bodySize: { width: 0.5, height: 0.9, depth: 0.5 },
      hasLegs: true,
      legCount: 2,
      hasArms: true,
      hasHead: true,
      headSize: 0.28,
      cape: true, // 披风
      glow: true, // 发光效果
    },
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.12,
        bobSpeed: 7,
        tiltAmount: 0.08,
        legSwingAmount: 0.25,
        capeFlow: true, // 披风飘动
      },
    },
  },

  boss: {
    modelPath: null,
    proceduralConfig: {
      bodyColor: '#ef4444',
      bodyShape: 'box',
      bodySize: { width: 1.2, height: 1.5, depth: 1.2 },
      hasLegs: true,
      legCount: 4,
      hasArms: true,
      hasHead: true,
      headSize: 0.6,
      armor: true,
      heavyArmor: true,
      spikes: true, // 尖刺
      glow: true,
    },
    animations: {
      run: {
        type: 'procedural',
        bobAmount: 0.1,
        bobSpeed: 3,
        tiltAmount: 0.05,
        legSwingAmount: 0.15,
        groundShake: true, // 地面震动效果
      },
    },
  },
}

/**
 * 怪物模型工厂类
 */
export default class EnemyModelFactory {
  constructor(resources) {
    this.resources = resources
    this.animationMixers = new Map() // 存储动画混合器
  }

  /**
   * 创建怪物模型
   * @param {string} enemyType - 怪物类型
   * @param {object} stats - 怪物属性
   * @returns {THREE.Group} 怪物模型组
   */
  createEnemyModel(enemyType, stats) {
    // ===== 修复：统一小写 =====
    const normalizedType = enemyType.toLowerCase()
    const config = ENEMY_MODEL_CONFIG[normalizedType]

    if (!config) {
      console.warn(`未找到怪物类型 ${enemyType} 的模型配置，使用默认模型`)
      return this.createDefaultModel(stats)
    }

    // 尝试加载 GLTF 模型
    if (config.modelPath && this.resources.items[config.modelPath]) {
      return this.createGLTFModel(config.modelPath, stats)
    }

    // 使用程序化生成
    return this.createProceduralModel(config, stats)
  }

  /**
   * 创建程序化模型
   */
  createProceduralModel(config, stats) {
    const group = new THREE.Group()
    const procConfig = config.proceduralConfig

    // 创建身体
    const body = this.createBody(procConfig, stats)
    group.add(body)

    // 创建头部
    if (procConfig.hasHead) {
      const head = this.createHead(procConfig, stats)
      group.add(head)
    }

    // 创建腿部
    if (procConfig.hasLegs) {
      const legs = this.createLegs(procConfig, stats)
      group.add(...legs)
      group.userData.legs = legs
    }

    // 创建手臂
    if (procConfig.hasArms) {
      const arms = this.createArms(procConfig, stats)
      group.add(...arms)
      group.userData.arms = arms
    }

    // 添加装甲
    if (procConfig.armor) {
      const armor = this.createArmor(procConfig, stats)
      group.add(...armor)
    }

    // 添加特效
    if (procConfig.glow) {
      this.addGlowEffect(group, stats.color)
    }

    if (procConfig.cape) {
      const cape = this.createCape(procConfig, stats)
      group.add(cape)
      group.userData.cape = cape
    }

    // 存储动画配置
    group.userData.animationConfig = config.animations
    group.userData.animationState = {
      time: 0,
      currentAnimation: 'run',
    }

    return group
  }

  /**
   * 创建身体
   */
  createBody(config, stats) {
    const { bodyShape, bodySize, bodyColor } = config
    let geometry

    switch (bodyShape) {
      case 'capsule':
        geometry = new THREE.CapsuleGeometry(
          bodySize.width / 2,
          bodySize.height - bodySize.width,
          8,
          16,
        )
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(bodySize.width / 2, 16, 16)
        break
      case 'box':
      default:
        geometry = new THREE.BoxGeometry(
          bodySize.width,
          bodySize.height,
          bodySize.depth,
        )
        break
    }

    const material = new THREE.MeshStandardMaterial({
      color: stats.color || bodyColor,
      metalness: 0.3,
      roughness: 0.7,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.name = 'body'

    return mesh
  }

  /**
   * 创建头部
   */
  createHead(config, stats) {
    const headSize = config.headSize || 0.25
    const geometry = new THREE.SphereGeometry(headSize, 12, 12)
    const material = new THREE.MeshStandardMaterial({
      color: stats.color || config.bodyColor,
      metalness: 0.2,
      roughness: 0.8,
    })

    const head = new THREE.Mesh(geometry, material)
    head.position.y = config.bodySize.height / 2 + headSize * 0.8
    head.castShadow = true
    head.receiveShadow = true
    head.name = 'head'

    // 添加眼睛
    const eyeGeometry = new THREE.SphereGeometry(headSize * 0.15, 8, 8)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: '#ff0000',
      emissive: '#ff0000',
      emissiveIntensity: 0.5,
    })

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-headSize * 0.3, headSize * 0.2, headSize * 0.7)
    head.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(headSize * 0.3, headSize * 0.2, headSize * 0.7)
    head.add(rightEye)

    return head
  }

  /**
   * 创建腿部
   */
  createLegs(config, stats) {
    const legs = []
    const legCount = config.legCount || 2
    const legWidth = config.bodySize.width * 0.15
    const legHeight = config.bodySize.height * 0.6

    const legGeometry = new THREE.CapsuleGeometry(legWidth / 2, legHeight, 6, 8)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stats.color || config.bodyColor).multiplyScalar(0.7),
      metalness: 0.2,
      roughness: 0.8,
    })

    const positions = this.getLegPositions(legCount, config.bodySize.width)

    positions.forEach((pos, index) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(pos.x, -config.bodySize.height / 2 - legHeight / 2, pos.z)
      leg.castShadow = true
      leg.name = `leg_${index}`
      leg.userData.legIndex = index
      leg.userData.originalY = leg.position.y
      legs.push(leg)
    })

    return legs
  }

  /**
   * 计算腿部位置
   */
  getLegPositions(legCount, bodyWidth) {
    const positions = []
    const spacing = bodyWidth * 0.6

    if (legCount === 2) {
      positions.push(
        { x: -spacing / 2, z: 0 },
        { x: spacing / 2, z: 0 },
      )
    }
    else if (legCount === 4) {
      positions.push(
        { x: -spacing / 2, z: spacing / 2 },
        { x: spacing / 2, z: spacing / 2 },
        { x: -spacing / 2, z: -spacing / 2 },
        { x: spacing / 2, z: -spacing / 2 },
      )
    }

    return positions
  }

  /**
   * 创建手臂
   */
  createArms(config, stats) {
    const arms = []
    const armWidth = config.bodySize.width * 0.12
    const armLength = config.bodySize.height * 0.5

    const armGeometry = new THREE.CapsuleGeometry(armWidth / 2, armLength, 6, 8)
    const armMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stats.color || config.bodyColor).multiplyScalar(0.8),
      metalness: 0.2,
      roughness: 0.7,
    })

    // 左臂
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-config.bodySize.width / 2 - armWidth, config.bodySize.height * 0.2, 0)
    leftArm.rotation.z = Math.PI / 6
    leftArm.castShadow = true
    leftArm.name = 'leftArm'
    arms.push(leftArm)

    // 右臂
    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(config.bodySize.width / 2 + armWidth, config.bodySize.height * 0.2, 0)
    rightArm.rotation.z = -Math.PI / 6
    rightArm.castShadow = true
    rightArm.name = 'rightArm'
    arms.push(rightArm)

    return arms
  }

  /**
   * 创建装甲
   */
  createArmor(config, stats) {
    const armorParts = []
    const armorColor = new THREE.Color(stats.color || config.bodyColor).multiplyScalar(0.5)
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: armorColor,
      metalness: 0.8,
      roughness: 0.3,
    })

    // 胸甲
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(
        config.bodySize.width * 0.95,
        config.bodySize.height * 0.4,
        config.bodySize.depth * 0.55,
      ),
      armorMaterial,
    )
    chestPlate.position.y = config.bodySize.height * 0.15
    chestPlate.position.z = config.bodySize.depth * 0.3
    chestPlate.castShadow = true
    armorParts.push(chestPlate)

    if (config.heavyArmor) {
      // 肩甲
      const shoulderSize = config.bodySize.width * 0.3
      const leftShoulder = new THREE.Mesh(
        new THREE.BoxGeometry(shoulderSize, shoulderSize, shoulderSize),
        armorMaterial,
      )
      leftShoulder.position.set(-config.bodySize.width / 2 - shoulderSize / 2, config.bodySize.height * 0.3, 0)
      leftShoulder.castShadow = true
      armorParts.push(leftShoulder)

      const rightShoulder = leftShoulder.clone()
      rightShoulder.position.x = -leftShoulder.position.x
      armorParts.push(rightShoulder)
    }

    return armorParts
  }

  /**
   * 创建披风
   */
  createCape(config, stats) {
    const capeGeometry = new THREE.PlaneGeometry(
      config.bodySize.width * 1.2,
      config.bodySize.height * 1.5,
      8,
      12,
    )
    const capeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stats.color || config.bodyColor).multiplyScalar(0.6),
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.9,
    })

    const cape = new THREE.Mesh(capeGeometry, capeMaterial)
    cape.position.z = -config.bodySize.depth / 2 - 0.05
    cape.position.y = config.bodySize.height * 0.2
    cape.rotation.x = Math.PI * 0.1
    cape.castShadow = true
    cape.name = 'cape'

    return cape
  }

  /**
   * 添加发光效果
   */
  addGlowEffect(group, color) {
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
    })

    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.name = 'glow'
    group.add(glow)
  }

  /**
   * 创建默认模型（备用）
   */
  createDefaultModel(stats) {
    const geometry = new THREE.BoxGeometry(stats.size, stats.size, stats.size)
    const material = new THREE.MeshStandardMaterial({
      color: stats.color,
      metalness: 0.3,
      roughness: 0.7,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    const group = new THREE.Group()
    group.add(mesh)

    return group
  }

  /**
   * 更新动画
   * @param {THREE.Group} model - 怪物模型
   * @param {number} dt - 帧时间
   * @param {number} speed - 当前速度
   */
  updateAnimation(model, dt, speed) {
    const animState = model.userData.animationState
    if (!animState)
      return

    animState.time += dt

    const animConfig = model.userData.animationConfig
    if (!animConfig)
      return

    const currentAnim = animConfig[animState.currentAnimation]
    if (!currentAnim)
      return

    // 程序动画
    if (currentAnim.type === 'procedural') {
      this.updateProceduralAnimation(model, animState.time, currentAnim, speed)
    }
  }

  /**
   * 更新程序动画
   */
  updateProceduralAnimation(model, time, animConfig, speed) {
    const speedMultiplier = speed / 2.0 // 归一化速度

    // 身体上下摆动
    const bobOffset = Math.sin(time * animConfig.bobSpeed * speedMultiplier) * animConfig.bobAmount
    model.position.y += bobOffset * 0.1

    // 身体倾斜
    if (animConfig.tiltAmount) {
      model.rotation.z = Math.sin(time * animConfig.bobSpeed * speedMultiplier) * animConfig.tiltAmount
    }

    // 前倾（冲刺效果）
    if (animConfig.leanForward) {
      model.rotation.x = -animConfig.leanForward
    }

    // 腿部摆动
    if (model.userData.legs) {
      model.userData.legs.forEach((leg, index) => {
        const phase = index % 2 === 0 ? 0 : Math.PI
        const swing = Math.sin(time * animConfig.bobSpeed * speedMultiplier + phase) * animConfig.legSwingAmount
        leg.rotation.x = swing

        // 腿部上下移动
        const legBob = Math.abs(Math.sin(time * animConfig.bobSpeed * speedMultiplier + phase)) * animConfig.legSwingAmount * 0.3
        leg.position.y = leg.userData.originalY + legBob
      })
    }

    // 手臂摆动
    if (model.userData.arms) {
      model.userData.arms.forEach((arm, index) => {
        const phase = index === 0 ? Math.PI : 0 // 左右臂相反
        const swing = Math.sin(time * animConfig.bobSpeed * speedMultiplier + phase) * animConfig.legSwingAmount * 0.5
        arm.rotation.x = swing
      })
    }

    // 披风飘动
    if (model.userData.cape && animConfig.capeFlow) {
      const cape = model.userData.cape
      cape.rotation.x = Math.PI * 0.1 + Math.sin(time * 5) * 0.1
    }
  }

  /**
   * 清理资源
   */
  dispose(model) {
    model.traverse((child) => {
      if (child.geometry)
        child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        }
        else {
          child.material.dispose()
        }
      }
    })
  }
}
