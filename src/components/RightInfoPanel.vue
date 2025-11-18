<template>
  <aside class="industrial-panel shadow-industrial z-40 flex flex-col h-full overflow-hidden" :class="$attrs.class || 'w-80'">
    <!-- 单位详情区域（可折叠） -->
    <div class="flex-1 overflow-hidden flex flex-col min-h-0 border-b border-gray-700">
      <div class="p-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h2 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
          {{ t('buildingDetails.unitDetails') }}
        </h2>
        <button
          v-if="selectedBuilding"
          class="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? '▲' : '▼' }}
        </button>
      </div>
      <div v-if="showDetails || !selectedBuilding" class="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
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
      <div v-else class="p-2 text-xs text-gray-500 text-center flex-shrink-0">
        {{ gameState.language === 'zh' ? '点击展开查看详情' : 'Click to expand details' }}
      </div>
    </div>

    <!-- 成就系统预览 -->
    <div class="dashboard-card rounded-lg p-2 border-t border-gray-700 flex-shrink-0">
      <div class="flex items-center justify-between mb-1.5">
        <h3 class="text-xs font-bold text-industrial-accent uppercase tracking-wide neon-text">
          {{ t('dashboardFooter.achievements') }}
        </h3>
        <button
          class="text-xs text-industrial-yellow hover:text-industrial-yellow/80 transition-colors"
          @click="showAchievements"
        >
          {{ gameState.language === 'zh' ? '全部' : 'All' }}
        </button>
      </div>
      <div class="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
        <!-- 已解锁的成就 -->
        <div
          v-for="achievement in recentAchievements"
          :key="achievement.id"
          class="flex items-center justify-between bg-industrial-gray rounded p-1.5"
        >
          <div class="flex items-center space-x-1.5 flex-1 min-w-0">
            <span class="text-industrial-yellow text-sm flex-shrink-0">{{ achievement.icon }}</span>
            <span class="text-xs text-gray-300 uppercase truncate">
              {{ achievement.name[gameState.language] }}
            </span>
          </div>
          <div class="status-indicator status-online flex-shrink-0 ml-1" />
        </div>
        <!-- 进行中的成就 -->
        <div
          v-for="achievement in inProgressAchievements"
          :key="achievement.id"
          class="flex items-center justify-between bg-industrial-gray rounded p-1.5"
        >
          <div class="flex items-center space-x-1.5 flex-1 min-w-0">
            <span class="text-gray-500 text-sm flex-shrink-0">{{ achievement.icon }}</span>
            <span class="text-xs text-gray-500 uppercase truncate">
              {{ achievement.name[gameState.language] }}
            </span>
          </div>
          <div class="text-xs text-gray-500 flex-shrink-0 ml-1">
            {{ Math.floor(achievement.percent) }}%
          </div>
        </div>
        <!-- 如果没有成就，显示提示 -->
        <div
          v-if="recentAchievements.length === 0 && inProgressAchievements.length === 0"
          class="text-xs text-gray-500 text-center py-1"
        >
          {{ t('dashboardFooter.noAchievements') }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGameState } from '../stores/useGameState'
import { BUILDING_DATA } from '../constants/constants'
import { getAllAchievements } from '@/constants/achievement-config.js'
import BuildingDetail from './BuildingDetail.vue'
import EmptyState from './EmptyState.vue'
import { eventBus } from '@/js/utils/event-bus.js'

const gameState = useGameState()
const { t } = useI18n()
const { unlockedAchievements, selectedBuilding, currentMode, selectedPosition } = storeToRefs(gameState)

// 单位详情显示控制
const showDetails = ref(true)

// 当选中建筑时，自动展开详情
watch(selectedBuilding, (newBuilding) => {
  if (newBuilding) {
    showDetails.value = true
  }
})

// 建筑详情计算
const building = computed(() => {
  if (!selectedBuilding.value) return {}
  const { type, level } = selectedBuilding.value
  const base = BUILDING_DATA[type] || {}
  const levelData = base.levels?.[level] || {}
  return { 
    ...base, 
    ...levelData, 
    level,
    nextLevel: levelData.nextLevel || null,
    levels: base.levels || {},
    upgradeCost: levelData.upgradeCost || null,
  }
})

// 获取最近的成就用于显示
const recentAchievements = computed(() => {
  const allAchievements = getAllAchievements()
  return allAchievements
    .filter(ach => gameState.isAchievementUnlocked(ach.id))
    .slice(-2) // 显示最近解锁的2个成就
})

// 获取未解锁但进度最高的成就
const inProgressAchievements = computed(() => {
  const allAchievements = getAllAchievements()
  return allAchievements
    .filter(ach => !gameState.isAchievementUnlocked(ach.id))
    .map(ach => {
      const progress = gameState.achievementProgress[ach.id]
      return {
        ...ach,
        progress: progress?.progress || 0,
        target: progress?.target || 0,
        percent: progress?.target > 0 ? (progress.progress / progress.target) * 100 : 0,
      }
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2) // 显示进度最高的2个成就
})

function showAchievements() {
  gameState.setShowAchievementPanel(true)
}

// 升级建筑
function upgradeBuilding() {
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

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b3b3b #18181b;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  background: #18181b;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3b3b3b 60%, #ffb800 100%);
  border-radius: 4px;
  min-height: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ffb800 60%, #3b3b3b 100%);
}
.custom-scrollbar::-webkit-scrollbar-corner {
  background: #18181b;
}
</style>

