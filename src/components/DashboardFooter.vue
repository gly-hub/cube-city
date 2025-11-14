<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameState } from '../stores/useGameState'
import AnimatedNumber from './AnimatedNumber.vue'
import { getAllAchievements } from '@/constants/achievement-config.js'

const gameState = useGameState()
const { t } = useI18n()
const { buildingCount, dailyIncome, pollution, stability, unlockedAchievements } = storeToRefs(gameState)

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

onMounted(() => {
  // 时间管理已统一到 App.vue，无需在组件中重复启动计时器
})

onUnmounted(() => {
  // 时间管理已统一到 App.vue，无需在组件中管理计时器
})

// 系统状态数据抽离
const systemStatusList = computed(() => [
  {
    key: 'powerGrid',
    status: 'online',
    colorClass: 'text-industrial-green',
    statusClass: 'status-online',
    label: t('dashboardFooter.online'),
  },
  {
    key: 'transport',
    status: 'limited',
    colorClass: 'text-industrial-yellow',
    statusClass: 'status-warning',
    label: t('dashboardFooter.limited'),
  },
  {
    key: 'security',
    status: 'secure',
    colorClass: 'text-industrial-green',
    statusClass: 'status-online',
    label: t('dashboardFooter.secure'),
  },
  {
    key: 'environment',
    status: 'moderate',
    colorClass: 'text-industrial-yellow',
    statusClass: 'status-warning',
    label: t('dashboardFooter.moderate'),
  },
])
</script>

<template>
  <footer class="p-2">
    <div class="grid grid-cols-3 gap-2">
      <!-- 左侧统计 -->
      <div class="dashboard-card rounded-lg p-4 z-10">
        <h3 class="text-sm font-bold text-industrial-accent uppercase tracking-wide mb-3 neon-text">
          {{ t('dashboardFooter.cityMetrics') }}
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-industrial-green neon-text">
              <AnimatedNumber :value="buildingCount" :duration="2" />
            </div>
            <div class="text-sm text-gray-400 uppercase" :class="gameState.language === 'zh' ? 'tracking-[0.3rem]' : 'tracking-wide'">
              {{ t('dashboardFooter.buildings') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-industrial-blue neon-text">
              +<AnimatedNumber :value="dailyIncome" :duration="2" separator="," />
            </div>
            <div class="text-sm text-gray-400 uppercase" :class="gameState.language === 'zh' ? 'tracking-[0.3rem]' : 'tracking-wide'">
              {{ t('dashboardFooter.dailyIncome') }}
            </div>
          </div>
          <div class="text-center">
            <div
              class="text-2xl font-bold neon-text"
              :class="pollution > 100 ? 'text-red-500' : 'text-industrial-yellow'"
            >
              <AnimatedNumber :value="pollution" :duration="2" />
              <span v-if="pollution > 100" class="text-sm"> DANGER</span>
            </div>
            <div class="text-sm text-gray-400 uppercase" :class="gameState.language === 'zh' ? 'tracking-[0.3rem]' : 'tracking-wide'">
              {{ t('dashboardFooter.efficiency') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-industrial-green neon-text">
              <AnimatedNumber :value="stability" :duration="2" />%
            </div>
            <div class="text-sm text-gray-400 uppercase" :class="gameState.language === 'zh' ? 'tracking-[0.3rem]' : 'tracking-wide'">
              {{ t('dashboardFooter.stability') }}
            </div>
          </div>
        </div>
      </div>
      <!-- 中间成就系统 -->
      <div class="dashboard-card rounded-lg p-4 z-10">
        <h3 class="text-sm font-bold text-industrial-accent uppercase tracking-wide mb-3 text-center neon-text">
          {{ t('dashboardFooter.achievements') }}
        </h3>
        <div class="space-y-2">
          <!-- 已解锁的成就 -->
          <div
            v-for="achievement in recentAchievements"
            :key="achievement.id"
            class="flex items-center justify-between bg-industrial-gray rounded p-2"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <span class="text-industrial-yellow text-lg flex-shrink-0">{{ achievement.icon }}</span>
              <span class="text-xs text-gray-300 uppercase truncate">
                {{ achievement.name[gameState.language] }}
              </span>
            </div>
            <div class="status-indicator status-online flex-shrink-0 ml-2" />
          </div>
          <!-- 进行中的成就 -->
          <div
            v-for="achievement in inProgressAchievements"
            :key="achievement.id"
            class="flex items-center justify-between bg-industrial-gray rounded p-2"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <span class="text-gray-500 text-lg flex-shrink-0">{{ achievement.icon }}</span>
              <span class="text-xs text-gray-500 uppercase truncate">
                {{ achievement.name[gameState.language] }}
              </span>
            </div>
            <div class="text-xs text-gray-500 flex-shrink-0 ml-2">
              {{ Math.floor(achievement.percent) }}%
            </div>
          </div>
          <!-- 如果没有成就，显示提示 -->
          <div
            v-if="recentAchievements.length === 0 && inProgressAchievements.length === 0"
            class="text-xs text-gray-500 text-center py-2"
          >
            {{ t('dashboardFooter.noAchievements') }}
          </div>
          <button
            class="industrial-button w-full text-white font-bold py-2 px-4 text-xs uppercase tracking-wide mt-2"
            @click="showAchievements"
          >
            {{ t('dashboardFooter.viewAllAchievements') }}
          </button>
        </div>
      </div>
      <!-- 右侧系统状态 -->
      <div class="dashboard-card rounded-lg p-4 z-10">
        <h3 class="text-sm font-bold text-industrial-accent uppercase tracking-wide mb-3 neon-text">
          {{ t('dashboardFooter.systemStatus') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="item in systemStatusList"
            :key="item.key"
            class="flex justify-between items-center"
          >
            <span class="text-xs text-gray-400 uppercase">{{ t(`dashboardFooter.${item.key}`) }}</span>
            <div class="flex items-center space-x-2">
              <div class="status-indicator" :class="item.statusClass" />
              <span class="text-xs uppercase" :class="item.colorClass">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
