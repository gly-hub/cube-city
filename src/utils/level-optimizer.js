/**
 * 关卡最优值计算工具
 * 根据地图大小、建筑数据和相互作用，计算最优布局的理论最大值
 */

import { BUILDING_DATA } from '@/constants/constants.js'
import { BUILDING_INTERACTIONS } from '@/constants/building-interactions.js'

/**
 * 计算指定地图大小的最优布局理论值
 * @param {number} mapSize - 地图大小（如16表示16x16）
 * @returns {object} 最优值 { population, dailyIncome, stability, buildingCount, maxPower, pollution }
 */
export function calculateOptimalLayout(mapSize) {
  const totalTiles = mapSize * mapSize
  
  // 道路布局分析：
  // 1. 最优道路布局是网格状，每3-4格一条道路
  // 2. 对于N×N地图，道路占用约为 15-20%（网格布局）
  // 3. 道路本身也占用格子，但可以共享（交叉口只算一次）
  // 4. 实际计算：道路占用约 totalTiles * 0.18（18%）
  
  const roadTiles = Math.floor(totalTiles * 0.18) // 道路占用18%
  const availableTiles = totalTiles - roadTiles // 可用于建筑的格子
  
  // 注意：风能发电和公园不需要道路，可以放在任意位置（包括道路旁边）
  // 但为了计算简化，我们假设它们也占用可用格子
  
  // 最优布局策略分析：
  // 1. 最大化收入：优先使用高产出建筑（工厂、化学工厂）
  // 2. 最大化人口：使用高级住宅，配合公园加成
  // 3. 平衡稳定度：控制污染，使用公园和垃圾站
  // 4. 平衡电力：使用发电建筑
  
  // 建筑效率分析（产出/成本比）：
  // - 工厂：70/500 = 0.14 (最高)
  // - 化学工厂Lv3：350/2000 = 0.175 (最高，但需要升级)
  // - 商店Lv3：140/1600 = 0.0875
  // - 办公室Lv3：180/2000 = 0.09
  
  // 人口效率分析（人口/成本比）：
  // - 豪华住宅：120/1200 = 0.1 (最高)
  // - 高级住宅：72/600 = 0.12 (更高)
  // - 豪华民宅：156/1600 = 0.0975
  
  // 最优布局假设（考虑相互作用）：
  // 1. 使用"棋盘"布局：公园和建筑交替，最大化相互作用
  // 2. 工业区：工厂+化学工厂+垃圾站+公园（最大化产出和减污）
  // 3. 住宅区：高级住宅+公园（最大化人口）
  // 4. 商业区：商店+办公室+公园（平衡产出）
  
  // 简化计算：假设最优布局下
  // - 30% 工业建筑（工厂、化学工厂）
  // - 25% 住宅建筑（高级住宅）
  // - 20% 商业建筑（商店、办公室）
  // - 15% 环境设施（公园、垃圾站、发电）
  // - 10% 基础设施（医院、警察局等）
  
  const industrialRatio = 0.30
  const residentialRatio = 0.25
  const commercialRatio = 0.20
  const environmentRatio = 0.15
  const infrastructureRatio = 0.10
  
  const industrialTiles = Math.floor(availableTiles * industrialRatio)
  const residentialTiles = Math.floor(availableTiles * residentialRatio)
  const commercialTiles = Math.floor(availableTiles * commercialRatio)
  const environmentTiles = Math.floor(availableTiles * environmentRatio)
  const infrastructureTiles = Math.floor(availableTiles * infrastructureRatio)
  
  // ========== 计算每日收入 ==========
  let dailyIncome = 0
  
  // 工业建筑（假设50%工厂，50%化学工厂Lv3，考虑相互作用加成）
  const factoryCount = Math.floor(industrialTiles * 0.5)
  const chemistryFactoryCount = Math.floor(industrialTiles * 0.5)
  
  // 工厂：基础70，假设平均有1个公园相邻（+0%收入，但减污染），1个水塔相邻（+25%）
  // 简化：假设30%的工厂有水塔加成
  const factoryIncome = factoryCount * 70 * (1 + 0.25 * 0.3) // 约77.5/个
  
  // 化学工厂Lv3：基础350，假设有工厂集群（+20%），垃圾站/公园（+15%）
  const chemistryIncome = chemistryFactoryCount * 350 * (1 + 0.20 + 0.15) // 约472.5/个
  
  dailyIncome += factoryIncome + chemistryIncome
  
  // 商业建筑（假设60%商店Lv3，40%办公室Lv3，考虑公园加成）
  const shopCount = Math.floor(commercialTiles * 0.6)
  const officeCount = Math.floor(commercialTiles * 0.4)
  
  // 商店Lv3：基础140，假设平均有2个公园相邻（+20%）
  const shopIncome = shopCount * 140 * (1 + 0.20) // 约168/个
  
  // 办公室Lv3：基础180，假设平均有2个公园相邻（+24%）
  const officeIncome = officeCount * 180 * (1 + 0.24) // 约223.2/个
  
  dailyIncome += shopIncome + officeIncome
  
  // ========== 计算人口 ==========
  let maxPopulation = 0
  
  // 住宅建筑（假设70%高级住宅Lv2，30%豪华住宅Lv3，考虑公园加成）
  const house2Count = Math.floor(residentialTiles * 0.7)
  const house3Count = Math.floor(residentialTiles * 0.3)
  
  // 高级住宅Lv2：基础72，假设平均有2个公园相邻（+20%）
  const house2Pop = house2Count * 72 * (1 + 0.20) // 约86.4/个
  
  // 豪华住宅Lv3：基础120，假设平均有2个公园相邻（+20%）
  const house3Pop = house3Count * 120 * (1 + 0.20) // 约144/个
  
  maxPopulation = house2Pop + house3Pop
  
  // 实际人口 = min(maxPopulation * 1.5, totalJobs)
  // 需要计算总就业岗位
  const totalJobs = factoryCount * 20 + chemistryFactoryCount * 80 + shopCount * 40 + officeCount * 60
  const actualPopulation = Math.min(maxPopulation * 1.5, totalJobs)
  
  // ========== 计算建筑数量 ==========
  // 建筑数量 = 所有建筑 + 道路
  const buildingCount = industrialTiles + residentialTiles + commercialTiles + environmentTiles + infrastructureTiles + roadTiles
  
  // ========== 计算稳定度 ==========
  // 稳定度主要受污染和人口利用率影响
  // 假设最优布局下：
  // - 污染被公园和垃圾站有效控制
  // - 人口利用率接近1.0（平衡）
  // - 稳定度可以达到85-90
  
  // ========== 计算发电量 ==========
  let maxPower = 0
  
  // 假设环境设施中：40%发电（太阳能、风力、核电站），60%其他（公园、垃圾站）
  const powerTiles = Math.floor(environmentTiles * 0.4)
  
  // 假设：50%风力发电，30%太阳能，20%核电站
  const windCount = Math.floor(powerTiles * 0.5)
  const solarCount = Math.floor(powerTiles * 0.3)
  const nukeCount = Math.floor(powerTiles * 0.2)
  
  // 风力发电：基础70，假设平均有1个公园相邻（+8%）
  const windPower = windCount * 70 * (1 + 0.08) // 约75.6/个
  
  // 太阳能：基础50，假设平均有1个住宅相邻（+5%）
  const solarPower = solarCount * 50 * (1 + 0.05) // 约52.5/个
  
  // 核电站：基础300
  const nukePower = nukeCount * 300
  
  maxPower = windPower + solarPower + nukePower
  
  // ========== 计算污染 ==========
  let pollution = 0
  
  // 工厂污染：基础22，假设平均有1个公园相邻（-25%）
  const factoryPollution = factoryCount * 22 * (1 - 0.25) // 约16.5/个
  
  // 化学工厂Lv3污染：基础90，假设有垃圾站（-30%），公园（-25%）
  const chemistryPollution = chemistryFactoryCount * 90 * (1 - 0.30 - 0.25) // 约40.5/个
  
  // 商业建筑污染（较小）
  const commercialPollution = shopCount * 12 + officeCount * 18
  
  // 住宅污染（较小）
  const residentialPollution = house2Count * 3 + house3Count * 5
  
  // 公园减污（假设平均每个公园影响4个建筑）
  const parkCount = Math.floor(environmentTiles * 0.6)
  const parkReduction = parkCount * 40 * 4 // 城市公园Lv3减污-40，影响4个建筑
  
  pollution = factoryPollution + chemistryPollution + commercialPollution + residentialPollution - parkReduction
  pollution = Math.max(0, pollution) // 污染不能为负
  
  // ========== 计算稳定度 ==========
  // 稳定度计算复杂，简化假设：
  // - 污染低（<50）：+10稳定度
  // - 人口利用率接近1.0：+5稳定度
  // - 基础稳定度：75
  // 最优布局下可以达到：85-90
  
  const optimalStability = Math.min(100, 75 + (pollution < 50 ? 10 : 0) + 5)
  
  return {
    population: Math.floor(actualPopulation),
    dailyIncome: Math.floor(dailyIncome),
    stability: optimalStability,
    buildingCount,
    maxPower: Math.floor(maxPower),
    pollution: Math.floor(pollution),
  }
}

