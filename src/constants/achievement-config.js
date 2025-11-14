/**
 * 成就系统配置
 * 定义所有成就及其解锁条件
 */

/**
 * 成就类型枚举
 */
export const ACHIEVEMENT_TYPES = {
  BUILDING: 'building', // 建造类成就
  RESOURCE: 'resource', // 资源类成就
  METRIC: 'metric', // 指标类成就
  MILESTONE: 'milestone', // 里程碑类成就
  SPECIAL: 'special', // 特殊成就
}

/**
 * 成就稀有度
 */
export const ACHIEVEMENT_RARITY = {
  COMMON: 'common', // 普通
  RARE: 'rare', // 稀有
  EPIC: 'epic', // 史诗
  LEGENDARY: 'legendary', // 传说
}

/**
 * 成就配置数据结构
 * @typedef {object} AchievementConfig
 * @property {string} id - 成就唯一ID
 * @property {string} type - 成就类型
 * @property {string} rarity - 成就稀有度
 * @property {object} name - 成就名称（多语言）
 * @property {object} description - 成就描述（多语言）
 * @property {object} condition - 解锁条件
 * @property {object} rewards - 成就奖励
 * @property {number} rewards.meritPoints - 奖励政绩分
 * @property {string} icon - 成就图标（emoji）
 * @property {number} order - 显示顺序
 */

/**
 * 成就配置列表
 */
