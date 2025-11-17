/**
 * 科技系统工具类
 * 管理科技研发、效果应用等逻辑
 */

import { getTechById, getTechsByBuildingType, isTechUnlocked, TECH_EFFECT_TYPES } from '@/constants/tech-tree-config.js'
import { BUILDING_DATA } from '@/constants/constants.js'
import { eventBus } from './event-bus.js'

export default class TechSystem {
  constructor() {
    this.gameState = null
  }

  /**
   * 初始化科技系统
   * @param {object} gameState - Pinia store 实例
   */
  init(gameState) {
    this.gameState = gameState
  }

  /**
   * 检查建筑是否可以研发科技（必须达到3级或不能升级）
   * @param {string} buildingType - 建筑类型
   * @param {number} level - 建筑等级
   * @param {number|null} nextLevel - 下一等级（null表示不能升级）
   * @returns {boolean} 是否可以研发科技
   */
  canResearchTech(buildingType, level, nextLevel = null) {
    // 检查是否有该建筑类型的科技树
    const techs = getTechsByBuildingType(buildingType)
    if (techs.length === 0) {
      return false
    }
    // 必须达到3级（最高级）或者不能升级（nextLevel为null）
    return level === 3 || nextLevel === null
  }

  /**
   * 获取建筑可研发的科技列表
   * @param {string} buildingType - 建筑类型
   * @param {string[]} researchedTechs - 已研发的科技ID列表
   * @returns {object[]} 可研发的科技列表（包含解锁状态）
   */
  getAvailableTechs(buildingType, researchedTechs = []) {
    const techs = getTechsByBuildingType(buildingType)
    return techs.map(tech => ({
      ...tech,
      unlocked: isTechUnlocked(tech.id, researchedTechs),
      researched: researchedTechs.includes(tech.id),
    }))
  }

  /**
   * 研发科技
   * @param {number} x - 建筑X坐标
   * @param {number} y - 建筑Y坐标
   * @param {string} techId - 科技ID
   * @returns {boolean} 是否研发成功
   */
  researchTech(x, y, techId) {
    if (!this.gameState) {
      console.error('TechSystem not initialized')
      return false
    }

    const tech = getTechById(techId)
    if (!tech) {
      console.error(`Tech not found: ${techId}`)
      return false
    }

    const tile = this.gameState.getTile(x, y)
    if (!tile || !tile.building) {
      console.error(`Building not found at ${x}, ${y}`)
      return false
    }

    // 检查建筑等级：必须是3级或者不能升级（nextLevel为null）
    const buildingData = BUILDING_DATA[tile.building]
    const levelData = buildingData?.levels?.[tile.level]
    const canResearch = tile.level === 3 || levelData?.nextLevel === null
    
    if (!canResearch) {
      const message = this.gameState.language === 'zh'
        ? '建筑必须达到最高级才能研发科技'
        : 'Building must be at maximum level to research technology'
      eventBus.emit('toast:add', {
        type: 'error',
        message,
      })
      return false
    }

    // 检查是否已研发
    const researchedTechs = this.gameState.getBuildingTechs(x, y)
    if (researchedTechs.includes(techId)) {
      const message = this.gameState.language === 'zh'
        ? '该科技已研发'
        : 'This technology is already researched'
      eventBus.emit('toast:add', {
        type: 'warning',
        message,
      })
      return false
    }

    // 检查是否解锁（前置科技）
    if (!isTechUnlocked(techId, researchedTechs)) {
      const message = this.gameState.language === 'zh'
        ? '前置科技未研发，无法研发此科技'
        : 'Prerequisites not met, cannot research this technology'
      eventBus.emit('toast:add', {
        type: 'error',
        message,
      })
      return false
    }

    // 检查金币
    if (this.gameState.credits < tech.cost) {
      const message = this.gameState.language === 'zh'
        ? `金币不足，需要 ${tech.cost} 金币`
        : `Insufficient credits, need ${tech.cost} credits`
      eventBus.emit('toast:add', {
        type: 'error',
        message,
      })
      return false
    }

    // 扣除金币
    this.gameState.updateCredits(-tech.cost)

    // 添加科技
    this.gameState.addBuildingTech(x, y, techId)

    // 应用科技效果
    this.applyTechEffects(x, y, tech)

    // 如果当前选中的建筑就是这个建筑，需要更新 selectedBuilding 以刷新UI
    const selectedPos = this.gameState.selectedPosition
    if (selectedPos && selectedPos.x === x && (selectedPos.z === y || selectedPos.y === y)) {
      const selectedBuilding = this.gameState.selectedBuilding
      if (selectedBuilding && selectedBuilding.type === tile.building) {
        // 触发更新，让UI重新计算 building 数据
        this.gameState.setSelectedBuilding({ ...selectedBuilding })
      }
    }

    // 触发事件
    eventBus.emit('tech:researched', {
      x,
      y,
      techId,
      tech,
    })

    // 显示成功提示
    const message = this.gameState.language === 'zh'
      ? `成功研发：${tech.name.zh}`
      : `Successfully researched: ${tech.name.en}`
    eventBus.emit('ui:toast', {
      type: 'success',
      message,
    })

    return true
  }

