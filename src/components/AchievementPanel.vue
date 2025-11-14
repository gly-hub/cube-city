<template>
  <div
    v-if="showAchievementPanel"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    @click.self="closePanel"
  >
    <div
      class="dashboard-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      :class="gameState.language === 'zh' ? 'p-6' : 'p-8'"
    >
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-industrial-accent neon-text uppercase tracking-wide">
          {{ t('achievementPanel.title') }}
        </h2>
        <button
          class="industrial-button text-white font-bold py-2 px-4 text-sm uppercase tracking-wide"
          @click="closePanel"
        >
          {{ t('achievementPanel.close') }}
        </button>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="dashboard-card p-4 text-center">
          <div class="text-3xl font-bold text-industrial-yellow neon-text">
            {{ unlockedCount }}/{{ totalCount }}
          </div>
          <div class="text-sm text-gray-400 uppercase mt-1">
            {{ t('achievementPanel.unlocked') }}
          </div>
        </div>
        <div class="dashboard-card p-4 text-center">
          <div class="text-3xl font-bold text-industrial-blue neon-text">
            {{ commonCount }}
          </div>
          <div class="text-sm text-gray-400 uppercase mt-1">
            {{ t('achievementPanel.common') }}
          </div>
        </div>
        <div class="dashboard-card p-4 text-center">
          <div class="text-3xl font-bold text-industrial-green neon-text">
            {{ rareCount }}
          </div>
          <div class="text-sm text-gray-400 uppercase mt-1">
            {{ t('achievementPanel.rare') }}
          </div>
        </div>
        <div class="dashboard-card p-4 text-center">
          <div class="text-3xl font-bold text-purple-500 neon-text">
            {{ epicCount }}
          </div>
          <div class="text-sm text-gray-400 uppercase mt-1">
            {{ t('achievementPanel.epic') }}
          </div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="type in achievementTypes"
          :key="type.value"
          class="px-4 py-2 rounded text-sm font-bold uppercase tracking-wide transition-all"
          :class="
            selectedType === type.value
              ? 'industrial-button text-white'
              : 'bg-industrial-gray text-gray-400 hover:bg-gray-700'
          "
          @click="selectedType = type.value"
        >
          {{ type.label }}
        </button>
        <button
          class="px-4 py-2 rounded text-sm font-bold uppercase tracking-wide transition-all"
          :class="
            selectedType === 'all'
              ? 'industrial-button text-white'
              : 'bg-industrial-gray text-gray-400 hover:bg-gray-700'
          "
          @click="selectedType = 'all'"
        >
          {{ t('achievementPanel.all') }}
        </button>
      </div>

      <!-- 成就列表 -->
      <div class="flex-1 overflow-y-auto pr-2 space-y-3">
        <div
          v-for="achievement in filteredAchievements"
          :key="achievement.id"
          class="dashboard-card p-4 transition-all"
          :class="
            isUnlocked(achievement.id)
              ? 'border-2 border-industrial-yellow bg-industrial-gray bg-opacity-50'
              : 'border border-gray-700'
          "
        >
          <div class="flex items-start gap-4">
            <!-- 成就图标 -->
            <div
              class="text-4xl flex-shrink-0"
              :class="isUnlocked(achievement.id) ? '' : 'opacity-50 grayscale'"
            >
              {{ achievement.icon }}
            </div>

            <!-- 成就信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3
                    class="text-lg font-bold uppercase tracking-wide"
                    :class="
                      isUnlocked(achievement.id)
                        ? 'text-industrial-yellow neon-text'
                        : 'text-gray-400'
                    "
                  >
                    {{ achievement.name[gameState.language] }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      class="text-xs px-2 py-1 rounded uppercase font-bold"
                      :class="getRarityClass(achievement.rarity)"
                    >
                      {{ getRarityLabel(achievement.rarity) }}
                    </span>
                    <span class="text-xs text-gray-500 uppercase">
                      {{ achievement.type }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="isUnlocked(achievement.id)"
                  class="text-2xl flex-shrink-0"
                >
                  ✅
                </div>
              </div>

              <p class="text-sm text-gray-300 mb-3">
                {{ achievement.description[gameState.language] }}
              </p>

              <!-- 进度条 -->
              <div v-if="!isUnlocked(achievement.id)" class="mb-2">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{{ t('achievementPanel.progress') }}</span>
                  <span>
                    {{ getProgress(achievement.id) }}/{{ getTarget(achievement.id) }}
                  </span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-industrial-blue transition-all duration-300"
                    :style="{
                      width: `${getProgressPercent(achievement.id)}%`,
                    }"
                  />
                </div>
              </div>

              <!-- 奖励信息 -->
              <div class="flex items-center gap-2 text-sm">
                <span class="text-gray-400">{{ t('achievementPanel.reward') }}:</span>
                <span class="text-industrial-yellow font-bold">
                  ⭐ {{ achievement.rewards.meritPoints }} {{ t('achievementPanel.meritPoints') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGameState } from '@/stores/useGameState.js'
import { getAllAchievements, ACHIEVEMENT_TYPES, ACHIEVEMENT_RARITY } from '@/constants/achievement-config.js'

const gameState = useGameState()
const { t } = useI18n()
const { showAchievementPanel, unlockedAchievements, achievementProgress, language } = storeToRefs(gameState)

const selectedType = ref('all')

// 成就类型选项
const achievementTypes = computed(() => [
  { value: ACHIEVEMENT_TYPES.BUILDING, label: t('achievementPanel.building') },
  { value: ACHIEVEMENT_TYPES.RESOURCE, label: t('achievementPanel.resource') },
  { value: ACHIEVEMENT_TYPES.METRIC, label: t('achievementPanel.metric') },
  { value: ACHIEVEMENT_TYPES.MILESTONE, label: t('achievementPanel.milestone') },
  { value: ACHIEVEMENT_TYPES.SPECIAL, label: t('achievementPanel.special') },
])

// 所有成就配置
const allAchievements = computed(() => getAllAchievements())

// 筛选后的成就列表
const filteredAchievements = computed(() => {
  if (selectedType.value === 'all') {
    return allAchievements.value
  }
  return allAchievements.value.filter(ach => ach.type === selectedType.value)
})

// 统计信息
const totalCount = computed(() => allAchievements.value.length)
const unlockedCount = computed(() => unlockedAchievements.value.length)
const commonCount = computed(() =>
  allAchievements.value.filter(
    ach => ach.rarity === ACHIEVEMENT_RARITY.COMMON && isUnlocked(ach.id)
  ).length
)
const rareCount = computed(() =>
  allAchievements.value.filter(
    ach => ach.rarity === ACHIEVEMENT_RARITY.RARE && isUnlocked(ach.id)
  ).length
)
const epicCount = computed(() =>
  allAchievements.value.filter(
    ach => (ach.rarity === ACHIEVEMENT_RARITY.EPIC || ach.rarity === ACHIEVEMENT_RARITY.LEGENDARY) && isUnlocked(ach.id)
  ).length
)

// 检查成就是否解锁
function isUnlocked(achievementId) {
  return gameState.isAchievementUnlocked(achievementId)
}

// 获取成就进度
function getProgress(achievementId) {
  const progress = achievementProgress.value[achievementId]
  return progress?.progress || 0
}

// 获取成就目标
function getTarget(achievementId) {
  const progress = achievementProgress.value[achievementId]
  return progress?.target || 0
}

// 获取进度百分比
function getProgressPercent(achievementId) {
  const progress = getProgress(achievementId)
  const target = getTarget(achievementId)
  if (target === 0) return 0
  return Math.min((progress / target) * 100, 100)
}

// 获取稀有度样式类
function getRarityClass(rarity) {
  switch (rarity) {
    case ACHIEVEMENT_RARITY.COMMON:
      return 'bg-gray-600 text-gray-200'
    case ACHIEVEMENT_RARITY.RARE:
      return 'bg-blue-600 text-blue-200'
    case ACHIEVEMENT_RARITY.EPIC:
      return 'bg-purple-600 text-purple-200'
    case ACHIEVEMENT_RARITY.LEGENDARY:
      return 'bg-yellow-600 text-yellow-200'
    default:
      return 'bg-gray-600 text-gray-200'
  }
}

// 获取稀有度标签
function getRarityLabel(rarity) {
  return t(`achievementPanel.rarity.${rarity}`)
}

// 关闭面板
function closePanel() {
  gameState.setShowAchievementPanel(false)
}
</script>

