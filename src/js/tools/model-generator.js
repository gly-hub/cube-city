/**
 * 3D 模型生成工具
 * 使用 Three.js 生成简单的建筑模型并导出为 GLB 格式
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行：window.generateModel('house', 'level1')
 * 2. 或者创建一个简单的测试页面来使用这个工具
 */

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

/**
 * 生成简单的建筑模型
 * @param {string} buildingType - 建筑类型 (house, shop, office, factory 等)
 * @param {string} level - 等级 (level1, level2, level3)
 * @param {object} options - 可选参数
 * @returns {Promise<Blob>} GLB 文件的 Blob 对象
 */
export async function generateBuildingModel(buildingType, level = 'level1', options = {}) {
  const scene = new THREE.Scene()
  const group = new THREE.Group()

  // 根据建筑类型和等级生成不同的模型
  const model = createBuildingGeometry(buildingType, level, options)
  group.add(model)
  scene.add(group)

  // 导出为 GLB
  const exporter = new GLTFExporter()
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        // 将结果转换为 Blob
        const blob = new Blob([result], { type: 'application/octet-stream' })
        resolve(blob)
      },
      (error) => {
        console.error('导出模型失败:', error)
        reject(error)
      },
      {
        binary: true, // 导出为 GLB (二进制格式)
        trs: false, // 不使用 TRS 属性，使用矩阵
        onlyVisible: true, // 只导出可见对象
        truncateDrawRange: true, // 截断绘制范围
        embedImages: true, // 嵌入图像
        animations: [], // 动画
        includeCustomExtensions: false, // 不包含自定义扩展
      }
    )
  })
}

/**
 * 创建建筑几何体
 * @param {string} buildingType - 建筑类型
 * @param {string} level - 等级
 * @param {object} options - 选项
 * @returns {THREE.Group} 建筑模型组
 */
function createBuildingGeometry(buildingType, level, options = {}) {
  const group = new THREE.Group()
  
  // 基础尺寸
  const baseSize = 1
  const heightMultiplier = getHeightMultiplier(buildingType, level)
  const height = baseSize * heightMultiplier

  // 创建主建筑体
  const geometry = new THREE.BoxGeometry(baseSize, height, baseSize)
  
  // 根据建筑类型选择材质颜色
  const color = getBuildingColor(buildingType, level)
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.7,
  })

  const mainBody = new THREE.Mesh(geometry, material)
  mainBody.position.y = height / 2
  mainBody.castShadow = true
  mainBody.receiveShadow = true
  group.add(mainBody)

  // 根据建筑类型添加特殊结构
  switch (buildingType) {
    case 'house':
    case 'house2':
      addHouseDetails(group, level, height)
      break
    case 'shop':
      addShopDetails(group, level, height)
      break
    case 'office':
      addOfficeDetails(group, level, height)
      break
    case 'factory':
      addFactoryDetails(group, level, height)
      break
    case 'hospital':
      addHospitalDetails(group, level, height)
      break
    case 'police':
      addPoliceDetails(group, level, height)
      break
    case 'fire_station':
      addFireStationDetails(group, level, height)
      break
    case 'park':
      addParkDetails(group, level, height)
      break
    default:
      // 默认建筑
      break
  }

  return group
}

/**
 * 获取建筑高度倍数
 */
function getHeightMultiplier(buildingType, level) {
  const levelNum = parseInt(level.replace('level', '')) || 1
  const baseHeights = {
    house: 1.2,
    house2: 1.2,
    shop: 1.5,
    office: 2.0,
    factory: 1.8,
    hospital: 2.5,
    police: 2.0,
    fire_station: 2.2,
    park: 0.3,
  }
  const baseHeight = baseHeights[buildingType] || 1.5
  return baseHeight + (levelNum - 1) * 0.3
}

/**
 * 获取建筑颜色
 */
function getBuildingColor(buildingType, level) {
  const levelNum = parseInt(level.replace('level', '')) || 1
  const colorMap = {
    house: ['#E8D5B7', '#D4C4A8', '#C0B399'], // 米色系
    house2: ['#B8D4E3', '#A8C4D3', '#98B4C3'], // 蓝色系
    shop: ['#FFD700', '#FFC125', '#FFB347'], // 金色系
    office: ['#C0C0C0', '#A8A8A8', '#909090'], // 灰色系
    factory: ['#8B4513', '#A0522D', '#CD853F'], // 棕色系
    hospital: ['#FFFFFF', '#F0F0F0', '#E0E0E0'], // 白色系
    police: ['#4169E1', '#1E90FF', '#00BFFF'], // 蓝色系
    fire_station: ['#FF4500', '#FF6347', '#FF7F50'], // 红色系
    park: ['#228B22', '#32CD32', '#3CB371'], // 绿色系
  }
  const colors = colorMap[buildingType] || ['#CCCCCC']
  return colors[Math.min(levelNum - 1, colors.length - 1)]
}

/**
 * 添加房屋细节
 */
function addHouseDetails(group, level, height) {
  // 屋顶
  const roofGeometry = new THREE.ConeGeometry(0.7, 0.3, 4)
  const roofMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' })
  const roof = new THREE.Mesh(roofGeometry, roofMaterial)
  roof.rotation.y = Math.PI / 4
  roof.position.y = height + 0.15
  group.add(roof)

  // 窗户
  const windowGeometry = new THREE.PlaneGeometry(0.2, 0.2)
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: '#87CEEB',
    emissive: '#4A90E2',
    emissiveIntensity: 0.3,
  })
  
  const window1 = new THREE.Mesh(windowGeometry, windowMaterial)
  window1.position.set(0.4, height * 0.6, 0.01)
  group.add(window1)
  
  const window2 = new THREE.Mesh(windowGeometry, windowMaterial)
  window2.position.set(-0.4, height * 0.6, 0.01)
  group.add(window2)
}

