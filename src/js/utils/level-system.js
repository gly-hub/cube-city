/**
 * 关卡系统管理器
 * 负责关卡解锁检测、地图扩展等
 */

import { checkLevelUnlocked, getLevelConfig, getNextLevelConfig } from '@/constants/level-config.js'
import { eventBus } from './event-bus.js'
import { useGameState } from '@/stores/useGameState.js'

export default class LevelSystem {
  constructor() {
    this.gameState = useGameState()
    this.checkInterval = null
  }

  /**
   * 开始关卡检测（定期检查是否可以解锁下一关）
   */
  start() {
    // 每5秒检查一次是否可以解锁下一关
    this.checkInterval = setInterval(() => {
      this.checkNextLevelUnlock()
    }, 5000)

    // 立即检查一次
    this.checkNextLevelUnlock()
  }

  /**
   * 停止关卡检测
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 检查是否可以解锁下一关
   */
  checkNextLevelUnlock() {
    const currentLevel = this.gameState.currentLevel
    const nextLevel = currentLevel + 1
    const nextLevelConfig = getNextLevelConfig(currentLevel)

    if (!nextLevelConfig) {
      return // 没有下一关了
    }

    // 如果已经解锁，跳过
    if (this.gameState.isLevelUnlocked(nextLevel)) {
      return
    }

    // 检查解锁条件
    const result = checkLevelUnlocked(
      nextLevel,
      {
        population: this.gameState.population,
        dailyIncome: this.gameState.dailyIncome,
        stability: this.gameState.stability,
        buildingCount: this.gameState.buildingCount,
      },
      this.gameState.completedQuests
    )

    if (result.unlocked) {
      // 可以解锁了！
      this.unlockLevel(nextLevel, nextLevelConfig)
    }
  }

  /**
   * 解锁关卡
   */
  unlockLevel(level, levelConfig) {
    // 更新状态
    this.gameState.unlockLevel(level)

    // 发放奖励
    if (levelConfig.rewards.credits > 0) {
      this.gameState.updateCredits(levelConfig.rewards.credits)
    }

    // 显示解锁弹窗
    this.gameState.setPendingLevelUnlock({
      level,
      config: levelConfig,
    })
    this.gameState.setShowLevelUnlockModal(true)

    // 触发事件
    eventBus.emit('level:unlocked', {
      level,
      config: levelConfig,
    })

    // 显示提示
    eventBus.emit('toast:add', {
      message: this.gameState.language === 'zh'
        ? `🎉 关卡 ${level} 已解锁！`
        : `🎉 Level ${level} unlocked!`,
      type: 'success',
    })
  }

  /**
   * 切换到指定关卡
   */
  switchToLevel(level) {
    const levelConfig = getLevelConfig(level)
    if (!levelConfig) {
      console.error(`关卡 ${level} 不存在`)
      return false
    }

    // 检查是否已解锁
    if (!this.gameState.isLevelUnlocked(level)) {
      console.error(`关卡 ${level} 未解锁`)
      return false
    }

    // 更新当前关卡
    this.gameState.setCurrentLevel(level)

    // 重置地图为新关卡（清空所有建筑数据）
    this.resetMapForLevel(levelConfig.mapSize)

    // 触发事件
    eventBus.emit('level:switched', {
      level,
      config: levelConfig,
    })

    return true
  }

  /**
   * 重置地图为新关卡（清空所有建筑数据）
   */
  resetMapForLevel(newSize) {
    // 清空所有建筑数据，创建全新的空地图
    this.gameState.resetMapForLevel(newSize)

    // 重置一些游戏状态（但保留金币、累计金币等）
    this.gameState.stability = 100
    this.gameState.stabilityChangeRate = 0
    this.gameState.gameDay = 1

    // 触发地图重建事件
    eventBus.emit('map:reset', {
      newSize,
      level: this.gameState.currentLevel,
    })

    // 通知 Three.js 层重建地图
    if (window.Experience && window.Experience.world && window.Experience.world.city) {
      // 延迟重建，确保状态已更新
      setTimeout(() => {
        if (window.Experience.world.city) {
          window.Experience.world.city.initTiles()
        }
      }, 100)
    }

    // 刷新任务系统（因为地图已重置）
    if (window.questSystem || window.Experience?.questSystem) {
      const questSystem = window.questSystem || window.Experience.questSystem
      // 重置当前关卡的任务进度（但保留已完成的任务记录）
      questSystem.resetCurrentLevelQuests(this.gameState.currentLevel)
    }
  }

  /**
   * 扩展地图到指定大小（保留原有数据，用于其他场景）
   */
  expandMapToLevel(newSize) {
    const currentSize = this.gameState.citySize

    if (newSize <= currentSize) {
      return // 不需要扩展
    }

    // 扩展地图
    this.gameState.expandMap(newSize)

    // 触发地图重建事件
    eventBus.emit('map:expanded', {
      oldSize: currentSize,
      newSize,
    })

    // 通知 Three.js 层重建地图
    if (window.Experience && window.Experience.world && window.Experience.world.city) {
      // 延迟重建，确保状态已更新
      setTimeout(() => {
        window.Experience.world.city.initTiles()
      }, 100)
    }
  }

  /**
   * 获取当前关卡配置
   */
  getCurrentLevelConfig() {
    return getLevelConfig(this.gameState.currentLevel)
  }

  /**
   * 获取下一关卡配置
   */
  getNextLevelConfig() {
    return getNextLevelConfig(this.gameState.currentLevel)
  }

  /**
   * 检查关卡解锁状态（返回详细信息）
   */
  checkLevelUnlockStatus(level) {
    return checkLevelUnlocked(
      level,
      {
        population: this.gameState.population,
        dailyIncome: this.gameState.dailyIncome,
        stability: this.gameState.stability,
        buildingCount: this.gameState.buildingCount,
      },
      this.gameState.completedQuests
    )
  }
}

