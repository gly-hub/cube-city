import * as THREE from 'three'
import Experience from '../experience.js'
import TDTile from './td-tile.js'
import { getTDMapConfig } from './td-map-config.js'

export default class TDCity {
  constructor(level = 1) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // 获取地图配置
    this.config = getTDMapConfig(level)
    this.mapData = this.config.mapData
    this.buildings = this.config.buildings || []

    // 外城地皮专用 Group
    // 注意：不直接添加到 scene，而是由 TowerDefenseWorld 管理
    this.root = new THREE.Group()
    // 外城地图默认可见，由 TowerDefenseWorld 的 root 控制总可见性
    this.root.visible = true

    // 存储所有 tile
    this.meshes = []
    this.size = this.config.size // 从配置读取地图大小

    // 初始化地皮
    this.initTiles()
  }

  initTiles() {
    this.meshes = []
    this.root.clear()

    // 创建网格，使用配置的 mapData
    for (let x = 0; x < this.size; x++) {
      const row = []
      for (let y = 0; y < this.size; y++) {
        const cellType = this.mapData[x]?.[y] || 0
        let tileType = 'base'
        if (cellType === 1) tileType = 'road'
        if (cellType === 2) tileType = 'start'
        if (cellType === 3) tileType = 'end'
        if (cellType === 4) tileType = 'building' // 装饰建筑

        const tile = new TDTile(x, y, { type: tileType })
        row.push(tile)
        this.root.add(tile)
      }
      this.meshes.push(row)
    }
    
    // 放置装饰建筑
    this.placeBuildings()

    // 居中显示（类似内城的处理）
    // 内城使用 SIZE，外城使用 10x10，每个格子大小为 1
    const offset = -(this.size - 1) / 2
    this.root.position.set(offset, 0, offset)
    
    // 根据 MAP_DATA 自动计算路径点（从起点到终点）
    // 注意：必须在 tile 创建完成后计算，因为需要获取 tile 的世界位置
    this.pathPoints = this.calculatePathPoints(offset)
    console.log('外城路径点计算完成，数量:', this.pathPoints.length, '路径点:', this.pathPoints.map(p => `(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`).join(' -> '))
    
    // === 刷新所有道路视图（让道路模型根据相邻道路自动选择正确的样式） ===
    // 需要等待资源加载完成后再刷新
    const refreshAllRoads = () => {
      if (this.resources.items.road) {
        for (let x = 0; x < this.size; x++) {
          for (let y = 0; y < this.size; y++) {
            const tile = this.meshes[x][y]
            if (tile && (tile.type === 'road' || tile.type === 'start' || tile.type === 'end')) {
              tile.refreshRoadView(this)
            }
          }
        }
        console.log('外城道路视图刷新完成')
      } else {
        // 如果资源未加载，等待一下再试
        setTimeout(refreshAllRoads, 100)
      }
    }
    
    // 如果资源已加载，立即刷新；否则等待
    if (this.resources.items.road) {
      refreshAllRoads()
    } else {
      this.resources.on('ready', () => {
        refreshAllRoads()
      })
    }
  }

  getTile(x, y) {
    return this.meshes[x]?.[y]
  }

  /**
   * 放置装饰建筑
   * 注意：建筑应该放在空地（type === 'base'）上，而不是标记为 4 的位置
   */
  placeBuildings() {
    for (const buildingConfig of this.buildings) {
      const { x, y, buildingType, level = 1, direction = 0 } = buildingConfig
      const tile = this.getTile(x, y)
      // 确保 tile 存在且是空地（可以放置建筑）
      if (tile && tile.type === 'base') {
        // 检查 mapData 确保不是路径
        const cellType = this.mapData[x]?.[y]
        if (cellType === 0 || cellType === 4) {
          tile.setBuilding(buildingType, level, direction)
        } else {
          console.warn(`无法在位置 (${x}, ${y}) 放置建筑，该位置是路径或已占用`)
        }
      }
    }
  }

  /**
   * 根据 MAP_DATA 自动计算从起点到终点的路径点
   * 使用 A* 或简单的路径查找算法
   */
  calculatePathPoints(offset) {
    // 找到起点和终点
    let startX = -1, startY = -1
    let endX = -1, endY = -1
    
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (this.mapData[x]?.[y] === 2) {
          startX = x
          startY = y
        }
        if (this.mapData[x]?.[y] === 3) {
          endX = x
          endY = y
        }
      }
    }

    if (startX === -1 || endX === -1) {
      console.warn('未找到起点或终点')
      return []
    }

    // 使用简单的路径查找算法（BFS）
    const path = this.findPath(startX, startY, endX, endY)
    
    // 转换为世界坐标
    // 注意：TDTile(x, y) 中，x 对应世界坐标的 x，y 对应世界坐标的 z
    // 但在 MAP_DATA[x][y] 中，x 是行（对应 z），y 是列（对应 x）
    // 所以路径点 [x, y] 需要转换为：worldX = y, worldZ = x
    return path.map(([x, y]) => {
      // 获取对应 tile 的世界位置，确保路径点在 tile 中心
      const tile = this.getTile(x, y)
      if (tile) {
        const worldPos = new THREE.Vector3()
        tile.getWorldPosition(worldPos)
        return new THREE.Vector3(worldPos.x, 0.5, worldPos.z)
      } else {
        // 如果 tile 不存在，使用计算位置
        return new THREE.Vector3(
          y + offset, // y 对应世界坐标的 x
          0.5,
          x + offset  // x 对应世界坐标的 z
        )
      }
    })
  }

  /**
   * 使用随机 DFS 查找从起点到终点的路径（支持多条路径）
   * @returns {Array} 路径坐标数组
   */
  findRandomPath(startX, startY, endX, endY) {
    const path = []
    const visited = new Set()
    
    // 随机打乱方向数组，每次调用都不同
    const getRandomDirections = () => {
      const dirs = [
        [0, 1],   // 右
        [0, -1],  // 左
        [1, 0],   // 下
        [-1, 0],  // 上
      ]
      // Fisher-Yates 洗牌算法，保证真正的随机
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]]
      }
      return dirs
    }
    
    // 递归 DFS，每次在分叉时随机选择
    const dfs = (x, y, currentPath) => {
      // 到达终点
      if (x === endX && y === endY) {
        path.push(...currentPath, [x, y])
        return true
      }
      
      const key = `${x},${y}`
      if (visited.has(key)) return false
      visited.add(key)
      currentPath.push([x, y])
      
      // 随机打乱探索方向
      const directions = getRandomDirections()
      
      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy
        
        // 检查边界
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) continue
        
        const cellType = this.mapData[nx]?.[ny]
        // 可通行：路径(1)、起点(2)、终点(3)
        if (cellType === 1 || cellType === 2 || cellType === 3) {
          if (dfs(nx, ny, [...currentPath])) {
            return true
          }
        }
      }
      
      // 回溯
      visited.delete(key)
      return false
    }
    
    // 开始搜索
    if (dfs(startX, startY, [])) {
      return path
    }
    
    console.warn('未找到从起点到终点的路径')
    return []
  }

  /**
   * 使用 BFS 查找从起点到终点的路径（用于初始化和调试）
   * @param {boolean} randomize - 是否在分叉时随机选择路径
   */
  findPath(startX, startY, endX, endY, randomize = false) {
    const queue = [[startX, startY]]
    const visited = new Set()
    const parent = new Map()
    visited.add(`${startX},${startY}`)

    const directions = [
      [0, 1],   // 右
      [0, -1],  // 左
      [1, 0],   // 下
      [-1, 0],  // 上
    ]

    while (queue.length > 0) {
      const [x, y] = queue.shift()

      if (x === endX && y === endY) {
        // 找到终点，回溯路径
        const path = []
        let current = [x, y]
        // 先添加终点
        path.unshift(current)
        // 回溯到起点
        while (current) {
          const parentKey = `${current[0]},${current[1]}`
          const parentPos = parent.get(parentKey)
          if (parentPos) {
            path.unshift(parentPos)
            current = parentPos
          } else {
            break
          }
        }
        return path
      }

      // 如果启用随机化，每次都打乱邻居探索顺序
      const exploreDirections = randomize ? 
        [...directions].sort(() => Math.random() - 0.5) : 
        directions

      // 检查四个方向
      for (const [dx, dy] of exploreDirections) {
        const nx = x + dx
        const ny = y + dy

        // 检查边界
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) continue

        const key = `${nx},${ny}`
        if (visited.has(key)) continue

        // 检查是否是路径、起点或终点
        const cellType = this.mapData[nx]?.[ny]
        if (cellType === 1 || cellType === 2 || cellType === 3) {
          visited.add(key)
          parent.set(key, [x, y])
          queue.push([nx, ny])
        }
      }
    }

    console.warn('未找到从起点到终点的路径')
    return []
  }

  /**
   * 为单个怪物计算随机路径（在分叉时随机选择）
   * @returns {Array<THREE.Vector3>} 世界坐标的路径点数组
   */
  calculateRandomPathForEnemy() {
    // 找到起点和终点
    let startX = -1, startY = -1
    let endX = -1, endY = -1
    
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (this.mapData[x]?.[y] === 2) {
          startX = x
          startY = y
        }
        if (this.mapData[x]?.[y] === 3) {
          endX = x
          endY = y
        }
      }
    }

    if (startX === -1 || endX === -1) {
      console.warn('未找到起点或终点')
      return []
    }

    // 使用随机 DFS 查找路径（每次调用都会找到不同的路径）
    const path = this.findRandomPath(startX, startY, endX, endY)
    
    if (path.length === 0) {
      console.warn('随机路径查找失败，使用 BFS 备用方案')
      // 如果 DFS 失败，使用 BFS 作为备用
      const bfsPath = this.findPath(startX, startY, endX, endY, false)
      if (bfsPath.length > 0) {
        return this.convertPathToWorldCoords(bfsPath)
      }
      return []
    }
    
    // 转换为世界坐标
    return this.convertPathToWorldCoords(path)
  }

  /**
   * 将路径坐标转换为世界坐标
   */
  convertPathToWorldCoords(path) {
    const offset = -(this.size - 1) / 2
    
    return path.map(([x, y]) => {
      const tile = this.getTile(x, y)
      if (tile) {
        const worldPos = new THREE.Vector3()
        tile.getWorldPosition(worldPos)
        return new THREE.Vector3(worldPos.x, 0.5, worldPos.z)
      } else {
        return new THREE.Vector3(
          y + offset,
          0.5,
          x + offset
        )
      }
    })
  }

  update() {
    for (const row of this.meshes) {
      for (const tile of row) {
        tile.update()
      }
    }
  }

  show() {
    this.root.visible = true
  }

  hide() {
    this.root.visible = false
  }
}

