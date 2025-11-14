/**
 * 任务系统管理器
 * 负责任务进度追踪、完成检测和奖励发放
 */

import { getQuestConfig, QUEST_CONFIGS } from '@/constants/quest-config.js'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from './event-bus.js'

export default class QuestSystem {
  constructor() {
    this.gameState = useGameState()
    this.questProgress = new Map() // 任务进度：questId -> progress data
    this.questHistory = [] // 任务完成历史（用于统计）
    
    // 初始化所有任务的进度
    this.initQuestProgress()
    
    // 监听游戏事件
    this.setupEventListeners()
  }

  /**
   * 初始化所有任务的进度
   */
  initQuestProgress() {
    QUEST_CONFIGS.forEach(quest => {
      if (!this.questProgress.has(quest.id)) {
        this.questProgress.set(quest.id, {
          questId: quest.id,
          completed: false,
          progress: 0,
          target: this.getQuestTarget(quest),
          startTime: Date.now(),
          completeTime: null,
        })
      }
    })
  }

  /**
   * 获取任务目标值
   * @param {object} quest - 任务配置
   * @returns {number} 目标值
   */
  getQuestTarget(quest) {
    const { condition } = quest
    
    switch (condition.type) {
      case 'build_count':
        return condition.count
      case 'total_earned':
        return condition.amount
      case 'metric_reach':
        return condition.value
      case 'metric_sustain':
        return condition.duration
      case 'upgrade_count':
        return condition.count
      case 'build_multiple':
        return condition.buildings.reduce((sum, b) => sum + b.count, 0)
      case 'build_all_types':
        return condition.categories.length
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
    
    // 监听金币变化事件
    eventBus.on('credits:changed', (data) => {
      this.onCreditsChanged(data)
    })
  }

  /**
   * 建筑建造事件处理
   */
  onBuildingPlaced(data) {
    const { building } = data
    if (!building) return

    // 更新所有相关任务进度
    this.updateQuestProgress('build', { buildingType: building.type })
  }

  /**
   * 建筑升级事件处理
   */
  onBuildingUpgraded(data) {
    const { building, level } = data
    if (!building) return

    this.updateQuestProgress('upgrade', { building, level })
  }

  /**
   * 金币变化事件处理
   */
  onCreditsChanged(data) {
    // 这里可以追踪累计获得的金币（需要额外记录）
    // 暂时不处理，因为需要追踪历史累计值
  }

  /**
   * 更新任务进度
   * @param {string} eventType - 事件类型
   * @param {object} data - 事件数据
   */
  updateQuestProgress(eventType, data) {
    const gs = this.gameState
    
    QUEST_CONFIGS.forEach(quest => {
      if (this.isQuestCompleted(quest.id)) {
        return // 已完成的任务跳过
      }

      const progress = this.questProgress.get(quest.id)
      if (!progress) {
        // 如果进度不存在，初始化
        this.questProgress.set(quest.id, {
          questId: quest.id,
          completed: false,
          progress: 0,
          target: this.getQuestTarget(quest),
          startTime: Date.now(),
          completeTime: null,
        })
        return
      }

      const { condition } = quest
      let shouldUpdate = false
      let newProgress = progress.progress

      switch (condition.type) {
        case 'build_count':
          if (eventType === 'build' && condition.buildingType === data.buildingType) {
            newProgress = this.countBuildings(condition.buildingType)
            shouldUpdate = true
          }
          break

        case 'build_multiple':
          if (eventType === 'build') {
            newProgress = this.countMultipleBuildings(condition.buildings)
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
          // 累计获得金币任务
          newProgress = gs.totalEarnedCredits || 0
          shouldUpdate = true
          break

        case 'metric_reach':
          // 指标类任务通过定期检查完成
          newProgress = this.getMetricValue(condition.metric, gs)
          shouldUpdate = true
          break

        case 'metric_sustain':
          // 持续类任务需要特殊处理
          newProgress = this.checkMetricSustain(condition.metric, condition.value, gs)
          shouldUpdate = true
          break
      }

      if (shouldUpdate) {
        progress.progress = Math.min(newProgress, progress.target)
        // 同步到 Pinia
        gs.updateQuestProgress(quest.id, {
          progress: progress.progress,
          target: progress.target,
          completed: progress.completed,
        })
        this.checkQuestCompletion(quest.id)
      }
    })
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
   * 统计多种建筑的数量
   */
  countMultipleBuildings(buildings) {
    let total = 0
    
    buildings.forEach(({ type, count: required }) => {
      const actual = this.countBuildings(type)
      total += Math.min(actual, required)
    })
    
    return total
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
      default:
        return 0
    }
  }

  /**
   * 检查指标持续情况（简化版，实际需要记录历史）
   */
  checkMetricSustain(metric, value, gs) {
    const currentValue = this.getMetricValue(metric, gs)
    // 简化实现：如果当前值满足要求，返回1，否则返回0
    // 实际应该记录连续满足的天数
    return currentValue >= value ? 1 : 0
  }

  /**
   * 检查任务是否完成
   */
  checkQuestCompletion(questId) {
    const progress = this.questProgress.get(questId)
    if (!progress || progress.completed) return false

    if (progress.progress >= progress.target) {
      this.completeQuest(questId)
      return true
    }

    return false
  }

  /**
   * 完成任务
   */
  completeQuest(questId) {
    const progress = this.questProgress.get(questId)
    if (!progress || progress.completed) return

    progress.completed = true
    progress.completeTime = Date.now()

    const quest = getQuestConfig(questId)
    if (quest) {
      // 发放奖励
      if (quest.rewards.credits > 0) {
        this.gameState.updateCredits(quest.rewards.credits)
      }

      // 记录历史
      this.questHistory.push({
        questId,
        completeTime: progress.completeTime,
      })

      // 触发事件
      eventBus.emit('quest:completed', {
        questId,
        quest,
        rewards: quest.rewards,
      })
      
      // 更新 Pinia 状态
      this.gameState.completeQuest(questId)
    }
  }

  /**
   * 检查任务是否已完成
   */
  isQuestCompleted(questId) {
    const progress = this.questProgress.get(questId)
    return progress ? progress.completed : false
  }

  /**
   * 获取任务进度
   */
  getQuestProgress(questId) {
    return this.questProgress.get(questId) || null
  }

  /**
   * 获取所有任务进度
   */
  getAllQuestProgress() {
    return Array.from(this.questProgress.values())
  }

  /**
   * 获取指定关卡的任务进度
   */
  getQuestsByLevel(level) {
    return this.getAllQuestProgress().filter(progress => {
      const quest = getQuestConfig(progress.questId)
      return quest && quest.level === level
    })
  }

  /**
   * 定期检查指标类任务（应该在游戏循环中调用）
   */
  checkMetricQuests() {
    const gs = this.gameState
    
    QUEST_CONFIGS.forEach(quest => {
      if (this.isQuestCompleted(quest.id)) return

      const { condition } = quest
      if (condition.type === 'metric_reach' || condition.type === 'metric_sustain' || condition.type === 'total_earned') {
        this.updateQuestProgress('metric', {})
      }
    })
  }

  /**
   * 刷新所有任务进度（扫描现有建筑和状态）
   * 用于初始化时或需要强制刷新时
   */
  refreshAllQuests() {
    const gs = this.gameState
    
    QUEST_CONFIGS.forEach(quest => {
      if (this.isQuestCompleted(quest.id)) return

      const { condition } = quest
      let shouldUpdate = false
      let newProgress = 0

      switch (condition.type) {
        case 'build_count':
          newProgress = this.countBuildings(condition.buildingType)
          shouldUpdate = true
          break

        case 'build_multiple':
          newProgress = this.countMultipleBuildings(condition.buildings)
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

        case 'metric_sustain':
          newProgress = this.checkMetricSustain(condition.metric, condition.value, gs)
          shouldUpdate = true
          break
      }

      if (shouldUpdate) {
        const progress = this.questProgress.get(quest.id)
        if (!progress) {
          // 初始化进度
          this.questProgress.set(quest.id, {
            questId: quest.id,
            completed: false,
            progress: 0,
            target: this.getQuestTarget(quest),
            startTime: Date.now(),
            completeTime: null,
          })
        }
        
        const currentProgress = this.questProgress.get(quest.id)
        currentProgress.progress = Math.min(newProgress, currentProgress.target)
        
        // 同步到 Pinia
        gs.updateQuestProgress(quest.id, {
          progress: currentProgress.progress,
          target: currentProgress.target,
          completed: currentProgress.completed,
        })
        
        // 检查是否完成
        this.checkQuestCompletion(quest.id)
      }
    })
  }

  /**
   * 重置任务系统（用于新游戏）
   */
  reset() {
    this.questProgress.clear()
    this.questHistory = []
    this.initQuestProgress()
  }

  /**
   * 重置当前关卡的任务进度（但保留已完成的任务记录）
   * 用于关卡切换时，清空当前关卡的任务进度，但保留已完成的任务
   */
  resetCurrentLevelQuests(level) {
    const questsForLevel = QUEST_CONFIGS.filter(quest => quest.level === level)
    
    questsForLevel.forEach(quest => {
      // 如果任务已完成，保留完成状态
      if (this.gameState.isQuestCompleted(quest.id)) {
        // 保持完成状态，但重置进度数据
        const progress = this.questProgress.get(quest.id)
        if (progress) {
          progress.progress = progress.target
          progress.completed = true
        }
      } else {
        // 未完成的任务，重置进度
        this.questProgress.set(quest.id, {
          questId: quest.id,
          completed: false,
          progress: 0,
          target: this.getQuestTarget(quest),
          startTime: Date.now(),
          completeTime: null,
        })
        
        // 同步到 Pinia
        this.gameState.updateQuestProgress(quest.id, {
          progress: 0,
          target: this.getQuestTarget(quest),
          completed: false,
        })
      }
    })
  }
}

