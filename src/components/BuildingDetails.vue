<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BUILDING_DATA } from '../constants/constants'
import { useGameState } from '../stores/useGameState'
import BuildingDetail from './BuildingDetail.vue'
import EmptyState from './EmptyState.vue'

const { t } = useI18n()
const gameState = useGameState()
const selectedBuilding = computed(() => gameState.selectedBuilding)
const currentMode = computed(() => gameState.currentMode)
const selectedPosition = computed(() => gameState.selectedPosition)
const building = computed(() => {
  if (!selectedBuilding.value || !selectedPosition.value)
    return {}
  const { type, level } = selectedBuilding.value
  
  // 从 metadata 获取实际的 detail（包含科技效果）
  // 注意：需要访问 metadata 来触发响应式追踪
  const pos = selectedPosition.value
  const x = pos.x
  const y = pos.z !== undefined ? pos.z : pos.y
  
  // 直接访问 metadata 数组，确保响应式追踪
  // 使用 storeToRefs 的 metadata 来确保响应式
  const tile = metadata.value[x]?.[y]
  
  // 优先使用 metadata 中的 detail（包含科技效果），如果没有则使用原始数据
  const base = BUILDING_DATA[type] || {}
  
  // 如果 tile 存在且有 detail，使用 detail（包含科技效果）
  // 否则使用原始数据
  let levelData = {}
  if (tile?.detail) {
    // 创建 detail 的深拷贝，确保所有属性都被包含
    levelData = {
      ...tile.detail,
      // 确保所有可能的属性都被包含
      coinOutput: tile.detail.coinOutput,
      powerOutput: tile.detail.powerOutput,
      powerUsage: tile.detail.powerUsage,
      pollution: tile.detail.pollution,
      maxPopulation: tile.detail.maxPopulation,
      population: tile.detail.population,
    }
  } else {
    levelData = base.levels?.[level] || {}
  }
  
  // 确保包含 nextLevel 和 levels 属性，用于升级功能
  return { 
    ...base, 
    ...levelData, 
    type, // 确保包含 type
    level,
    nextLevel: levelData.nextLevel || base.levels?.[level]?.nextLevel || null,
    levels: base.levels || {},
    upgradeCost: levelData.upgradeCost || base.levels?.[level]?.upgradeCost || null,
  }
})

// 升级建筑
function upgradeBuilding() {
  // TODO: 找到当前建筑的下一级建筑
  const data = {
    action: 'upgrade',
    buildingType: selectedBuilding.value.type,
    buildingLevel: selectedBuilding.value.level,
  }
  eventBus.emit('ui:confirm-action', data)
}

// 维修建筑
function repairBuilding() {
  const data = {
    action: 'repair',
    buildingType: selectedBuilding.value.type,
    buildingLevel: selectedBuilding.value.level,
  }
  eventBus.emit('ui:confirm-action', data)
}

// 拆除建筑
function demolishBuilding() {
  const data = {
    action: 'demolish',
    buildingType: selectedBuilding.value.type,
    buildingLevel: selectedBuilding.value.level,
  }
  eventBus.emit('ui:confirm-action', data)
}
</script>

<template>
  <aside class="w-80 industrial-panel shadow-industrial z-40 absolute right-2 top-2 bottom-2">
    <div class="p-4 h-full flex flex-col">
      <h2 class="text-lg font-bold text-industrial-accent uppercase tracking-wide mb-4 border-b border-gray-600 pb-2">
        <span class="neon-text">{{ t('buildingDetails.unitDetails') }}</span>
      </h2>
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <EmptyState v-if="!selectedBuilding" :current-mode="currentMode" />
        <BuildingDetail
          v-else
          :building="building"
          :selected-position="selectedPosition"
          :current-mode="currentMode"
          @upgrade="upgradeBuilding"
          @repair="repairBuilding"
          @demolish="demolishBuilding"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b3b3b #18181b;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  background: #18181b;
  border-radius: 8px;
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
