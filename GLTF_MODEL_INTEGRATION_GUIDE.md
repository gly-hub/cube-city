# 🎨 GLTF 模型集成完整指南

## 📦 第一步：准备 GLTF 模型

### 推荐的免费资源网站

#### 1. **Mixamo** (最推荐！) ⭐⭐⭐⭐⭐
- **网址**: https://www.mixamo.com/
- **优势**:
  - 完全免费，无需授权
  - 大量高质量角色模型
  - 自带专业动画（走路、跑步、攻击等）
  - 自动骨骼绑定
  - 可直接下载 FBX，然后转换为 GLB
- **适合**: 人形怪物、角色类

**使用步骤**:
1. 注册/登录 Adobe 账号
2. 选择一个角色（如 "X Bot", "Mutant" 等）
3. 选择动画（搜索 "run" 或 "walk"）
4. 点击 "Download"
5. 格式选择 **"FBX for Unity (.fbx)"**
6. Skin 选择 **"With Skin"**
7. Frames per second 选择 **"30"**
8. 下载后用 Blender 转换为 GLB

#### 2. **Sketchfab** ⭐⭐⭐⭐
- **网址**: https://sketchfab.com/
- **优势**:
  - 海量 3D 模型
  - 支持 **"Downloadable"** 过滤
  - 许多模型支持 CC0 授权（可商用）
  - 直接下载 GLB 格式
- **适合**: 怪物、生物、机器人

**搜索技巧**:
```
搜索词示例：
- "low poly monster"
- "cartoon enemy"
- "robot animated"
- "creature rigged"

过滤器：
☑️ Downloadable
☑️ Animated (如果需要动画)
License: CC Attribution / CC0
```

#### 3. **Poly Pizza** ⭐⭐⭐
- **网址**: https://poly.pizza/
- **优势**:
  - 全部 CC0 授权（免费商用）
  - 低模风格，性能友好
  - 直接下载 GLB
- **适合**: 简约风格、2.5D 游戏

#### 4. **Quaternius** ⭐⭐⭐⭐
- **网址**: http://quaternius.com/
- **优势**:
  - 全部 CC0 授权
  - 专为游戏设计
  - 统一的低模风格
  - 提供完整资源包
- **适合**: 低多边形游戏

### 模型要求

| 属性 | 要求 | 推荐值 |
|------|------|--------|
| **格式** | `.glb` 或 `.gltf` | `.glb` (单文件) |
| **文件大小** | < 5MB | < 2MB |
| **三角面数** | < 5000 | 1000-2000 |
| **贴图分辨率** | < 2048x2048 | 512x512 或 1024x1024 |
| **骨骼数量** | < 50 | 20-30 |
| **动画** | 至少包含 `run` 或 `walk` | 包含 idle, run, attack |
| **朝向** | 面向 +Z 轴 | 标准 Three.js 方向 |
| **比例** | 高度约 1-2 单位 | 1.8 单位（人形） |

### 模型结构示例

```
monster.glb
├── Geometry
│   ├── Body (Mesh)
│   ├── Head (Mesh)
│   └── Limbs (Mesh)
├── Armature (Skeleton)
│   ├── Root Bone
│   ├── Spine Bones
│   ├── Leg Bones
│   └── Arm Bones
└── Animations
    ├── idle (AnimationClip)
    ├── run (AnimationClip)
    └── attack (AnimationClip)
```

---

## 🔄 第二步：格式转换（如果需要）

### FBX → GLB 转换

#### 方法1：使用 Blender（免费）

1. **下载 Blender**: https://www.blender.org/

2. **导入 FBX**:
   ```
   File → Import → FBX (.fbx)
   选择你的 .fbx 文件
   ```

3. **调整模型**（可选）:
   ```
   - 选中模型 (点击模型)
   - 调整位置: G 键 (移动), R 键 (旋转), S 键 (缩放)
   - 确保模型面向 +Y 轴（在 Blender 中）
   ```

4. **导出 GLB**:
   ```
   File → Export → glTF 2.0 (.glb/.gltf)
   
   设置：
   ☑️ Format: glTF Binary (.glb)
   ☑️ Include: Selected Objects (如果只选了模型)
   ☑️ Transform:
      - +Y Up (让 Three.js 正确显示)
   ☑️ Geometry:
      - ☑️ Apply Modifiers
      - ☑️ UVs
      - ☑️ Normals
   ☑️ Animation:
      - ☑️ Animation
      - ☑️ Shape Keys
   
   点击 "Export glTF 2.0"
   ```