  /**
   * 应用科技效果到建筑
   * @param {number} x - 建筑X坐标
   * @param {number} y - 建筑Y坐标
   * @param {object} tech - 科技配置
   */
  applyTechEffects(x, y, tech) {
    const tile = this.gameState.getTile(x, y)
    if (!tile || !tile.detail) {
      return
    }

    const effects = tech.effects
    // 创建 detail 的副本，避免直接修改原始数据
    const detail = { ...tile.detail }

    // 应用产出加成
    if (effects[TECH_EFFECT_TYPES.OUTPUT]) {
      const multiplier = 1 + effects[TECH_EFFECT_TYPES.OUTPUT]
      if (detail.coinOutput !== undefined) {
        detail.coinOutput = Math.floor((detail.coinOutput || 0) * multiplier)
      }
      if (detail.powerOutput !== undefined) {
        detail.powerOutput = Math.floor((detail.powerOutput || 0) * multiplier)
      }
    }

    // 应用污染变化
    if (effects[TECH_EFFECT_TYPES.POLLUTION] !== undefined) {
      const change = effects[TECH_EFFECT_TYPES.POLLUTION]
      if (detail.pollution !== undefined) {
        // 注意：pollution 可能是负数（减污建筑），需要正确处理
        detail.pollution = Math.floor(detail.pollution * (1 + change))
      }
    }

    // 应用稳定度加成（全局效果）
    if (effects[TECH_EFFECT_TYPES.STABILITY]) {
      const stabilityBonus = effects[TECH_EFFECT_TYPES.STABILITY] * 100
      this.gameState.stability = Math.min(100, this.gameState.stability + stabilityBonus)
    }

    // 应用人口容量加成
    if (effects[TECH_EFFECT_TYPES.POPULATION]) {
      const multiplier = 1 + effects[TECH_EFFECT_TYPES.POPULATION]
      if (detail.maxPopulation !== undefined) {
        detail.maxPopulation = Math.floor((detail.maxPopulation || 0) * multiplier)
      }
    }

    // 应用电力相关效果
    if (effects[TECH_EFFECT_TYPES.POWER] !== undefined) {
      const change = effects[TECH_EFFECT_TYPES.POWER]
      if (detail.powerUsage !== undefined) {
        detail.powerUsage = Math.floor((detail.powerUsage || 0) * (1 + change))
      }
      if (detail.powerOutput !== undefined) {
        detail.powerOutput = Math.floor((detail.powerOutput || 0) * (1 - change))
      }
    }

    // 应用效率加成（影响产出因子）
    if (effects[TECH_EFFECT_TYPES.EFFICIENCY]) {
      if (!tile.outputFactor) {
        tile.outputFactor = 1
      }
      tile.outputFactor *= (1 + effects[TECH_EFFECT_TYPES.EFFICIENCY])
    }

    // 应用容量加成（处理能力等）
    if (effects[TECH_EFFECT_TYPES.CAPACITY]) {
      const multiplier = 1 + effects[TECH_EFFECT_TYPES.CAPACITY]
      // 对于垃圾站等，可以增加处理能力（pollution的负值表示处理能力）
      if (detail.pollution !== undefined && detail.pollution < 0) {
        detail.pollution = Math.floor(detail.pollution * multiplier)
      }
    }

    // 更新tile（使用新的 detail 对象，确保触发响应式更新）
    // 需要创建一个新的 detail 对象，而不是直接修改
    // 确保所有属性都被正确设置
    const newDetail = {
      ...detail,
      // 显式设置所有可能被修改的属性，确保响应式更新
      coinOutput: detail.coinOutput,
      powerOutput: detail.powerOutput,
      powerUsage: detail.powerUsage,
      pollution: detail.pollution,
      maxPopulation: detail.maxPopulation,
      population: detail.population,
    }
    
    this.gameState.setTile(x, y, { 
      detail: newDetail, // 创建新对象确保响应式
      outputFactor: tile.outputFactor 
    })
    
    // 强制触发响应式更新：通过更新 selectedBuilding 来刷新 UI
    const selectedPos = this.gameState.selectedPosition
    if (selectedPos && selectedPos.x === x && (selectedPos.z === y || selectedPos.y === y)) {
      const selectedBuilding = this.gameState.selectedBuilding
      if (selectedBuilding && selectedBuilding.type === tile.building) {
        // 触发更新，让UI重新计算 building 数据
        // 使用 nextTick 确保 metadata 更新后再更新 selectedBuilding
        setTimeout(() => {
          this.gameState.setSelectedBuilding({ 
            ...selectedBuilding,
            // 添加一个时间戳来强制触发更新
            _updateTime: Date.now()
          })
        }, 0)
      }
    }
  }

