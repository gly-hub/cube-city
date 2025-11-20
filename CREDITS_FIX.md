# 🎯 关键问题修复：credits 未定义

## 问题根源

**错误原因**：代码中访问 `this.world.gameState.metadata.credits`，但实际上 `credits` 在 Pinia store 的根级别，不在 `metadata` 中。

### 错误的访问方式
```javascript
// ❌ 错误
const credits = this.world.gameState.metadata.credits  
// 结果：undefined

// ✅ 正确
const credits = this.world.gameState.credits
// 结果：3000（初始值）
```

---

## 修复的文件

### 1. `src/js/td/active-skills.js`

#### ✅ `selectSkill()` 方法
```javascript
// 修复前
const credits = this.world.gameState.metadata.credits

// 修复后
const credits = this.world.gameState.credits || 0
```

#### ✅ `useSkill()` 方法
```javascript
// 修复前
const credits = this.world.gameState.metadata.credits

// 修复后
const credits = this.world.gameState.credits || 0
```

#### ✅ `getSkillsStatus()` 方法
```javascript
// 修复前
const credits = this.world.gameState.metadata.credits

// 修复后
const credits = this.world.gameState.credits || 0
```

### 2. `src/js/td/tower-defense-world.js`

#### ✅ `handleSkillSelect()` 方法
```javascript
// 修复前
credits: this.gameState.metadata.credits

// 修复后
credits: this.gameState.credits
```

---

## gameState 结构说明

### 正确的结构（来自 useGameState.js）
```javascript
state: () => ({
  metadata: Array.from(...),  // 17x17 地图数据
  currentMode: 'build',
  currentScene: 'CITY',
  credits: 3000,              // ✅ 在根级别
  gameDay: 1,
  // ... 其他属性
})
```

### 常见错误
```javascript
// ❌ 错误：metadata 是地图数据数组，不包含 credits
gameState.metadata.credits  

// ✅ 正确：credits 直接在 gameState 根级别
gameState.credits
```

---

## 修复后的行为

### 技能选择流程
```
用户点击技能按钮
  ↓
检查 credits（从 gameState.credits 获取）
  ↓
credits: 3000, cost: 60
  ↓
canUse: true ✅
  ↓
技能选择成功
  ↓
显示范围指示器
```

### 预期控制台输出
```
📥 handleSkillSelect 接收: { 
  skillId: 'airstrike', 
  credits: 3000  // ✅ 不再是 undefined
}

🔍 检查技能可用性: {
  skillId: 'airstrike',
  canUse: true,  // ✅ 现在是 true
  remainingCooldown: 0,
  credits: 3000,
  cost: 100
}

✅ 技能选择成功: airstrike
✅ 范围指示器已显示，半径: 2.5
✅ 技能已选择: airstrike，点击地面使用
```

---

## 测试检查清单

### 技能选择
- [ ] 点击技能按钮，控制台显示 `credits: 3000`（不是 undefined）
- [ ] 控制台显示 `canUse: true`
- [ ] 控制台显示 `✅ 技能选择成功`
- [ ] 范围圈出现并跟随鼠标

### 技能释放
- [ ] 点击地面，技能释放
- [ ] 金币减少（3000 → 2940 或类似）
- [ ] 特效播放
- [ ] 敌人受到影响

### 技能冷却
- [ ] 释放后开始冷却倒计时
- [ ] 冷却期间 `canUse: false`
- [ ] 冷却结束后 `canUse: true`

---

## 相关 API

### Pinia Store 访问
```javascript
// 在 Vue 组件中
const gameState = useGameState()
console.log(gameState.credits)  // 3000

// 在 Three.js 类中
this.gameState = useGameState()
console.log(this.gameState.credits)  // 3000
```

### 金币操作
```javascript
// 增加金币
gameState.updateCredits(100)  // +100

// 减少金币
gameState.updateCredits(-100)  // -100

// 直接设置
gameState.credits = 5000
```

---

刷新页面测试，现在应该可以正常选择技能了！🎯