5. **验证模型**:
   - 在线查看器: https://gltf-viewer.donmccurdy.com/
   - 拖入你的 .glb 文件
   - 检查模型方向、动画是否正常

#### 方法2：在线转换（快速）

- **网址**: https://products.aspose.app/3d/conversion/fbx-to-glb
- 上传 FBX → 下载 GLB
- 无需安装软件

### 优化模型（推荐）

使用 **gltf-transform** 工具压缩模型：

```bash
# 安装
npm install -g @gltf-transform/cli

# 压缩模型
gltf-transform optimize input.glb output.glb --texture-compress webp

# 查看模型信息
gltf-transform inspect input.glb
```

---

## 📂 第三步：将模型添加到项目

### 1. 创建模型文件夹

```bash
cd /Users/mac/my-project/cube-city
mkdir -p public/models/enemies
```

### 2. 放置模型文件

将你的 `.glb` 文件放入 `public/models/enemies/` 文件夹：

```
public/
└── models/
    └── enemies/
        ├── scout.glb        # 侦察兵模型
        ├── tank.glb         # 坦克模型
        ├── runner.glb       # 冲锋兵模型
        ├── armored.glb      # 装甲兵模型
        ├── elite.glb        # 精英模型
        └── boss.glb         # Boss 模型
```

**重命名建议**:
- 使用小写字母
- 使用短横线分隔单词（如 `heavy-tank.glb`）
- 避免空格和特殊字符

---

## ⚙️ 第四步：修改代码集成模型

### 1. 在 `sources.js` 中注册模型

```javascript
// src/js/sources.js

export default [
  // ... 现有资源 ...
  
  // ===== 怪物 GLTF 模型 =====
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

### 2. 更新 `enemy-model-factory.js` 配置

```javascript
// src/js/td/enemy-model-factory.js

const ENEMY_MODEL_CONFIG = {
  scout: {
    // ===== 启用 GLTF 模型 =====
    modelPath: 'enemyScout',  // 对应 sources.js 中的 name
    scale: 0.6,               // 调整模型大小（可选）
    
    // 保留程序化配置作为备用
    proceduralConfig: {
      bodyColor: '#10b981',
      bodyShape: 'capsule',
      bodySize: { width: 0.4, height: 0.8, depth: 0.4 },
      hasLegs: true,
      legCount: 2,
      hasArms: true,
      hasHead: true,
      headSize: 0.25,
    },
    
    // 动画配置
    animations: {
      run: {
        type: 'gltf',          // ← 改为 'gltf'
        clipName: 'run',       // GLTF 动画剪辑名称
        timeScale: 1.2,        // 播放速度倍率
      },
    },
  },
  
  tank: {
    modelPath: 'enemyTank',
    scale: 0.8,
    proceduralConfig: { /* ... */ },
    animations: {
      run: {
        type: 'gltf',
        clipName: 'walk',      // 或者 'run'
        timeScale: 0.8,        // 坦克移动慢
      },
    },
  },
  
  // ... 其他怪物类型 ...
}
```

### 3. 实现 `createGLTFModel` 方法

在 `enemy-model-factory.js` 中添加：

```javascript
/**
 * 创建 GLTF 模型
 * @param {string} modelName - 模型资源名称
 * @param {object} stats - 怪物属性
 * @returns {THREE.Group} GLTF 模型组
 */
createGLTFModel(modelName, stats) {
  const gltfData = this.resources.items[modelName]
  if (!gltfData) {
    console.warn(`GLTF 模型 ${modelName} 未加载，使用程序化模型`)
    return this.createProceduralModel(this.getConfigByModelPath(modelName), stats)
  }
  
  // 克隆模型（重要！避免多个实例共享同一模型）
  const model = gltfData.scene.clone()
  
  // 查找模型配置
  const config = this.getConfigByModelPath(modelName)
  
  // 调整大小
  if (config && config.scale) {
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
    
    // 查找并播放指定动画
    const animConfig = config?.animations?.run
    const clipName = animConfig?.clipName || 'run'
    
    let clip = THREE.AnimationClip.findByName(gltfData.animations, clipName)
    
    // 如果没找到指定动画，使用第一个动画
    if (!clip && gltfData.animations.length > 0) {
      console.warn(`动画 "${clipName}" 未找到，使用第一个动画`)
      clip = gltfData.animations[0]
    }
    
    if (clip) {
      const action = mixer.clipAction(clip)
      
      // 设置播放速度
      if (animConfig?.timeScale) {
        action.timeScale = animConfig.timeScale
      }
      
      action.play()
      console.log(`播放动画: ${clip.name}`)
    }
  }
  
  // 存储动画配置
  model.userData.animationConfig = config?.animations
  model.userData.animationType = 'gltf'
  
  return model
}

