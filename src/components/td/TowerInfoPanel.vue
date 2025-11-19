<script setup>
import { computed, ref } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'

const gameState = useGameState()
const selectedTower = computed(() => gameState.selectedTower)
const language = computed(() => gameState.language)

// 控制详情展开/折叠
const showDetails = ref(true)

// 计算升级成本
const upgradeCost = computed(() => {
  if (!selectedTower.value) return 0
  const currentLevel = selectedTower.value.level || 1
  const nextLevel = currentLevel + 1
  const currentCost = selectedTower.value.cost || 0
  const nextCost = Math.floor(currentCost * nextLevel * 1.5)
  return nextCost - currentCost
})

// 计算出售退款
const demolishRefund = computed(() => {
  if (!selectedTower.value) return 0
  return Math.floor((selectedTower.value.cost || 0) * 0.5)
})

// 是否可以升级（检查金币是否足够）
const canUpgrade = computed(() => {
  if (!selectedTower.value) return false
  return gameState.credits >= upgradeCost.value
})

function upgradeTower() {
  eventBus.emit('td:upgrade-tower')
}

function demolishTower() {
  eventBus.emit('td:demolish-tower')
}
</script>

<template>
  <aside class="industrial-panel shadow-industrial z-40 flex flex-col h-full overflow-hidden" :class="$attrs.class || 'w-80'">
    <!-- 防御塔详情区域（可折叠） -->
    <div class="flex-1 overflow-hidden flex flex-col min-h-0 border-b border-gray-700">
      <div class="p-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h2 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
          {{ language === 'zh' ? '防御塔详情' : 'Tower Details' }}
        </h2>
        <button
          v-if="selectedTower"
          class="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? '▲' : '▼' }}
        </button>
      </div>
      <div v-if="showDetails || !selectedTower" class="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <!-- 空状态 -->
        <div v-if="!selectedTower" class="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
          <div class="text-5xl mb-3 animate-pulse">🛡️</div>
          <p class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
            {{ language === 'zh' ? '未选择防御塔' : 'No Tower Selected' }}
          </p>
          <p class="text-xs text-gray-600 leading-relaxed max-w-xs">
            {{ language === 'zh' ? '点击地图上的防御塔查看详细信息和升级选项' : 'Click a tower on the map to view details and upgrade options' }}
          </p>
        </div>
        
        <!-- 防御塔详情 -->
        <div v-else class="space-y-3">
          <!-- 防御塔名称和图标 -->
          <div class="resource-display rounded-lg p-3">
            <div class="flex items-center mb-2">
              <div class="text-3xl mr-3">
                {{ selectedTower.id === 'basic' ? '🔵' : selectedTower.id === 'rapid' ? '⚡' : '💣' }}
              </div>
              <div class="flex-1">
                <h3 class="text-base font-bold text-white uppercase tracking-wide">
                  {{ selectedTower.name || (language === 'zh' ? '防御塔' : 'Tower') }}
                </h3>
                <div class="text-xs text-gray-400 mt-1">
                  {{ language === 'zh' ? '等级' : 'Level' }} {{ selectedTower.level || 1 }}
                </div>
              </div>
            </div>
          </div>

          <!-- 属性信息卡片 -->
          <div class="dashboard-card rounded-lg p-3">
            <div class="text-xs font-bold text-industrial-accent uppercase tracking-wide mb-2">
              {{ language === 'zh' ? '属性' : 'Stats' }}
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-gray-400 flex items-center">
                  <span class="mr-1">⚔️</span>
                  {{ language === 'zh' ? '伤害' : 'Damage' }}
                </span>
                <span class="text-white font-bold">{{ selectedTower.damage || 20 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 flex items-center">
                  <span class="mr-1">📡</span>
                  {{ language === 'zh' ? '范围' : 'Range' }}
                </span>
                <span class="text-white font-bold">{{ selectedTower.range || 5 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 flex items-center">
                  <span class="mr-1">⏱️</span>
                  {{ language === 'zh' ? '冷却' : 'Cooldown' }}
                </span>
                <span class="text-white font-bold">{{ selectedTower.cooldown || 1000 }}ms</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-700">
                <span class="text-gray-400">{{ language === 'zh' ? '建造成本' : 'Build Cost' }}</span>
                <span class="text-industrial-yellow font-bold">💰{{ selectedTower.cost || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 位置信息 -->
          <div v-if="selectedTower.tileX !== undefined" class="dashboard-card rounded-lg p-3">
            <div class="text-xs font-bold text-industrial-accent uppercase tracking-wide mb-2">
              {{ language === 'zh' ? '位置信息' : 'Location' }}
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">{{ language === 'zh' ? '坐标' : 'Position' }}</span>
              <span class="text-industrial-blue font-bold font-mono">
                ({{ selectedTower.tileX }}, {{ selectedTower.tileY }})
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="space-y-2">
            <button
              class="industrial-button w-full text-white font-bold py-2.5 px-4 text-xs uppercase tracking-wide transition"
              :disabled="!canUpgrade"
              :class="!canUpgrade ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'"
              @click="upgradeTower"
            >
              <span class="flex items-center justify-center">
                <span class="mr-2">⬆️</span>
                {{ language === 'zh' ? '升级防御塔' : 'Upgrade Tower' }}
                <span v-if="canUpgrade" class="ml-2">
                  (💰{{ upgradeCost }})
                </span>
                <span v-else class="ml-2 text-red-400">
                  ({{ language === 'zh' ? '金币不足' : 'No credits' }})
                </span>
              </span>
            </button>
            <button
              class="industrial-button w-full text-white font-bold py-2.5 px-4 text-xs uppercase tracking-wide bg-red-700 hover:bg-red-600 hover:scale-[1.02] transition"
              @click="demolishTower"
            >
              <span class="flex items-center justify-center">
                <span class="mr-2">🗑️</span>
                {{ language === 'zh' ? '拆除防御塔' : 'Demolish Tower' }}
                <span class="ml-2 text-xs">(💰{{ demolishRefund }})</span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="p-2 text-xs text-gray-500 text-center flex-shrink-0">
        {{ language === 'zh' ? '点击展开查看详情' : 'Click to expand details' }}
      </div>
    </div>

    <!-- 战斗统计 -->
    <div class="dashboard-card rounded-lg p-2 border-t border-gray-700 flex-shrink-0">
      <div class="flex items-center justify-between mb-1.5">
        <h3 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
          {{ language === 'zh' ? '战斗统计' : 'Battle Stats' }}
        </h3>
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between bg-industrial-gray rounded p-1.5">
          <div class="flex items-center space-x-1.5">
            <span class="text-industrial-yellow text-sm">🏆</span>
            <span class="text-xs text-gray-300 uppercase">
              {{ language === 'zh' ? '当前波次' : 'Current Wave' }}
            </span>
          </div>
          <div class="text-xs text-white font-bold">{{ gameState.wave || 1 }}</div>
        </div>
        <div class="flex items-center justify-between bg-industrial-gray rounded p-1.5">
          <div class="flex items-center space-x-1.5">
            <span class="text-red-500 text-sm">❤️</span>
            <span class="text-xs text-gray-300 uppercase">
              {{ language === 'zh' ? '基地生命' : 'Base Health' }}
            </span>
          </div>
          <div class="text-xs text-white font-bold">{{ gameState.baseHealth || 10 }}</div>
        </div>
        <div class="flex items-center justify-between bg-industrial-gray rounded p-1.5">
          <div class="flex items-center space-x-1.5">
            <span class="text-blue-500 text-sm">🛡️</span>
            <span class="text-xs text-gray-300 uppercase">
              {{ language === 'zh' ? '防御塔数量' : 'Towers' }}
            </span>
          </div>
          <div class="text-xs text-white font-bold">{{ gameState.towerCount || 0 }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 确保 industrial-panel 背景生效 */
aside.industrial-panel {
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a) !important;
  border: 1px solid #404040;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b3b3b #18181b;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #18181b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3b3b3b 60%, #ffb800 100%);
  border-radius: 8px;
  min-height: 24px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ffb800 60%, #3b3b3b 100%);
}
.custom-scrollbar::-webkit-scrollbar-corner {
  background: #18181b;
}
</style>

