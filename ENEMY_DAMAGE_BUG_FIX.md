# 🐛 怪物受伤卡死 Bug 修复

## 问题描述

当怪物被防御塔攻击时，游戏会直接卡死，控制台报错：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'color')
at C$.flashDamage (index-DyA3iz-V.js:65:419877)
at $$.takeDamage (index-DyA3iz-V.js:65:419709)
at $$.updateProjectile (index-DyA3iz-V.js:65:440376)
at $$.update (index-DyA3iz-V.js:65:434527)
```

## 问题根源

### 1. **`flashDamage()` 方法的问题**

旧版 `enemy.js` 中的 `flashDamage()` 方法直接访问 `this.mesh.material.color`:

```javascript
// ❌ 问题代码
flashDamage() {
  const originalColor = this.mesh.material.color.clone()  // ← 这里会报错
  this.mesh.material.color.setHex(0xffffff)
  
  setTimeout(() => {
    this.mesh.material.color.copy(originalColor)
  }, 100)
}
```

**问题**：
- 使用 `EnemyModelFactory` 创建的模型是 `THREE.Group`，不是 `THREE.Mesh`
- `THREE.Group` 没有 `material` 属性
- 直接访问 `this.mesh.material.color` 会导致 `undefined` 错误

### 2. **模型结构差异**

```
旧模型（直接 Mesh）:
Enemy.mesh (THREE.Mesh)
  └── .material
      └── .color  ← 可以直接访问

新模型（Group）:
Enemy.mesh (THREE.Group)
  ├── body (THREE.Mesh)
  │   └── .material.color
  ├── head (THREE.Mesh)
  │   └── .material.color
  ├── leg_0 (THREE.Mesh)
  │   └── .material.color
  └── leg_1 (THREE.Mesh)
      └── .material.color

❌ this.mesh.material  → undefined
❌ this.mesh.material.color  → TypeError
```

## 修复方案

### 修复 1：支持 Group 和 Mesh

更新 `enemy.js` 的 `flashDamage()` 方法：

```javascript
// ✅ 修复后的代码
flashDamage() {
  // ===== 修复：支持 Group 和 Mesh =====
  // 如果是 Group，遍历所有子网格
  if (this.mesh.isGroup) {
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        const originalColor = child.material.color.clone()
        child.material.color.setHex(0xffffff)
        
        setTimeout(() => {
          if (child.material) {
            child.material.color.copy(originalColor)
          }
        }, 100)
      }
    })
  } else if (this.mesh.isMesh) {
    // 如果是单个 Mesh
    const originalColor = this.mesh.material.color.clone()
    this.mesh.material.color.setHex(0xffffff)
    
    setTimeout(() => {
      if (this.mesh.material) {
        this.mesh.material.color.copy(originalColor)
      }
    }, 100)
  }
}
```

**改进点**：
1. ✅ 检查 `this.mesh.isGroup`，如果是 Group，遍历所有子网格
2. ✅ 对每个子网格独立保存 `originalColor`
3. ✅ 兼容旧的单 Mesh 模型
4. ✅ 添加了空指针检查

### 修复 2：统一怪物类型命名

更新 `enemy-model-factory.js` 的 `createEnemyModel()` 方法：

```javascript
// ✅ 修复后的代码
createEnemyModel(enemyType, stats) {
  // ===== 修复：统一小写 =====
  const normalizedType = enemyType.toLowerCase()
  const config = ENEMY_MODEL_CONFIG[normalizedType]
  
  // ...
}
```

**原因**：
- `ENEMY_MODEL_CONFIG` 的键是小写的 (`'scout'`, `'tank'`)
- `enemy-types.js` 中 `EnemyType.SCOUT` 的值也是小写的 `'scout'`
- 但为了防止未来可能的大小写不一致问题，统一转换为小写

## 测试验证

### 测试步骤

1. 启动游戏
   ```bash
   npm run dev
   ```

2. 切换到外城
3. 建造一些防御塔
4. 开始下一波怪物
5. 观察防御塔攻击怪物时的效果

### 预期结果

- ✅ 怪物被攻击时会**闪白**（所有身体部位都会闪烁）
- ✅ 游戏不会卡死
- ✅ 控制台没有报错
- ✅ 怪物的动画继续播放

## 技术细节

### THREE.Group.traverse()

```javascript
// traverse 会递归遍历所有子对象
group.traverse((child) => {
  // child 可能是 Mesh, Group, Light, Camera 等任何 Object3D
  
  if (child.isMesh) {
    // 这是一个 Mesh
    console.log('Found mesh:', child.name)
  }
})
```

### 克隆颜色

```javascript
// ❌ 错误：直接赋值（引用传递）
const originalColor = mesh.material.color
originalColor.setHex(0xff0000)  // 会同时修改 mesh.material.color