/**
 * 根据 modelPath 查找配置
 */
getConfigByModelPath(modelPath) {
  for (const [type, config] of Object.entries(ENEMY_MODEL_CONFIG)) {
    if (config.modelPath === modelPath) {
      return config
    }
  }
  return null
}
```

### 4. 更新 `updateAnimation` 方法

```javascript
/**
 * 更新动画
 * @param {THREE.Group} model - 怪物模型
 * @param {number} dt - 帧时间
 * @param {number} speed - 当前速度
 */
updateAnimation(model, dt, speed) {
  // ===== GLTF 骨骼动画 =====
  if (model.userData.animationType === 'gltf') {
    const mixer = this.animationMixers.get(model.uuid)
    if (mixer) {
      // 根据怪物速度调整动画速度
      const speedMultiplier = speed / 2.0
      mixer.update(dt * speedMultiplier)
    }
    return
  }
  
  // ===== 程序动画（现有代码） =====
  const animState = model.userData.animationState
  if (!animState)
    return
  
  animState.time += dt
  
  const animConfig = model.userData.animationConfig
  if (!animConfig)
    return
  
  const currentAnim = animConfig[animState.currentAnimation]
  if (!currentAnim)
    return
  
  // 程序动画
  if (currentAnim.type === 'procedural') {
    this.updateProceduralAnimation(model, animState.time, currentAnim, speed)
  }
}
```

### 5. 更新 `dispose` 方法

```javascript
/**
 * 清理资源
 */
dispose(model) {
  // 清理动画混合器
  const mixer = this.animationMixers.get(model.uuid)
  if (mixer) {
    mixer.stopAllAction()
    this.animationMixers.delete(model.uuid)
  }
  
  // 清理几何体和材质
  model.traverse((child) => {
    if (child.geometry)
      child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      }
      else {
        child.material.dispose()
      }
    }
  })
}
```

---

## 🎯 第五步：测试和调试

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 检查模型加载

打开浏览器控制台，查看：

```
✅ 正常加载：
[Resources] Loading: enemyScout
[Resources] Loaded: enemyScout (1.2 MB)
播放动画: run

❌ 加载失败：
[Resources] Error loading: enemyScout
GLTF 模型 enemyScout 未加载，使用程序化模型
```

### 3. 调试常见问题

#### 问题1：模型太大或太小

**解决**：调整 `scale` 参数

```javascript
scout: {
  modelPath: 'enemyScout',
  scale: 0.01,  // ← 试试不同的值：0.01, 0.1, 0.5, 1.0
  // ...
}
```

#### 问题2：模型朝向错误

**解决**：在 Blender 中调整，或在代码中旋转

```javascript
createGLTFModel(modelName, stats) {
  // ...
  const model = gltfData.scene.clone()
  
  // 旋转模型使其面向正确方向
  model.rotation.y = Math.PI  // 旋转 180 度
  
  // ...
}
```

#### 问题3：动画不播放

**解决**：检查动画剪辑名称

```javascript
// 在控制台打印所有可用动画
console.log('可用动画:', gltfData.animations.map(a => a.name))

// 输出可能是：
// 可用动画: ['Idle', 'Run', 'Walk', 'Attack']

