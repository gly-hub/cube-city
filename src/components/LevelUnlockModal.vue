<script setup>
import { computed } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'
import { eventBus } from '@/js/utils/event-bus.js'
import LevelSystem from '@/js/utils/level-system.js'

const gameState = useGameState()
const { showLevelUnlockModal, pendingLevelUnlock, language, currentLevel } = storeToRefs(gameState)

// 关卡系统实例
let levelSystem = null

// 获取关卡信息
const levelInfo = computed(() => {
  return pendingLevelUnlock.value
})

// 确认解锁并切换关卡
function confirmUnlock() {
  if (!levelInfo.value) return

  const { level, config } = levelInfo.value

  // 初始化关卡系统（如果还没有）
  if (!levelSystem) {
    levelSystem = new LevelSystem()
    window.levelSystem = levelSystem
  }

  // 切换到新关卡
  const success = levelSystem.switchToLevel(level)

  if (success) {
    // 关闭弹窗
    gameState.setShowLevelUnlockModal(false)
    gameState.setPendingLevelUnlock(null)

    // 显示成功提示
    eventBus.emit('toast:add', {
      message: language.value === 'zh'
        ? `🎉 已切换到关卡 ${level}！地图已扩展至 ${config.mapSize}x${config.mapSize}`
        : `🎉 Switched to Level ${level}! Map expanded to ${config.mapSize}x${config.mapSize}`,
      type: 'success',
    })
  }
}

// 取消解锁（暂时不切换）
function cancelUnlock() {
  gameState.setShowLevelUnlockModal(false)
  gameState.setPendingLevelUnlock(null)
}
</script>

<template>
  <div
    v-if="showLevelUnlockModal && levelInfo"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    @click.self="cancelUnlock"
  >
    <div class="industrial-panel w-full max-w-lg p-8 m-4 shadow-industrial animate-scale-in">
      <!-- 标题 -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-3xl font-bold text-industrial-accent neon-text mb-2">
          {{ language === 'zh' ? '关卡解锁！' : 'Level Unlocked!' }}
        </h2>
        <div class="text-xl font-bold text-white">
          {{ levelInfo.config.name[language] || levelInfo.config.name.zh }}
        </div>
      </div>

      <!-- 关卡信息 -->
      <div class="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '关卡编号' : 'Level' }}:</span>
            <span class="text-white font-bold">{{ levelInfo.level }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '地图大小' : 'Map Size' }}:</span>
            <span class="text-white font-bold">
              {{ levelInfo.config.mapSize }}×{{ levelInfo.config.mapSize }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '解锁奖励' : 'Unlock Reward' }}:</span>
            <span class="text-industrial-green font-bold">
              💰 {{ levelInfo.config.rewards.credits }}
            </span>
          </div>
        </div>
      </div>

      <!-- 关卡描述 -->
      <div class="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
        <p class="text-gray-300 text-center">
          {{ levelInfo.config.description[language] || levelInfo.config.description.zh }}
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex gap-4">
        <button
          class="flex-1 px-6 py-3 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
          @click="cancelUnlock"
        >
          {{ language === 'zh' ? '稍后切换' : 'Switch Later' }}
        </button>
        <button
          class="flex-1 px-6 py-3 rounded-lg bg-industrial-green text-white font-bold hover:bg-industrial-green/80 transition shadow-lg"
          @click="confirmUnlock"
        >
          {{ language === 'zh' ? '立即切换' : 'Switch Now' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.industrial-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #0f3460;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.neon-text {
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

@keyframes scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
</style>