// ✅ 正确：克隆（值传递）
const originalColor = mesh.material.color.clone()
originalColor.setHex(0xff0000)  // 不会影响 mesh.material.color
```

### setTimeout 中的空指针检查

```javascript
setTimeout(() => {
  // 必须检查 child.material 是否存在
  // 因为在 100ms 内，怪物可能已经被销毁了
  if (child.material) {
    child.material.color.copy(originalColor)
  }
}, 100)
```

## 后续优化建议

### 1. 添加受伤音效

```javascript
flashDamage() {
  // 播放受伤音效
  this.experience.audio.play('enemyHit')
  
  // ... 闪烁逻辑 ...
}
```

### 2. 添加受伤粒子效果

```javascript
flashDamage() {
  // 生成血液粒子
  const particles = this.createBloodParticles(this.mesh.position)
  this.scene.add(particles)
  
  // ... 闪烁逻辑 ...
}
```

### 3. 不同伤害程度的反馈

```javascript
flashDamage(damageRatio) {
  // damageRatio = actualDamage / maxHealth
  const flashColor = damageRatio > 0.5 ? 0xff0000 : 0xffff00  // 大伤害红色，小伤害黄色
  
  if (this.mesh.isGroup) {
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        const originalColor = child.material.color.clone()
        child.material.color.setHex(flashColor)  // ← 使用动态颜色
        
        setTimeout(() => {
          if (child.material) {
            child.material.color.copy(originalColor)
          }
        }, damageRatio > 0.5 ? 150 : 100)  // ← 大伤害闪烁更久
      }
    })
  }
}
```

### 4. 受伤动画

```javascript
flashDamage() {
  // 受伤时模型后退
  const knockbackDirection = this.mesh.position.clone().sub(attackSource)
  gsap.to(this.mesh.position, {
    x: this.mesh.position.x + knockbackDirection.x * 0.1,
    z: this.mesh.position.z + knockbackDirection.z * 0.1,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
  })
  
  // ... 闪烁逻辑 ...
}
```

## 涉及的文件

### 修改的文件

1. **`src/js/td/enemy.js`**
   - 修复 `flashDamage()` 方法，支持 Group 和 Mesh
   - 添加了 `traverse()` 遍历子网格

2. **`src/js/td/enemy-model-factory.js`**
   - 在 `createEnemyModel()` 中统一转换怪物类型为小写

### 相关文件（无需修改）

- `src/js/td/enemy-types.js`: 定义怪物类型和属性
- `src/js/td/tower-defense-world.js`: 调用 Enemy 和攻击逻辑

## 总结

### 问题本质

- 旧代码假设 `this.mesh` 是单个 `THREE.Mesh`
- 新模型工厂返回的是 `THREE.Group`（包含多个子 Mesh）
- 直接访问 `Group.material` 会返回 `undefined`，导致 `TypeError`

### 解决方案

- 使用 `traverse()` 方法遍历 Group 中的所有子 Mesh
- 为每个子 Mesh 独立应用闪烁效果
- 兼容旧的单 Mesh 模型

### 效果

- ✅ 怪物被攻击时所有身体部位都会闪烁
- ✅ 游戏流畅运行，不会卡死
- ✅ 代码更加健壮，支持复杂的模型结构

---

**现在可以正常游戏了！** 🎉