// 然后在配置中使用正确的名称
animations: {
  run: {
    type: 'gltf',
    clipName: 'Run',  // ← 注意大小写
    timeScale: 1.0,
  },
}
```

#### 问题4：模型太暗

**解决**：增加材质的亮度

```javascript
createGLTFModel(modelName, stats) {
  // ...
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      
      // 增加材质亮度
      if (child.material) {
        child.material.emissive = new THREE.Color(0x222222)
        child.material.emissiveIntensity = 0.5
      }
    }
  })
  // ...
}
```

---

## 📊 性能优化

### 1. 使用实例化（Instancing）

对于相同类型的多个怪物，使用 `InstancedMesh`：

```javascript
// 在 TowerDefenseWorld 中
createEnemyInstancePool() {
  // 为每种怪物类型创建实例池
  this.enemyInstances = {
    scout: new THREE.InstancedMesh(scoutGeometry, scoutMaterial, 50),
    tank: new THREE.InstancedMesh(tankGeometry, tankMaterial, 20),
    // ...
  }
  
  // 添加到场景
  Object.values(this.enemyInstances).forEach(instance => {
    this.root.add(instance)
  })
}
```

### 2. LOD (Level of Detail)

根据距离切换模型精度：

```javascript
createGLTFModel(modelName, stats) {
  const model = gltfData.scene.clone()
  
  // 创建 LOD
  const lod = new THREE.LOD()
  lod.addLevel(model, 0)              // 近距离：完整模型
  lod.addLevel(simplifiedModel, 10)   // 中距离：简化模型
  lod.addLevel(verySimpleModel, 20)   // 远距离：极简模型
  
  return lod
}
```

### 3. 减少绘制调用

合并相同材质的网格：

```javascript
// 在 Blender 中：
// 1. 选中所有使用相同材质的对象
// 2. Ctrl + J 合并
// 3. 导出
```

---

## 🎨 示例：快速测试一个模型

### 使用 Mixamo（推荐新手）

1. **选择角色**:
   - 访问 https://www.mixamo.com/
   - 登录后，选择 "Y Bot"（简单的机器人）

2. **选择动画**:
   - 在右侧搜索 "run"
   - 选择 "Running" 动画
   - 调整 "Trim" 和 "Overdrive"（可选）

3. **下载**:
   - 点击 "Download"
   - Format: **FBX for Unity (.fbx)**
   - Skin: **With Skin**
   - Frames per second: **30**
   - 下载

4. **转换为 GLB**:
   - 打开 Blender
   - File → Import → FBX → 选择下载的文件
   - File → Export → glTF 2.0 (.glb)
   - Format: **glTF Binary (.glb)**
   - Transform: **+Y Up**
   - Animation: **☑️ 勾选**
   - 保存为 `scout.glb`

5. **放入项目**:
   ```bash
   mv scout.glb public/models/enemies/
   ```

6. **更新配置**:
   ```javascript
   // src/js/sources.js
   {
     name: 'enemyScout',
     type: 'gltfModel',
     path: 'models/enemies/scout.glb',
   }
   
   // src/js/td/enemy-model-factory.js
   scout: {
     modelPath: 'enemyScout',
     scale: 0.01,  // Mixamo 模型通常很大，需要缩小
     animations: {
       run: {
         type: 'gltf',
         clipName: 'mixamo.com',  // Mixamo 的动画通常叫这个
         timeScale: 1.0,
       },
     },
   }
   ```

7. **运行测试**:
   ```bash
   npm run dev
   ```

---

## 🆘 故障排除

### 检查清单

- [ ] 模型文件在 `public/models/enemies/` 文件夹中
- [ ] 文件名和路径完全匹配（注意大小写）
- [ ] `sources.js` 中已注册模型
- [ ] `ENEMY_MODEL_CONFIG` 中设置了 `modelPath`
- [ ] 实现了 `createGLTFModel` 方法
- [ ] 更新了 `updateAnimation` 方法
- [ ] 控制台没有加载错误

### 调试技巧

```javascript
// 在 createGLTFModel 中添加调试日志
createGLTFModel(modelName, stats) {
  console.log('🎨 加载 GLTF 模型:', modelName)
  
  const gltfData = this.resources.items[modelName]
  console.log('📦 GLTF 数据:', gltfData)
  
  if (gltfData.animations) {
    console.log('🎬 可用动画:', gltfData.animations.map(a => a.name))
  }
  
  const model = gltfData.scene.clone()
  console.log('👾 模型层级:', model)
  
  // ...
}
```

---

## ✅ 完成检查

完成以下步骤后，你的 GLTF 模型应该已经成功集成：

1. ✅ 下载了 GLTF 模型（或从 FBX 转换）
2. ✅ 模型放在 `public/models/enemies/` 文件夹
3. ✅ 在 `sources.js` 中注册模型
4. ✅ 更新 `ENEMY_MODEL_CONFIG` 配置
5. ✅ 实现 `createGLTFModel` 方法
6. ✅ 更新 `updateAnimation` 方法
7. ✅ 测试通过，模型正确显示和动画

---

## 🎉 效果预览

替换为 GLTF 模型后的效果：

| 程序化模型 | GLTF 模型 |
|-----------|----------|
| 🟢 简单方块 | 🎨 高质量 3D 角色 |
| 🟢 低多边形 | 🎨 真实细节 |
| 🟢 程序动画 | 🎨 骨骼动画 |
| 🟢 性能极佳 | 🟡 性能良好 |
| 🟢 即时生成 | 🔴 需要下载 |

**建议**：
- 新手/快速原型：使用程序化模型
- 追求质量/发布版本：使用 GLTF 模型
- 混合使用：重要怪物用 GLTF，小怪用程序化

祝你成功集成 GLTF 模型！🚀

