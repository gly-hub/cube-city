/**
 * 成就系统管理器
 * 负责成就进度追踪、解锁检测和奖励发放
 */

import { getAchievementConfig, ACHIEVEMENT_CONFIGS } from '@/constants/achievement-config.js'
import { getQuestsByLevel } from '@/constants/quest-config.js'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from './event-bus.js'

export default class AchievementSystem {
  constructor() {
    this.gameState = useGameState()
    this.achievementProgress = new Map() // 成就进度：achievementId -> progress data
    this.achievementHistory = [] // 成就解锁历史（用于统计）
    
    // 初始化所有成就的进度
    this.initAchievementProgress()
    
    // 监听游戏事件
    this.setupEventListeners()
  }

  /**
   * 初始化所有成就的进度
   */
  initAchievementProgress() {
    ACHIEVEMENT_CONFIGS.forEach(achievement => {
      if (!this.achievementProgress.has(achievement.id)) {
        this.achievementProgress.set(achievement.id, {
          achievementId: achievement.id,
          unlocked: false,
          progress: 0,
          target: this.getAchievementTarget(achievement),
          unlockTime: null,
        })
      }
    })
  }

  /**
   * 获取成就目标值
   * @param {object} achievement - 成就配置
   * @returns {number} 目标值
   */
  getAchievementTarget(achievement) {
    const { condition } = achievement
    
    switch (condition.type) {
      case 'build_count':
        return condition.count
      case 'total_earned':
        return condition.amount
      case 'metric_reach':
      case 'metric_below':
        return condition.value
      case 'upgrade_count':
        return condition.count
      case 'level_unlock':
        return 1
      case 'quests_complete':
        // 返回该关卡的任务数量
        return getQuestsByLevel(condition.level).length
      case 'build_all_types':
        return condition.categories.length
      case 'metric_multi':
        // 多条件成就：返回100（表示需要100%完成）
        return 100
      default:
        return 1
    }
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听建筑建造事件
    eventBus.on('building:placed', (data) => {
      this.onBuildingPlaced(data)
    })
    
    // 监听建筑升级事件
    eventBus.on('building:upgraded', (data) => {
      this.onBuildingUpgraded(data)
    })
    
    // 监听关卡解锁事件
    eventBus.on('level:unlocked', (data) => {
      this.onLevelUnlocked(data)
    })
    
    // 监听任务完成事件
    eventBus.on('quest:completed', (data) => {
      this.onQuestCompleted(data)
    })
  }

  /**
   * 建筑建造事件处理
   */
  onBuildingPlaced(data) {
    this.updateAchievementProgress('build', { buildingType: data.building?.type })
  }

  /**
   * 建筑升级事件处理
   */
  onBuildingUpgraded(data) {
    this.updateAchievementProgress('upgrade', { level: data.level })
  }

  /**
   * 关卡解锁事件处理
   */
  onLevelUnlocked(data) {
    this.updateAchievementProgress('level_unlock', { level: data.level })
  }

  /**
   * 任务完成事件处理
   */
  onQuestCompleted(data) {
    // 检查是否有"完成某关卡所有任务"的成就
    this.updateAchievementProgress('quests_complete', {})
  }

  /**
   * 更新成就进度
   * @param {string} eventType - 事件类型
   * @param {object} data - 事件数据
   */
  updateAchievementProgress(eventType, data) {
    const gs = this.gameState
    
    ACHIEVEMENT_CONFIGS.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) {
        return // 已解锁的成就跳过
      }

      const progress = this.achievementProgress.get(achievement.id)
      if (!progress) return

      const { condition } = achievement
      let shouldUpdate = false
      let newProgress = progress.progress