  /**
   * 获取建筑的所有科技效果（用于显示）
   * @param {number} x - 建筑X坐标
   * @param {number} y - 建筑Y坐标
   * @returns {object} 科技效果汇总
   */
  getBuildingTechEffects(x, y) {
    const researchedTechs = this.gameState.getBuildingTechs(x, y)
    const effects = {
      output: 0,
      pollution: 0,
      stability: 0,
      population: 0,
      power: 0,
      efficiency: 0,
      capacity: 0,
    }

    researchedTechs.forEach(techId => {
      const tech = getTechById(techId)
      if (tech && tech.effects) {
        Object.keys(tech.effects).forEach(key => {
          if (effects[key] !== undefined) {
            effects[key] += tech.effects[key]
          }
        })
      }
    })

    return effects
  }

  /**
   * 刷新所有建筑的科技效果（用于加载存档后重新应用）
   * 注意：需要先重置 detail 到原始值，然后重新应用所有科技效果
   */
  refreshAllTechEffects() {
    if (!this.gameState) return

    this.gameState.metadata.forEach((row, x) => {
      row.forEach((tile, y) => {
        if (tile.building) {
          // 检查是否是最高级建筑（3级或不能升级）
          const buildingData = BUILDING_DATA[tile.building]
          const levelData = buildingData?.levels?.[tile.level]
          const isMaxLevel = tile.level === 3 || levelData?.nextLevel === null
          
          if (isMaxLevel) {
            // 先重置 detail 到原始值
            if (buildingData && buildingData.levels && buildingData.levels[tile.level]) {
              const originalDetail = { ...buildingData.levels[tile.level] }
              tile.detail = originalDetail
              tile.outputFactor = 1
            }

            // 重新应用所有已研发的科技效果
            const researchedTechs = this.gameState.getBuildingTechs(x, y)
            researchedTechs.forEach(techId => {
              const tech = getTechById(techId)
              if (tech) {
                this.applyTechEffects(x, y, tech)
              }
            })
          }
        }
      })
    })
  }
}

