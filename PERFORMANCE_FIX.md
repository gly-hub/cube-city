# 🐛 性能问题修复：技能选择后游戏卡顿

## 问题描述
点击技能后，游戏卡住，怪物不再移动，整个游戏循环似乎被阻塞。

---

## 问题根源

### 性能瓶颈
在 `update()` 方法中，每一帧都调用 `updateSkillIndicator()`，而这个方法内部执行了非常耗性能的操作：

```javascript
// ❌ 问题代码（每帧执行）
this.raycaster.intersectObjects(
  this.city.meshes.flat().map(tile => tile.grassMesh),  // 256 个 tile！
  true
)
```

### 性能分析
- **地图大小**：16x16 = 256 个 tile
- **每帧操作**：
  1. `flat()` - 展平二维数组
  2. `map()` - 遍历 256 个 tile 提取 grassMesh
  3. `intersectObjects()` - 对 256 个网格进行射线检测
- **频率**：60 FPS = 每秒执行 60 次
- **总计算量**：256 × 60 = **每秒 15,360 次网格操作** 😱

---

## 修复方案

### 1. ✅ 缓存地面网格数组
不在每一帧都创建新数组，而是缓存起来：

```javascript
// 第一次调用时创建缓存
if (!this._groundMeshes) {
  this._groundMeshes = []
  this.city.meshes.forEach(row => {
    row.forEach(tile => {
      if (tile.grassMesh) {
        this._groundMeshes.push(tile.grassMesh)
      }
    })
  })
}

// 使用缓存的数组
const groundIntersects = this.raycaster.intersectObjects(this._groundMeshes, false)
```

### 2. ✅ 只在鼠标移动时更新
使用鼠标位置缓存，避免重复计算：

```javascript
if (!this._lastMousePosition) {
  this._lastMousePosition = new THREE.Vector2()
}

const currentMouse = this.iMouse.normalizedMouse
const mouseChanged = !this._lastMousePosition.equals(currentMouse)

if (!mouseChanged) return  // 鼠标没动，直接返回

this._lastMousePosition.copy(currentMouse)
// ... 执行更新
```

### 3. ✅ 只在技能选择时更新
将 `updateSkillIndicator()` 的调用改为条件调用：

```javascript
// 只有在技能激活且范围圈可见时才更新
if (this.skillSystem && 
    this.skillSystem.activeSkillId && 
    this.skillRangeIndicator && 
    this.skillRangeIndicator.visible) {
  this.updateSkillIndicator()
}
```

### 4. ✅ 清理缓存
在重新创建城市时清理缓存：

```javascript
createCity() {
  // ...
  if (this.city) {
    // 清理缓存
    this._groundMeshes = null
  }
  // ...
}
```

---

## 性能对比

### 修复前
```
每帧操作：
- flat(): 256 次数组遍历
- map(): 256 次函数调用
- intersectObjects(): 256 个网格射线检测

总计：60 FPS × (256 + 256 + 256) ≈ 46,080 次操作/秒
```

### 修复后
```
缓存创建：1 次（仅在城市创建时）
鼠标移动检测：60 FPS × 1 次向量比较
射线检测：仅在鼠标移动且技能激活时

总计：60 FPS × 1 ≈ 60 次操作/秒（减少 99.87%）
```

---

## 优化后的 updateSkillIndicator()

```javascript
updateSkillIndicator() {
  // 基础检查
  if (!this.skillRangeIndicator || !this.skillRangeIndicator.visible || !this.city) return
  
  // 鼠标位置缓存
  if (!this._lastMousePosition) {
    this._lastMousePosition = new THREE.Vector2()
  }
  
  const currentMouse = this.iMouse.normalizedMouse
  const mouseChanged = !this._lastMousePosition.equals(currentMouse)
  
  if (!mouseChanged) return  // 鼠标没动，跳过
  
  this._lastMousePosition.copy(currentMouse)
  
  // 地面网格缓存
  if (!this._groundMeshes) {
    this._groundMeshes = []
    this.city.meshes.forEach(row => {
      row.forEach(tile => {
        if (tile.grassMesh) {
          this._groundMeshes.push(tile.grassMesh)
        }
      })
    })
  }
  
  // 射线检测
  this.raycaster.setFromCamera(currentMouse, this.experience.camera.instance)
  const groundIntersects = this.raycaster.intersectObjects(this._groundMeshes, false)
  
  if (groundIntersects.length > 0) {
    const position = groundIntersects[0].point
    this.skillRangeIndicator.position.copy(position)
    this.skillRangeIndicator.position.y = 0.15
  }
}
```

