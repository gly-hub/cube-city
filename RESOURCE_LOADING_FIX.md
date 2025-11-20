# 🔧 外城资源加载报错修复

## 问题描述
**报错**："资源未加载，无法创建外城"  
**场景**：切换到外城时

## 原因分析
1. **资源加载时机问题**：`TowerDefenseWorld` 实例化时，资源可能还没有完全加载
2. **缺少等待机制**：`show()` 方法中如果资源未加载就直接报错，没有等待逻辑
3. **缺少资源检查**：`createCity()` 方法没有检查必需资源是否存在

## 修复方案

### 1. ✅ `createCity()` 添加资源检查
```javascript
createCity() {
  console.log('创建外城城市')
  
  // ===== 检查资源是否加载 =====
  if (!this.resources.items.grass) {
    console.error('❌ 草地纹理未加载，无法创建外城')
    return
  }
  
  try {
    this.city = new TDCity()
    // ... 创建逻辑
    console.log('✅ 外城创建完成')
  } catch (error) {
    console.error('❌ 创建外城失败:', error)
    this.city = null
  }
}
```

### 2. ✅ `show()` 添加资源等待机制
```javascript
show() {
  // ...
  if (!this.city) {
    console.warn('外城城市未创建，尝试重新创建')
    
    if (this.resources.items.grass) {
      // 资源已加载，直接创建
      this.createCity()
      if (this.city) {
        this.city.show()
      }
    } else {
      // 资源未加载，等待加载完成
      console.warn('⚠️ 资源未加载完成，等待资源加载...')
      this.resources.on('ready', () => {
        console.log('✅ 资源加载完成，现在创建外城')
        this.createCity()
        if (this.city) {
          this.city.show()
        }
      })
    }
  }
}
```

### 3. ✅ 错误处理增强
- 所有关键操作都添加了 try-catch
- 失败时显示友好的错误信息
- 不会导致整个应用崩溃

---

## 资源加载流程

### 正常流程（首次进入）
```
应用启动
  ↓
Resources 开始加载
  ↓
TowerDefenseWorld 构造函数（this.city = null）
  ↓
init() 检查资源
  ├─ 已加载 → 立即 createCity()
  └─ 未加载 → 监听 'ready' 事件 → createCity()
  ↓
外城创建完成
```

### 切换场景流程
```
从内城切换到外城
  ↓
调用 TowerDefenseWorld.show()
  ↓
检查 this.city 是否存在
  ├─ 存在 → 直接显示
  └─ 不存在 → 尝试创建
      ├─ 资源已加载 → createCity()
      └─ 资源未加载 → 等待 'ready' 事件
```

---

## 测试检查清单

### 初次加载测试
- [ ] 刷新页面后直接进入外城
- [ ] 不应该有"资源未加载"报错
- [ ] 控制台显示 "✅ 外城创建完成"

### 场景切换测试
- [ ] 从内城切换到外城
- [ ] 外城地图正常显示
- [ ] 路径、地块正常渲染

### 错误恢复测试
- [ ] 如果资源加载失败，应显示友好错误而不是崩溃
- [ ] 控制台有清晰的日志指示问题原因

---

## 相关文件

- **`src/js/td/tower-defense-world.js`**
  - `createCity()` - 添加资源检查和错误处理
  - `show()` - 添加资源等待机制
  - `init()` - 已有资源等待逻辑

- **`src/js/utils/resources.js`**
  - 提供 `on('ready')` 事件监听
  - 管理所有资源加载状态

---

## 如果还有问题

### 检查资源配置
查看 `src/js/sources.js`，确保草地纹理已配置：
```javascript
{
  name: 'grass',
  type: 'texture',
  path: 'textures/grass.jpg' // 路径正确吗？
}
```

### 检查资源文件
确保文件存在：
- `public/textures/grass.jpg` ✓

### 清除缓存
有时浏览器缓存会导致问题：
- **Ctrl/Cmd + Shift + R** 强制刷新

---

## 预期行为

### 成功创建外城
```
✅ 技能系统初始化成功
✅ 技能范围指示器创建成功
创建外城城市
✅ 外城创建完成，路径点数量: 100
外城 root 层级: X, city root 层级: X
```

### 资源未加载（等待）
```
⚠️ 资源未加载完成，等待资源加载...
（等待几秒）
✅ 资源加载完成，现在创建外城
✅ 外城创建完成
```

### 资源加载失败（错误）
```
❌ 草地纹理未加载，无法创建外城
```

---

刷新页面并切换到外城，看看还有没有报错！🚀




