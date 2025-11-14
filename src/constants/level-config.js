/**
 * 关卡系统配置
 * 定义每个关卡的大小、解锁条件和任务
 */

/**
 * 关卡配置数据结构
 * @typedef {object} LevelConfig
 * @property {number} level - 关卡编号（从1开始）
 * @property {number} mapSize - 地图大小（如16表示16x16）
 * @property {object} unlockConditions - 解锁条件
 * @property {object} unlockConditions.cityMetrics - 城市指标要求
 * @property {number} unlockConditions.cityMetrics.minPopulation - 最小人口
 * @property {number} unlockConditions.cityMetrics.minDailyIncome - 最小每日收入
 * @property {number} unlockConditions.cityMetrics.minStability - 最小稳定度
 * @property {number} unlockConditions.cityMetrics.minBuildingCount - 最小建筑数量
 * @property {string[]} unlockConditions.requiredQuests - 必须完成的任务ID列表
 * @property {object} rewards - 解锁奖励
 * @property {number} rewards.credits - 奖励金币
 * @property {string} name - 关卡名称
 * @property {string} description - 关卡描述
 */

/**
 * 关卡配置列表
 */
export const LEVEL_CONFIGS = [
  {
    level: 1,
    mapSize: 16,
    name: {
      zh: '新手村',
      en: 'Starter Village',
    },
    description: {
      zh: '你的第一个城市，从这里开始你的建设之旅！',
      en: 'Your first city, start your building journey here!',
    },
    unlockConditions: {
      cityMetrics: {
        minPopulation: 0,
        minDailyIncome: 0,
        minStability: 0,
        minBuildingCount: 0,
      },
      requiredQuests: [],
    },
    rewards: {
      credits: 0,
    },
  },
  {
    level: 2,
    mapSize: 24,
    name: {
      zh: '繁荣小镇',
      en: 'Prosperous Town',
    },
    description: {
      zh: '证明你的管理能力，扩展你的城市版图！',
      en: 'Prove your management skills and expand your city territory!',
    },
    unlockConditions: {
      cityMetrics: {
        minPopulation: 50,
        minDailyIncome: 100,
        minStability: 60,
        minBuildingCount: 10,
      },
      requiredQuests: ['quest_001', 'quest_002'],
    },
    rewards: {
      credits: 2000,
    },
  },
  {
    level: 3,
    mapSize: 32,
    name: {
      zh: '中型城市',
      en: 'Medium City',
    },
    description: {
      zh: '城市规模不断扩大，挑战更加复杂！',
      en: 'The city continues to grow, challenges become more complex!',
    },
    unlockConditions: {
      cityMetrics: {
        minPopulation: 150,
        minDailyIncome: 300,
        minStability: 70,
        minBuildingCount: 25,
      },
      requiredQuests: ['quest_003', 'quest_004', 'quest_005'],
    },
    rewards: {
      credits: 5000,
    },
  },
  {
    level: 4,
    mapSize: 40,
    name: {
      zh: '大型都市',
      en: 'Large Metropolis',
    },
    description: {
      zh: '成为真正的城市管理者，建设现代化大都市！',
      en: 'Become a true city manager and build a modern metropolis!',
    },
    unlockConditions: {
      cityMetrics: {
        minPopulation: 300,
        minDailyIncome: 600,
        minStability: 75,
        minBuildingCount: 50,
      },
      requiredQuests: ['quest_006', 'quest_007', 'quest_008', 'quest_009'],
    },
    rewards: {
      credits: 10000,
    },
  },
  {
    level: 5,
    mapSize: 48,
    name: {
      zh: '超级城市',
      en: 'Super City',
    },
    description: {
      zh: '终极挑战！建设一个完美的超级城市！',
      en: 'Ultimate challenge! Build a perfect super city!',
    },
    unlockConditions: {
      cityMetrics: {
        minPopulation: 500,
        minDailyIncome: 1000,
        minStability: 80,
        minBuildingCount: 80,
      },
      requiredQuests: ['quest_010', 'quest_011', 'quest_012'],
    },
    rewards: {
      credits: 20000,
    },
  },
]

/**
 * 根据关卡编号获取关卡配置
 * @param {number} level - 关卡编号
 * @returns {LevelConfig|null} 关卡配置
 */
export function getLevelConfig(level) {
  return LEVEL_CONFIGS.find(config => config.level === level) || null
}

/**
 * 获取当前关卡的下一个关卡配置
 * @param {number} currentLevel - 当前关卡编号
 * @returns {LevelConfig|null} 下一个关卡配置
 */
export function getNextLevelConfig(currentLevel) {
  return getLevelConfig(currentLevel + 1)
}

/**
 * 检查关卡是否已解锁
 * @param {number} level - 关卡编号
 * @param {object} gameState - 游戏状态对象
 * @param {string[]} completedQuests - 已完成的任务ID列表
 * @returns {object} { unlocked: boolean, reasons: string[] }
 */
export function checkLevelUnlocked(level, gameState, completedQuests = []) {
  const config = getLevelConfig(level)
  if (!config) {
    return { unlocked: false, reasons: ['关卡配置不存在'] }
  }

  // 第一关默认解锁
  if (level === 1) {
    return { unlocked: true, reasons: [] }
  }

  const reasons = []
  const conditions = config.unlockConditions

  // 检查城市指标
  if (gameState.population < conditions.cityMetrics.minPopulation) {
    reasons.push(`人口不足：需要 ${conditions.cityMetrics.minPopulation}，当前 ${gameState.population}`)
  }
  if (gameState.dailyIncome < conditions.cityMetrics.minDailyIncome) {
    reasons.push(`每日收入不足：需要 ${conditions.cityMetrics.minDailyIncome}，当前 ${Math.floor(gameState.dailyIncome)}`)
  }
  if (gameState.stability < conditions.cityMetrics.minStability) {
    reasons.push(`稳定度不足：需要 ${conditions.cityMetrics.minStability}，当前 ${gameState.stability}`)
  }
  if (gameState.buildingCount < conditions.cityMetrics.minBuildingCount) {
    reasons.push(`建筑数量不足：需要 ${conditions.cityMetrics.minBuildingCount}，当前 ${gameState.buildingCount}`)
  }

  // 检查任务完成情况
  const missingQuests = conditions.requiredQuests.filter(questId => !completedQuests.includes(questId))
  if (missingQuests.length > 0) {
    reasons.push(`未完成任务：${missingQuests.join(', ')}`)
  }

  return {
    unlocked: reasons.length === 0,
    reasons,
  }
}
