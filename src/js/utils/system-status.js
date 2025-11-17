/**
 * 系统状态计算工具
 * 计算电网、交通、安全、环境四个系统的状态等级
 */

// 系统状态等级定义（5级）
export const SYSTEM_STATUS_LEVELS = {
  1: {
    zh: '优秀',
    en: 'Excellent',
    color: 'text-green-400',
    indicatorClass: 'status-online',
    incomeMultiplier: 1.1, // +10%
  },
  2: {
    zh: '良好',
    en: 'Good',
    color: 'text-green-500',
    indicatorClass: 'status-online',
    incomeMultiplier: 1.0, // 不变
  },
  3: {
    zh: '适中',
    en: 'Moderate',
    color: 'text-yellow-500',
    indicatorClass: 'status-warning',
    incomeMultiplier: 0.9, // -10%
  },
  4: {
    zh: '受限',
    en: 'Limited',
    color: 'text-orange-500',
    indicatorClass: 'status-warning',
    incomeMultiplier: 0.75, // -25%
  },
  5: {
    zh: '严重',
    en: 'Critical',
    color: 'text-red-500',
    indicatorClass: 'status-error',
    incomeMultiplier: 0.5, // -50%
  },
}

/**
 * 计算电力系统状态等级
 * @param {number} powerUsage - 总耗电量
 * @param {number} powerOutput - 总发电量
 * @returns {number} 状态等级 (1-5)
 */
export function calculatePowerStatus(powerUsage, powerOutput) {
  if (powerOutput === 0) {
    return 5 // 没有发电，严重
  }

  const ratio = powerUsage / powerOutput

  if (ratio <= 0.5) {
    return 1 // 优秀：耗电量 <= 50% 发电量
  } else if (ratio <= 0.7) {
    return 2 // 良好：耗电量 <= 70% 发电量
  } else if (ratio <= 0.9) {
    return 3 // 适中：耗电量 <= 90% 发电量
  } else if (ratio <= 1.0) {
    return 4 // 受限：耗电量 <= 100% 发电量
  } else {
    return 5 // 严重：耗电量 > 发电量
  }
}

/**
 * 计算安全系统状态等级（基于稳定度）
 * @param {number} stability - 城市稳定度 (0-100)
 * @returns {number} 状态等级 (1-5)
 */
export function calculateSecurityStatus(stability) {
  if (stability >= 90) {
    return 1 // 优秀：稳定度 >= 90
  } else if (stability >= 75) {
    return 2 // 良好：稳定度 >= 75
  } else if (stability >= 60) {
    return 3 // 适中：稳定度 >= 60
  } else if (stability >= 40) {
    return 4 // 受限：稳定度 >= 40
  } else {
    return 5 // 严重：稳定度 < 40
  }
}

/**
 * 计算环境系统状态等级（基于污染比例）
 * @param {number} pollution - 总污染值
 * @param {number} mapSize - 地图大小
 * @returns {number} 状态等级 (1-5)
 */
export function calculateEnvironmentStatus(pollution, mapSize) {
  const totalTiles = mapSize * mapSize
  // 假设每格平均污染阈值：总格子数 * 2（经验值）
  const pollutionThreshold = totalTiles * 2

  const pollutionRatio = pollution / pollutionThreshold

  if (pollutionRatio <= 0.2) {
    return 1 // 优秀：污染 <= 20% 阈值
  } else if (pollutionRatio <= 0.4) {
    return 2 // 良好：污染 <= 40% 阈值
  } else if (pollutionRatio <= 0.6) {
    return 3 // 适中：污染 <= 60% 阈值
  } else if (pollutionRatio <= 0.8) {
    return 4 // 受限：污染 <= 80% 阈值
  } else {
    return 5 // 严重：污染 > 80% 阈值
  }
}

/**
 * 使用BFS查找道路连通区域
 * @param {Array<Array>} metadata - 地图元数据
 * @param {number} mapSize - 地图大小
 * @param {number} startX - 起始X坐标
 * @param {number} startY - 起始Y坐标
 * @param {Set} visited - 已访问的坐标集合
 * @returns {number} 连通区域的道路数量
 */
