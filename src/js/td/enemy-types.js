/**
 * 外城塔防 - 怪物类型配置
 * 
 * 定义了所有怪物类型的基础属性和成长曲线
 * 支持根据波次自动提升怪物属性
 */

import * as THREE from 'three'

/**
 * 怪物类型枚举
 */
export const EnemyType = {
  // 基础类型
  SCOUT: 'scout',       // 侦察兵：速度快，血量低，防御低
  TANK: 'tank',         // 坦克：速度慢，血量高，防御高
  RUNNER: 'runner',     // 冲锋兵：速度极快，血量一般，防御低
  ARMORED: 'armored',   // 装甲兵：速度一般，血量低，防御极高
  ELITE: 'elite',       // 精英：全属性平衡且较高
  BOSS: 'boss',         // Boss：全属性极高，超大体型
  
  // ===== 特殊类型 =====
  FLYING: 'flying',     // 飞行单位：只能被防空塔攻击
  STEALTH: 'stealth',   // 隐身单位：定期隐身，无法被锁定
  HEALER: 'healer',     // 治疗单位：为周围怪物回血
  SPLITTER: 'splitter', // 分裂单位：死亡后分裂成小怪
}

/**
 * 怪物类型基础配置
 * 所有数值都是基础值，会根据波次进行缩放
 */