/**
 * 计算所有关卡的最优值
 * @returns {object} 各关卡的最优值
 */
export function calculateAllLevelsOptimal() {
  const levels = [16, 24, 32, 40, 48]
  const results = {}
  
  levels.forEach((size, index) => {
    const level = index + 1
    results[level] = {
      mapSize: size,
      optimal: calculateOptimalLayout(size),
    }
  })
  
  return results
}

/**
 * 根据最优值和难度比例计算解锁条件
 * @param {number} optimalValue - 最优值
 * @param {number} difficultyRatio - 难度比例（如0.7表示70%）
 * @returns {number} 解锁条件值
 */
export function calculateUnlockCondition(optimalValue, difficultyRatio) {
  return Math.floor(optimalValue * difficultyRatio)
}

/**
 * 生成关卡配置建议
 * @param {number} difficultyRatio - 难度比例（默认0.7，即70%）
 * @returns {object} 关卡配置建议
 */
export function generateLevelConfigs(difficultyRatio = 0.7) {
  const optimalValues = calculateAllLevelsOptimal()
  const configs = {}
  
  Object.keys(optimalValues).forEach(level => {
    const { mapSize, optimal } = optimalValues[level]
    configs[level] = {
      mapSize,
      optimal,
      unlockConditions: {
        minPopulation: calculateUnlockCondition(optimal.population, difficultyRatio),
        minDailyIncome: calculateUnlockCondition(optimal.dailyIncome, difficultyRatio),
        minStability: Math.max(60, Math.floor(optimal.stability * difficultyRatio)),
        minBuildingCount: calculateUnlockCondition(optimal.buildingCount, difficultyRatio),
      },
    }
  })
  
  return configs
}