function findConnectedRoads(metadata, mapSize, startX, startY, visited) {
  const queue = [[startX, startY]]
  let count = 0

  while (queue.length > 0) {
    const [x, y] = queue.shift()
    const key = `${x},${y}`

    if (visited.has(key)) {
      continue
    }

    const tile = metadata[x]?.[y]
    if (!tile || tile.building !== 'road') {
      continue
    }

    visited.add(key)
    count++

    // 检查四个方向的相邻格子
    const directions = [
      [0, 1], // 上
      [0, -1], // 下
      [1, 0], // 右
      [-1, 0], // 左
    ]

    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy

      if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
        const neighborKey = `${nx},${ny}`
        if (!visited.has(neighborKey)) {
          queue.push([nx, ny])
        }
      }
    }
  }

  return count
}

/**
 * 计算交通系统状态等级（基于道路连通性）
 * @param {Array<Array>} metadata - 地图元数据
 * @param {number} mapSize - 地图大小
 * @returns {number} 状态等级 (1-5)
 */
export function calculateTransportStatus(metadata, mapSize) {
  // 统计所有道路
  const roadPositions = []
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      const tile = metadata[x]?.[y]
      if (tile && tile.building === 'road') {
        roadPositions.push([x, y])
      }
    }
  }

  const totalRoads = roadPositions.length

  if (totalRoads === 0) {
    return 5 // 没有道路，严重
  }

  // 使用BFS找到最大的连通区域
  const visited = new Set()
  let maxConnectedRoads = 0

  for (const [x, y] of roadPositions) {
    const key = `${x},${y}`
    if (!visited.has(key)) {
      const connectedCount = findConnectedRoads(metadata, mapSize, x, y, visited)
      maxConnectedRoads = Math.max(maxConnectedRoads, connectedCount)
    }
  }

  // 计算连通比例：最长连通道路数 / 总道路数
  const connectivityRatio = maxConnectedRoads / totalRoads

  if (connectivityRatio >= 0.9) {
    return 1 // 优秀：连通度 >= 90%
  } else if (connectivityRatio >= 0.7) {
    return 2 // 良好：连通度 >= 70%
  } else if (connectivityRatio >= 0.5) {
    return 3 // 适中：连通度 >= 50%
  } else if (connectivityRatio >= 0.3) {
    return 4 // 受限：连通度 >= 30%
  } else {
    return 5 // 严重：连通度 < 30%
  }
}

/**
 * 计算所有系统状态
 * @param {object} gameState - 游戏状态对象
 * @returns {object} 系统状态 { power, transport, security, environment }
 */
export function calculateAllSystemStatus(gameState) {
  const { metadata, power, maxPower, stability, pollution, citySize } = gameState

  return {
    power: calculatePowerStatus(power, maxPower),
    transport: calculateTransportStatus(metadata, citySize),
    security: calculateSecurityStatus(stability),
    environment: calculateEnvironmentStatus(pollution, citySize),
  }
}

/**
 * 计算系统状态对每日收入的影响倍数
 * @param {object} systemStatus - 系统状态对象 { power, transport, security, environment }
 * @returns {number} 收入倍数（所有系统状态的平均影响）
 */
export function calculateIncomeMultiplier(systemStatus) {
  const { power, transport, security, environment } = systemStatus

  const powerMultiplier = SYSTEM_STATUS_LEVELS[power].incomeMultiplier
  const transportMultiplier = SYSTEM_STATUS_LEVELS[transport].incomeMultiplier
  const securityMultiplier = SYSTEM_STATUS_LEVELS[security].incomeMultiplier
  const environmentMultiplier = SYSTEM_STATUS_LEVELS[environment].incomeMultiplier

  // 计算平均值
  const averageMultiplier = (powerMultiplier + transportMultiplier + securityMultiplier + environmentMultiplier) / 4

  return averageMultiplier
}