export const ENEMY_BASE_CONFIG = {
  // 侦察兵：速度快，血量低，防御低
  [EnemyType.SCOUT]: {
    name: '侦察兵',
    baseHealth: 60,        // 基础血量
    baseSpeed: 3.5,        // 基础速度
    baseDefense: 0,        // 基础防御（减伤百分比 0-1）
    baseReward: 8,         // 基础奖励金币
    size: 0.6,             // 模型大小
    color: '#10b981',      // 颜色（绿色）
    // 成长系数（每波增长）
    growthRates: {
      health: 0.15,        // 血量成长 15%
      speed: 0.05,         // 速度成长 5%
      defense: 0.01,       // 防御成长 1%
      reward: 0.1,         // 奖励成长 10%
    },
    description: '移动迅速的轻型单位，血量和防御较低',
  },

  // 坦克：速度慢，血量高，防御高
  [EnemyType.TANK]: {
    name: '坦克',
    baseHealth: 200,
    baseSpeed: 1.2,
    baseDefense: 0.3,      // 30% 减伤
    baseReward: 20,
    size: 0.9,
    color: '#6366f1',      // 颜色（蓝色）
    growthRates: {
      health: 0.25,        // 血量成长 25%
      speed: 0.02,         // 速度成长 2%
      defense: 0.02,       // 防御成长 2%
      reward: 0.15,
    },
    description: '移动缓慢但血量和防御极高的重型单位',
  },

  // 冲锋兵：速度极快，血量一般，防御低
  [EnemyType.RUNNER]: {
    name: '冲锋兵',
    baseHealth: 80,
    baseSpeed: 4.5,
    baseDefense: 0.05,
    baseReward: 12,
    size: 0.55,
    color: '#f59e0b',      // 颜色（橙色）
    growthRates: {
      health: 0.12,
      speed: 0.08,         // 速度成长 8%
      defense: 0.005,
      reward: 0.12,
    },
    description: '速度极快的突击单位，难以拦截',
  },

  // 装甲兵：速度一般，血量低，防御极高
  [EnemyType.ARMORED]: {
    name: '装甲兵',
    baseHealth: 100,
    baseSpeed: 2.0,
    baseDefense: 0.5,      // 50% 减伤
    baseReward: 18,
    size: 0.75,
    color: '#8b5cf6',      // 颜色（紫色）
    growthRates: {
      health: 0.18,
      speed: 0.03,
      defense: 0.025,      // 防御成长 2.5%
      reward: 0.14,
    },
    description: '拥有厚重装甲，防御力极高',
  },

  // 精英：全属性平衡且较高
  [EnemyType.ELITE]: {
    name: '精英',
    baseHealth: 150,
    baseSpeed: 2.5,
    baseDefense: 0.2,
    baseReward: 25,
    size: 0.8,
    color: '#ec4899',      // 颜色（粉色）
    growthRates: {
      health: 0.2,
      speed: 0.05,
      defense: 0.015,
      reward: 0.18,
    },
    description: '全面强化的精锐单位',
  },

  // Boss：全属性极高，超大体型
  [EnemyType.BOSS]: {
    name: 'Boss',
    baseHealth: 500,
    baseSpeed: 1.5,
    baseDefense: 0.4,
    baseReward: 100,
    size: 1.5,
    color: '#ef4444',      // 颜色（红色）
    growthRates: {
      health: 0.35,        // 血量成长 35%
      speed: 0.02,
      defense: 0.03,
      reward: 0.25,
    },
    description: '强大的Boss单位，拥有超高属性',
  },
  
  // ===== 特殊怪物类型 =====
  
  // 飞行单位：只能被防空塔攻击
  [EnemyType.FLYING]: {
    name: '飞行单位',
    baseHealth: 50,
    baseSpeed: 3.0,
    baseDefense: 0,
    baseReward: 15,
    size: 0.6,
    color: '#0ea5e9',      // 颜色（天蓝色）
    growthRates: {
      health: 0.12,
      speed: 0.06,
      defense: 0.01,
      reward: 0.12,
    },
    description: '在空中飞行，普通塔无法攻击',
    special: {
      isFlying: true,      // 标记为飞行单位
      altitude: 1.5,       // 飞行高度
    },
  },
  
  // 隐身单位：定期隐身，无法被锁定
  [EnemyType.STEALTH]: {
    name: '隐身单位',
    baseHealth: 70,
    baseSpeed: 3.5,
    baseDefense: 0.1,
    baseReward: 20,
    size: 0.65,
    color: '#a855f7',      // 颜色（紫色）
    growthRates: {
      health: 0.15,
      speed: 0.07,
      defense: 0.01,
      reward: 0.15,
    },
    description: '会定期隐身，隐身时无法被攻击',
    special: {
      stealthCycle: 5,     // 隐身周期：5秒
      stealthDuration: 2,  // 每次隐身持续 2秒
      opacity: 0.3,        // 隐身时的透明度
    },
  },
  
  // 治疗单位：为周围怪物回血
  [EnemyType.HEALER]: {
    name: '治疗单位',
    baseHealth: 100,
    baseSpeed: 2.0,
    baseDefense: 0.2,
    baseReward: 30,        // 奖励高，鼓励优先击杀
    size: 0.7,
    color: '#22c55e',      // 颜色（亮绿色）
    growthRates: {
      health: 0.18,
      speed: 0.04,
      defense: 0.015,
      reward: 0.2,
    },
    description: '为周围怪物恢复生命值，优先击杀目标',
    special: {
      healRange: 2.5,      // 治疗范围
      healAmount: 10,      // 每次治疗量
      healInterval: 2,     // 治疗间隔（秒）
    },
  },
  
  // 分裂单位：死亡后分裂成小怪
  [EnemyType.SPLITTER]: {
    name: '分裂单位',
    baseHealth: 80,
    baseSpeed: 2.5,
    baseDefense: 0.15,
    baseReward: 25,
    size: 0.75,
    color: '#fb923c',      // 颜色（橙色）
    growthRates: {
      health: 0.16,
      speed: 0.05,
      defense: 0.01,
      reward: 0.15,
    },
    description: '死亡时分裂成多个小型单位',
    special: {
      splitCount: 3,       // 分裂数量
      splitHealthRatio: 0.3,  // 小怪血量为母体的 30%
      splitSpeedMultiplier: 1.2,  // 小怪速度提升 20%
    },
  },
}

/**
 * 波次怪物配置
 * 定义每波出现的怪物类型和数量
 */
