/**
 * Google Analytics 工具类
 * 用于跟踪用户行为和停留时长
 */

// Google Analytics ID
const GA_ID = 'G-SG1WXP91ZX'

// 初始化 Google Analytics
export function initGoogleAnalytics() {
  // 如果已经初始化过，直接返回
  if (window.gtag)
    return

  // 创建 dataLayer
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID)

  // 动态加载 Google Analytics 脚本
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

/**
 * 停留时长跟踪器
 */
class SessionTracker {
  constructor() {
    this.startTime = Date.now()
    this.lastActiveTime = Date.now()
    this.isActive = true
    this.totalTime = 0
    this.pageViewSent = false

    // 初始化事件监听
    this.initEventListeners()
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 页面可见性变化（切换标签页、最小化窗口等）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏，记录当前活跃时间
        this.pauseTracking()
      }
      else {
        // 页面显示，恢复跟踪
        this.resumeTracking()
      }
    })

    // 用户活动（鼠标移动、点击、键盘输入等）
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((event) => {
      document.addEventListener(event, () => {
        this.updateLastActiveTime()
      }, { passive: true })
    })

    // 页面卸载前上报停留时长
    window.addEventListener('beforeunload', () => {
      this.sendSessionDuration()
    })

    // 页面卸载时上报（作为备用）
    window.addEventListener('unload', () => {
      this.sendSessionDuration()
    })

    // 定期上报停留时长（每30秒）
    setInterval(() => {
      this.sendSessionDuration()
    }, 30000) // 30秒
  }

  /**
   * 暂停跟踪
   */
  pauseTracking() {
    if (!this.isActive)
      return

    // 计算当前会话的活跃时间
    const activeDuration = Date.now() - this.lastActiveTime
    this.totalTime += activeDuration
    this.isActive = false
  }

  /**
   * 恢复跟踪
   */
  resumeTracking() {
    if (this.isActive)
      return

    this.lastActiveTime = Date.now()
    this.isActive = true
  }

  /**
   * 更新最后活跃时间
   */
  updateLastActiveTime() {
    if (!this.isActive) {
      // 如果之前是暂停状态，恢复跟踪
      this.resumeTracking()
    }
    else {
      this.lastActiveTime = Date.now()
    }
  }

  /**
   * 获取当前停留时长（秒）
   */
  getSessionDuration() {
    let duration = this.totalTime

    if (this.isActive) {
      // 如果当前是活跃状态，加上从最后活跃时间到现在的时长
      duration += Date.now() - this.lastActiveTime
    }

    // 转换为秒
    return Math.floor(duration / 1000)
  }

  /**
   * 发送停留时长到 Google Analytics
   */
  sendSessionDuration() {
    if (!window.gtag)
      return

    const duration = this.getSessionDuration()

    // 只上报大于0的停留时长
    if (duration <= 0)
      return

    // 发送自定义事件到 Google Analytics
    window.gtag('event', 'session_duration', {
      event_category: 'engagement',
      event_label: 'page_time',
      value: duration, // 停留时长（秒）
      non_interaction: false,
    })

    // 也可以使用自定义维度来跟踪停留时长
    // 这里我们使用事件的方式，更灵活
  }

  /**
   * 发送页面浏览事件
   */
  sendPageView(pagePath = window.location.pathname, pageTitle = document.title) {
    if (!window.gtag)
      return

    if (this.pageViewSent)
      return

    window.gtag('config', GA_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    })

    this.pageViewSent = true
  }

  /**
   * 重置会话（用于单页应用的路由切换）
   */
  reset() {
    this.startTime = Date.now()
    this.lastActiveTime = Date.now()
    this.totalTime = 0
    this.isActive = true
    this.pageViewSent = false
  }
}

// 创建全局实例
let sessionTracker = null

/**
 * 初始化停留时长跟踪
 */
export function initSessionTracker() {
  if (sessionTracker)
    return sessionTracker

  sessionTracker = new SessionTracker()
  return sessionTracker
}

/**
 * 获取会话跟踪器实例
 */
export function getSessionTracker() {
  return sessionTracker
}

/**
 * 发送自定义事件到 Google Analytics
 * @param {string} eventName - 事件名称
 * @param {object} eventParams - 事件参数
 */
export function trackEvent(eventName, eventParams = {}) {
  if (!window.gtag)
    return

  window.gtag('event', eventName, eventParams)
}

/**
 * 发送页面浏览
 * @param {string} pagePath - 页面路径
 * @param {string} pageTitle - 页面标题
 */
export function trackPageView(pagePath, pageTitle) {
  if (!window.gtag)
    return

  window.gtag('config', GA_ID, {
    page_path: pagePath,
    page_title: pageTitle,
  })
}

// ==================== 游戏操作统计 ====================

/**
 * 跟踪建筑建造
 * @param {string} buildingType - 建筑类型
 * @param {number} level - 建筑等级
 * @param {number} cost - 建造成本
 */
export function trackBuildingBuilt(buildingType, level = 1, cost = 0) {
  trackEvent('building_built', {
    event_category: 'building',
    event_label: buildingType,
    building_type: buildingType,
    building_level: level,
    value: cost,
  })
}

