# 🎨 怪物模型和动画系统指南

## 📋 目录
1. [系统架构](#系统架构)
2. [已实现功能](#已实现功能)
3. [如何使用](#如何使用)
4. [升级到 GLTF 模型](#升级到-gltf-模型)
5. [自定义怪物外观](#自定义怪物外观)
6. [动画系统详解](#动画系统详解)
7. [性能优化建议](#性能优化建议)

---

## 🏗 系统架构

### 核心组件

```
怪物渲染系统
├── EnemyModelFactory (enemy-model-factory.js)
│   ├── 模型创建
│   │   ├── GLTF 模型加载
│   │   └── 程序化生成模型
│   ├── 动画系统
│   │   ├── 骨骼动画 (GLTF)
│   │   └── 程序动画 (Procedural)
│   └── 资源管理
│
├── Enemy (enemy.js)
│   ├── 怪物逻辑
│   ├── 状态管理
│   └── 模型集成
│
└── ENEMY_TYPES (enemy-types.js)
    ├── 怪物类型定义
    ├── 属性计算
    └── 波次配置
```

### 数据流

```
TowerDefenseWorld.spawnEnemy()
    ↓
创建 Enemy 实例 (enemy.js)
    ↓
调用 EnemyModelFactory.createEnemyModel()
    ↓
检查是否有 GLTF 模型
    ├── 有 → 加载 GLTF 模型
    └── 无 → 程序化生成模型
        ├── 创建身体
        ├── 创建头部
        ├── 创建腿部
        ├── 创建手臂
        ├── 添加装甲
        └── 添加特效
    ↓
返回 THREE.Group
    ↓
Enemy.update(dt)
    ↓
调用 EnemyModelFactory.updateAnimation()
    ↓
应用程序动画
    ├── 身体摆动
    ├── 腿部摆动
    ├── 手臂摆动
    └── 特效更新
```

---

## ✅ 已实现功能

### 1. 程序化模型生成

已为 6 种怪物类型创建了不同的程序化模型：

| 怪物类型 | 颜色 | 身体形状 | 特征 |
|---------|------|----------|------|
| **Scout (侦察兵)** | 绿色 | 胶囊体 | 2 腿 + 手臂 + 头部 |
| **Tank (坦克)** | 蓝色 | 立方体 | 4 腿 + 装甲板 |
| **Runner (冲锋兵)** | 橙色 | 流线胶囊体 | 2 腿 + 前倾姿态 |
| **Armored (装甲兵)** | 紫色 | 立方体 | 4 腿 + 重型装甲 |
| **Elite (精英)** | 粉色 | 胶囊体 | 2 腿 + 披风 + 发光 |
| **Boss** | 红色 | 大型立方体 | 4 腿 + 尖刺 + 发光 |

### 2. 程序动画系统

每个怪物都有独特的移动动画：

#### 身体动画
- **上下摆动 (Bob)**: 模拟行走时的起伏
- **左右倾斜 (Tilt)**: 增加动态感
- **前倾 (Lean Forward)**: 冲刺效果（Runner）

#### 肢体动画
- **腿部摆动**: 根据速度调整摆动频率
- **手臂摆动**: 与腿部相反相位
- **披风飘动**: 随风摆动效果（Elite）

#### 参数示例
```javascript
animations: {
  run: {
    bobAmount: 0.15,      // 摆动幅度
    bobSpeed: 8,          // 摆动速度
    tiltAmount: 0.1,      // 倾斜幅度
    legSwingAmount: 0.3,  // 腿部摆动幅度
  }
}
```

### 3. 视觉特效

- **发光效果 (Glow)**: Elite 和 Boss 有半透明发光球体
- **装甲板**: Tank 和 Armored 有金属装甲
- **眼睛**: 所有有头部的怪物都有发红光的眼睛
- **阴影**: 所有模型支持投射和接收阴影

### 4. 模型细节

```javascript
// 身体 (Body)
- 支持 3 种形状：box, capsule, sphere
- 自定义尺寸：width, height, depth
- 材质：MeshStandardMaterial (支持光照)

// 头部 (Head)
- 球形几何体
- 自动添加红色发光眼睛
- 位置自动调整到身体上方

// 腿部 (Legs)
- 支持 2 腿或 4 腿
- 胶囊体形状
- 自动计算位置分布

// 手臂 (Arms)
- 胶囊体形状
- 自动放置在身体两侧
- 跟随奔跑动画摆动

// 装甲 (Armor)
- 胸甲 (Chest Plate)
- 肩甲 (Shoulder Armor) - 仅重型装甲
- 高金属度材质

// 披风 (Cape)
- 平面几何体
- 双面材质
- 随风摆动动画
```

---

## 🎮 如何使用

### 当前状态

模型系统已完全集成到游戏中，**无需任何额外配置**！

```javascript
// 自动运行流程：
// 1. 玩家点击"开始下一波"
// 2. TowerDefenseWorld.startWave() 被调用
// 3. spawnEnemy() 每隔 1 秒生成一个怪物
// 4. Enemy 构造函数自动使用 EnemyModelFactory 创建模型
// 5. Enemy.update() 自动更新动画

// 你不需要做任何事情！✅
```

### 测试动画效果

1. 启动开发服务器
   ```bash
   npm run dev
   ```

2. 切换到外城
3. 点击"开始下一波"
4. 观察不同类型的怪物
   - 第 1-3 波：主要是 **Scout** (绿色) 和 **Runner** (橙色)
   - 第 4-6 波：开始出现 **Tank** (蓝色)
   - 第 7-10 波：混合 **Armored** (紫色) 和 **Elite** (粉色)
   - 第 5, 10, 15... 波：**Boss** (红色，超大)

### 观察要点

- ✅ 怪物的**身体会上下摆动**
- ✅ 怪物的**腿会前后摆动**
- ✅ 怪物的**手臂会摆动**（2 腿怪物）
- ✅ **速度越快，摆动越快**
- ✅ Elite 的**披风会飘动**
- ✅ Boss 和 Elite 会**发光**
- ✅ Tank 和 Armored 有**装甲板**

---

## 🎨 升级到 GLTF 模型

如果你有专业的 3D 模型（推荐），可以轻松升级：

### 步骤1：准备 GLTF 模型

#### 推荐工具
- **Blender** (免费): https://www.blender.org/
- **Mixamo** (免费动画): https://www.mixamo.com/
- **Sketchfab** (下载模型): https://sketchfab.com/

#### 模型要求
- 格式：`.glb` 或 `.gltf`
- 大小：建议 < 2MB
- 动画：包含 `run` 或 `walk` 动画
- 朝向：模型面向 +Z 轴

#### 示例模型结构
```
models/
└── enemies/
    ├── scout.glb          # 侦察兵模型
    ├── tank.glb           # 坦克模型
    ├── runner.glb         # 冲锋兵模型
    ├── armored.glb        # 装甲兵模型
    ├── elite.glb          # 精英模型
    └── boss.glb           # Boss模型
```

### 步骤2：在 sources.js 中注册模型

```javascript
// src/js/sources.js

export default [
  // ... 现有资源 ...
  
  // 怪物模型
  {
    name: 'enemyScout',
    type: 'gltfModel',
    path: 'models/enemies/scout.glb',
  },
  {
    name: 'enemyTank',
    type: 'gltfModel',
    path: 'models/enemies/tank.glb',
  },
  {
    name: 'enemyRunner',
    type: 'gltfModel',
    path: 'models/enemies/runner.glb',
  },
  {
    name: 'enemyArmored',
    type: 'gltfModel',
    path: 'models/enemies/armored.glb',
  },
  {
    name: 'enemyElite',
    type: 'gltfModel',
    path: 'models/enemies/elite.glb',
  },
  {
    name: 'enemyBoss',
    type: 'gltfModel',
    path: 'models/enemies/boss.glb',
  },
]
```

### 步骤3：更新 enemy-model-factory.js 配置

```javascript
// src/js/td/enemy-model-factory.js

const ENEMY_MODEL_CONFIG = {
  scout: {
    // ===== 设置 GLTF 路径 =====
    modelPath: 'enemyScout',  // 对应 sources.js 中的 name
    scale: 0.01,              // 可选：调整模型大小
    animations: {
      run: {
        type: 'gltf',         // 使用 GLTF 动画
        clipName: 'run',      // 动画剪辑名称
        timeScale: 1.5,       // 播放速度
      },
    },
  },
  
  tank: {
    modelPath: 'enemyTank',
    scale: 0.015,
    animations: {
      run: {
        type: 'gltf',
        clipName: 'walk',
        timeScale: 1.0,
      },
    },
  },
  
  // ... 其他怪物类型 ...
}
```

### 步骤4：添加 GLTF 加载和动画播放代码

在 `enemy-model-factory.js` 中添加 GLTF 模型加载方法：

```javascript
/**
 * 创建 GLTF 模型
 */
createGLTFModel(modelName, stats) {
  const gltfData = this.resources.items[modelName]
  if (!gltfData) {
    console.warn(`GLTF 模型 ${modelName} 未加载，使用程序化模型`)
    return this.createDefaultModel(stats)
  }
  
  // 克隆模型（避免多个实例共享同一模型）
  const model = gltfData.scene.clone()
  
  // 调整大小
  const config = ENEMY_MODEL_CONFIG[stats.type.toLowerCase()]
  if (config.scale) {
    model.scale.setScalar(config.scale)
  }
  
  // 确保所有子网格可以投射阴影
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  
  // 设置动画混合器
  if (gltfData.animations && gltfData.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model)
    this.animationMixers.set(model.uuid, mixer)
    
    // 查找并播放 run 动画
    const runClip = THREE.AnimationClip.findByName(gltfData.animations, 'run')
    if (runClip) {
      const action = mixer.clipAction(runClip)
      action.play()
    } else {
      // 如果没有 run 动画，播放第一个动画
      const action = mixer.clipAction(gltfData.animations[0])
      action.play()
    }
  }
  
  // 存储动画配置
  model.userData.animationConfig = config.animations
  model.userData.animationType = 'gltf'
  
  return model
}
```

### 步骤5：更新动画更新逻辑

在 `updateAnimation` 方法中添加 GLTF 动画支持：

```javascript
updateAnimation(model, dt, speed) {
  // GLTF 骨骼动画
  if (model.userData.animationType === 'gltf') {
    const mixer = this.animationMixers.get(model.uuid)
    if (mixer) {
      mixer.update(dt * speed / 2.0) // 根据速度调整动画速度
    }
    return
  }
  
  // 程序动画（现有代码）
  const animState = model.userData.animationState
  if (!animState) return
  // ... 现有的程序动画代码 ...
}
```

---

## 🎨 自定义怪物外观

### 修改现有怪物

在 `enemy-model-factory.js` 中修改 `ENEMY_MODEL_CONFIG`:

```javascript
const ENEMY_MODEL_CONFIG = {
  scout: {
    proceduralConfig: {
      bodyColor: '#10b981',       // 改成你想要的颜色
      bodyShape: 'capsule',       // 'box', 'capsule', 'sphere'
      bodySize: { 
        width: 0.4,               // 调整宽度
        height: 0.8,              // 调整高度
        depth: 0.4                // 调整深度
      },
      hasLegs: true,              // 是否有腿
      legCount: 2,                // 腿的数量 (2 或 4)
      hasArms: true,              // 是否有手臂
      hasHead: true,              // 是否有头
      headSize: 0.25,             // 头的大小
    },
    animations: {
      run: {
        bobAmount: 0.15,          // 上下摆动幅度 (0-0.3)
        bobSpeed: 8,              // 摆动速度 (1-15)
        tiltAmount: 0.1,          // 左右倾斜幅度 (0-0.2)
        legSwingAmount: 0.3,      // 腿摆动幅度 (0-0.5)
      },
    },
  },
}
```

### 添加新怪物类型

```javascript
// 1. 在 enemy-types.js 中定义新类型
export const ENEMY_TYPES = {
  // ... 现有类型 ...
  
  NINJA: {
    id: 'NINJA',
    name: '忍者',
    color: '#1f2937', // 黑色
    baseHealth: 60,
    baseSpeed: 4.0,
    baseDefense: 0.1,
    baseReward: 15,
    // ... 缩放参数
  },
}

// 2. 在 enemy-model-factory.js 中添加配置
const ENEMY_MODEL_CONFIG = {
  // ... 现有配置 ...
  
  ninja: {
    proceduralConfig: {
      bodyColor: '#1f2937',
      bodyShape: 'capsule',
      bodySize: { width: 0.35, height: 0.85, depth: 0.35 },
      hasLegs: true,
      legCount: 2,
      hasArms: true,
      hasHead: true,
      headSize: 0.2,
      streamline: true,
    },
    animations: {
      run: {
        bobAmount: 0.25,
        bobSpeed: 12,
        tiltAmount: 0.2,
        legSwingAmount: 0.5,
        leanForward: 0.3, // 忍者跑步时身体前倾
      },
    },
  },
}

// 3. 在 getWaveComposition 中添加到波次配置
export function getWaveComposition(wave) {
  // ...
  
  if (wave > 15) {
    composition.push({ type: 'NINJA', count: Math.ceil(totalEnemies * 0.2) })
  }
  
  // ...
}
```

---

## 🎬 动画系统详解

### 程序动画原理

程序动画使用**正弦波**模拟生物运动：

```javascript
// 上下摆动
const bobOffset = Math.sin(time * speed) * amount

// 前后摆动（腿）
const legSwing = Math.sin(time * speed + phase) * amount

// 左右摆动
const tilt = Math.sin(time * speed) * amount
```

### 参数调优指南

| 参数 | 范围 | 效果 | 建议值 |
|------|------|------|--------|
| `bobAmount` | 0-0.3 | 身体上下起伏 | 轻型:0.15, 重型:0.06 |
| `bobSpeed` | 1-15 | 摆动频率 | 快速:12, 慢速:3 |
| `tiltAmount` | 0-0.2 | 身体倾斜 | 灵活:0.15, 笨重:0.03 |
| `legSwingAmount` | 0-0.5 | 腿部摆动 | 大步:0.4, 小步:0.15 |
| `leanForward` | 0-0.3 | 身体前倾 | 冲刺:0.2-0.3 |

### 多腿动画相位

```javascript
// 2 腿：左右交替
leg0: phase = 0
leg1: phase = Math.PI

// 4 腿：对角线同步
leg0: phase = 0
leg1: phase = Math.PI
leg2: phase = Math.PI
leg3: phase = 0
```

---

## ⚡ 性能优化建议

### 当前性能

- **程序化模型**: 非常轻量，每个怪物约 ~100 顶点
- **动画计算**: CPU 端，轻量级三角函数
- **内存占用**: 极小，所有怪物共享几何体和材质

### 如果使用 GLTF 模型

#### 优化策略

```javascript
// 1. 实例化 (Instancing)
// 对于相同类型的怪物，使用 InstancedMesh
const scoutGeometry = scoutModel.children[0].geometry
const scoutMaterial = scoutModel.children[0].material
const scoutInstances = new THREE.InstancedMesh(scoutGeometry, scoutMaterial, 100)

// 2. LOD (Level of Detail)
// 距离远时使用低模
const lod = new THREE.LOD()
lod.addLevel(highDetailModel, 0)
lod.addLevel(midDetailModel, 10)
lod.addLevel(lowDetailModel, 20)

// 3. 动画简化
// 远距离怪物降低动画更新频率
if (distanceToCamera > 15) {
  updateAnimationEveryNFrames(3) // 每 3 帧更新一次
}

// 4. 减面 (Decimation)
// 在 Blender 中使用 Decimate Modifier
// 目标：远景怪物 < 500 三角面，近景 < 2000 三角面
```

### 内存管理

```javascript
// 及时清理已销毁的怪物
dispose(model) {
  // 清理动画混合器
  const mixer = this.animationMixers.get(model.uuid)
  if (mixer) {
    mixer.stopAllAction()
    this.animationMixers.delete(model.uuid)
  }
  
  // 清理几何体和材质
  model.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}
```

---

## 🚀 下一步建议

### 短期（快速实现）

1. **微调动画参数**
   - 调整每个怪物的 `bobAmount`, `bobSpeed`
   - 让不同怪物的动作更有区分度

2. **添加特效**
   - 怪物生成时的传送门效果
   - 怪物死亡时的爆炸效果
   - Boss 登场时的震屏效果

3. **优化视觉反馈**
   - 怪物受伤时红色闪烁更明显
   - 添加血条（已有基础代码）
   - 慢速效果时颜色变蓝

### 中期（需要美术资源）

1. **替换为 GLTF 模型**
   - 从 Mixamo 下载免费角色模型
   - 添加 `run` 和 `walk` 动画
   - 为不同怪物设计独特外观

2. **添加更多动画**
   - `idle` (待机)
   - `attack` (攻击，未来可能用到)
   - `death` (死亡)

3. **粒子特效**
   - 奔跑时的尘土
   - Elite 的魔法光环
   - Boss 的火焰特效

### 长期（高级功能）

1. **骨骼绑定武器/装备**
   - 怪物携带武器
   - 根据波次更换装备

2. **面部表情**
   - 眼睛跟随玩家塔
   - 受伤时的表情

3. **群体动画**
   - 多个怪物协同动作
   - Boss 召唤小怪

---

## 📚 相关资源

### 免费 3D 模型网站

- **Mixamo**: https://www.mixamo.com/
  - 免费角色 + 动画
  - 可自动绑定骨骼

- **Sketchfab**: https://sketchfab.com/
  - 海量免费模型
  - 支持 CC0 授权

- **Poly Pizza**: https://poly.pizza/
  - 低模风格
  - 免费商用

### Three.js 动画教程

- **官方文档**: https://threejs.org/docs/#manual/en/introduction/Animation-system
- **GLTF 加载**: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- **动画混合器**: https://threejs.org/docs/#api/en/animation/AnimationMixer

### Blender 教程

- **官方教程**: https://www.blender.org/support/tutorials/
- **低模建模**: https://www.youtube.com/watch?v=5TCzRIb3H_c
- **导出 GLTF**: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html

---

## 🎉 总结

你现在已经有了一个完整的怪物模型和动画系统！

### ✅ 当前状态

- ✅ 6 种不同的程序化怪物模型
- ✅ 独特的奔跑动画
- ✅ 根据速度自动调整动画
- ✅ 完整的资源管理和清理
- ✅ 可扩展的架构（支持 GLTF）

### 🎯 下一步

1. **运行游戏，观察效果**
2. **微调动画参数**（可选）
3. **准备 GLTF 模型**（可选，推荐）

祝你游戏开发顺利！🚀

