<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { getQuestsByLevel, getQuestConfig } from '@/constants/quest-config.js'
import { getNextLevelConfig, checkLevelUnlocked } from '@/constants/level-config.js'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'

const gameState = useGameState()
const { 
  currentLevel, 
  completedQuests, 
  questProgress, 
  language, 
  showQuestPanel,
  population,
  credits,
  stability,
  buildingCount,
  maxPower,
  power,
  dailyIncome,
  gameDay
} = storeToRefs(gameState)

// 获取任务系统实例（从全局或 Experience）
const questSystem = computed(() => {
  return window.questSystem || window.Experience?.questSystem
})

// 获取当前关卡的任务列表
const currentQuests = computed(() => {
  return getQuestsByLevel(currentLevel.value)
})

// 获取任务显示信息
const getQuestDisplay = (quest) => {
  const progress = questProgress.value[quest.id] || { progress: 0, target: 0, completed: false }
  const isCompleted = completedQuests.value.includes(quest.id)
  
  return {
    ...quest,
    progress: progress.progress || 0,
    target: progress.target || 1,
    completed: isCompleted,
    progressPercent: isCompleted ? 100 : Math.min(100, (progress.progress / (progress.target || 1)) * 100),
  }
}

// 格式化任务描述（显示进度）
const formatQuestDescription = (quest) => {
  const display = getQuestDisplay(quest)
  const { condition } = quest
  
  if (display.completed) {
    return language.value === 'zh' ? '✅ 已完成' : '✅ Completed'
  }

  let desc = quest.description[language.value] || quest.description.zh
  
  // 根据任务类型添加进度信息
  switch (condition.type) {
    case 'build_count':
      desc += ` (${display.progress}/${display.target})`
      break
    case 'metric_reach':
      desc += ` (${Math.floor(display.progress)}/${display.target})`
      break
    case 'total_earned':
      desc += ` (${Math.floor(display.progress)}/${display.target})`
      break
    default:
      desc += ` (${display.progress}/${display.target})`
  }
  
  return desc
}

// 获取下一关解锁信息
const nextLevelInfo = computed(() => {
  const nextLevel = currentLevel.value + 1
  const nextConfig = getNextLevelConfig(currentLevel.value)
  if (!nextConfig) return null

    const unlockStatus = checkLevelUnlocked(
      nextLevel,
      {
        population: population.value,
        dailyIncome: dailyIncome.value,
        stability: stability.value,
        buildingCount: buildingCount.value,
      },
      completedQuests.value
    )

  return {
    config: nextConfig,
    level: nextLevel,
    unlocked: unlockStatus.unlocked,
    reasons: unlockStatus.reasons,
  }
})

// 初始化时刷新任务进度
onMounted(() => {
  // 等待 questSystem 初始化
  const checkSystem = setInterval(() => {
    if (questSystem.value) {
      // 立即刷新所有任务进度（扫描现有建筑）
      questSystem.value.refreshAllQuests()
      clearInterval(checkSystem)
    }
  }, 100)

  // 定期更新任务进度
  const updateInterval = setInterval(() => {
    if (questSystem.value) {
      questSystem.value.checkMetricQuests()
      // 同步进度到 Pinia
      questSystem.value.getAllQuestProgress().forEach(progress => {
        gameState.updateQuestProgress(progress.questId, {
          progress: progress.progress,
          target: progress.target,
          completed: progress.completed,
        })
        
        // 如果任务完成，更新完成列表
        if (progress.completed && !gameState.isQuestCompleted(progress.questId)) {
          gameState.completeQuest(progress.questId)
        }
      })
    }
  }, 2000) // 每2秒更新一次

  onUnmounted(() => {
    clearInterval(checkSystem)
    clearInterval(updateInterval)
  })
})

// 关闭面板
function closePanel() {
  gameState.setShowQuestPanel(false)
}

// 跳转到下一关
function switchToNextLevel() {
  if (!nextLevelInfo.value || !nextLevelInfo.value.unlocked) {
    return
  }

  const levelSystem = window.levelSystem || window.Experience?.levelSystem
  if (!levelSystem) {
    console.error('LevelSystem not found')
    return
  }

  const success = levelSystem.switchToLevel(nextLevelInfo.value.level)
  if (success) {
    // 关闭任务面板
    gameState.setShowQuestPanel(false)
    
    // 显示成功提示（levelSystem 内部会触发 toast）
    // 这里可以添加额外的提示
  }
}
</script>

