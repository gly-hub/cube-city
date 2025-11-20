/**
 * 外城塔防 - 防御塔类型配置
 * 
 * 定义了所有防御塔的类型、属性和升级路径
 */

/**
 * 防御塔类型枚举
 */
export const TowerType = {
  // 基础塔
  BASIC: 'basic',           // 基础炮塔：平衡型，中等伤害和射程
  
  // 特殊塔
  SLOW: 'slow',             // 减速塔：低伤害，但大幅减速敌人
  AOE: 'aoe',               // 范围塔：范围伤害，对付成群敌人
  SNIPER: 'sniper',         // 狙击塔：超远射程，高伤害单体，攻速慢
  SUPPORT: 'support',       // 辅助塔：不攻击，增强周围塔的属性
  ANTI_AIR: 'antiAir',      // 防空塔：专门攻击飞行敌人
}

/**
 * 防御塔配置
 */
export const TOWER_CONFIG = {
  // ===== 基础炮塔 =====
  [TowerType.BASIC]: {
    name: '基础炮塔',
    description: '平衡的防御塔，中等伤害和射程',
    color: '#64748b',         // 灰色
    
    // 等级配置
    levels: [
      // Lv1
      {
        cost: 100,
        damage: 20,
        range: 3.5,
        cooldown: 1.0,         // 秒
        targetPriority: 'nearest',  // 攻击最近的
      },
      // Lv2
      {
        cost: 150,
        damage: 40,
        range: 4.0,
        cooldown: 0.9,
        targetPriority: 'nearest',
      },
      // Lv3
      {
        cost: 250,
        damage: 80,
        range: 4.5,
        cooldown: 0.8,
        targetPriority: 'nearest',
      },
    ],
    
    // 视觉配置
    visual: {
      baseColor: '#64748b',
      turretColor: '#475569',
      projectileColor: '#fbbf24',
      projectileSpeed: 8,
    },
  },
  
  // ===== 减速塔 =====
  [TowerType.SLOW]: {
    name: '减速塔',
    description: '发射寒冰弹，大幅减慢敌人速度',
    color: '#3b82f6',         // 蓝色
    
    levels: [
      // Lv1
      {
        cost: 120,
        damage: 5,             // 伤害很低
        range: 3.0,
        cooldown: 1.2,
        slowEffect: {
          multiplier: 0.5,     // 减速 50%
          duration: 2.0,       // 持续 2 秒
        },
        targetPriority: 'fastest',  // 优先攻击速度快的
      },
      // Lv2
      {
        cost: 180,
        damage: 10,
        range: 3.5,
        cooldown: 1.0,
        slowEffect: {
          multiplier: 0.4,     // 减速 60%
          duration: 2.5,
        },
        targetPriority: 'fastest',
      },
      // Lv3
      {
        cost: 300,
        damage: 20,
        range: 4.0,
        cooldown: 0.8,
        slowEffect: {
          multiplier: 0.3,     // 减速 70%
          duration: 3.0,
        },
        targetPriority: 'fastest',
      },
    ],
    
    visual: {
      baseColor: '#3b82f6',
      turretColor: '#2563eb',
      projectileColor: '#60a5fa',
      projectileSpeed: 6,
      effectColor: '#bfdbfe',  // 冰冻特效颜色
    },
  },
  
  // ===== 范围塔 =====
  [TowerType.AOE]: {
    name: '榴弹炮',
    description: '发射范围爆炸弹药，对区域内所有敌人造成伤害',
    color: '#ef4444',         // 红色
    
    levels: [
      // Lv1
      {
        cost: 150,
        damage: 30,
        range: 3.0,
        cooldown: 2.0,         // 攻速慢
        aoeRadius: 1.5,        // 爆炸半径
        targetPriority: 'strongest',  // 优先血多的
      },
      // Lv2
      {
        cost: 250,
        damage: 60,
        range: 3.5,
        cooldown: 1.8,
        aoeRadius: 2.0,
        targetPriority: 'strongest',
      },
      // Lv3
      {
        cost: 400,
        damage: 120,
        range: 4.0,
        cooldown: 1.5,
        aoeRadius: 2.5,
        targetPriority: 'strongest',
      },
    ],
    
    visual: {
      baseColor: '#ef4444',
      turretColor: '#dc2626',
      projectileColor: '#fbbf24',
      projectileSpeed: 5,
      explosionColor: '#f97316',  // 爆炸颜色
    },
  },
  
  // ===== 狙击塔 =====
  [TowerType.SNIPER]: {
    name: '狙击塔',
    description: '超远射程，高伤害，专打高价值目标',
    color: '#8b5cf6',         // 紫色
    
    levels: [
      // Lv1
      {
        cost: 200,
        damage: 100,           // 伤害高
        range: 6.0,            // 射程远
        cooldown: 2.5,         // 攻速很慢
        targetPriority: 'strongest',  // 优先打血多的
        critChance: 0.2,       // 20% 暴击率
        critMultiplier: 2.0,   // 暴击 2 倍伤害
      },
      // Lv2
      {
        cost: 350,
        damage: 200,
        range: 7.0,
        cooldown: 2.2,
        targetPriority: 'strongest',
        critChance: 0.25,
        critMultiplier: 2.5,
      },
      // Lv3
      {
        cost: 600,
        damage: 400,
        range: 8.0,
        cooldown: 2.0,
        targetPriority: 'strongest',
        critChance: 0.3,
        critMultiplier: 3.0,
      },
    ],
    
    visual: {
      baseColor: '#8b5cf6',
      turretColor: '#7c3aed',
      projectileColor: '#c084fc',
      projectileSpeed: 15,     // 子弹速度快
      critColor: '#fde047',    // 暴击颜色
    },
  },
  
  // ===== 辅助塔 =====
  [TowerType.SUPPORT]: {
    name: '辅助塔',
    description: '不攻击，但增强周围塔的属性',
    color: '#10b981',         // 绿色
    
    levels: [
      // Lv1
      {
        cost: 100,
        damage: 0,             // 不攻击
        range: 3.0,            // 辅助范围
        cooldown: 0,
        buffEffect: {
          damageBonus: 0.2,    // 周围塔伤害 +20%
          rangeBonus: 0.1,     // 周围塔射程 +10%
          cooldownReduction: 0.1,  // 周围塔冷却 -10%
        },
        targetPriority: 'none',
      },
      // Lv2
      {
        cost: 180,
        damage: 0,
        range: 3.5,
        cooldown: 0,
        buffEffect: {
          damageBonus: 0.3,
          rangeBonus: 0.15,
          cooldownReduction: 0.15,
        },
        targetPriority: 'none',
      },
      // Lv3
      {
        cost: 300,
        damage: 0,
        range: 4.0,
        cooldown: 0,
        buffEffect: {
          damageBonus: 0.5,
          rangeBonus: 0.2,
          cooldownReduction: 0.2,
        },
        targetPriority: 'none',
      },
    ],
    
    visual: {
      baseColor: '#10b981',
      turretColor: '#059669',
      buffColor: '#6ee7b7',    // 辅助光环颜色
      pulseSpeed: 2.0,         // 光环脉动速度
    },
  },
  
  // ===== 防空塔 =====
  [TowerType.ANTI_AIR]: {
    name: '防空塔',
    description: '专门攻击飞行单位，对地面单位无效',
    color: '#f59e0b',         // 橙色
    
    levels: [
      // Lv1
      {
        cost: 130,
        damage: 40,
        range: 4.5,
        cooldown: 0.8,
        targetPriority: 'flying',  // 只打飞行
        canTargetGround: false,    // 不能打地面
      },
      // Lv2
      {
        cost: 200,
        damage: 80,
        range: 5.0,
        cooldown: 0.7,
        targetPriority: 'flying',
        canTargetGround: false,
      },
      // Lv3
      {
        cost: 350,
        damage: 160,
        range: 5.5,
        cooldown: 0.6,
        targetPriority: 'flying',
        canTargetGround: false,
      },
    ],
    
    visual: {
      baseColor: '#f59e0b',
      turretColor: '#d97706',
      projectileColor: '#fbbf24',
      projectileSpeed: 12,
    },
  },
}

