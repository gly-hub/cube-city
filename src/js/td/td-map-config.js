/**
 * 外城塔防地图配置
 * 支持动态配置地图大小、路径、建筑等
 */

// 地图配置
export const TD_MAP_CONFIG = {
  // 地图大小
  size: 16,

  // 地图数据：0=空地(可造塔)，1=路径，2=起点，3=终点，4=建筑(装饰)
  // 注意：x 是行（对应 z 轴），y 是列（对应 x 轴）
  // 设计了一个更长的 S 形路径，从左上角到右下角
  mapData: [
    [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  ],

  // 建筑配置：在地图的某些位置放置装饰建筑
  // 格式：{ x, y, buildingType, level, direction }
  // 注意：x 和 y 是地图坐标（行和列），不是世界坐标
  buildings: [
    // 在路径周围放置一些装饰建筑，增加场景丰富度
    // 第一区域（左上）
    { x: 1, y: 1, buildingType: 'house', level: 1, direction: 0 },
    { x: 2, y: 1, buildingType: 'house', level: 1, direction: 90 },
    { x: 1, y: 5, buildingType: 'shop', level: 1, direction: 0 },
    { x: 2, y: 6, buildingType: 'shop', level: 1, direction: 180 },

    // 第二区域（中上）
    { x: 4, y: 1, buildingType: 'office', level: 1, direction: 0 },
    { x: 5, y: 1, buildingType: 'house', level: 1, direction: 90 },
    { x: 4, y: 6, buildingType: 'shop', level: 1, direction: 0 },
    { x: 5, y: 7, buildingType: 'house', level: 1, direction: 180 },

    // 第三区域（中下）
    { x: 7, y: 1, buildingType: 'office', level: 1, direction: 0 },
    { x: 8, y: 1, buildingType: 'house', level: 1, direction: 90 },
    { x: 7, y: 11, buildingType: 'shop', level: 1, direction: 0 },
    { x: 8, y: 12, buildingType: 'house', level: 1, direction: 180 },

    // 第四区域（右下）
    { x: 10, y: 1, buildingType: 'office', level: 1, direction: 0 },
    { x: 11, y: 1, buildingType: 'house', level: 1, direction: 90 },
    { x: 10, y: 11, buildingType: 'shop', level: 1, direction: 0 },
    { x: 11, y: 12, buildingType: 'house', level: 1, direction: 180 },
    { x: 12, y: 11, buildingType: 'office', level: 1, direction: 0 },
    { x: 13, y: 12, buildingType: 'house', level: 1, direction: 90 },
  ],
}

/**
 * 获取地图配置（支持关卡系统扩展）
 * @param {number} level - 关卡等级，默认为 1
 * @returns {object} 地图配置对象
 */
export function getTDMapConfig(level = 1) {
  // 可以根据关卡返回不同的配置
  // 例如：level 1 = 16x16, level 2 = 20x20, level 3 = 24x24
  const baseConfig = { ...TD_MAP_CONFIG }

  // 未来可以根据关卡调整地图大小和路径
  if (level === 1) {
    return baseConfig
  }
  if (level === 2) {
    // 示例：更大的地图
    return {
      ...baseConfig,
      size: 20,
      // mapData 需要相应扩展
    }
  }

  return baseConfig
}
