<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Teleport } from 'vue'
import AnimatedNumber from './AnimatedNumber.vue'
import AudioManager from './AudioManager.vue'
import GuideModal from './GuideModal.vue'
import { getNextTitle } from '@/constants/title-config.js'

const gameState = useGameState()
const { credits, totalJobs, maxPopulation, territory, citySize, cityLevel, cityName, language, showMapOverview, gameDay, power, maxPower, musicEnabled, musicVolume, isPlayingMusic, showQuestPanel, meritPoints, buildingCount, dailyIncome, pollution, stability } = storeToRefs(gameState)

// 当前身份
const currentTitle = computed(() => gameState.getCurrentTitle())

// 获取下一级身份
function getNextTitleInfo() {
  if (!currentTitle.value) return null
  return getNextTitle(meritPoints.value)
}

// 提示框位置
const tooltipPosition = ref({ top: 0, right: 0 })
const showTooltip = ref(false)
const titleElementRef = ref(null)

// 计算提示框位置
function updateTooltipPosition(event) {
  if (!titleElementRef.value) return
  const rect = titleElementRef.value.getBoundingClientRect()
  tooltipPosition.value = {
    top: rect.bottom + 8,
    right: window.innerWidth - rect.right,
  }
  showTooltip.value = true
}

function hideTooltip() {
  showTooltip.value = false
}

// 音乐相关
const showVolumeSlider = ref(false)

// 音乐控制方法
function toggleMusic() {
  gameState.toggleMusic()
}

function handleVolumeChange(event) {
  const volume = Number.parseFloat(event.target.value)
  gameState.setMusicVolume(volume)
}

// 警告状态
const populationWarning = computed(() => totalJobs.value > maxPopulation.value)
const powerWarning = computed(() => power.value > maxPower.value)

// 监听异常状态并触发警告
watch([totalJobs, maxPopulation, power, maxPower], ([newTotalJobs, newMaxPopulation, newPower, newMaxPower], [oldTotalJobs, oldMaxPopulation, oldPower, oldMaxPower]) => {
  // 人口警告：当就业岗位超过人口容量时
  if (newTotalJobs > newMaxPopulation && !(oldTotalJobs > oldMaxPopulation)) {
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '⚠️ 就业岗位不足！人口容量已超负荷' : '⚠️ Job shortage! Population capacity exceeded',
      type: 'warning',
    })
  }

  // 电力警告：当耗电量超过发电量时
  if (newPower > newMaxPower && !(oldPower > oldMaxPower)) {
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '⚡ 电力不足！发电量无法满足需求' : '⚡ Power shortage! Power generation insufficient',
      type: 'error',
    })
  }
}, { immediate: true })

function toggleLang() {
  gameState.setLanguage(language.value === 'zh' ? 'en' : 'zh')
}

function toggleQuestPanel() {
  gameState.setShowQuestPanel(!showQuestPanel.value)
}

// 新手指南状态
const showGuide = ref(false)

function toggleGuide() {
  showGuide.value = !showGuide.value
}

// 显示新手指南
function showGuideModal() {
  showGuide.value = true
}
</script>

