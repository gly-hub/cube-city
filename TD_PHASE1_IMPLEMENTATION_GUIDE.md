# 🎮 第一阶段塔防优化 - 实现进度

## ✅ 已完成的配置

### 1. 防御塔类型系统 ⭐⭐⭐⭐⭐

**新增文件**: `src/js/td/tower-config.js`

**已实现的塔类型**:

| 塔类型 | 特性 | 用途 | 成本 (Lv1) |
|--------|------|------|-----------|
| **基础炮塔** | 平衡型，中等伤害和射程 | 通用防御 | 100 |
| **减速塔** | 低伤害，50-70% 减速 | 控制快速敌人 | 120 |
| **榴弹炮** | 范围伤害，攻速慢 | 对付成群敌人 | 150 |
| **狙击塔** | 超远射程，高伤害，暴击 | 专打 Boss/精英 | 200 |
| **辅助塔** | 不攻击，增强周围塔 | 辅助输出 | 100 |
| **防空塔** | 只打飞行单位 | 防空专用 | 130 |

**塔的升级系统**:
- 每种塔都有 3 个等级
- 每级提升伤害、射程、攻速
- 特殊塔还会提升特效强度（如减速塔的减速率）

**攻击优先级系统**:
- `nearest` - 最近的
- `farthest` - 最远的
- `strongest` - 血最多的
- `weakest` - 血最少的
- `fastest` - 速度最快的
- `flying` - 只打飞行单位

### 2. 特殊怪物类型 ⭐⭐⭐⭐⭐

**更新文件**: `src/js/td/enemy-types.js`

**新增怪物类型**:

| 怪物类型 | 特性 | 对策 | 首次出现 |
|---------|------|------|----------|
| **飞行单位** 🦅 | 空中飞行，普通塔打不到 | 需要建造防空塔 | 第 3 波 |
| **隐身单位** 👻 | 定期隐身 2秒/每 5秒 | 趁可见时集火 | 第 5 波 |
| **治疗单位** ⚕️ | 为周围 2.5 格怪物回血 | 优先击杀 | 第 6 波 |
| **分裂单位** 🧬 | 死亡分裂成 3 个小怪 | 准备范围伤害塔 | 第 7 波 |

**怪物配置**:
```javascript
special: {
  // 飞行
  isFlying: true,
  altitude: 1.5,
  
  // 隐身
  stealthCycle: 5,      // 隐身周期
  stealthDuration: 2,   // 隐身时长
  opacity: 0.3,         // 隐身透明度
  
  // 治疗
  healRange: 2.5,       // 治疗范围
  healAmount: 10,       // 治疗量
  healInterval: 2,      // 治疗间隔
  
  // 分裂
  splitCount: 3,        // 分裂数量
  splitHealthRatio: 0.3,  // 小怪血量比例
  splitSpeedMultiplier: 1.2,  // 小怪速度倍率
}
```

---

## 🔧 接下来需要集成的代码

### 任务 1: 更新 `TowerSidebar.vue` 显示新塔类型

```vue
<script setup>
import { TowerType, TOWER_CONFIG } from '@/js/td/tower-config.js'

// 塔列表
const towers = [
  { type: TowerType.BASIC, icon: '🔫' },
  { type: TowerType.SLOW, icon: '❄️' },
  { type: TowerType.AOE, icon: '💥' },
  { type: TowerType.SNIPER, icon: '🎯' },
  { type: TowerType.SUPPORT, icon: '🛡️' },
  { type: TowerType.ANTI_AIR, icon: '🚀' },
]
</script>
```

### 任务 2: 更新 `tower-defense-world.js` 的塔建造逻辑

```javascript
import { getTowerConfig, TargetPriority } from './tower-config.js'

// 在 placeTowerFromDrag 中
placeTowerFromDrag(tile) {
  const towerType = this.gameState.selectedTowerType
  const towerConfig = getTowerConfig(towerType, 1)  // Lv1
  
  if (!towerConfig) {
    console.error('无效的塔类型:', towerType)
    return
  }
  
  // 检查金币
  if (this.gameState.credits < towerConfig.cost) {
    this.experience.eventBus.emit('toast:add', {
      message: `金币不足！需要 ${towerConfig.cost}`,
      type: 'warning',
    })
    return
  }
  
  // 创建塔的 3D 模型
  const tower = this.createTowerMesh(towerConfig)
  // ...
}
```

### 任务 3: 更新 `updateTower()` 实现不同塔的逻辑

