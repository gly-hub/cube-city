<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { ref, onMounted, onUnmounted } from 'vue'
import TowerSidebar from './TowerSidebar.vue'
import TowerInfoPanel from './TowerInfoPanel.vue'

const gameState = useGameState()
// 从持久化数据初始化（而不是硬编码默认值）
const wave = ref(gameState.tdGameData.wave || 1)
const baseHealth = ref(gameState.tdGameData.baseHealth || 10)
const isWaveActive = ref(gameState.tdGameData.isWaveActive || false)
const enemiesRemaining = ref(0)

function startWave() {
  isWaveActive.value = true
  eventBus.emit('td:start-wave')
}

function handleWaveCompleted(data) {
  isWaveActive.value = false
  wave.value = data.nextWave
}

function handleBaseDamaged(data) {
  baseHealth.value = data.health
}

function handleGameOver() {
  console.log('UI: 游戏失败，重置所有数据')
  // 重置为初始值
  isWaveActive.value = false
  wave.value = 1
  baseHealth.value = 10
  enemiesRemaining.value = 0
  
  // 清除选中状态
  gameState.setSelectedTower(null)
  gameState.setSelectedPosition(null)
}

function handleWaveStarted(data) {
  enemiesRemaining.value = data.totalEnemies || (5 + data.wave * 2)
}

function handleWaveReset(data) {
  // 战斗中刷新导致的波次重置
  console.log('波次重置，当前波次:', data.wave)
  isWaveActive.value = false
  wave.value = data.wave
}

function handleEnemySpawned() {
  // 可以在这里更新剩余敌人数量
}

onMounted(() => {
  eventBus.on('td:wave-completed', handleWaveCompleted)
  eventBus.on('td:base-damaged', handleBaseDamaged)
  eventBus.on('td:game-over', handleGameOver)
  eventBus.on('td:wave-started', handleWaveStarted)
  eventBus.on('td:wave-reset', handleWaveReset)
})

onUnmounted(() => {
  eventBus.off('td:wave-completed', handleWaveCompleted)
  eventBus.off('td:base-damaged', handleBaseDamaged)
  eventBus.off('td:game-over', handleGameOver)
  eventBus.off('td:wave-started', handleWaveStarted)
  eventBus.off('td:wave-reset', handleWaveReset)
})
</script>

<template>
  <!-- 使用与内城完全一致的布局结构 -->
  <div class="flex gap-2 h-full w-full">
    <!-- 左侧：防御塔建造栏（和内城的 BuildingSidebar 位置一致） -->
    <TowerSidebar />

    <!-- 中间：游戏场景（和内城的 main 位置一致） -->
    <main class="flex-1 industrial-panel shadow-industrial relative overflow-hidden industrial-grid">
      <!-- 波次控制面板（浮动在游戏场景上方） -->
      <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div class="pointer-events-auto rounded-lg bg-gray-900/90 p-3 text-center shadow-lg backdrop-blur-sm border border-red-500/30 min-w-[200px]">
          <h2 class="mb-2 text-lg font-bold text-red-500">🛡️ 外城防线</h2>
          <div class="flex justify-center gap-6">
            <div class="text-center">
              <div class="text-xs text-gray-400 uppercase tracking-wider">Wave</div>
              <div class="text-xl font-bold text-white">{{ wave }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-400 uppercase tracking-wider">Health</div>
              <div class="text-xl font-bold" :class="baseHealth < 4 ? 'text-red-500 animate-pulse' : 'text-green-500'">
                {{ baseHealth }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div class="pointer-events-auto flex flex-col items-center gap-2">
          <div class="text-xs text-gray-300 bg-black/50 px-2 py-1 rounded">
            {{ gameState.language === 'zh' ? '点击空地建造防御塔' : 'Click empty tiles to build towers' }}
          </div>
          <button 
            class="rounded px-6 py-3 font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isWaveActive ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'"
            :disabled="isWaveActive"
            @click="startWave"
          >
            {{ isWaveActive ? '⚔️ 战斗中...' : '⚔️ 开始下一波' }}
          </button>
        </div>
      </div>
    </main>

    <!-- 右侧：防御塔详情面板（和内城的 RightInfoPanel 位置完全一致） -->
    <TowerInfoPanel class="w-80" />
  </div>
</template>

<style scoped>
/* 使用内城的工业风格，背景透明以显示 GameCanvas 的渐变背景 */
.industrial-panel {
  @apply border border-gray-700 rounded-lg;
  background: transparent !important; /* 透明背景，让 GameCanvas 的渐变背景显示，和内城一致 */
}

.shadow-industrial {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.industrial-grid {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>