/**
 * 添加商店细节
 */
function addShopDetails(group, level, height) {
  // 招牌
  const signGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.05)
  const signMaterial = new THREE.MeshStandardMaterial({ color: '#FF0000' })
  const sign = new THREE.Mesh(signGeometry, signMaterial)
  sign.position.set(0, height - 0.2, 0.5)
  group.add(sign)

  // 大窗户
  const windowGeometry = new THREE.PlaneGeometry(0.6, 0.8)
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: '#87CEEB',
    transparent: true,
    opacity: 0.7,
  })
  const window = new THREE.Mesh(windowGeometry, windowMaterial)
  window.position.set(0, height * 0.4, 0.51)
  group.add(window)
}

/**
 * 添加办公楼细节
 */
function addOfficeDetails(group, level, height) {
  // 多个窗户
  const windowGeometry = new THREE.PlaneGeometry(0.15, 0.25)
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: '#87CEEB',
    emissive: '#4A90E2',
    emissiveIntensity: 0.2,
  })
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial)
      window.position.set(
        (i - 1) * 0.3,
        height * (0.3 + j * 0.4),
        0.51
      )
      group.add(window)
    }
  }
}

/**
 * 添加工厂细节
 */
function addFactoryDetails(group, level, height) {
  // 烟囱
  const chimneyGeometry = new THREE.CylinderGeometry(0.1, 0.1, height * 0.5, 8)
  const chimneyMaterial = new THREE.MeshStandardMaterial({ color: '#696969' })
  const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial)
  chimney.position.set(0.3, height + height * 0.25, 0.3)
  group.add(chimney)

  // 管道
  const pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8)
  const pipe = new THREE.Mesh(pipeGeometry, chimneyMaterial)
  pipe.rotation.z = Math.PI / 2
  pipe.position.set(-0.3, height * 0.7, 0)
  group.add(pipe)
}

/**
 * 添加医院细节
 */
function addHospitalDetails(group, level, height) {
  // 红十字标志
  const crossGeometry1 = new THREE.BoxGeometry(0.3, 0.05, 0.05)
  const crossGeometry2 = new THREE.BoxGeometry(0.05, 0.3, 0.05)
  const crossMaterial = new THREE.MeshStandardMaterial({ color: '#FF0000' })
  
  const cross1 = new THREE.Mesh(crossGeometry1, crossMaterial)
  cross1.position.set(0, height * 0.7, 0.51)
  group.add(cross1)
  
  const cross2 = new THREE.Mesh(crossGeometry2, crossMaterial)
  cross2.position.set(0, height * 0.7, 0.51)
  group.add(cross2)
}

/**
 * 添加警察局细节
 */
function addPoliceDetails(group, level, height) {
  // 警灯
  const lightGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16)
  const lightMaterial = new THREE.MeshStandardMaterial({ 
    color: '#0000FF',
    emissive: '#0000FF',
    emissiveIntensity: 0.5,
  })
  const light = new THREE.Mesh(lightGeometry, lightMaterial)
  light.position.set(0, height + 0.1, 0)
  group.add(light)
}

/**
 * 添加消防站细节
 */
function addFireStationDetails(group, level, height) {
  // 红色条纹
  const stripeGeometry = new THREE.BoxGeometry(1, 0.1, 0.02)
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: '#FF0000' })
  
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial)
    stripe.position.set(0, height * (0.3 + i * 0.3), 0.51)
    group.add(stripe)
  }
}

/**
 * 添加公园细节
 */
function addParkDetails(group, level, height) {
  // 树木
  const treeTrunkGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)
  const treeTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' })
  const treeTrunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial)
  treeTrunk.position.set(0, 0.15, 0)
  group.add(treeTrunk)

  const treeTopGeometry = new THREE.ConeGeometry(0.2, 0.4, 8)
  const treeTopMaterial = new THREE.MeshStandardMaterial({ color: '#228B22' })
  const treeTop = new THREE.Mesh(treeTopGeometry, treeTopMaterial)
  treeTop.position.set(0, 0.5, 0)
  group.add(treeTop)
}

/**
 * 下载 GLB 文件
 * @param {Blob} blob - GLB 文件的 Blob 对象
 * @param {string} filename - 文件名
 */
export function downloadGLB(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'model.glb'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 生成并下载模型
 * @param {string} buildingType - 建筑类型
 * @param {string} level - 等级
 * @param {string} filename - 文件名（可选）
 */
export async function generateAndDownloadModel(buildingType, level = 'level1', filename) {
  try {
    console.log(`正在生成模型: ${buildingType}_${level}...`)
    const blob = await generateBuildingModel(buildingType, level)
    const defaultFilename = filename || `${buildingType}_${level}.glb`
    downloadGLB(blob, defaultFilename)
    console.log(`模型已生成并下载: ${defaultFilename}`)
  } catch (error) {
    console.error('生成模型失败:', error)
  }
}

// 如果在浏览器环境中，将函数挂载到 window 对象上以便在控制台中使用
if (typeof window !== 'undefined') {
  window.generateModel = generateAndDownloadModel
  window.generateBuildingModel = generateBuildingModel
  window.downloadGLB = downloadGLB
}


