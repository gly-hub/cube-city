/**
 * 身份等级系统配置
 * 根据累计政绩分获得不同的身份等级
 */

/**
 * 身份等级配置
 * @typedef {object} TitleConfig
 * @property {string} id - 身份ID
 * @property {number} minMeritPoints - 最低政绩分要求
 * @property {number} maxMeritPoints - 最高政绩分（-1表示无上限）
 * @property {object} name - 身份名称（多语言）
 * @property {string} icon - 身份图标（emoji）
 * @property {number} level - 等级（用于排序）
 */

/**
 * 身份等级列表（按政绩分从低到高）
 */
export const TITLE_CONFIGS = [
  // 村级
  {
    id: 'village_staff',
    minMeritPoints: 0,
    maxMeritPoints: 100,
    name: {
      zh: '村规划局职员',
      en: 'Village Planning Staff',
    },
    icon: '👤',
    level: 1,
  },
  {
    id: 'village_director',
    minMeritPoints: 100,
    maxMeritPoints: 300,
    name: {
      zh: '村规划局局长',
      en: 'Village Planning Director',
    },
    icon: '👔',
    level: 2,
  },
  // 乡镇级
  {
    id: 'township_staff',
    minMeritPoints: 300,
    maxMeritPoints: 600,
    name: {
      zh: '乡镇规划局职员',
      en: 'Township Planning Staff',
    },
    icon: '👨‍💼',
    level: 3,
  },
  {
    id: 'township_director',
    minMeritPoints: 600,
    maxMeritPoints: 1000,
    name: {
      zh: '乡镇规划局局长',
      en: 'Township Planning Director',
    },
    icon: '👨‍💼',
    level: 4,
  },
  // 县级
  {
    id: 'county_staff',
    minMeritPoints: 1000,
    maxMeritPoints: 2000,
    name: {
      zh: '县规划局职员',
      en: 'County Planning Staff',
    },
    icon: '👨‍💻',
    level: 5,
  },
  {
    id: 'county_director',
    minMeritPoints: 2000,
    maxMeritPoints: 3500,
    name: {
      zh: '县规划局局长',
      en: 'County Planning Director',
    },
    icon: '👨‍💻',
    level: 6,
  },
  // 市级
  {
    id: 'city_staff',
    minMeritPoints: 3500,
    maxMeritPoints: 6000,
    name: {
      zh: '市规划局职员',
      en: 'City Planning Staff',
    },
    icon: '👨‍🎓',
    level: 7,
  },
  {
    id: 'city_director',
    minMeritPoints: 6000,
    maxMeritPoints: 10000,
    name: {
      zh: '市规划局局长',
      en: 'City Planning Director',
    },
    icon: '👨‍🎓',
    level: 8,
  },
  // 省级
  {
    id: 'province_staff',
    minMeritPoints: 10000,
    maxMeritPoints: 20000,
    name: {
      zh: '省规划局职员',
      en: 'Province Planning Staff',
    },
    icon: '👨‍🏫',
    level: 9,
  },
  {
    id: 'province_director',
    minMeritPoints: 20000,
    maxMeritPoints: 35000,
    name: {
      zh: '省规划局局长',
      en: 'Province Planning Director',
    },
    icon: '👨‍🏫',
    level: 10,
  },
  // 国家级
  {
    id: 'national_staff',
    minMeritPoints: 35000,
    maxMeritPoints: 60000,
    name: {
      zh: '国家规划局职员',
      en: 'National Planning Staff',
    },
    icon: '👨‍⚖️',
    level: 11,
  },
  {
    id: 'national_director',
    minMeritPoints: 60000,
    maxMeritPoints: -1, // 无上限
    name: {
      zh: '国家规划局局长',
      en: 'National Planning Director',
    },
    icon: '👨‍⚖️',
    level: 12,
  },
]

/**
 * 根据政绩分获取当前身份
 * @param {number} meritPoints - 累计政绩分
 * @returns {TitleConfig} 当前身份配置
 */
export function getTitleByMeritPoints(meritPoints) {
  // 从高到低查找第一个满足条件的身份
  for (let i = TITLE_CONFIGS.length - 1; i >= 0; i--) {
    const title = TITLE_CONFIGS[i]
    if (meritPoints >= title.minMeritPoints) {
      if (title.maxMeritPoints === -1 || meritPoints < title.maxMeritPoints) {
        return title
      }
    }
  }
  // 默认返回最低等级
  return TITLE_CONFIGS[0]
}

/**
 * 获取下一个身份
 * @param {number} meritPoints - 当前政绩分
 * @returns {TitleConfig|null} 下一个身份配置，如果没有则返回null
 */
export function getNextTitle(meritPoints) {
  const currentTitle = getTitleByMeritPoints(meritPoints)
  const currentIndex = TITLE_CONFIGS.findIndex(t => t.id === currentTitle.id)
  
  if (currentIndex < TITLE_CONFIGS.length - 1) {
    return TITLE_CONFIGS[currentIndex + 1]
  }
  
  return null
}

/**
 * 获取身份进度百分比
 * @param {number} meritPoints - 当前政绩分
 * @returns {number} 进度百分比（0-100）
 */
export function getTitleProgress(meritPoints) {
  const currentTitle = getTitleByMeritPoints(meritPoints)
  const nextTitle = getNextTitle(meritPoints)
  
  if (!nextTitle) {
    return 100 // 已达到最高等级
  }
  
  const range = nextTitle.minMeritPoints - currentTitle.minMeritPoints
  const progress = meritPoints - currentTitle.minMeritPoints
  
  if (range === 0) return 0
  
  return Math.min((progress / range) * 100, 100)
}

