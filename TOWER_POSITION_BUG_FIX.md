# 🔧 塔位置Bug修复

## 问题描述
用户报告了两个问题：
1. 新建的塔位置过高，悬浮在空中
2. 刷新页面后恢复的塔模型和样式与刷新前不一致

## 根本原因分析

### 问题1：塔位置过高
**原因**：塔的 Y 轴位置设置为 `0.75`，这是相对于 `grassMesh` 的位置。但 `grassMesh` 的高度只有 `0.2`（从 `td-tile.js` 第 48 行可以看到：`new THREE.BoxGeometry(0.98, 0.2, 0.98)`），所以塔应该在更低的位置。

**计算**：
- grassMesh 高度：0.2
- grassMesh 中心：0（因为 position.y = 0）
- grassMesh 顶面：0.1（0 + 0.2/2）
- 塔应该放在：~0.2（稍高于顶面）

### 问题2：刷新后模型不一致
**原因**：`restoreTowers()` 方法使用的是旧的简单圆柱体模型，而不是使用 `TowerFactory` 创建的新模型。

**旧代码**：
```javascript
const tower = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.5, 1, 8),
  new THREE.MeshStandardMaterial({ color: ... })
)
```

**新代码**：
```javascript
const towerConfig = getTowerConfig(towerData.type, towerData.level || 1)
const tower = TowerFactory.createTowerMesh(towerConfig.type, towerData.level || 1)
```

## 已修复 ✅

### 修复 1：调整塔的高度
在 `placeTowerFromDrag()` 和 `restoreTowers()` 中：
```javascript
// 从
tower.position.set(0, 0.75, 0)

// 改为
tower.position.set(0, 0.2, 0) // 降低高度，让塔贴在地面上
```

### 修复 2：使用 TowerFactory
在 `restoreTowers()` 中使用与 `placeTowerFromDrag()` 相同的塔创建逻辑：
- ✅ 使用 `getTowerConfig()` 获取配置
- ✅ 使用 `TowerFactory.createTowerMesh()` 创建模型
- ✅ 保存所有特殊属性（`targetPriority`, `specialEffect`, `projectileType`）

## 测试步骤

1. **测试新建塔**：
   - 进入外城塔防模式
   - 拖拽建造不同类型的塔
   - 检查塔是否贴在地面上，不再悬浮

2. **测试刷新恢复**：
   - 建造几个不同类型的塔
   - 刷新页面
   - 检查恢复的塔：
     - 模型样式是否一致（颜色、形状）
     - 位置是否正确
     - 功能是否正常（能否攻击敌人）

## 预期效果

### 修复前 ❌
- 塔悬浮在空中（Y = 0.75）
- 刷新后变成简单的蓝色/黄色/红色圆柱体
- 位置可能不一致

### 修复后 ✅
- 塔贴在地面上（Y = 0.2）
- 刷新后保持原样（使用 TowerFactory 模型）
- 位置完全一致
- 所有特殊属性保留

## 其他可能的调整

如果塔的高度还需要微调，可以在以下位置修改 Y 值：

**src/js/td/tower-defense-world.js**
- `placeTowerFromDrag()` 方法中的 `tower.position.set(0, Y, 0)`
- `restoreTowers()` 方法中的 `tower.position.set(0, Y, 0)`

建议的 Y 值范围：
- `0.1` - 塔底部与地面齐平
- `0.2` - 塔稍微高于地面（推荐）
- `0.3` - 塔明显高于地面

## 完成 ✅

现在塔的位置应该正确，刷新后也能保持一致了！

