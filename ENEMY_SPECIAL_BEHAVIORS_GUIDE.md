# Enemy 特殊行为集成指南

## Enemy.js 已更新

`src/js/td/enemy.js` 已添加以下新功能：

### 1. 隐身行为 ✓
- 自动在隐身/显形之间切换
- 隐身时透明度降低，无法被塔锁定

### 2. 飞行行为 ✓
- 飞行单位在空中移动（Y 轴抬高）
- 只能被防空塔攻击

### 3. 治疗行为 ✓
- 定期为周围怪物回血
- 有绿色闪光视觉效果

### 4. 分裂行为 ⏳
- 需要在 `TowerDefenseWorld` 中处理

---

## 需要更新 tower-defense-world.js

### 更新 1：updateEnemy 方法传递 allEnemies

找到 `updateEnemy(enemy, index)` 方法（约 879-920 行），在调用 `enemy.update(dt)` 之前添加：

```javascript
  updateEnemy(enemy, index) {
    if (!enemy || !enemy.isAlive) {
      this.removeEnemy(index)
      return
    }
    
    const dt = this.time.delta
    
    // ===== 新增：为治疗单位传递所有敌人 =====
    if (enemy.stats.special?.healRange) {
      enemy.updateHealBehavior(dt, this.enemies)
    }
    
    // 更新怪物
    const reachedEnd = enemy.update(dt)
    
    // ... 其余逻辑
  }
```

### 更新 2：removeEnemy 处理分裂

找到 `removeEnemy(index)` 方法（约 1102-1153 行），在方法开头添加分裂逻辑：

```javascript
  removeEnemy(index) {
    const enemy = this.enemies[index]
    if (!enemy) return
    
    // ===== 新增：处理分裂单位 =====
    if (enemy.stats.special?.splitCount && enemy.isAlive === false) {
      this.handleSplitterDeath(enemy)
    }
    
    // 给予奖励
    if (!enemy.isAlive) {
      this.gameState.updateCredits(enemy.stats.reward)
    }
    
    // 销毁怪物
    enemy.destroy(this.scene)
    this.enemies.splice(index, 1)
    
    // ... 其余逻辑
  }
```

### 更新 3：添加 handleSplitterDeath 方法

在 `TowerDefenseWorld` 类中添加新方法（建议在 `removeEnemy` 方法后）：

```javascript
  /**
   * 处理分裂单位的死亡
   * @param {Enemy} parentEnemy - 父怪物
   */
  handleSplitterDeath(parentEnemy) {
    const { splitCount, splitHealthRatio, splitSpeedMultiplier } = parentEnemy.stats.special
    const parentPath = parentEnemy.path
    const parentPathIndex = parentEnemy.pathIndex
    
    // 从当前位置开始的剩余路径
    const remainingPath = parentPath.slice(parentPathIndex)
    
    if (remainingPath.length < 2) {
      // 如果路径太短，不生成小怪
      return
    }
    
    console.log(`分裂单位死亡，生成 ${splitCount} 个小怪`)
    
    // 生成小怪
    for (let i = 0; i < splitCount; i++) {
      try {
        // 创建小怪（使用相同类型，标记为分裂体）
        const splitEnemy = new Enemy(
          parentEnemy.stats.type,
          this.wave,
          remainingPath,
          this.scene,
          this.enemyModelFactory
        )
        
        // 调整小怪属性
        splitEnemy.health = parentEnemy.maxHealth * splitHealthRatio
        splitEnemy.maxHealth = splitEnemy.health
        splitEnemy.stats.speed *= splitSpeedMultiplier
        splitEnemy.stats.reward = Math.round(parentEnemy.stats.reward * 0.3) // 小怪奖励减少
        
        // 缩小模型
        splitEnemy.mesh.scale.setScalar(0.6)
        
        // 随机偏移位置，避免重叠
        const offsetX = (Math.random() - 0.5) * 1.0
        const offsetZ = (Math.random() - 0.5) * 1.0
        splitEnemy.mesh.position.x += offsetX
        splitEnemy.mesh.position.z += offsetZ
        
        // 标记为分裂体，避免二次分裂
        if (splitEnemy.stats.special) {
          splitEnemy.stats.special.splitCount = 0
        }
        
        // 添加到敌人数组
        this.enemies.push(splitEnemy)
        
      } catch (error) {
        console.error('生成分裂小怪失败:', error)
      }
    }
  }
```

---

## 测试检查清单

完成上述更新后，测试以下功能：

### 隐身单位测试
- [ ] 第 5 波出现隐身单位
- [ ] 隐身单位会定期变透明
- [ ] 隐身时塔无法锁定它们
- [ ] 显形时塔可以正常攻击

### 飞行单位测试
- [ ] 第 3 波出现飞行单位
- [ ] 飞行单位在空中移动（比地面高）
- [ ] 普通塔无法攻击飞行单位
- [ ] 防空塔可以攻击飞行单位

### 治疗单位测试
- [ ] 第 6 波出现治疗单位
- [ ] 治疗单位会为周围怪物回血
- [ ] 被治疗的怪物有绿色闪光
- [ ] 优先击杀治疗单位能减少麻烦

### 分裂单位测试
- [ ] 第 7 波出现分裂单位
- [ ] 分裂单位死亡后生成 3 个小怪
- [ ] 小怪体型更小，速度更快
- [ ] 小怪不会二次分裂

---

## 可选：视觉增强

如果想添加更多视觉效果，可以：

### 1. 治疗连线效果

在 `Enemy.js` 的 `performHeal` 方法中取消注释：

```javascript
this.createHealEffect(myPos, otherEnemy.getPosition())
```

然后添加方法：

```javascript
  createHealEffect(fromPos, toPos) {
    // 创建治疗光束
    const points = [fromPos, toPos]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ 
      color: 0x22c55e,
      transparent: true,
      opacity: 0.6
    })
    const line = new THREE.Line(geometry, material)
    this.mesh.parent.add(line)
    
    // 0.3秒后移除
    setTimeout(() => {
      this.mesh.parent.remove(line)
      geometry.dispose()
      material.dispose()
    }, 300)
  }
```

### 2. 分裂爆炸效果

在 `handleSplitterDeath` 中添加粒子效果：

```javascript
// 在生成小怪之前
this.createSplitExplosion(parentEnemy.getPosition())
```

---

## 性能优化建议

如果游戏卡顿：

1. **减少分裂数量**：将 `splitCount` 从 3 改为 2
2. **限制治疗范围**：减少 `healRange` 
3. **降低治疗频率**：增加 `healInterval`
4. **优化透明度**：隐身时使用更简单的材质

---

完成这些更新后，整个特殊怪物系统就完整了！ 🎉



