<script setup>
import { computed } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'

const gameState = useGameState()

// 防御塔类型定义
const towerTypes = [
  { id: 'basic', name: { zh: '基础塔', en: 'Basic Tower' }, cost: 100, icon: '🔵', damage: 20, range: 5 },
  { id: 'rapid', name: { zh: '速射塔', en: 'Rapid Tower' }, cost: 150, icon: '⚡', damage: 15, range: 4 },
  { id: 'heavy', name: { zh: '重炮塔', en: 'Heavy Tower' }, cost: 200, icon: '💣', damage: 40, range: 6 },
]

const selectedTowerType = computed(() => gameState.selectedTowerType)
const language = computed(() => gameState.language)

function selectTowerType(towerType) {
  console.log('选择防御塔类型:', towerType)
  if (selectedTowerType.value?.id === towerType.id) {
    gameState.setSelectedTowerType(null)
    console.log('取消选择防御塔')
  } else {
    gameState.setSelectedTowerType(towerType)
    console.log('已选择防御塔:', towerType.id)
    eventBus.emit('td:select-tower-type', towerType)
  }
}
</script>

<template>
  <aside class="industrial-panel shadow-industrial z-40 flex flex-col h-full overflow-hidden w-80">
    <div class="p-2 border-b border-gray-700 flex-shrink-0">
      <h2 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
        {{ language === 'zh' ? '防御塔' : 'Defense Towers' }}
      </h2>
    </div>
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div class="space-y-2">
        <div
          v-for="tower in towerTypes"
          :key="tower.id"
          class="building-item rounded-lg p-3 cursor-pointer transition-all border-2"
          :class="selectedTowerType?.id === tower.id
            ? 'bg-industrial-yellow border-industrial-yellow shadow-lg'
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'"
          @click="selectTowerType(tower)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ tower.icon }}</span>
              <div>
                <div class="text-sm font-bold text-white">
                  {{ tower.name[language] }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ language === 'zh' ? '伤害' : 'Damage' }}: {{ tower.damage }} | 
                  {{ language === 'zh' ? '范围' : 'Range' }}: {{ tower.range }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-industrial-green">
                💰{{ tower.cost }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.building-item {
  transition: transform 0.2s, box-shadow 0.2s;
}

.building-item:hover {
  transform: translateY(-2px);
}
</style>