      switch (condition.type) {
        case 'build_count':
          if (eventType === 'build') {
            if (condition.buildingType === null) {
              // 任意建筑
              newProgress = this.countAllBuildings()
            } else {
              // 指定类型建筑
              newProgress = this.countBuildings(condition.buildingType)
            }
            shouldUpdate = true
          }
          break

        case 'build_all_types':
          if (eventType === 'build') {
            newProgress = this.countAllTypes(condition.categories)
            shouldUpdate = true
          }
          break

        case 'upgrade_count':
          if (eventType === 'upgrade') {
            // 升级任务：统计达到指定等级或更高的建筑数量
            newProgress = this.countUpgradedBuildings(condition.level)
            shouldUpdate = true
          }
          break

        case 'total_earned':
          // 累计获得金币成就
          newProgress = gs.totalEarnedCredits || 0
          shouldUpdate = true
          break

        case 'metric_reach':
          // 指标达到类成就
          newProgress = this.getMetricValue(condition.metric, gs)
          shouldUpdate = true
          break

        case 'metric_below':
          // 指标低于类成就（如污染低于10）
          const currentValue = this.getMetricValue(condition.metric, gs)
          // 如果当前值低于目标值，进度为100%，否则为0%
          newProgress = currentValue <= condition.value ? 100 : 0
          shouldUpdate = true
          break

        case 'metric_multi':
          // 多条件成就（需要同时满足多个条件）
          if (condition.conditions && Array.isArray(condition.conditions)) {
            let allMet = true
            let completedCount = 0
            
            condition.conditions.forEach(cond => {
              const value = this.getMetricValue(cond.metric, gs)
              let met = false
              
              switch (cond.operator) {
                case '>=':
                  met = value >= cond.value
                  break
                case '<=':
                  met = value <= cond.value
                  break
                case '>':
                  met = value > cond.value
                  break
                case '<':
                  met = value < cond.value
                  break
                case '===':
                case '==':
                  met = value === cond.value
                  break
              }
              
              if (met) {
                completedCount++
              } else {
                allMet = false
              }
            })
            
            // 进度 = 已完成条件数 / 总条件数 * 100
            newProgress = (completedCount / condition.conditions.length) * 100
            // 如果所有条件都满足，进度为100%
            if (allMet) {
              newProgress = 100
            }
            shouldUpdate = true
          }
          break

        case 'level_unlock':
          // 关卡解锁类成就
          if (eventType === 'level_unlock' && condition.level === data.level) {
            newProgress = 100
            shouldUpdate = true
          }
          break

        case 'quests_complete':
          // 完成某关卡所有任务的成就
          const questsForLevel = getQuestsByLevel(condition.level)
          const completedCount = questsForLevel.filter(quest => 
            gs.isQuestCompleted(quest.id)
          ).length
          newProgress = questsForLevel.length > 0 
            ? (completedCount / questsForLevel.length) * 100 
            : 0
          shouldUpdate = true
          break
      }

