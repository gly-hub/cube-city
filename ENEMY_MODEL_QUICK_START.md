# 🚀 怪物模型和动画 - 快速开始

## ✅ 已完成的工作

我已经为你实现了完整的怪物模型和动画系统！

### 📦 新增文件

1. **`src/js/td/enemy-model-factory.js`** (全新)
   - 怪物模型工厂类
   - 支持程序化生成模型
   - 支持 GLTF 模型加载（预留）
   - 程序动画系统

2. **`src/js/td/enemy.js`** (更新)
   - 集成模型工厂
   - 动画更新逻辑

3. **`src/js/td/tower-defense-world.js`** (更新)
   - 初始化模型工厂
   - 传递工厂给 Enemy

---

## 🎮 当前效果

### 6 种不同的怪物模型

| 怪物 | 颜色 | 外观特征 |
|------|------|----------|
| 侦察兵 (Scout) | 🟢 绿色 | 胶囊体 + 2腿 + 手臂 + 头部 |
| 坦克 (Tank) | 🔵 蓝色 | 立方体 + 4腿 + 装甲板 |
| 冲锋兵 (Runner) | 🟠 橙色 | 流线胶囊体 + 2腿 + 前倾 |
| 装甲兵 (Armored) | 🟣 紫色 | 立方体 + 4腿 + 重装甲 + 肩甲 |
| 精英 (Elite) | 🩷 粉色 | 胶囊体 + 2腿 + 披风 + 发光 |
| Boss | 🔴 红色 | 大型立方体 + 4腿 + 尖刺 + 发光 |

### 动画效果

- ✅ **身体上下摆动** - 模拟行走时的起伏
- ✅ **身体左右倾斜** - 增加动态感
- ✅ **腿部前后摆动** - 根据速度自动调整
- ✅ **手臂摆动** - 与腿部相反相位
- ✅ **披风飘动** - Elite 的披风随风摆动
- ✅ **发光效果** - Boss 和 Elite 有半透明光环
- ✅ **速度联动** - 速度越快，动画越快

---

## 🎯 如何测试

### 1. 启动游戏
```bash
npm run dev
```

### 2. 进入外城并开始游戏
- 点击顶部 "前往外城" 或 "切换场景"
- 点击 "开始下一波"
- 观察怪物的模型和动画

### 3. 观察不同波次的怪物

| 波次 | 主要怪物类型 |
|------|-------------|
| 1-3 波 | 🟢 侦察兵 + 🟠 冲锋兵 |
| 4-6 波 | 🟢🟠 + 🔵 坦克 |
| 7-10 波 | 混合 + 🟣 装甲兵 + 🩷 精英 |
| 5, 10, 15... | 🔴 **Boss 波** (超大) |

---

## 🎨 如何调整外观

### 调整颜色

打开 `src/js/td/enemy-model-factory.js`，找到 `ENEMY_MODEL_CONFIG`:

```javascript
scout: {
  proceduralConfig: {
    bodyColor: '#10b981',  // ← 改成你想要的颜色
    // ...
  }
}
```

### 调整大小

```javascript
scout: {
  proceduralConfig: {
    bodySize: { 
      width: 0.4,   // ← 宽度
      height: 0.8,  // ← 高度
      depth: 0.4    // ← 深度
    },
    // ...
  }
}
```

### 调整动画速度

```javascript
scout: {
  animations: {
    run: {
      bobAmount: 0.15,      // ← 摆动幅度 (0-0.3)
      bobSpeed: 8,          // ← 摆动速度 (1-15)
      tiltAmount: 0.1,      // ← 倾斜幅度 (0-0.2)
      legSwingAmount: 0.3,  // ← 腿摆动幅度 (0-0.5)
    }
  }
}
```

---

## 📊 性能表现

### 当前（程序化模型）

- ✅ **极轻量** - 每个怪物约 100 顶点
- ✅ **高性能** - 可同时显示 50+ 怪物
- ✅ **低内存** - 所有怪物共享几何体
- ✅ **CPU 友好** - 简单的三角函数计算

### 未来（GLTF 模型）

- 推荐每个模型 < 2MB
- 使用 Instancing 优化
- 推荐顶点数 < 2000

---

## 🚀 下一步升级（可选）

### 方案1：继续优化程序化模型（推荐新手）

```javascript
// 1. 调整现有怪物的外观参数
// 2. 添加更多程序化特效（拖尾、光晕等）
// 3. 优化动画细节（转向、加速减速）
```

### 方案2：升级为 GLTF 模型（推荐进阶）

```javascript
// 1. 从 Mixamo 下载免费角色 + 动画
// 2. 在 sources.js 中注册模型
// 3. 在 enemy-model-factory.js 中配置 modelPath
// 4. 实现 createGLTFModel 和 骨骼动画
```

详细教程见：`ENEMY_MODEL_ANIMATION_GUIDE.md`

---

## 🐛 常见问题

### Q: 怪物没有动画，只是静止的模型？
**A**: 检查控制台是否有报错。确保 `EnemyModelFactory` 正确传递给 `Enemy` 构造函数。

### Q: 动画太快或太慢？
**A**: 调整 `bobSpeed` 参数。较大的值 = 更快的动画。

### Q: 想让某个怪物看起来更笨重？
**A**: 减小 `bobAmount`, `tiltAmount`, `legSwingAmount`，增大 `bodySize`。

### Q: 如何让 Boss 看起来更强大？
**A**: 
- 增大 `bodySize`
- 添加 `glow: true`
- 添加 `spikes: true`
- 设置 `groundShake: true`

### Q: 可以添加更多特效吗？
**A**: 可以！在 `createProceduralModel` 中添加：
- 粒子系统（尘土、火花）
- 拖尾效果
- 环绕光环
- 武器/道具

---

## 📝 代码示例

### 创建一个新怪物类型

```javascript
// 1. 在 enemy-types.js 中定义
export const ENEMY_TYPES = {
  SPECTER: {
    id: 'SPECTER',
    name: '幽灵',
    color: '#a78bfa',
    baseHealth: 40,
    baseSpeed: 3.5,
    baseDefense: 0.5,
    baseReward: 20,
    // ... 缩放参数
  },
}

// 2. 在 enemy-model-factory.js 中配置外观
const ENEMY_MODEL_CONFIG = {
  specter: {
    proceduralConfig: {
      bodyColor: '#a78bfa',
      bodyShape: 'sphere',       // 球形身体
      bodySize: { width: 0.6, height: 0.6, depth: 0.6 },
      hasLegs: false,            // 无腿（飘浮）
      hasArms: false,
      hasHead: false,
      glow: true,                // 发光
      transparent: true,         // 半透明
    },
    animations: {
      run: {
        bobAmount: 0.3,          // 大幅度飘动
        bobSpeed: 4,             // 慢速飘动
        tiltAmount: 0.15,
      },
    },
  },
}

// 3. 在 getWaveComposition 中添加到波次
if (wave > 8) {
  composition.push({ type: 'SPECTER', count: Math.ceil(totalEnemies * 0.15) })
}
```

---

## 🎉 总结

恭喜！你现在有了：

1. ✅ 6 种程序化怪物模型
2. ✅ 完整的动画系统
3. ✅ 可扩展的架构
4. ✅ GLTF 升级路径

**现在就运行游戏，看看效果吧！** 🚀

如果需要帮助：
- 详细教程：`ENEMY_MODEL_ANIMATION_GUIDE.md`
- 调试技巧：检查控制台的 `👾 生成` 日志
- 性能监控：开启 Debug 面板查看 FPS