/**
 * 跟踪建筑升级
 * @param {string} buildingType - 建筑类型
 * @param {number} fromLevel - 原等级
 * @param {number} toLevel - 新等级
 * @param {number} cost - 升级成本
 */
export function trackBuildingUpgraded(buildingType, fromLevel, toLevel, cost = 0) {
  trackEvent('building_upgraded', {
    event_category: 'building',
    event_label: buildingType,
    building_type: buildingType,
    from_level: fromLevel,
    to_level: toLevel,
    value: cost,
  })
}

/**
 * 跟踪建筑拆除
 * @param {string} buildingType - 建筑类型
 * @param {number} level - 建筑等级
 * @param {number} refund - 退款金额
 */
export function trackBuildingDemolished(buildingType, level = 1, refund = 0) {
  trackEvent('building_demolished', {
    event_category: 'building',
    event_label: buildingType,
    building_type: buildingType,
    building_level: level,
    value: refund,
  })
}

/**
 * 跟踪建筑搬迁
 * @param {string} buildingType - 建筑类型
 * @param {number} level - 建筑等级
 * @param {number} cost - 搬迁成本
 */
export function trackBuildingRelocated(buildingType, level = 1, cost = 0) {
  trackEvent('building_relocated', {
    event_category: 'building',
    event_label: buildingType,
    building_type: buildingType,
    building_level: level,
    value: cost,
  })
}

/**
 * 跟踪科技研究
 * @param {string} techId - 科技ID
 * @param {string} buildingType - 建筑类型
 * @param {number} cost - 研究成本
 */
export function trackTechResearched(techId, buildingType, cost = 0) {
  trackEvent('tech_researched', {
    event_category: 'tech',
    event_label: techId,
    tech_id: techId,
    building_type: buildingType,
    value: cost,
  })
}

/**
 * 跟踪任务完成
 * @param {string} questId - 任务ID
 * @param {string} questName - 任务名称
 * @param {object} rewards - 奖励信息
 */
export function trackQuestCompleted(questId, questName, rewards = {}) {
  trackEvent('quest_completed', {
    event_category: 'quest',
    event_label: questId,
    quest_id: questId,
    quest_name: questName,
    reward_credits: rewards.credits || 0,
    reward_merit_points: rewards.meritPoints || 0,
  })
}

/**
 * 跟踪成就解锁
 * @param {string} achievementId - 成就ID
 * @param {string} achievementName - 成就名称
 * @param {number} meritPoints - 获得的政绩分
 */
export function trackAchievementUnlocked(achievementId, achievementName, meritPoints = 0) {
  trackEvent('achievement_unlocked', {
    event_category: 'achievement',
    event_label: achievementId,
    achievement_id: achievementId,
    achievement_name: achievementName,
    merit_points: meritPoints,
  })
}

/**
 * 跟踪关卡切换
 * @param {number} fromLevel - 原关卡
 * @param {number} toLevel - 新关卡
 */
export function trackLevelSwitched(fromLevel, toLevel) {
  trackEvent('level_switched', {
    event_category: 'level',
    event_label: `level_${toLevel}`,
    from_level: fromLevel,
    to_level: toLevel,
  })
}

/**
 * 跟踪关卡解锁
 * @param {number} level - 解锁的关卡
 */
export function trackLevelUnlocked(level) {
  trackEvent('level_unlocked', {
    event_category: 'level',
    event_label: `level_${level}`,
    level,
  })
}

/**
 * 跟踪游戏速度调整
 * @param {number} fromSpeed - 原速度
 * @param {number} toSpeed - 新速度
 */
export function trackGameSpeedChanged(fromSpeed, toSpeed) {
  trackEvent('game_speed_changed', {
    event_category: 'settings',
    event_label: `speed_${toSpeed}x`,
    from_speed: fromSpeed,
    to_speed: toSpeed,
  })
}

/**
 * 跟踪游戏模式切换
 * @param {string} fromMode - 原模式
 * @param {string} toMode - 新模式
 */
export function trackGameModeChanged(fromMode, toMode) {
  trackEvent('game_mode_changed', {
    event_category: 'interaction',
    event_label: toMode,
    from_mode: fromMode,
    to_mode: toMode,
  })
}

/**
 * 跟踪城市指标
 * @param {object} metrics - 城市指标数据
 */
export function trackCityMetrics(metrics) {
  trackEvent('city_metrics', {
    event_category: 'city',
    event_label: 'metrics_update',
    building_count: metrics.buildingCount || 0,
    daily_income: metrics.dailyIncome || 0,
    pollution: metrics.pollution || 0,
    stability: metrics.stability || 0,
    population: metrics.population || 0,
    max_population: metrics.maxPopulation || 0,
    power: metrics.power || 0,
    max_power: metrics.maxPower || 0,
    city_level: metrics.cityLevel || 1,
    game_day: metrics.gameDay || 1,
  })
}

/**
 * 跟踪系统状态变化
 * @param {string} statusType - 状态类型 (power_grid, transport, security, environment)
 * @param {string} fromStatus - 原状态等级
 * @param {string} toStatus - 新状态等级
 */
export function trackSystemStatusChanged(statusType, fromStatus, toStatus) {
  trackEvent('system_status_changed', {
    event_category: 'system',
    event_label: statusType,
    status_type: statusType,
    from_status: fromStatus,
    to_status: toStatus,
  })
}