<template>
  <div
    v-if="showQuestPanel"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="closePanel"
  >
    <div class="industrial-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 m-4 shadow-industrial">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-industrial-accent neon-text">
          {{ language === 'zh' ? '📋 任务列表' : '📋 Quest List' }}
        </h2>
        <button
          class="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
          @click="closePanel"
        >
          ✕
        </button>
      </div>

      <!-- 当前关卡信息 -->
      <div class="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div class="text-sm text-gray-400 mb-1">
          {{ language === 'zh' ? '当前关卡' : 'Current Level' }}
        </div>
        <div class="text-xl font-bold text-industrial-accent">
          {{ language === 'zh' ? `关卡 ${currentLevel}` : `Level ${currentLevel}` }}
        </div>
      </div>

      <!-- 下一关解锁条件 -->
      <div
        v-if="nextLevelInfo"
        class="mb-6 p-4 rounded-lg border"
        :class="nextLevelInfo.unlocked
          ? 'bg-green-900/30 border-green-600'
          : 'bg-yellow-900/20 border-yellow-600'"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-white">
            {{ language === 'zh' ? '🎯 下一关解锁条件' : '🎯 Next Level Unlock' }}
          </h3>
          <div
            v-if="nextLevelInfo.unlocked"
            class="text-2xl"
          >
            ✅
          </div>
        </div>
        
        <div class="text-sm text-gray-300 mb-2">
          <strong>{{ nextLevelInfo.config.name[language] || nextLevelInfo.config.name.zh }}</strong>
          ({{ nextLevelInfo.config.mapSize }}×{{ nextLevelInfo.config.mapSize }})
        </div>

        <!-- 城市指标要求 -->
        <div class="space-y-2 mb-3">
          <div class="text-xs font-semibold text-gray-400 mb-1">
            {{ language === 'zh' ? '城市指标要求：' : 'City Metrics Required:' }}
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-400">{{ language === 'zh' ? '人口' : 'Population' }}:</span>
              <span :class="population >= nextLevelInfo.config.unlockConditions.cityMetrics.minPopulation ? 'text-green-400' : 'text-red-400'">
                {{ Math.floor(population) }}/{{ nextLevelInfo.config.unlockConditions.cityMetrics.minPopulation }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">{{ language === 'zh' ? '每日收入' : 'Daily Income' }}:</span>
              <span :class="dailyIncome >= nextLevelInfo.config.unlockConditions.cityMetrics.minDailyIncome ? 'text-green-400' : 'text-red-400'">
                {{ Math.floor(dailyIncome) }}/{{ nextLevelInfo.config.unlockConditions.cityMetrics.minDailyIncome }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">{{ language === 'zh' ? '稳定度' : 'Stability' }}:</span>
              <span :class="stability >= nextLevelInfo.config.unlockConditions.cityMetrics.minStability ? 'text-green-400' : 'text-red-400'">
                {{ Math.floor(stability) }}/{{ nextLevelInfo.config.unlockConditions.cityMetrics.minStability }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">{{ language === 'zh' ? '建筑数' : 'Buildings' }}:</span>
              <span :class="buildingCount >= nextLevelInfo.config.unlockConditions.cityMetrics.minBuildingCount ? 'text-green-400' : 'text-red-400'">
                {{ buildingCount }}/{{ nextLevelInfo.config.unlockConditions.cityMetrics.minBuildingCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- 任务要求 -->
        <div class="space-y-1">
          <div class="text-xs font-semibold text-gray-400 mb-1">
            {{ language === 'zh' ? '必须完成的任务：' : 'Required Quests:' }}
          </div>
          <div class="space-y-1">
            <div
              v-for="questId in nextLevelInfo.config.unlockConditions.requiredQuests"
              :key="questId"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-gray-300">
                {{ getQuestConfig(questId)?.name[language] || getQuestConfig(questId)?.name.zh || questId }}
              </span>
              <span
                v-if="completedQuests.includes(questId)"
                class="text-green-400"
              >
                ✅
              </span>
              <span
                v-else
                class="text-red-400"
              >
                ❌
              </span>
            </div>
            <div
              v-if="nextLevelInfo.config.unlockConditions.requiredQuests.length === 0"
              class="text-xs text-gray-500"
            >
              {{ language === 'zh' ? '无需完成任务' : 'No quests required' }}
            </div>
          </div>
        </div>

        <!-- 解锁奖励 -->
        <div
          v-if="nextLevelInfo.config.rewards.credits > 0"
          class="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400"
        >
          {{ language === 'zh' ? '解锁奖励' : 'Unlock Reward' }}:
          <span class="text-industrial-green font-bold">
            💰 {{ nextLevelInfo.config.rewards.credits }}
          </span>
        </div>

        <!-- 跳转下一关按钮 -->
        <div
          v-if="nextLevelInfo.unlocked"
          class="mt-4 pt-3 border-t border-green-600"
        >
          <button
            class="w-full px-6 py-3 rounded-lg bg-industrial-green text-white font-bold hover:bg-industrial-green/80 transition shadow-lg flex items-center justify-center space-x-2"
            @click="switchToNextLevel"
          >
            <span class="text-xl">🚀</span>
            <span>{{ language === 'zh' ? '跳转到下一关' : 'Switch to Next Level' }}</span>
          </button>
          <p class="mt-2 text-xs text-center text-gray-400">
            {{ language === 'zh' ? '地图将扩展至' : 'Map will expand to' }} {{ nextLevelInfo.config.mapSize }}×{{ nextLevelInfo.config.mapSize }}
          </p>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="space-y-4">
        <div
          v-for="quest in currentQuests"
          :key="quest.id"
          class="p-4 rounded-lg border transition"
          :class="getQuestDisplay(quest).completed
            ? 'bg-green-900/30 border-green-600'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'"
        >
          <!-- 任务标题 -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-white mb-1">
                {{ quest.name[language] || quest.name.zh }}
              </h3>
              <p class="text-sm text-gray-400">
                {{ formatQuestDescription(quest) }}
              </p>
            </div>
            <div class="ml-4 text-right">
              <div
                v-if="getQuestDisplay(quest).completed"
                class="text-2xl"
              >
                ✅
              </div>
              <div
                v-else
                class="text-sm text-gray-400"
              >
                {{ getQuestDisplay(quest).progressPercent.toFixed(0) }}%
              </div>
            </div>
          </div>

          <!-- 进度条 -->
          <div
            v-if="!getQuestDisplay(quest).completed"
            class="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-industrial-green transition-all duration-300"
              :style="{ width: `${getQuestDisplay(quest).progressPercent}%` }"
            />
          </div>

          <!-- 奖励信息 -->
          <div class="mt-3 text-xs text-gray-500">
            {{ language === 'zh' ? '奖励' : 'Reward' }}:
            <span class="text-industrial-green font-bold">
              💰 {{ quest.rewards.credits }}
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="currentQuests.length === 0"
          class="text-center py-8 text-gray-400"
        >
          {{ language === 'zh' ? '当前关卡暂无任务' : 'No quests for current level' }}
        </div>
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
</style>

