/**
 * 任务系统配置
 * 定义所有关卡任务及其完成条件
 */

/**
 * 任务类型枚举
 */
export const QUEST_TYPES = {
  BUILD: 'build', // 建造任务
  RESOURCE: 'resource', // 资源任务
  METRIC: 'metric', // 指标任务
  UPGRADE: 'upgrade', // 升级任务
  SPECIAL: 'special', // 特殊任务
}

/**
 * 任务配置数据结构
 * @typedef {object} QuestConfig
 * @property {string} id - 任务唯一ID
 * @property {number} level - 所属关卡
 * @property {string} type - 任务类型
 * @property {object} name - 任务名称（多语言）
 * @property {object} description - 任务描述（多语言）
 * @property {object} condition - 完成条件
 * @property {object} rewards - 任务奖励
 * @property {number} rewards.credits - 奖励金币
 * @property {number} rewards.experience - 奖励经验（预留）
 */

/**
 * 任务配置列表
 */
export const QUEST_CONFIGS = [
  // ========== 关卡1任务 ==========
  {
    id: 'quest_001',
    level: 1,
    type: QUEST_TYPES.BUILD,
    name: {
      zh: '初来乍到',
      en: 'First Steps',
    },
    description: {
      zh: '建造你的第一座住宅建筑',
      en: 'Build your first residential building',
    },
    condition: {
      type: 'build_count',
      buildingType: 'house',
      count: 1,
    },
    rewards: {
      credits: 500,
    },
  },
  {
    id: 'quest_002',
    level: 1,
    type: QUEST_TYPES.RESOURCE,
    name: {
      zh: '积累财富',
      en: 'Accumulate Wealth',
    },
    description: {
      zh: '累计获得 10000 金币',
      en: 'Accumulate 10,000 credits',
    },
    condition: {
      type: 'total_earned',
      amount: 10000,
    },
    rewards: {
      credits: 1000,
    },
  },

  // ========== 关卡2任务 ==========
  {
    id: 'quest_003',
    level: 2,
    type: QUEST_TYPES.BUILD,
    name: {
      zh: '商业起步',
      en: 'Commercial Start',
    },
    description: {
      zh: '建造 3 座商业建筑',
      en: 'Build 3 commercial buildings',
    },
    condition: {
      type: 'build_count',
      buildingType: 'shop',
      count: 3,
    },
    rewards: {
      credits: 1500,
    },
  },
  {
    id: 'quest_004',
    level: 2,
    type: QUEST_TYPES.METRIC,
    name: {
      zh: '人口增长',
      en: 'Population Growth',
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
      credits: 2000,
    },
  },
  {
    id: 'quest_005',
    level: 2,
    type: QUEST_TYPES.BUILD,
    name: {
      zh: '基础设施',
      en: 'Infrastructure',
    },
    description: {
      zh: '建造 1 座医院和 1 座警察局',
      en: 'Build 1 hospital and 1 police station',
    },
    condition: {
      type: 'build_multiple',
      buildings: [
        { type: 'hospital', count: 1 },
        { type: 'police', count: 1 },
      ],
    },
    rewards: {
      credits: 2500,
    },
  },

  // ========== 关卡3任务 ==========
  {
    id: 'quest_006',
    level: 3,
    type: QUEST_TYPES.BUILD,
    name: {
      zh: '工业发展',
      en: 'Industrial Development',
    },
    description: {
      zh: '建造 5 座工业建筑',
      en: 'Build 5 industrial buildings',
    },
    condition: {
      type: 'build_count',
      buildingType: 'factory',
      count: 5,
    },
    rewards: {
      credits: 3000,
    },
  },
  {
    id: 'quest_007',
    level: 3,
    type: QUEST_TYPES.METRIC,
    name: {
      zh: '稳定发展',
      en: 'Stable Development',
    },
    description: {
      zh: '城市稳定度保持在 70 以上持续 5 天',
      en: 'Keep city stability above 70 for 5 days',
    },
    condition: {
      type: 'metric_sustain',
      metric: 'stability',
      value: 70,
      duration: 5, // 天数
    },
    rewards: {
      credits: 4000,
    },
  },
  {
    id: 'quest_008',
    level: 3,
    type: QUEST_TYPES.UPGRADE,
    name: {
      zh: '建筑升级',
      en: 'Building Upgrade',
    },
    description: {
      zh: '升级 3 座建筑到 2 级',
      en: 'Upgrade 3 buildings to level 2',
    },
    condition: {
      type: 'upgrade_count',
      level: 2,
      count: 3,
    },
    rewards: {
      credits: 3500,
    },
  },
  {
    id: 'quest_009',
    level: 3,
    type: QUEST_TYPES.RESOURCE,
    name: {
      zh: '电力保障',
      en: 'Power Security',
    },
    description: {
      zh: '发电量达到 200',
      en: 'Reach power output of 200',
    },
    condition: {
      type: 'metric_reach',
      metric: 'maxPower',
      value: 200,
    },
    rewards: {
      credits: 3000,
    },
  },

  // ========== 关卡4任务 ==========
  {
    id: 'quest_010',
    level: 4,
    type: QUEST_TYPES.METRIC,
    name: {
      zh: '人口大城',
      en: 'Population City',
    },
    description: {
      zh: '城市人口达到 400',
      en: 'Reach a population of 400',
    },
    condition: {
      type: 'metric_reach',
      metric: 'population',
      value: 400,
    },
    rewards: {
      credits: 5000,
    },
  },
  {
    id: 'quest_011',
    level: 4,
    type: QUEST_TYPES.BUILD,
    name: {
      zh: '全面覆盖',
      en: 'Full Coverage',
    },
    description: {
      zh: '建造所有类型的建筑各至少 1 座',
      en: 'Build at least 1 of each building type',
    },
    condition: {
      type: 'build_all_types',
      categories: ['residential', 'commercial', 'industrial', 'environment', 'social', 'governance'],
    },
    rewards: {
      credits: 6000,
    },
  },
  {
    id: 'quest_012',
    level: 4,
    type: QUEST_TYPES.METRIC,
    name: {
      zh: '经济繁荣',
      en: 'Economic Prosperity',
    },
    description: {
      zh: '每日收入达到 500',
      en: 'Reach daily income of 500',
    },
    condition: {
      type: 'metric_reach',
      metric: 'dailyIncome',
      value: 500,
    },
    rewards: {
      credits: 5000,
    },
  },
]

/**
 * 根据任务ID获取任务配置
 * @param {string} questId - 任务ID
 * @returns {QuestConfig|null} 任务配置
 */
export function getQuestConfig(questId) {
  return QUEST_CONFIGS.find(config => config.id === questId) || null
}

/**
 * 获取指定关卡的所有任务
 * @param {number} level - 关卡编号
 * @returns {QuestConfig[]} 任务配置列表
 */
export function getQuestsByLevel(level) {
  return QUEST_CONFIGS.filter(config => config.level === level)
}

/**
 * 获取所有任务配置
 * @returns {QuestConfig[]} 所有任务配置
 */
export function getAllQuests() {
  return QUEST_CONFIGS
}