export const ACHIEVEMENT_CONFIGS = [
  // ========== 建造类成就 ==========
  {
    id: 'ach_first_building',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '初出茅庐',
      en: 'First Steps',
    },
    description: {
      zh: '建造你的第一座建筑',
      en: 'Build your first building',
    },
    condition: {
      type: 'build_count',
      buildingType: null, // 任意建筑
      count: 1,
    },
    rewards: {
      meritPoints: 20,
    },
    icon: '🏗️',
    order: 1,
  },
  {
    id: 'ach_first_house',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '第一个家',
      en: 'First Home',
    },
    description: {
      zh: '建造你的第一座住宅',
      en: 'Build your first residential building',
    },
    condition: {
      type: 'build_count',
      buildingType: 'house',
      count: 1,
    },
    rewards: {
      meritPoints: 15,
    },
    icon: '🏠',
    order: 2,
  },
  {
    id: 'ach_industrial_tycoon',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '工业大亨',
      en: 'Industrial Tycoon',
    },
    description: {
      zh: '建造 20 座工业建筑',
      en: 'Build 20 industrial buildings',
    },
    condition: {
      type: 'build_count',
      buildingType: 'factory',
      count: 20,
    },
    rewards: {
      meritPoints: 150,
    },
    icon: '🏭',
    order: 10,
  },
  {
    id: 'ach_commercial_empire',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '商业帝国',
      en: 'Commercial Empire',
    },
    description: {
      zh: '建造 25 座商业建筑',
      en: 'Build 25 commercial buildings',
    },
    condition: {
      type: 'build_count',
      buildingType: 'shop',
      count: 25,
    },
    rewards: {
      meritPoints: 150,
    },
    icon: '🏬',
    order: 11,
  },
  {
    id: 'ach_master_builder',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '建筑大师',
      en: 'Master Builder',
    },
    description: {
      zh: '建造 100 座建筑',
      en: 'Build 100 buildings',
    },
    condition: {
      type: 'build_count',
      buildingType: null,
      count: 100,
    },
    rewards: {
      meritPoints: 400,
    },
    icon: '🏛️',
    order: 20,
  },
  {
    id: 'ach_upgrade_master',
    type: ACHIEVEMENT_TYPES.BUILDING,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '升级大师',
      en: 'Upgrade Master',
    },
    description: {
      zh: '升级 20 座建筑到 2 级',
      en: 'Upgrade 20 buildings to level 2',
    },
    condition: {
      type: 'upgrade_count',
      level: 2,
      count: 20,
    },
    rewards: {
      meritPoints: 200,
    },
    icon: '⬆️',
    order: 15,
  },

  // ========== 资源类成就 ==========
  {
    id: 'ach_first_thousand',
    type: ACHIEVEMENT_TYPES.RESOURCE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '第一桶金',
      en: 'First Thousand',
    },
    description: {
      zh: '累计获得 1000 金币',
      en: 'Accumulate 1,000 credits',
    },
    condition: {
      type: 'total_earned',
      amount: 1000,
    },
    rewards: {
      meritPoints: 10,
    },
    icon: '💰',
    order: 3,
  },
  {
    id: 'ach_wealthy',
    type: ACHIEVEMENT_TYPES.RESOURCE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '富甲一方',
      en: 'Wealthy',
    },
    description: {
      zh: '累计获得 100000 金币',
      en: 'Accumulate 100,000 credits',
    },
    condition: {
      type: 'total_earned',
      amount: 100000,
    },
    rewards: {
      meritPoints: 250,
    },
    icon: '💎',
    order: 21,
  },
  {
    id: 'ach_daily_income_100',
    type: ACHIEVEMENT_TYPES.RESOURCE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '日进斗金',
      en: 'Daily Income',
    },
    description: {
      zh: '每日收入达到 100',
      en: 'Reach daily income of 100',
    },
    condition: {
      type: 'metric_reach',
      metric: 'dailyIncome',
      value: 100,
    },
    rewards: {
      meritPoints: 50,
    },
    icon: '💵',
    order: 5,
  },
  {
    id: 'ach_daily_income_500',
    type: ACHIEVEMENT_TYPES.RESOURCE,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '财源滚滚',
      en: 'Flowing Wealth',
    },
    description: {
      zh: '每日收入达到 1000',
      en: 'Reach daily income of 1000',
    },
    condition: {
      type: 'metric_reach',
      metric: 'dailyIncome',
      value: 1000,
    },
    rewards: {
      meritPoints: 450,
    },
    icon: '💸',
    order: 22,
  },

  // ========== 指标类成就 ==========
  {
    id: 'ach_population_100',
    type: ACHIEVEMENT_TYPES.METRIC,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '初具规模',
      en: 'Growing City',
    },
    description: {
      zh: '城市人口达到 100',
      en: 'Reach a population of 100',
    },
    condition: {
      type: 'metric_reach',
      metric: 'population',
      value: 100,
    },
    rewards: {
      meritPoints: 50,
    },
    icon: '👥',
    order: 4,
  },
  {
    id: 'ach_population_500',
    type: ACHIEVEMENT_TYPES.METRIC,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '大都市',
      en: 'Metropolis',
    },
    description: {
      zh: '城市人口达到 500',
      en: 'Reach a population of 500',
    },
    condition: {
      type: 'metric_reach',
      metric: 'population',
      value: 500,
    },
    rewards: {
      meritPoints: 800,
    },
    icon: '🏙️',
    order: 23,
  },
  {
    id: 'ach_power_king',
    type: ACHIEVEMENT_TYPES.METRIC,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '电力大亨',
      en: 'Power King',
    },
    description: {
      zh: '发电量达到 500',
      en: 'Reach power output of 500',
    },
    condition: {
      type: 'metric_reach',
      metric: 'maxPower',
      value: 500,
    },
    rewards: {
      meritPoints: 150,
    },
    icon: '⚡',
    order: 12,
  },
  {
    id: 'ach_stability_master',
    type: ACHIEVEMENT_TYPES.METRIC,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '稳定大师',
      en: 'Stability Master',
    },
    description: {
      zh: '城市稳定度保持在 95 以上',
      en: 'Keep city stability above 95',
    },
    condition: {
      type: 'metric_reach',
      metric: 'stability',
      value: 95,
    },
    rewards: {
      meritPoints: 200,
    },
    icon: '📊',
    order: 16,
  },
  {
    id: 'ach_eco_champion',
    type: ACHIEVEMENT_TYPES.METRIC,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '环保先锋',
      en: 'Eco Champion',
    },
    description: {
      zh: '人口达到 1000 且污染值低于 10',
      en: 'Reach population of 1000 and keep pollution below 10',
    },
    condition: {
      type: 'metric_multi',
      conditions: [
        { metric: 'population', operator: '>=', value: 1000 },
        { metric: 'pollution', operator: '<=', value: 10 },
      ],
    },
    rewards: {
      meritPoints: 350,
    },
    icon: '🌳',
    order: 17,
  },

  // ========== 里程碑类成就 ==========
  {
    id: 'ach_level_2',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    name: {
      zh: '小镇崛起',
      en: 'Town Rising',
    },
    description: {
      zh: '解锁关卡 2',
      en: 'Unlock Level 2',
    },
    condition: {
      type: 'level_unlock',
      level: 2,
    },
    rewards: {
      meritPoints: 50,
    },
    icon: '🏘️',
    order: 6,
  },
  {
    id: 'ach_level_3',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '城市扩张',
      en: 'City Expansion',
    },
    description: {
      zh: '解锁关卡 3',
      en: 'Unlock Level 3',
    },
    condition: {
      type: 'level_unlock',
      level: 3,
    },
    rewards: {
      meritPoints: 100,
    },
    icon: '🏙️',
    order: 13,
  },
  {
    id: 'ach_level_5',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    name: {
      zh: '超级城市',
      en: 'Super City',
    },
    description: {
      zh: '解锁关卡 5',
      en: 'Unlock Level 5',
    },
    condition: {
      type: 'level_unlock',
      level: 5,
    },
    rewards: {
      meritPoints: 800,
    },
    icon: '🌆',
    order: 24,
  },
  {
    id: 'ach_all_quests_level1',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '完美开局',
      en: 'Perfect Start',
    },
    description: {
      zh: '完成关卡 1 的所有任务',
      en: 'Complete all Level 1 quests',
    },
    condition: {
      type: 'quests_complete',
      level: 1,
    },
    rewards: {
      meritPoints: 80,
    },
    icon: '⭐',
    order: 7,
  },
  {
    id: 'ach_all_quests_level3',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '任务达人',
      en: 'Quest Master',
    },
    description: {
      zh: '完成关卡 3 的所有任务',
      en: 'Complete all Level 3 quests',
    },
    condition: {
      type: 'quests_complete',
      level: 3,
    },
    rewards: {
      meritPoints: 300,
    },
    icon: '🌟',
    order: 18,
  },

  // ========== 特殊成就 ==========
  {
    id: 'ach_7_days',
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    name: {
      zh: '持之以恒',
      en: 'Perseverance',
    },
    description: {
      zh: '游戏天数达到 7 天',
      en: 'Reach 7 game days',
    },
    condition: {
      type: 'metric_reach',
      metric: 'gameDay',
      value: 7,
    },
    rewards: {
      meritPoints: 100,
    },
    icon: '📅',
    order: 8,
  },
  {
    id: 'ach_all_building_types',
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    name: {
      zh: '全面发展',
      en: 'All-Round Development',
    },
    description: {
      zh: '建造所有类型的建筑各至少 1 座',
      en: 'Build at least 1 of each building type',
    },
    condition: {
      type: 'build_all_types',
      categories: ['residential', 'commercial', 'industrial', 'environment', 'social', 'governance', 'infrastructure'],
    },
    rewards: {
      meritPoints: 300,
    },
    icon: '🎯',
    order: 19,
  },
  {
    id: 'ach_no_pollution',
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    name: {
      zh: '零污染城市',
      en: 'Zero Pollution City',
    },
    description: {
      zh: '人口达到 5000 且污染值降至 0',
      en: 'Reach population of 5000 and reduce pollution to 0',
    },
    condition: {
      type: 'metric_multi',
      conditions: [
        { metric: 'population', operator: '>=', value: 5000 },
        { metric: 'pollution', operator: '<=', value: 0 },
      ],
    },
    rewards: {
      meritPoints: 1000,
    },
    icon: '🌍',
    order: 25,
  },
]

/**
 * 根据成就ID获取成就配置
 * @param {string} achievementId - 成就ID
 * @returns {AchievementConfig|null} 成就配置
 */
export function getAchievementConfig(achievementId) {
  return ACHIEVEMENT_CONFIGS.find(config => config.id === achievementId) || null
}

/**
 * 获取所有成就配置
 * @returns {AchievementConfig[]} 所有成就配置
 */
export function getAllAchievements() {
  return ACHIEVEMENT_CONFIGS
}

/**
 * 根据类型获取成就
 * @param {string} type - 成就类型
 * @returns {AchievementConfig[]} 成就配置列表
 */
export function getAchievementsByType(type) {
  return ACHIEVEMENT_CONFIGS.filter(config => config.type === type)
}

/**
 * 根据稀有度获取成就
 * @param {string} rarity - 成就稀有度
 * @returns {AchievementConfig[]} 成就配置列表
 */
export function getAchievementsByRarity(rarity) {
  return ACHIEVEMENT_CONFIGS.filter(config => config.rarity === rarity)
}

