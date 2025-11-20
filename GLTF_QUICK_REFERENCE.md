# 🚀 GLTF 模型集成 - 快速参考

## 📥 快速开始（5 分钟）

### 1. 下载免费模型

**Mixamo（最简单）**:
```
1. 访问 https://www.mixamo.com/
2. 登录 → 选择 "Y Bot" → 选择 "Running" 动画
3. Download → FBX for Unity → With Skin → 30 FPS
```

**Sketchfab（更多选择）**:
```
1. 访问 https://sketchfab.com/
2. 搜索 "low poly monster downloadable"
3. 下载 GLB 格式
```

### 2. 转换为 GLB（如果是 FBX）

**Blender（免费）**:
```
File → Import → FBX
File → Export → glTF 2.0 (.glb)
- Format: glTF Binary (.glb)
- Transform: +Y Up
- Animation: ☑️
```

**在线转换（更快）**:
```
https://products.aspose.app/3d/conversion/fbx-to-glb
```

### 3. 放入项目

```bash
# 创建文件夹
mkdir -p public/models/enemies

# 复制模型
mv scout.glb public/models/enemies/
```

### 4. 修改代码（3 处）

#### A. `src/js/sources.js`

```javascript
export default [
  // ... 现有资源 ...
  
  {
    name: 'enemyScout',           // ← 资源名称
    type: 'gltfModel',
    path: 'models/enemies/scout.glb',  // ← 文件路径
  },
]
```

#### B. `src/js/td/enemy-model-factory.js`（配置）

```javascript
const ENEMY_MODEL_CONFIG = {
  scout: {
    modelPath: 'enemyScout',      // ← 对应 sources.js 的 name
    scale: 0.01,                  // ← 调整大小（Mixamo 通常是 0.01）
    
    // 保留程序化配置作为备用
    proceduralConfig: { /* ... */ },
    
    animations: {
      run: {
        type: 'gltf',             // ← 改为 'gltf'
        clipName: 'mixamo.com',   // ← Mixamo 的动画名
        timeScale: 1.0,
      },
    },
  },
}
```

#### C. `src/js/td/enemy-model-factory.js`（实现方法）

**添加这 3 个方法**:

1️⃣ **加载 GLTF 模型**:

```javascript
createGLTFModel(modelName, stats) {
  const gltfData = this.resources.items[modelName]
  if (!gltfData) {
    console.warn(`GLTF 模型 ${modelName} 未加载`)
    return this.createProceduralModel(this.getConfigByModelPath(modelName), stats)
  }
  
  const model = gltfData.scene.clone()
  const config = this.getConfigByModelPath(modelName)
  
  // 调整大小
  if (config?.scale) {
    model.scale.setScalar(config.scale)
  }
  
  // 启用阴影
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  
  // 设置动画
  if (gltfData.animations?.length > 0) {
    const mixer = new THREE.AnimationMixer(model)
    this.animationMixers.set(model.uuid, mixer)
    
    const clipName = config?.animations?.run?.clipName || 'run'
    let clip = THREE.AnimationClip.findByName(gltfData.animations, clipName)
    
    if (!clip) {
      clip = gltfData.animations[0]
    }
    
    if (clip) {
      const action = mixer.clipAction(clip)
      if (config?.animations?.run?.timeScale) {
        action.timeScale = config.animations.run.timeScale
      }
      action.play()
    }
  }
  
  model.userData.animationType = 'gltf'
  model.userData.animationConfig = config?.animations
  
  return model
}
```

2️⃣ **查找配置**:

```javascript
getConfigByModelPath(modelPath) {
  for (const [type, config] of Object.entries(ENEMY_MODEL_CONFIG)) {
    if (config.modelPath === modelPath) {
      return config
    }
  }
  return null
}
```

3️⃣ **更新动画（修改现有方法）**:

```javascript
updateAnimation(model, dt, speed) {
  // ===== 新增：支持 GLTF 动画 =====
  if (model.userData.animationType === 'gltf') {
    const mixer = this.animationMixers.get(model.uuid)
    if (mixer) {
      const speedMultiplier = speed / 2.0
      mixer.update(dt * speedMultiplier)
    }
    return
  }
  
  // ===== 原有代码：程序动画 =====
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
  
  if (currentAnim.type === 'procedural') {
    this.updateProceduralAnimation(model, animState.time, currentAnim, speed)
  }
}
```

4️⃣ **清理资源（修改现有方法）**:

```javascript
dispose(model) {
  // ===== 新增：清理动画混合器 =====
  const mixer = this.animationMixers.get(model.uuid)
  if (mixer) {
    mixer.stopAllAction()
    this.animationMixers.delete(model.uuid)
  }
  
  // ===== 原有代码：清理几何体和材质 =====
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

### 5. 测试

```bash
npm run dev
```

---

## 🐛 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| **模型没显示** | 检查 `scale` 值，试试 `0.01`, `0.1`, `0.5` |
| **模型太大** | 减小 `scale`，如 `scale: 0.01` |
| **模型朝向错误** | 在 Blender 中旋转 Y 轴 180°，或代码中 `model.rotation.y = Math.PI` |
| **动画不播放** | 打印 `gltfData.animations.map(a => a.name)`，检查动画名称 |
| **模型太暗** | 添加 `child.material.emissive = new THREE.Color(0x222222)` |
| **控制台报错 404** | 检查文件路径和名称是否正确 |
| **动画太快/太慢** | 调整 `timeScale`，如 `timeScale: 0.5` |

---

## 📊 模型要求

| 项目 | 要求 | 推荐 |
|------|------|------|
| 格式 | `.glb` 或 `.gltf` | `.glb` |
| 大小 | < 5MB | < 2MB |
| 三角面 | < 5000 | 1000-2000 |
| 骨骼 | < 50 | 20-30 |
| 动画 | 包含 `run` 或 `walk` | 包含 idle, run, attack |

---

## 🎯 调试技巧

### 查看可用动画

```javascript
createGLTFModel(modelName, stats) {
  const gltfData = this.resources.items[modelName]
  
  // ===== 添加调试日志 =====
  console.log('📦 模型:', modelName)
  console.log('🎬 可用动画:', gltfData.animations?.map(a => a.name))
  console.log('📐 模型尺寸:', gltfData.scene.scale)
  
  // ...
}
```

### 在线查看模型

上传到这个网站，查看模型结构：
```
https://gltf-viewer.donmccurdy.com/
```

---

## 💡 快速提示

### Mixamo 模型设置

```javascript
{
  modelPath: 'enemyScout',
  scale: 0.01,              // ← 通常是 0.01
  animations: {
    run: {
      type: 'gltf',
      clipName: 'mixamo.com',  // ← Mixamo 动画名
      timeScale: 1.0,
    },
  },
}
```

### Sketchfab 模型设置

```javascript
{
  modelPath: 'enemyScout',
  scale: 1.0,               // ← 通常是 1.0
  animations: {
    run: {
      type: 'gltf',
      clipName: 'Run',       // ← 首字母大写
      timeScale: 1.0,
    },
  },
}
```

---

## 🔄 从程序化切回 GLTF

如果 GLTF 模型有问题，想切回程序化模型：

```javascript
scout: {
  modelPath: null,  // ← 设为 null
  // ... 其他配置保持不变
}
```

---

## 📚 完整指南

详细教程：`GLTF_MODEL_INTEGRATION_GUIDE.md`

---

## ✅ 成功标志

- ✅ 控制台显示 "Loaded: enemyScout"
- ✅ 游戏中看到 3D 角色模型
- ✅ 怪物移动时有流畅的奔跑动画
- ✅ 性能良好（FPS > 30）

---

祝你成功！🎉