```javascript
updateTower(tower) {
  const now = this.time.elapsed
  if (now - tower.userData.lastAttackTime < tower.userData.cooldown) return
  
  // 根据塔类型选择目标
  const target = this.findTarget(tower)
  if (!target) return
  
  // 发射子弹
  this.fireProjectile(tower, target)
  tower.userData.lastAttackTime = now
}

findTarget(tower) {
  const { range, targetPriority, canTargetGround } = tower.userData
  const towerPos = new THREE.Vector3()
  tower.getWorldPosition(towerPos)
  
  let candidates = []
  
  // 筛选候选目标
  for (const enemy of this.enemies) {
    // 飞行检查
    if (targetPriority === 'flying' && !enemy.stats.special?.isFlying) {
      continue
    }
    
    if (canTargetGround === false && !enemy.stats.special?.isFlying) {
      continue
    }
    
    // 隐身检查
    if (enemy.isStealthed) {
      continue
    }
    
    // 距离检查
    const dist = towerPos.distanceTo(enemy.getPosition())
    if (dist <= range) {
      candidates.push({ enemy, dist })
    }
  }
  
  if (candidates.length === 0) return null
  
  // 根据优先级排序
  switch (targetPriority) {
    case 'nearest':
      return candidates.sort((a, b) => a.dist - b.dist)[0].enemy
    case 'strongest':
      return candidates.sort((a, b) => b.enemy.health - a.enemy.health)[0].enemy
    case 'fastest':
      return candidates.sort((a, b) => b.enemy.stats.speed - a.enemy.stats.speed)[0].enemy
    // ...
  }
}
```

### 任务 4: 实现减速效果

```javascript
// 在 hitEnemy() 中
hitEnemy(projectile, enemy, index) {
  const { damage, slowEffect, aoeRadius } = projectile.userData
  
  // 应用减速
  if (slowEffect) {
    enemy.applySlow(slowEffect.multiplier, slowEffect.duration)
  }
  
  // AOE 伤害
  if (aoeRadius) {
    const hitPos = enemy.getPosition()
    this.enemies.forEach((otherEnemy) => {
      const dist = hitPos.distanceTo(otherEnemy.getPosition())
      if (dist <= aoeRadius) {
        otherEnemy.takeDamage(damage)
      }
    })
  } else {
    // 单体伤害
    enemy.takeDamage(damage)
  }
  
  // ...
}
```

### 任务 5: 实现特殊怪物行为

```javascript
// 在 Enemy.js 的 update() 中

// 隐身逻辑
if (this.stats.special?.stealthCycle) {
  const { stealthCycle, stealthDuration, opacity } = this.stats.special
  const cycleTime = this.stats.time % stealthCycle
  
  if (cycleTime < stealthDuration) {
    this.isStealthed = true
    this.mesh.traverse((child) => {
      if (child.material) {
        child.material.opacity = opacity
        child.material.transparent = true
      }
    })
  } else {
    this.isStealthed = false
    this.mesh.traverse((child) => {
      if (child.material) {
        child.material.opacity = 1.0
        child.material.transparent = false
      }
    })
  }
}

// 治疗逻辑
if (this.stats.special?.healRange) {
  const { healRange, healAmount, healInterval } = this.stats.special
  
  if (!this.lastHealTime) this.lastHealTime = 0
  
  if (this.time.elapsed - this.lastHealTime > healInterval) {
    const myPos = this.getPosition()
    
    // 治疗周围怪物
    this.scene.enemies.forEach((otherEnemy) => {
      if (otherEnemy === this || !otherEnemy.isAlive) return
      
      const dist = myPos.distanceTo(otherEnemy.getPosition())
      if (dist <= healRange) {
        otherEnemy.heal(healAmount)
      }
    })
    
    this.lastHealTime = this.time.elapsed
  }
}
```

### 任务 6: 实现分裂逻辑

```javascript
// 在 TowerDefenseWorld.js 的 removeEnemy() 中

removeEnemy(index) {
  const enemy = this.enemies[index]
  
  // 检查是否是分裂单位
  if (enemy.stats.special?.splitCount) {
    const { splitCount, splitHealthRatio, splitSpeedMultiplier } = enemy.stats.special
    const parentPath = enemy.path
    const parentPathIndex = enemy.pathIndex
    
    // 生成小怪
    for (let i = 0; i < splitCount; i++) {
      const splitPath = parentPath.slice(parentPathIndex)  // 从当前位置开始
      
      // 创建小怪（血量和速度调整）
      const splitEnemy = new Enemy(
        enemy.stats.type + '_split',  // 标记为分裂小怪
        this.wave,
        splitPath,
        this.root,
        this.enemyModelFactory
      )
      
      // 调整属性
      splitEnemy.health = enemy.stats.maxHealth * splitHealthRatio
      splitEnemy.stats.speed *= splitSpeedMultiplier
      splitEnemy.mesh.scale.setScalar(0.6)  // 缩小模型
      
      // 随机偏移位置
      const offsetX = (Math.random() - 0.5) * 1.0
      const offsetZ = (Math.random() - 0.5) * 1.0
      splitEnemy.mesh.position.x += offsetX
      splitEnemy.mesh.position.z += offsetZ
      
      this.enemies.push(splitEnemy)
    }
  }
  
  // 销毁原怪物
  enemy.destroy(this.root)
  this.enemies.splice(index, 1)
}
```