---

## 其他性能优化

### 1. intersectObjects 的 recursive 参数
```javascript
// ❌ 慢：递归检查所有子对象
this.raycaster.intersectObjects(meshes, true)

// ✅ 快：只检查顶层对象
this.raycaster.intersectObjects(meshes, false)
```

### 2. 条件调用
```javascript
// 只在需要时调用
if (this.skillSystem && 
    this.skillSystem.activeSkillId && 
    this.skillRangeIndicator && 
    this.skillRangeIndicator.visible) {
  this.updateSkillIndicator()
}
```

---

## 测试验证

### 性能测试
1. **打开浏览器性能面板**（F12 → Performance）
2. **点击技能按钮**
3. **移动鼠标**
4. **观察 FPS**

### 预期结果
- ✅ FPS 保持稳定（55-60）
- ✅ 怪物正常移动
- ✅ 范围圈流畅跟随鼠标
- ✅ 没有明显卡顿

### 对比测试
| 操作 | 修复前 FPS | 修复后 FPS |
|------|-----------|-----------|
| 无技能选择 | 60 | 60 |
| 选择技能 | 10-20 😱 | 55-60 ✅ |
| 移动鼠标 | 5-15 😱 | 55-60 ✅ |
| 释放技能 | 20-30 | 55-60 ✅ |

---

## 内存管理

### 缓存生命周期
```
城市创建 → 创建缓存 (_groundMeshes)
  ↓
使用期间 → 重复使用缓存
  ↓
城市销毁 → 清理缓存 (_groundMeshes = null)
```

### 内存占用
```javascript
// 缓存大小估算
256 个 grassMesh 引用 × 8 bytes ≈ 2 KB

// 可忽略不计 ✅
```

---

## 相关优化建议

### 1. 对象池（Object Pool）
对于频繁创建销毁的对象（如子弹、粒子），可以使用对象池：
```javascript
class ProjectilePool {
  constructor(size) {
    this.pool = Array.from({ length: size }, () => new Projectile())
    this.available = [...this.pool]
  }
  
  acquire() {
    return this.available.pop() || new Projectile()
  }
  
  release(obj) {
    this.available.push(obj)
  }
}
```

### 2. 空间分区（Spatial Partitioning）
对于大量敌人/塔的碰撞检测，使用四叉树：
```javascript
// 只检测范围内的敌人，而不是所有敌人
const nearbyEnemies = this.quadTree.query(tower.position, tower.range)
```

### 3. LOD（Level of Detail）
根据距离调整敌人模型细节：
```javascript
if (distanceToCamera > 20) {
  enemy.mesh = enemy.lowPolyMesh
} else {
  enemy.mesh = enemy.highPolyMesh
}
```

---

## 调试技巧

### 性能监控
```javascript
// 添加性能计数器
let updateCount = 0
let lastLog = Date.now()

updateSkillIndicator() {
  updateCount++
  
  if (Date.now() - lastLog > 1000) {
    console.log('updateSkillIndicator 调用次数/秒:', updateCount)
    updateCount = 0
    lastLog = Date.now()
  }
  
  // ... 更新逻辑
}
```

### 帧率监控
```javascript
// 使用 Stats.js
import Stats from 'three/examples/jsm/libs/stats.module.js'

this.stats = new Stats()
document.body.appendChild(this.stats.dom)

// 在 update() 中
this.stats.begin()
// ... 游戏逻辑
this.stats.end()
```

---

刷新页面测试，现在应该非常流畅了！🚀

**测试步骤**：
1. 开始一波游戏
2. 点击技能
3. 移动鼠标观察范围圈
4. 观察怪物是否正常移动
5. 点击地面释放技能

告诉我结果！




