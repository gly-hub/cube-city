# 🔧 打包错误修复

## 错误信息
```
"calculateDamage" is not exported by "src/js/td/tower-attack-utils.js"
```

## 原因
`tower-attack-utils.js` 文件中缺少 `calculateDamage` 和 `applySpecialEffect` 两个导出函数。

## 已修复 ✅

在 `src/js/td/tower-attack-utils.js` 中添加了两个缺失的导出函数：

### 1. `calculateDamage(tower, enemy, baseDamage)`
计算最终伤害，包括：
- 暴击检测（狙击塔 30% 几率）
- 防御减免
- 最小伤害保证（至少1点）

### 2. `applySpecialEffect(tower, enemy, allEnemies, baseDamage, scene)`
应用特殊效果，包括：
- **减速效果**：减速50%，持续2秒
- **AOE效果**：1.5范围，伤害减半，带视觉效果
- 其他效果占位

## 现在可以重新运行

```bash
npm run dev
```

打包应该成功了！ 🎉