---

## 📊 下一步：UI 和视觉效果

### 任务 7: 波次预览 UI

```vue
<!-- TowerDefenseUI.vue -->
<div class="next-wave-preview">
  <h3>下一波 (第 {{ nextWave }} 波)</h3>
  <div v-for="enemyGroup in nextWaveComposition" :key="enemyGroup.type">
    <span>{{ enemyGroup.icon }}</span>
    <span>{{ enemyGroup.name }}</span>
    <span>x{{ enemyGroup.count }}</span>
  </div>
  <div class="reward">奖励: {{ nextWaveReward }} 💰</div>
</div>
```

### 任务 8: 伤害飘字效果

```javascript
// 创建飘字
createDamageText(position, damage, isCrit = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  
  ctx.font = isCrit ? 'bold 48px Arial' : 'bold 32px Arial'
  ctx.fillStyle = isCrit ? '#fde047' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(`-${damage}`, 64, 40)
  
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  
  sprite.position.copy(position)
  sprite.position.y += 1
  sprite.scale.set(0.5, 0.25, 1)
  
  this.scene.add(sprite)
  
  // 动画：向上飘并淡出
  gsap.to(sprite.position, {
    y: position.y + 2,
    duration: 1,
    ease: 'power2.out',
  })
  
  gsap.to(sprite.material, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      this.scene.remove(sprite)
      texture.dispose()
      material.dispose()
    },
  })
}
```

### 任务 9: 主动技能系统

```javascript
// skills.js
export const SKILLS = {
  AIR_STRIKE: {
    name: '空袭',
    description: '对目标区域造成大量范围伤害',
    cost: 150,
    cooldown: 30,
    damage: 200,
    radius: 3,
    icon: '✈️',
  },
  
  ICE_STORM: {
    name: '冰冻',
    description: '冻结区域内所有敌人 3秒',
    cost: 100,
    cooldown: 25,
    duration: 3,
    radius: 2.5,
    icon: '❄️',
  },
  
  LIGHTNING: {
    name: '闪电链',
    description: '对一个敌人和周围敌人造成伤害',
    cost: 120,
    cooldown: 20,
    damage: 150,
    chainCount: 5,
    icon: '⚡',
  },
}
```

---

## 🎯 实现优先级

### 高优先级（核心玩法）
1. ✅ 塔类型配置（已完成）
2. ✅ 特殊怪物配置（已完成）
3. ⏳ 更新 TowerSidebar 显示新塔
4. ⏳ 实现塔的攻击优先级逻辑
5. ⏳ 实现减速/AOE 效果
6. ⏳ 实现特殊怪物行为（隐身、飞行、治疗、分裂）

### 中优先级（体验提升）
7. ⏳ 波次预览 UI
8. ⏳ 伤害飘字
9. ⏳ 辅助塔的光环效果

### 低优先级（锦上添花）
10. ⏳ 主动技能系统
11. ⏳ 狙击塔的暴击特效
12. ⏳ 分裂怪的分裂动画

---

## 📝 代码集成检查清单

- [ ] 更新 `TowerSidebar.vue` 引入 `tower-config.js`
- [ ] 更新 `tower-defense-world.js` 引入 `tower-config.js`
- [ ] 修改 `placeTowerFromDrag()` 使用新的塔配置
- [ ] 修改 `updateTower()` 实现攻击优先级
- [ ] 修改 `fireProjectile()` 传递塔的特殊效果
- [ ] 修改 `hitEnemy()` 应用减速/AOE 效果
- [ ] 在 `Enemy.js` 添加隐身/治疗逻辑
- [ ] 在 `removeEnemy()` 添加分裂逻辑
- [ ] 在 `enemy-model-factory.js` 为特殊怪物添加视觉效果
- [ ] 创建波次预览组件
- [ ] 实现伤害飘字系统
- [ ] （可选）实现主动技能

---

想让我继续实现哪个部分？我建议先从 **任务 3、4、5、6** 开始，把核心玩法逻辑完成！