      if (shouldUpdate) {
        progress.progress = Math.min(newProgress, progress.target)
        // 同步到 Pinia
        gs.updateAchievementProgress(achievement.id, {
          progress: progress.progress,
          target: progress.target,
          unlocked: progress.unlocked,
        })
        this.checkAchievementUnlock(achievement.id)
      }
    })
  }

  /**
   * 统计所有建筑数量
   */
  countAllBuildings() {
    return this.gameState.buildingCount
  }

  /**
   * 统计指定类型的建筑数量
   */
  countBuildings(buildingType) {
    const gs = this.gameState
    let count = 0
    
    if (!gs.metadata || !Array.isArray(gs.metadata)) {
      return 0
    }
    
    gs.metadata.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(tile => {
          if (tile && tile.building === buildingType) {
            count++
          }
        })
      }
    })
    
    return count
  }

  /**
   * 统计所有类型建筑的数量
   */
  countAllTypes(categories) {
    const gs = this.gameState
    const foundCategories = new Set()
    
    gs.metadata.forEach(row => {
      row.forEach(tile => {
        if (tile.building && tile.detail) {
          foundCategories.add(tile.detail.category)
        }
      })
    })
    
    return foundCategories.size
  }

  /**
   * 统计升级建筑数量
   */
  countUpgradedBuildings(level) {
    const gs = this.gameState
    let count = 0
    
    gs.metadata.forEach(row => {
      row.forEach(tile => {
        if (tile.building && tile.level >= level) {
          count++
        }
      })
    })
    
    return count
  }

  /**
   * 获取指标值
   */
  getMetricValue(metric, gs) {
    switch (metric) {
      case 'population':
        return gs.population
      case 'maxPower':
        return gs.maxPower
      case 'dailyIncome':
        return gs.dailyIncome
      case 'stability':
        return gs.stability
      case 'pollution':
        return gs.pollution
      case 'gameDay':
        return gs.gameDay
      default:
        return 0
    }
  }

  /**
   * 检查成就是否解锁
   */
  checkAchievementUnlock(achievementId) {
    const progress = this.achievementProgress.get(achievementId)
    if (!progress || progress.unlocked) return false

    const achievement = getAchievementConfig(achievementId)
    if (!achievement) return false

    const { condition } = achievement
    let shouldUnlock = false

    switch (condition.type) {
      case 'build_count':
      case 'total_earned':
      case 'upgrade_count':
        shouldUnlock = progress.progress >= progress.target
        break

      case 'metric_reach':
        shouldUnlock = progress.progress >= progress.target
        break

      case 'metric_below':
        // 对于"低于"类型的成就，progress 为 100 表示满足条件
        shouldUnlock = progress.progress >= 100
        break

      case 'level_unlock':
        shouldUnlock = progress.progress >= 100
        break

      case 'quests_complete':
        shouldUnlock = progress.progress >= 100
        break

      case 'build_all_types':
        shouldUnlock = progress.progress >= progress.target
        break

      case 'metric_multi':
        // 多条件成就：所有条件都必须满足（进度为100%）
        shouldUnlock = progress.progress >= 100
        break
    }

    if (shouldUnlock) {
      this.unlockAchievement(achievementId)
      return true
    }

    return false
  }

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId) {
    const progress = this.achievementProgress.get(achievementId)
    if (!progress || progress.unlocked) return

    progress.unlocked = true
    progress.unlockTime = Date.now()

    const achievement = getAchievementConfig(achievementId)
    if (achievement) {
      // 发放奖励（政绩分）
      if (achievement.rewards.meritPoints > 0) {
        this.gameState.addMeritPoints(achievement.rewards.meritPoints)
      }

      // 记录历史
      this.achievementHistory.push({
        achievementId,
        unlockTime: progress.unlockTime,
      })

      // 更新 Pinia 状态
      this.gameState.unlockAchievement(achievementId)

      // 触发事件
      eventBus.emit('achievement:unlocked', {
        achievementId,
        achievement,
        rewards: achievement.rewards,
      })

      // 显示解锁通知
      eventBus.emit('toast:add', {
        message: this.gameState.language === 'zh'
          ? `🏆 成就解锁：${achievement.name.zh}！获得 ${achievement.rewards.meritPoints} 政绩分`
          : `🏆 Achievement Unlocked: ${achievement.name.en}! Gained ${achievement.rewards.meritPoints} merit points`,
        type: 'success',
      })
    }
  }

  /**
   * 检查成就是否已解锁
   */
  isAchievementUnlocked(achievementId) {
    const progress = this.achievementProgress.get(achievementId)
    return progress ? progress.unlocked : false
  }

  /**
   * 获取成就进度
   */
  getAchievementProgress(achievementId) {
    return this.achievementProgress.get(achievementId) || null
  }

  /**
   * 获取所有成就进度
   */
  getAllAchievementProgress() {
    return Array.from(this.achievementProgress.values())
  }

  /**
   * 定期检查指标类成就（应该在游戏循环中调用）
   */
  checkMetricAchievements() {
    const gs = this.gameState
    
    ACHIEVEMENT_CONFIGS.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return

      const { condition } = achievement
      if (condition.type === 'metric_reach' || condition.type === 'metric_below' || condition.type === 'metric_multi' || condition.type === 'total_earned' || condition.type === 'quests_complete') {
        this.updateAchievementProgress('metric', {})
      }
    })
  }

  /**
   * 刷新所有成就进度（扫描现有状态）
   * 用于初始化时或需要强制刷新时
   */
  refreshAllAchievements() {
    const gs = this.gameState
    
    ACHIEVEMENT_CONFIGS.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return

      const { condition } = achievement
      let shouldUpdate = false
      let newProgress = 0

      switch (condition.type) {
        case 'build_count':
          if (condition.buildingType === null) {
            newProgress = this.countAllBuildings()
          } else {
            newProgress = this.countBuildings(condition.buildingType)
          }
          shouldUpdate = true
          break

        case 'build_all_types':
          newProgress = this.countAllTypes(condition.categories)
          shouldUpdate = true
          break

        case 'upgrade_count':
          newProgress = this.countUpgradedBuildings(condition.level)
          shouldUpdate = true
          break

        case 'total_earned':
          newProgress = gs.totalEarnedCredits || 0
          shouldUpdate = true
          break

        case 'metric_reach':
          newProgress = this.getMetricValue(condition.metric, gs)
          shouldUpdate = true
          break

        case 'metric_below':
          const currentValue = this.getMetricValue(condition.metric, gs)
          newProgress = currentValue <= condition.value ? 100 : 0
          shouldUpdate = true
          break

        case 'metric_multi':
          // 多条件成就
          if (condition.conditions && Array.isArray(condition.conditions)) {
            let allMet = true
            let completedCount = 0
            
            condition.conditions.forEach(cond => {
              const value = this.getMetricValue(cond.metric, gs)
              let met = false
              
              switch (cond.operator) {
                case '>=':
                  met = value >= cond.value
                  break
                case '<=':
                  met = value <= cond.value
                  break
                case '>':
                  met = value > cond.value
                  break
                case '<':
                  met = value < cond.value
                  break
                case '===':
                case '==':
                  met = value === cond.value
                  break
              }
              
              if (met) {
                completedCount++
              } else {
                allMet = false
              }
            })
            
            newProgress = (completedCount / condition.conditions.length) * 100
            if (allMet) {
              newProgress = 100
            }
            shouldUpdate = true
          }
          break

        case 'level_unlock':
          // 检查关卡是否已解锁
          newProgress = gs.isLevelUnlocked(condition.level) ? 100 : 0
          shouldUpdate = true
          break

        case 'quests_complete':
          const questsForLevel = getQuestsByLevel(condition.level)
          const completedCount = questsForLevel.filter(quest => 
            gs.isQuestCompleted(quest.id)
          ).length
          newProgress = questsForLevel.length > 0 
            ? (completedCount / questsForLevel.length) * 100 
            : 0
          shouldUpdate = true
          break
      }

      if (shouldUpdate) {
        const progress = this.achievementProgress.get(achievement.id)
        if (!progress) {
          // 初始化进度
          this.achievementProgress.set(achievement.id, {
            achievementId: achievement.id,
            unlocked: false,
            progress: 0,
            target: this.getAchievementTarget(achievement),
            unlockTime: null,
          })
        }
        
        const currentProgress = this.achievementProgress.get(achievement.id)
        currentProgress.progress = Math.min(newProgress, currentProgress.target)
        
        // 同步到 Pinia
        gs.updateAchievementProgress(achievement.id, {
          progress: currentProgress.progress,
          target: currentProgress.target,
          unlocked: currentProgress.unlocked,
        })
        
        // 检查是否解锁
        this.checkAchievementUnlock(achievement.id)
      }
    })
  }

  /**
   * 重置成就系统（用于新游戏）
   */
  reset() {
    this.achievementProgress.clear()
    this.achievementHistory = []
    this.initAchievementProgress()
  }
}

