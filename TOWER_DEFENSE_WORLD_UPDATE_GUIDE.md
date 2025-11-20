# tower-defense-world.js 更新说明

由于文件过大（1326行），这里提供关键方法的更新代码片段。请手动替换以下方法：

## 1. 替换 `placeTowerFromDrag` 方法（约597-678行）

将整个 `placeTowerFromDrag(tile, towerType)` 方法替换为：

```javascript
  // 从拖拽放置防御塔
  placeTowerFromDrag(tile, towerType) {
    // 获取塔配置（Level 1）
    const towerConfig = getTowerConfig(towerType.id, 1)
    
    if (!towerConfig) {
      console.error('无效的塔类型:', towerType.id)
      return
    }
    
    // 扣除金币
    this.gameState.updateCredits(-towerConfig.cost)

    // 使用工厂创建防御塔 3D 模型
    const tower = TowerFactory.createTowerMesh(towerConfig.type, towerConfig.level)
    
    // 塔相对于 tile 的位置（tile 的中心，稍微抬高）
    tower.position.set(0, 0.75, 0)
    tower.castShadow = true

    // 塔的数据
    tower.userData = {
      type: towerConfig.type,
      name: towerConfig.name,
      level: towerConfig.level,
      damage: towerConfig.damage,
      range: towerConfig.range,
      cooldown: towerConfig.cooldown * 1000, // 转换为毫秒
      lastAttackTime: 0,
      targetPriority: towerConfig.targetPriority,
      cost: towerConfig.cost,
      tile: tile, // 保存对 tile 的引用
      
      // 特殊效果
      slowEffect: towerConfig.slowEffect || null,
      aoeRadius: towerConfig.aoeRadius || null,
      critChance: towerConfig.critChance || 0,
      critMultiplier: towerConfig.critMultiplier || 1,
      buffEffect: towerConfig.buffEffect || null,
      canTargetGround: towerConfig.canTargetGround !== false,
      
      // 视觉配置
      visual: towerConfig.visual,
    }

    // 将塔添加到 tile（这样塔会跟随 tile 的位置）
    tile.setTower(tower)
    tile.hasTower = true
    
    // 在 tower 的 userData 中保存对 tile 的引用（用于点击检测）
    tower.userData.tile = tile
    
    // 同时添加到 towers 数组用于更新逻辑
    this.towers.push(tower)

    // 放置动画
    tower.scale.set(0, 0, 0)
    import('gsap').then(({ default: gsap }) => {
      gsap.to(tower.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.7)' })
    })

    // 延迟状态更新，避免在事件处理过程中触发响应式循环
    setTimeout(() => {
      // 只保存必要的数据，避免循环引用导致响应式死循环
      const towerData = {
        id: towerConfig.type,
        name: towerConfig.name,
        damage: towerConfig.damage,
        range: towerConfig.range,
        cooldown: towerConfig.cooldown * 1000,
        level: towerConfig.level,
        cost: towerConfig.cost,
        // 只保存坐标，不保存整个对象
        tileX: tile._tileX,
        tileY: tile._tileY,
        // 保存弱引用标识，用于后续查找
        _tileId: `${tile._tileX}-${tile._tileY}`,
        _towerId: tower.uuid || tower.id
      }
      
      // 自动选中刚放置的防御塔
      this.gameState.setSelectedTower(towerData)
      this.gameState.setSelectedPosition(null)
      
      this.gameState.addTowerToData(towerData)
    }, 0)

    console.log(`已放置防御塔: ${towerConfig.name} (Lv${towerConfig.level}) 在 (${tile._tileX}, ${tile._tileY})`)
  }
```

## 2. 找到 `restoreTowers` 方法（约155-222行），在塔创建部分更新

找到这段代码：

```javascript
      // 创建塔 3D 模型
      const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8)
      const material = new THREE.MeshStandardMaterial({ color: '#4299e1' })
      const tower = new THREE.Mesh(geometry, material)
```

替换为：

```javascript
      // 使用塔配置和工厂创建 3D 模型
      const towerConfig = getTowerConfig(towerData.id, towerData.level || 1)
      const tower = towerConfig 
        ? TowerFactory.createTowerMesh(towerConfig.type, towerConfig.level)
        : TowerFactory.createDefaultTower()
```

并在 `tower.userData` 部分添加新配置：

```javascript
      tower.userData = {
        type: towerData.id,
        name: towerData.name,
        level: towerData.level || 1,
        damage: towerData.damage,
        range: towerData.range,
        cooldown: towerData.cooldown,
        lastAttackTime: 0,
        tile: tile,
        // 新增：从配置读取特殊效果
        targetPriority: towerConfig?.targetPriority || 'nearest',
        slowEffect: towerConfig?.slowEffect || null,
        aoeRadius: towerConfig?.aoeRadius || null,
        critChance: towerConfig?.critChance || 0,
        critMultiplier: towerConfig?.critMultiplier || 1,
        buffEffect: towerConfig?.buffEffect || null,
        canTargetGround: towerConfig?.canTargetGround !== false,
        visual: towerConfig?.visual,
      }
```

## 3. 更新 `fireProjectile` 方法（约969-1007行）

找到创建子弹的代码：

```javascript
    // 创建子弹
    const geometry = new THREE.SphereGeometry(0.1, 8, 8)
    const material = new THREE.MeshStandardMaterial({ 
      color: '#fbbf24',
      emissive: '#fbbf24',
      emissiveIntensity: 0.5
    })
    const projectile = new THREE.Mesh(geometry, material)
```

替换为：

```javascript
    // 使用工厂创建子弹（根据塔的配置）
    const towerConfig = getTowerConfig(tower.userData.type, tower.userData.level)
    const projectile = towerConfig 
      ? TowerFactory.createProjectile(towerConfig)
      : TowerFactory.createProjectile({ visual: {} })
```

并在 `projectile.userData` 中添加特殊效果：

```javascript
    projectile.userData = {
      target: enemy,
      speed: towerConfig?.visual?.projectileSpeed || 8,
      damage: tower.userData.damage,
      tower: tower,
      // 特殊效果
      slowEffect: tower.userData.slowEffect,
      aoeRadius: tower.userData.aoeRadius,
      critChance: tower.userData.critChance,
      critMultiplier: tower.userData.critMultiplier,
    }
```

## 完成后

完成上述替换后，塔防系统将使用新的配置系统。下一步将实现：
- 攻击优先级逻辑
- 特殊效果（减速、AOE、暴击）
- 特殊怪物行为

是否需要我继续实现这些功能？