/**
 * 攻击优先级枚举
 */
export const TargetPriority = {
  NEAREST: 'nearest',       // 最近的
  FARTHEST: 'farthest',     // 最远的
  STRONGEST: 'strongest',   // 血量最多的
  WEAKEST: 'weakest',       // 血量最少的
  FASTEST: 'fastest',       // 速度最快的
  FLYING: 'flying',         // 飞行单位
  NONE: 'none',             // 不攻击（辅助塔）
}

/**
 * 获取防御塔配置
 * @param {string} towerType - 塔类型
 * @param {number} level - 塔等级（1-3）
 * @returns {object} 塔配置
 */
export function getTowerConfig(towerType, level = 1) {
  const config = TOWER_CONFIG[towerType]
  if (!config) {
    console.warn(`未知的塔类型: ${towerType}`)
    return null
  }
  
  const levelIndex = level - 1
  if (levelIndex < 0 || levelIndex >= config.levels.length) {
    console.warn(`塔等级超出范围: ${level}`)
    return null
  }
  
  return {
    ...config,
    ...config.levels[levelIndex],
    level,
    type: towerType,
  }
}

/**
 * 获取升级成本
 * @param {string} towerType - 塔类型
 * @param {number} currentLevel - 当前等级
 * @returns {number} 升级成本，如果已满级返回 null
 */
export function getUpgradeCost(towerType, currentLevel) {
  const config = TOWER_CONFIG[towerType]
  if (!config) return null
  
  const nextLevel = currentLevel + 1
  const nextLevelIndex = nextLevel - 1
  
  if (nextLevelIndex >= config.levels.length) {
    return null  // 已满级
  }
  
  return config.levels[nextLevelIndex].cost
}

/**
 * 获取塔的出售价格（建造成本的 50%）
 * @param {string} towerType - 塔类型
 * @param {number} level - 当前等级
 * @returns {number} 出售价格
 */
export function getSellPrice(towerType, level) {
  const config = TOWER_CONFIG[towerType]
  if (!config) return 0
  
  // 计算总投入成本
  let totalCost = 0
  for (let i = 0; i < level; i++) {
    totalCost += config.levels[i].cost
  }
  
  // 返回 50% 的成本
  return Math.floor(totalCost * 0.5)
}

/**
 * 获取所有可建造的塔类型
 * @returns {Array} 塔类型数组
 */
export function getAvailableTowerTypes() {
  return Object.keys(TOWER_CONFIG)
}