export const WAVE_COMPOSITION = {
  // 简单模式：前 5 波
  1: [{ type: EnemyType.SCOUT, count: 5 }],
  2: [{ type: EnemyType.SCOUT, count: 7 }],
  3: [
    { type: EnemyType.SCOUT, count: 5 },
    { type: EnemyType.RUNNER, count: 2 },
    { type: EnemyType.FLYING, count: 2 },  // 首次出现飞行单位
  ],
  4: [
    { type: EnemyType.SCOUT, count: 4 },
    { type: EnemyType.TANK, count: 2 },
    { type: EnemyType.FLYING, count: 2 },
  ],
  5: [
    { type: EnemyType.SCOUT, count: 5 },
    { type: EnemyType.RUNNER, count: 2 },
    { type: EnemyType.TANK, count: 1 },
    { type: EnemyType.STEALTH, count: 2 },  // 首次出现隐身单位
  ],
  
  // 中等难度：6-10 波
  6: [
    { type: EnemyType.RUNNER, count: 5 },
    { type: EnemyType.ARMORED, count: 2 },
    { type: EnemyType.HEALER, count: 1 },  // 首次出现治疗单位
  ],
  7: [
    { type: EnemyType.SCOUT, count: 6 },
    { type: EnemyType.TANK, count: 3 },
    { type: EnemyType.SPLITTER, count: 2 },  // 首次出现分裂单位
  ],
  8: [
    { type: EnemyType.RUNNER, count: 4 },
    { type: EnemyType.ARMORED, count: 3 },
    { type: EnemyType.ELITE, count: 1 },
    { type: EnemyType.FLYING, count: 3 },
  ],
  9: [
    { type: EnemyType.SCOUT, count: 5 },
    { type: EnemyType.TANK, count: 3 },
    { type: EnemyType.ELITE, count: 2 },
    { type: EnemyType.STEALTH, count: 2 },
    { type: EnemyType.HEALER, count: 1 },
  ],
  10: [
    { type: EnemyType.RUNNER, count: 5 },
    { type: EnemyType.ARMORED, count: 3 },
    { type: EnemyType.ELITE, count: 2 },
    { type: EnemyType.BOSS, count: 1 },
    { type: EnemyType.HEALER, count: 2 },  // Boss 波有治疗支援
  ],
  
  // 困难模式：11+ 波（使用公式生成）
  default: (wave) => {
    const baseCount = Math.floor(wave * 1.5)
    const eliteCount = Math.floor(wave * 0.3)
    const bossCount = wave % 5 === 0 ? 1 : 0
    
    return [
      { type: EnemyType.RUNNER, count: Math.floor(baseCount * 0.4) },
      { type: EnemyType.ARMORED, count: Math.floor(baseCount * 0.3) },
      { type: EnemyType.TANK, count: Math.floor(baseCount * 0.3) },
      { type: EnemyType.ELITE, count: eliteCount },
      ...(bossCount > 0 ? [{ type: EnemyType.BOSS, count: bossCount }] : []),
    ]
  },
}

/**
 * 获取指定波次的怪物配置
 * @param {number} wave - 波次数
 * @returns {Array} 怪物配置数组
 */
export function getWaveComposition(wave) {
  if (WAVE_COMPOSITION[wave]) {
    return WAVE_COMPOSITION[wave]
  }
  
  // 使用默认公式生成
  if (WAVE_COMPOSITION.default) {
    return WAVE_COMPOSITION.default(wave)
  }
  
  // 兜底配置
  return [{ type: EnemyType.SCOUT, count: 5 + wave }]
}

/**
 * 计算怪物在指定波次的实际属性
 * @param {string} enemyType - 怪物类型
 * @param {number} wave - 波次数
 * @returns {Object} 计算后的属性
 */
export function calculateEnemyStats(enemyType, wave) {
  const config = ENEMY_BASE_CONFIG[enemyType]
  if (!config) {
    console.warn(`未知的怪物类型: ${enemyType}`)
    return null
  }
  
  // 波次缩放系数（从第 1 波开始）
  const waveMultiplier = wave - 1
  
  return {
    type: enemyType,
    name: config.name,
    health: Math.floor(config.baseHealth * (1 + config.growthRates.health * waveMultiplier)),
    maxHealth: Math.floor(config.baseHealth * (1 + config.growthRates.health * waveMultiplier)),
    speed: config.baseSpeed * (1 + config.growthRates.speed * waveMultiplier),
    defense: Math.min(0.8, config.baseDefense + config.growthRates.defense * waveMultiplier), // 防御上限 80%
    reward: Math.floor(config.baseReward * (1 + config.growthRates.reward * waveMultiplier)),
    size: config.size,
    color: config.color,
    description: config.description,
  }
}

/**
 * 创建怪物 3D 模型
 * @param {Object} stats - 怪物属性
 * @returns {THREE.Mesh} 怪物模型
 */
export function createEnemyMesh(stats) {
  const geometry = new THREE.BoxGeometry(stats.size, stats.size, stats.size)
  const material = new THREE.MeshStandardMaterial({ 
    color: stats.color,
    metalness: 0.3,
    roughness: 0.7,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  
  return mesh
}

/**
 * 获取所有怪物类型列表（用于 UI 展示）
 */
export function getAllEnemyTypes() {
  return Object.keys(ENEMY_BASE_CONFIG).map(type => ({
    type,
    ...ENEMY_BASE_CONFIG[type],
  }))
}

