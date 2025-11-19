<script setup>
import { computed } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'

const gameState = useGameState()
const selectedTower = computed(() => gameState.selectedTower)
const language = computed(() => gameState.language)

function upgradeTower() {
  eventBus.emit('td:upgrade-tower')
}

function sellTower() {
  eventBus.emit('td:sell-tower')
}
</script>

<template>
  <aside class="industrial-panel shadow-industrial z-40 flex flex-col h-full overflow-hidden" :class="$attrs.class || 'w-80'">
    <div class="flex-1 overflow-hidden flex flex-col min-h-0 border-b border-gray-700">
      <div class="p-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h2 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
          {{ language === 'zh' ? '防御塔详情' : 'Tower Details' }}
        </h2>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <div v-if="!selectedTower" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div class="text-4xl mb-4">🛡️</div>
          <p class="text-sm">
            {{ language === 'zh' ? '点击防御塔查看详情' : 'Click a tower to view details' }}
          </p>
        </div>
        <div v-else class="space-y-4">
          <div>
            <h3 class="text-lg font-bold text-white mb-2">{{ selectedTower.name || '防御塔' }}</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">{{ language === 'zh' ? '伤害' : 'Damage' }}:</span>
                <span class="text-white font-bold">{{ selectedTower.damage || 20 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">{{ language === 'zh' ? '范围' : 'Range' }}:</span>
                <span class="text-white font-bold">{{ selectedTower.range || 5 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">{{ language === 'zh' ? '冷却' : 'Cooldown' }}:</span>
                <span class="text-white font-bold">{{ selectedTower.cooldown || 1000 }}ms</span>
              </div>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-700 space-y-2">
            <button
              class="w-full px-4 py-2 bg-industrial-yellow text-gray-900 font-bold rounded hover:bg-industrial-yellow/80 transition"
              @click="upgradeTower"
            >
              {{ language === 'zh' ? '升级' : 'Upgrade' }}
            </button>
            <button
              class="w-full px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-500 transition"
              @click="sellTower"
            >
              {{ language === 'zh' ? '出售' : 'Sell' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