<template>
  <header class="industrial-panel p-3 m-2 shadow-industrial z-[10] relative overflow-visible">
    <!-- 第一行：主要资源和城市信息 -->
    <div class="flex justify-between items-center mb-2">
      <!-- 左侧资源信息 -->
      <div class="flex items-center space-x-4">
        <!-- 金币 -->
        <div class="resource-display rounded-lg px-3 py-1.5 flex items-center space-x-2 min-w-[8vw]">
          <div class="status-indicator status-online" />
          <div class="flex items-center space-x-1.5">
            <span class="text-industrial-green text-lg">💰</span>
            <div>
              <div class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
                {{ $t('topbar.credits') }}
              </div>
              <div class="text-base font-bold text-industrial-green neon-text">
                <AnimatedNumber :value="credits" :duration="3" separator="," />
              </div>
            </div>
          </div>
        </div>
        <!-- 人口 -->
        <div class="resource-display rounded-lg px-3 py-1.5 flex items-center space-x-2 min-w-[8vw]" :class="{ 'warning-pulse': populationWarning }">
          <div class="status-indicator" :class="populationWarning ? 'status-error' : 'status-online'" />
          <div class="flex items-center space-x-1.5">
            <span class="text-lg" :class="populationWarning ? 'text-red-500' : 'text-industrial-blue'">👥</span>
            <div>
              <div class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
                {{ $t('topbar.population') }}
              </div>
              <div class="text-base font-bold neon-text" :class="populationWarning ? 'text-red-500' : 'text-industrial-blue'">
                <AnimatedNumber :value="totalJobs" :duration="3" separator="," />/
                <AnimatedNumber :value="maxPopulation" :duration="3" separator="," />
              </div>
            </div>
          </div>
        </div>
        <!-- 地皮 -->
        <div class="resource-display rounded-lg px-3 py-1.5 flex items-center space-x-2">
          <div class="status-indicator status-warning" />
          <div class="flex items-center space-x-1.5">
            <span class="text-industrial-accent text-lg">🏭</span>
            <div>
              <div class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
                {{ $t('topbar.territory') }}
              </div>
              <div class="text-base font-bold text-industrial-accent neon-text">
                {{ territory }}×{{ citySize }}
              </div>
            </div>
          </div>
        </div>
        <!-- 电力 -->
        <div class="resource-display rounded-lg px-3 py-1.5 flex items-center space-x-2 min-w-[8vw]" :class="{ 'warning-pulse': powerWarning }">
          <div class="status-indicator" :class="powerWarning ? 'status-error' : 'status-online'" />
          <div class="flex items-center space-x-1.5">
            <span class="text-lg" :class="powerWarning ? 'text-red-500' : 'text-industrial-yellow'">⚡️</span>
            <div>
              <div class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
                {{ $t('topbar.power') }}
              </div>
              <div class="text-base font-bold neon-text" :class="powerWarning ? 'text-red-500' : 'text-industrial-yellow'">
                <AnimatedNumber :value="power" :duration="3" separator="," />/
                <AnimatedNumber :value="maxPower" :duration="3" separator="," />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧城市信息和按钮 -->
      <div class="text-right flex items-center space-x-3">
        <!-- 城市信息 -->
        <div>
          <h1 class="text-xl font-black text-industrial-accent neon-text uppercase tracking-wider">
            {{ cityName }}
          </h1>
          <div class="flex items-center justify-end space-x-2 mt-0.5 relative">
            <div class="status-indicator status-online" />
            <span class="text-xs text-gray-400 uppercase tracking-wide">
              {{ $t('topbar.level') }} <span class="text-white">{{ cityLevel }}</span> • {{ $t('topbar.day') }} <span class="text-white">{{ gameDay }}</span>
              <span
                v-if="currentTitle"
                ref="titleElementRef"
                class="text-industrial-yellow cursor-help hover:text-industrial-yellow/80 transition-colors relative inline-block"
                @mouseenter="updateTooltipPosition"
                @mouseleave="hideTooltip"
              >
                • {{ currentTitle.icon }} {{ currentTitle.name[language] }}
              </span>
            </span>
            <!-- 悬停提示框 - 使用 fixed 定位，放在外层 -->
            <Teleport to="body">
              <div
                v-if="currentTitle && showTooltip"
                class="fixed w-64 p-3 bg-gray-900 border-2 border-industrial-yellow rounded-lg shadow-xl transition-all duration-200 z-[9999]"
                :style="{
                  top: `${tooltipPosition.top}px`,
                  right: `${tooltipPosition.right}px`,
                }"
                @mouseenter="showTooltip = true"
                @mouseleave="hideTooltip"
              >
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-2xl">{{ currentTitle.icon }}</span>
                  <div>
                    <div class="text-sm font-bold text-industrial-yellow uppercase">
                      {{ currentTitle.name[language] }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ language === 'zh' ? '当前身份' : 'Current Title' }}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-700">
                  <div class="mb-1">
                    <span class="text-gray-400">{{ language === 'zh' ? '政绩分：' : 'Merit Points: ' }}</span>
                    <span class="text-industrial-yellow font-bold">{{ meritPoints }}</span>
                  </div>
                  <div v-if="getNextTitleInfo()" class="mt-2">
                    <span class="text-gray-400">{{ language === 'zh' ? '下一级：' : 'Next Level: ' }}</span>
                    <span class="text-white">{{ getNextTitleInfo().name[language] }}</span>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ language === 'zh' ? '需要' : 'Requires' }} {{ getNextTitleInfo().minMeritPoints }} {{ language === 'zh' ? '政绩分' : 'merit points' }}
                    </div>
                  </div>
                  <div v-else class="mt-2 text-gray-500 text-xs">
                    {{ language === 'zh' ? '已达到最高身份' : 'Maximum title reached' }}
                  </div>
                </div>
              </div>
            </Teleport>
          </div>
        </div>

        <!-- 按钮区域 - 紧凑布局 -->
        <div class="flex gap-1.5">
          <!-- 第一行 -->
          <button class="px-2 py-1 rounded bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition" @click="toggleLang">
            {{ language === 'zh' ? 'EN' : '中' }}
          </button>

          <button
            class="px-3 col-span-2 py-1 rounded bg-industrial-green text-white text-sm font-bold shadow hover:bg-industrial-green/80 transition"
            @click="toggleGuide"
          >
            📖 {{ language === 'zh' ? '指南' : 'Guide' }}
          </button>

          <!-- 第二行 -->
          <div class="relative">
            <button
              class="w-full px-2 py-1 rounded text-white text-sm font-bold shadow transition"
              :class="musicEnabled ? 'bg-industrial-blue hover:bg-industrial-blue/80' : 'bg-gray-600 hover:bg-gray-500'"
              :title="musicEnabled ? $t('topbar.music.pauseMusic') : $t('topbar.music.playMusic')"
              @click="toggleMusic"
              @mouseenter="showVolumeSlider = true"
              @mouseleave="showVolumeSlider = false"
            >
              {{ musicEnabled && isPlayingMusic ? '🔊' : '🔇' }}
            </button>

            <!-- 音量滑块 tooltip -->
            <div
              v-if="showVolumeSlider"
              class="absolute bottom-full left-1/2 transform -translate-x-1/2  p-3 bg-gray-800 rounded shadow-lg border border-gray-600 z-20 min-w-max"
              @mouseenter="showVolumeSlider = true"
              @mouseleave="showVolumeSlider = false"
            >
              <div class="flex items-center space-x-2 whitespace-nowrap">
                <span class="text-xs text-gray-400">🔉</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  :value="musicVolume"
                  class="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  @input="handleVolumeChange"
                >
                <span class="text-xs text-gray-400">🔊</span>
              </div>
              <div class="text-xs text-center text-gray-400 mt-1">
                {{ Math.round(musicVolume * 100) }}%
              </div>
            </div>
          </div>

          <!-- 任务按钮 -->
          <button
            class="px-3 col-span-3 py-1 rounded bg-purple-600 text-white text-sm font-bold shadow hover:bg-purple-500 transition"
            @click="toggleQuestPanel"
          >
            📋 {{ language === 'zh' ? '任务' : 'Quests' }}
          </button>
        </div>
      </div>
    </div>
    <!-- 第二行：城市指标和系统状态 -->
    <div class="flex justify-between items-center pt-2 border-t border-gray-700">
      <!-- 城市指标 -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.buildings') }}:
          </span>
          <span class="text-sm font-bold text-industrial-green neon-text">
            <AnimatedNumber :value="buildingCount" :duration="2" />
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.dailyIncome') }}:
          </span>
          <span class="text-sm font-bold text-industrial-blue neon-text">
            +<AnimatedNumber :value="dailyIncome" :duration="2" separator="," />
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.efficiency') }}:
          </span>
          <span
            class="text-sm font-bold neon-text"
            :class="pollution > 100 ? 'text-red-500' : 'text-industrial-yellow'"
          >
            <AnimatedNumber :value="pollution" :duration="2" />
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.stability') }}:
          </span>
          <span class="text-sm font-bold text-industrial-green neon-text">
            <AnimatedNumber :value="stability" :duration="2" />%
          </span>
        </div>
      </div>
      <!-- 系统状态 -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1.5">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.powerGrid') }}:
          </span>
          <div class="status-indicator status-online" />
          <span class="text-xs text-industrial-green uppercase">{{ $t('dashboardFooter.online') }}</span>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.transport') }}:
          </span>
          <div class="status-indicator status-warning" />
          <span class="text-xs text-industrial-yellow uppercase">{{ $t('dashboardFooter.limited') }}</span>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.security') }}:
          </span>
          <div class="status-indicator status-online" />
          <span class="text-xs text-industrial-green uppercase">{{ $t('dashboardFooter.secure') }}</span>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
            {{ $t('dashboardFooter.environment') }}:
          </span>
          <div class="status-indicator status-warning" />
          <span class="text-xs text-industrial-yellow uppercase">{{ $t('dashboardFooter.moderate') }}</span>
        </div>
      </div>
    </div>

    <!-- 新手指南弹窗 -->
    <GuideModal
      :is-visible="showGuide"
      @close="showGuide = false"
      @show-guide="showGuideModal"
    />

    <!-- 音频管理器 -->
    <AudioManager />
  </header>
</template>

<style scoped>
/* 警告脉冲效果 */
.warning-pulse {
  animation: warning-pulse 2s ease-in-out infinite;
  border: 2px solid transparent;
  background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
}

@keyframes warning-pulse {
  0% {
    transform: scale(1);
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    transform: scale(1.02);
    border-color: rgba(239, 68, 68, 0.6);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(1);
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* 状态指示器样式 */
.status-error {
  background-color: #ef4444;
  box-shadow: 0 0 10px #ef4444;
  animation: error-blink 1s ease-in-out infinite;
}

@keyframes error-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
