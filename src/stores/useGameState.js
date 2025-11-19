import { getAdjustedStabilityRate, STABILITY_CONFIG } from '@/constants/constants.js'
import { getEffectiveBuildingValue } from '@/js/utils/building-interaction-utils.js'
import { defineStore } from 'pinia'
import { getTitleByMeritPoints } from '@/constants/title-config.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { calculateAllSystemStatus, calculateIncomeMultiplier } from '@/js/utils/system-status.js'

export const useGameState = defineStore('gameState', {
  state: () => ({
    // 核心游戏状态
    metadata: Array.from({ length: 17 }, _ =>
      Array.from({ length: 17 }, _ => ({
        type: 'grass',
        building: null,
        direction: 0,
      }))),
    currentMode: 'build',
    // 新增：当前场景模式 'CITY' | 'TD'
    currentScene: 'CITY',
    selectedBuilding: null,
    selectedPosition: null,
    toastQueue: [],

    // 游戏时间和经济
    gameDay: 1,
    credits: 3000,
    gameSpeed: 1.0, // 游戏速度倍率（1.0 = 正常速度，2.0 = 2倍速，0.5 = 0.5倍速）

    // 城市属性
    territory: 16,
    cityLevel: 1,
    cityName: '我的城市',
    citySize: 16,
    language: 'zh',
    showMapOverview: false,

    // 音乐系统状态
    musicEnabled: false,
    musicVolume: 0.5,
    isPlayingMusic: false,

    // 稳定度系统（移除计时器相关状态）
    stability: 100,
    stabilityChangeRate: 0,
    // 移除：stabilityIntervalId: null,

    // 关卡系统状态
    currentLevel: 1, // 当前关卡
    unlockedLevels: [1], // 已解锁的关卡列表
    totalEarnedCredits: 0, // 累计获得的金币（用于任务追踪）

    // 任务系统状态
    completedQuests: [], // 已完成的任务ID列表
    questProgress: {}, // 任务进度 { questId: { progress, target, completed } }
    showQuestPanel: false, // 是否显示任务面板
    showLevelUnlockModal: false, // 是否显示关卡解锁弹窗
    pendingLevelUnlock: null, // 待解锁的关卡信息

    // 成就系统状态
    unlockedAchievements: [], // 已解锁的成就ID列表
    achievementProgress: {}, // 成就进度 { achievementId: { progress, target, unlocked } }
    showAchievementPanel: false, // 是否显示成就面板

    // 政绩分和身份系统
    meritPoints: 0, // 累计政绩分
    currentTitle: 'village_staff', // 当前身份ID

    // 科技系统状态
    buildingTechs: {}, // 建筑科技研发状态 { 'x,y': ['tech_id1', 'tech_id2'] }
    showTechTreePanel: false, // 是否显示科技树面板
    selectedBuildingForTech: null, // 当前选中用于科技研发的建筑位置 { x, y }

    // 塔防系统状态
    selectedTowerType: null, // 当前选中的防御塔类型
    selectedTower: null, // 当前选中的防御塔实例

    // 外城塔防游戏数据（持久化）
    tdGameData: {
      wave: 1, // 当前波次
      baseHealth: 10, // 基地生命值
      towers: [], // 防御塔数据 [{ type, level, damage, range, cooldown, cost, tileX, tileY }]
      isWaveActive: false, // 是否正在战斗
    },
  }),
  getters: {
    /**
     * 计算系统状态（需要先计算基础数据）
     * @param {object} state - 游戏状态
     * @returns {object} 系统状态 { power, transport, security, environment }
     */
    systemStatus(state) {
      // 先计算基础数据（避免循环依赖）
      let totalPower = 0
      let totalPowerUsage = 0
      let totalPollution = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            const power = getEffectiveBuildingValue(state, x, y, 'powerOutput')
            const powerUsage = getEffectiveBuildingValue(state, x, y, 'powerUsage')
            const pollution = getEffectiveBuildingValue(state, x, y, 'pollution')
            totalPower += power
            // powerUsage是正数（消耗值）
            totalPowerUsage += powerUsage || 0
            totalPollution += pollution
          }
        })
      })

      return calculateAllSystemStatus({
        metadata: state.metadata,
        power: totalPowerUsage,
        maxPower: totalPower,
        stability: state.stability,
        pollution: totalPollution,
        citySize: state.citySize,
      })
    },
    /**
     * 计算每日总收入（受系统状态影响）
     * @param {object} state - 游戏状态
     * @returns {number} 总收入
     */
    dailyIncome(state) {
      let totalIncome = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            // 使用高效函数：自动判断是否需要相互作用计算
            const income = getEffectiveBuildingValue(state, x, y, 'coinOutput')
            totalIncome += income
          }
        })
      })

      // 应用系统状态影响（避免循环依赖，直接计算基础数据）
      let totalPower = 0
      let totalPowerUsage = 0
      let totalPollution = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            const power = getEffectiveBuildingValue(state, x, y, 'powerOutput')
            const powerUsage = getEffectiveBuildingValue(state, x, y, 'powerUsage')
            const pollution = getEffectiveBuildingValue(state, x, y, 'pollution')
            totalPower += power
            // powerUsage是正数（消耗值）
            totalPowerUsage += powerUsage || 0
            totalPollution += pollution
          }
        })
      })

      const systemStatus = calculateAllSystemStatus({
        metadata: state.metadata,
        power: totalPowerUsage,
        maxPower: totalPower,
        stability: state.stability,
        pollution: totalPollution,
        citySize: state.citySize,
      })
      const incomeMultiplier = calculateIncomeMultiplier(systemStatus)

      return Math.floor(totalIncome * incomeMultiplier)
    },
    /**
     * 计算总人口容量（优化：直接使用detail，仅对有相互作用的建筑计算修正）
     * @param {object} state - 游戏状态
     * @returns {number} 总人口容量
     */
    maxPopulation: (state) => {
      let totalCapacity = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail && tile.detail.category === 'residential') {
            // 使用高效函数：自动判断是否需要相互作用计算
            const capacity = getEffectiveBuildingValue(state, x, y, 'maxPopulation')
            totalCapacity += capacity
          }
        })
      })

      return totalCapacity
    },
    /**
     * 计算总就业岗位
     * @param {object} state - a
     * @returns {number} - b
     */
    totalJobs: (state) => {
      let totalJobs = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.detail) {
            totalJobs += tile.detail.population || 0
          }
        })
      })
      return totalJobs
    },
    population() {
      return Math.min(this.maxPopulation * 1.5, this.totalJobs)
    },
    /**
     * 计算最大发电量（优化：直接使用detail，仅对有相互作用的建筑计算修正）
     * @param {object} state - 游戏状态
     * @returns {number} 最大发电量
     */
    maxPower: (state) => {
      let totalPower = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            // 使用高效函数：自动判断是否需要相互作用计算
            const power = getEffectiveBuildingValue(state, x, y, 'powerOutput')
            totalPower += power
          }
        })
      })

      return totalPower
    },
    /**
     * 计算总耗电量
     * @param {object} state - a
     * @returns {number} - b
     */
    power: (state) => {
      let totalUsage = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.detail) {
            totalUsage += tile.detail.powerUsage || 0
          }
        })
      })
      return totalUsage
    },

    buildingCount: (state) => {
      let count = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.building !== 'road') {
            count++
          }
        })
      })
      return count
    },
    /**
     * 计算总污染值（优化：直接使用detail，仅对有相互作用的建筑计算修正）
     * @param {object} state - 游戏状态
     * @returns {number} 总污染值
     */
    pollution: (state) => {
      let totalPollution = 0

      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            // 使用高效函数：自动判断是否需要相互作用计算
            const pollution = getEffectiveBuildingValue(state, x, y, 'pollution')
            totalPollution += pollution
          }
        })
      })

      return totalPollution
    },
    hospitalCount: state =>
      state.metadata.flat().filter(tile => tile.building === 'hospital').length,
    policeStationCount: state =>
      state.metadata.flat().filter(tile => tile.building === 'police').length,
    fireStationCount: state =>
      state.metadata.flat().filter(tile => tile.building === 'fire_station').length,
  },
  actions: {
    updateStability() {
      // 每5秒的变化率，使用配置常量计算
      let changeRate = STABILITY_CONFIG.DEFAULT_STABILITY_CHANGE_RATE

      // 1. 公共服务建筑带来的稳定度提升
      const servicesCount = this.hospitalCount + this.policeStationCount + this.fireStationCount
      changeRate += servicesCount * getAdjustedStabilityRate(STABILITY_CONFIG.SERVICE_STABILITY_PER_SECOND)

      // 2. 就业不足导致的稳定度下降
      const jobDeficit = this.totalJobs - this.maxPopulation
      if (jobDeficit > 0 && this.maxPopulation > 0) {
        const unemploymentRatio = Number((jobDeficit / this.maxPopulation).toFixed(2))
        changeRate -= unemploymentRatio * getAdjustedStabilityRate(STABILITY_CONFIG.UNEMPLOYMENT_STABILITY_PENALTY)
      }

      // 3. 污染导致的稳定度下降
      if (this.pollution > STABILITY_CONFIG.POLLUTION_THRESHOLD) {
        // 污染越高，下降越快，呈指数增长
        const pollutionFactor = (this.pollution / STABILITY_CONFIG.POLLUTION_THRESHOLD) ** 2
        changeRate -= Number((pollutionFactor * getAdjustedStabilityRate(STABILITY_CONFIG.POLLUTION_STABILITY_PENALTY)).toFixed(2))
      }

      // 4. 电力不足导致的稳定度下降
      const powerDeficit = this.power - this.maxPower
      if (powerDeficit > 0 && this.maxPower > 0) {
        const powerDeficitRatio = Number((powerDeficit / this.maxPower).toFixed(2))
        changeRate -= powerDeficitRatio * getAdjustedStabilityRate(STABILITY_CONFIG.POWER_DEFICIT_STABILITY_PENALTY)
      }

      // 确保变化率是有效数值，防止 Infinity 或 NaN
      if (!Number.isFinite(changeRate)) {
        changeRate = 0
      }

      this.stabilityChangeRate = changeRate
    },

    applyStabilityChange() {
      const newStability = this.stability + this.stabilityChangeRate
      this.stability = Math.max(0, Math.min(100, newStability))
    },

    // 移除稳定度定时器相关方法，现在使用统一的5秒计时器
    // startStabilityTimer() 和 stopStabilityTimer() 已移除

    setMode(mode) {
      const fromMode = this.currentMode
      this.currentMode = mode
      // 统计：游戏模式切换
      if (fromMode !== mode) {
        import('@/js/utils/analytics.js').then(({ trackGameModeChanged }) => {
          trackGameModeChanged(fromMode, mode)
        })
      }
    },
    // 新增：设置场景模式
    setScene(scene) {
      this.currentScene = scene
      // 触发场景切换事件，通知 Experience
      eventBus.emit('scene:change', scene)
    },
    setSelectedBuilding(payload) {
      this.selectedBuilding = payload
    },
    setSelectedPosition(position) {
      this.selectedPosition = position
    },
    // 金币
    setCredits(credits) {
      this.credits = credits
    },
    updateCredits(credits) {
      this.credits += credits
    },
    setTerritory(territory) {
      this.territory = territory
    },
    setCityLevel(cityLevel) {
      this.cityLevel = cityLevel
    },
    setCityName(cityName) {
      this.cityName = cityName
    },
    setCitySize(citySize) {
      this.citySize = citySize
    },
    addToast(message, type = 'info') {
      const id = Date.now() + Math.random()
      this.toastQueue.push({ message, type, id })
      // 最多只保留 3 条 toast
      if (this.toastQueue.length > 2) {
        this.toastQueue.shift()
      }
    },
    setLanguage(lang) {
      this.language = lang
    },
    setGameSpeed(speed) {
      const fromSpeed = this.gameSpeed
      this.gameSpeed = Math.max(0.1, Math.min(5.0, speed)) // 限制在0.1-5.0倍速之间
      // 统计：游戏速度调整
      if (fromSpeed !== this.gameSpeed) {
        import('@/js/utils/analytics.js').then(({ trackGameSpeedChanged }) => {
          trackGameSpeedChanged(fromSpeed, this.gameSpeed)
        })
      }
    },
    removeToast(id) {
      this.toastQueue = this.toastQueue.filter(t => t.id !== id)
    },
    clearSelection() {
      this.selectedBuilding = null
      this.selectedPosition = null
    },
    setTile(x, y, patch) {
      // 合并 patch 到指定 tile
      // 对于嵌套对象（如 detail），需要创建新对象以确保响应式更新
      const tile = this.metadata[x][y]
      if (patch.detail && typeof patch.detail === 'object') {
        // 如果更新的是 detail，创建新对象，确保所有属性都被复制
        patch = { 
          ...patch, 
          detail: { 
            ...patch.detail,
            // 显式复制所有属性，确保响应式追踪
            coinOutput: patch.detail.coinOutput,
            powerOutput: patch.detail.powerOutput,
            powerUsage: patch.detail.powerUsage,
            pollution: patch.detail.pollution,
            maxPopulation: patch.detail.maxPopulation,
            population: patch.detail.population,
          } 
        }
      }
      // 使用 Object.assign 更新，但确保是替换而不是合并
      Object.keys(patch).forEach(key => {
        if (key === 'detail' && patch[key]) {
          // detail 对象完全替换
          tile[key] = patch[key]
        } else {
          tile[key] = patch[key]
        }
      })
    },
    updateTile(x, y, patch) {
      // 语义同 setTile，便于扩展
      Object.assign(this.metadata[x][y], patch)
    },
    getTile(x, y) {
      return this.metadata?.[x]?.[y] || null
    },
    setShowMapOverview(val) {
      this.showMapOverview = val
    },
    /**
     * 进入下一天，更新金币和稳定度
     */
    nextDay() {
      // 经济系统更新
      const income = this.dailyIncome
      this.credits += income
      this.addTotalEarnedCredits(income) // 累计获得的金币
      this.gameDay++

      // 稳定度系统更新（每5秒执行一次）
      this.updateStability()
      this.applyStabilityChange()
    },
    resetAll() {
      this.metadata = Array.from({ length: 17 }, _ =>
        Array.from({ length: 17 }, _ => ({
          type: 'grass',
          building: null,
          direction: 0,
        })))
      this.currentMode = 'build'
      this.currentScene = 'CITY'
      this.selectedBuilding = null
      this.selectedPosition = null
      this.toastQueue = []
      this.gameDay = 1
      this.credits = 3000
      this.territory = 16
      this.cityLevel = 1
      this.cityName = '我的城市'
      this.citySize = 16
      this.language = 'zh'
      this.showMapOverview = false
      this.stability = 100
      this.stabilityChangeRate = 0
      this.musicEnabled = false
      this.musicVolume = 0.5
      this.isPlayingMusic = false
      this.currentLevel = 1
      this.unlockedLevels = [1]
      this.totalEarnedCredits = 0
      this.completedQuests = []
      this.questProgress = {}
      this.showQuestPanel = false
      this.showLevelUnlockModal = false
      this.pendingLevelUnlock = null
      this.unlockedAchievements = []
      this.achievementProgress = {}
      this.showAchievementPanel = false
      this.meritPoints = 0
      this.currentTitle = 'village_staff'
      this.selectedTowerType = null
      this.selectedTower = null
      // 重置外城塔防数据
      this.tdGameData = {
        wave: 1,
        baseHealth: 10,
        towers: [],
        isWaveActive: false,
      }
    },

    // 音乐系统相关方法
    toggleMusic() {
      this.musicEnabled = !this.musicEnabled
    },
    enableMusic() {
      this.musicEnabled = true
    },
    disableMusic() {
      this.musicEnabled = false
    },
    setMusicVolume(volume) {
      this.musicVolume = Math.max(0, Math.min(1, volume))
    },
    setMusicPlaying(playing) {
      this.isPlayingMusic = playing
    },

    // 关卡系统相关方法
    setCurrentLevel(level) {
      this.currentLevel = level
    },
    unlockLevel(level) {
      if (!this.unlockedLevels.includes(level)) {
        this.unlockedLevels.push(level)
        this.unlockedLevels.sort((a, b) => a - b)
      }
    },
    isLevelUnlocked(level) {
      return this.unlockedLevels.includes(level)
    },
    setTotalEarnedCredits(amount) {
      this.totalEarnedCredits = amount
    },
    addTotalEarnedCredits(amount) {
      this.totalEarnedCredits += amount
    },

    // 任务系统相关方法
    completeQuest(questId) {
      if (!this.completedQuests.includes(questId)) {
        this.completedQuests.push(questId)
      }
    },
    isQuestCompleted(questId) {
      return this.completedQuests.includes(questId)
    },
    updateQuestProgress(questId, progress) {
      if (!this.questProgress[questId]) {
        this.questProgress[questId] = { progress: 0, target: 0, completed: false }
      }
      Object.assign(this.questProgress[questId], progress)
    },
    setShowQuestPanel(show) {
      this.showQuestPanel = show
    },
    setShowLevelUnlockModal(show) {
      this.showLevelUnlockModal = show
    },
    setPendingLevelUnlock(levelInfo) {
      this.pendingLevelUnlock = levelInfo
    },

    // 成就系统相关方法
    unlockAchievement(achievementId) {
      if (!this.unlockedAchievements.includes(achievementId)) {
        this.unlockedAchievements.push(achievementId)
      }
    },
    isAchievementUnlocked(achievementId) {
      return this.unlockedAchievements.includes(achievementId)
    },
    updateAchievementProgress(achievementId, progress) {
      if (!this.achievementProgress[achievementId]) {
        this.achievementProgress[achievementId] = { progress: 0, target: 0, unlocked: false }
      }
      Object.assign(this.achievementProgress[achievementId], progress)
    },
    setShowAchievementPanel(show) {
      this.showAchievementPanel = show
    },

    // 政绩分和身份系统相关方法
    addMeritPoints(points) {
      this.meritPoints += points
      // 检查是否需要更新身份
      this.updateCurrentTitle()
    },
    updateCurrentTitle() {
      const newTitle = getTitleByMeritPoints(this.meritPoints)
      if (newTitle && newTitle.id !== this.currentTitle) {
        const oldTitle = this.currentTitle
        this.currentTitle = newTitle.id
        // 触发身份升级事件
        if (oldTitle !== 'village_staff') {
          // 不是初始身份，触发升级通知
          eventBus.emit('title:upgraded', {
            oldTitle,
            newTitle: newTitle.id,
            title: newTitle,
          })
        }
      }
    },
    getCurrentTitle() {
      return getTitleByMeritPoints(this.meritPoints)
    },

    // 科技系统相关方法
    getBuildingTechs(x, y) {
      const key = `${x},${y}`
      return this.buildingTechs[key] || []
    },
    setBuildingTechs(x, y, techIds) {
      const key = `${x},${y}`
      this.buildingTechs[key] = techIds
    },
    addBuildingTech(x, y, techId) {
      const key = `${x},${y}`
      if (!this.buildingTechs[key]) {
        this.buildingTechs[key] = []
      }
      if (!this.buildingTechs[key].includes(techId)) {
        this.buildingTechs[key].push(techId)
      }
    },
    setShowTechTreePanel(show) {
      this.showTechTreePanel = show
    },
    setSelectedBuildingForTech(position) {
      this.selectedBuildingForTech = position
    },

    // 塔防系统相关方法
    setSelectedTowerType(towerType) {
      this.selectedTowerType = towerType
    },
    setSelectedTower(tower) {
      this.selectedTower = tower
    },

    // 扩展地图大小（保留原有数据）
    expandMap(newSize) {
      const oldSize = this.citySize
      this.citySize = newSize
      this.territory = newSize

      // 扩展 metadata 数组
      const newMetadata = Array.from({ length: newSize }, (_, x) =>
        Array.from({ length: newSize }, (_, y) => {
          // 如果坐标在旧地图范围内，保留原有数据
          if (x < oldSize && y < oldSize && this.metadata[x] && this.metadata[x][y]) {
            return { ...this.metadata[x][y] }
          }
          // 否则创建新的空地
          return {
            type: 'grass',
            building: null,
            direction: 0,
          }
        })
      )

      this.metadata = newMetadata
    },

    // 重置地图为新关卡（清空所有建筑数据）
    resetMapForLevel(newSize) {
      this.citySize = newSize
      this.territory = newSize

      // 创建全新的空地图，不保留任何建筑数据
      this.metadata = Array.from({ length: newSize }, (_, x) =>
        Array.from({ length: newSize }, (_, y) => ({
          type: 'grass',
          building: null,
          direction: 0,
          level: 0,
          detail: null,
          outputFactor: 1,
        }))
      )

      // 清空选中状态
      this.selectedBuilding = null
      this.selectedPosition = null
      
      // 清空科技系统状态
      this.buildingTechs = {}
      this.showTechTreePanel = false
      this.selectedBuildingForTech = null
      
      // 重置塔防系统状态
      this.selectedTowerType = null
      this.selectedTower = null
    },

    // ===== 外城塔防数据管理 =====
    /**
     * 设置外城游戏数据
     */
    setTDGameData(data) {
      this.tdGameData = {
        ...this.tdGameData,
        ...data,
      }
    },

    /**
     * 重置外城游戏数据
     */
    resetTDGameData() {
      this.tdGameData = {
        wave: 1,
        baseHealth: 10,
        towers: [],
        isWaveActive: false,
      }
    },

    /**
     * 添加防御塔到持久化数据
     */
    addTowerToData(towerData) {
      this.tdGameData.towers.push(towerData)
    },

    /**
     * 从持久化数据中移除防御塔
     */
    removeTowerFromData(tileX, tileY) {
      this.tdGameData.towers = this.tdGameData.towers.filter(
        t => !(t.tileX === tileX && t.tileY === tileY)
      )
    },

    /**
     * 更新防御塔数据
     */
    updateTowerInData(tileX, tileY, updates) {
      const index = this.tdGameData.towers.findIndex(
        t => t.tileX === tileX && t.tileY === tileY
      )
      if (index !== -1) {
        this.tdGameData.towers[index] = {
          ...this.tdGameData.towers[index],
          ...updates,
        }
      }
    },
  },
  persist: true, // 启用持久化
})
