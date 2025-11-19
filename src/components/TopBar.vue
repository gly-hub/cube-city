<script setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useMobile } from '@/composables/useMobile.js'
import { getNextTitle } from '@/constants/title-config.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { SYSTEM_STATUS_LEVELS } from '@/js/utils/system-status.js'
import { useGameState } from '@/stores/useGameState.js'
import AnimatedNumber from './AnimatedNumber.vue'
import AudioManager from './AudioManager.vue'
import GuideModal from './GuideModal.vue'

const gameState = useGameState()
const { credits, totalJobs, maxPopulation, territory, citySize, cityLevel, cityName, language, gameDay, power, maxPower, musicEnabled, musicVolume, isPlayingMusic, showQuestPanel, meritPoints, buildingCount, dailyIncome, pollution, stability, systemStatus, gameSpeed } = storeToRefs(gameState)

// 移动端检测
const { isMobileDevice } = useMobile()

// 系统状态显示
const powerStatus = computed(() => SYSTEM_STATUS_LEVELS[systemStatus.value.power] || SYSTEM_STATUS_LEVELS[3])
const transportStatus = computed(() => SYSTEM_STATUS_LEVELS[systemStatus.value.transport] || SYSTEM_STATUS_LEVELS[3])
const securityStatus = computed(() => SYSTEM_STATUS_LEVELS[systemStatus.value.security] || SYSTEM_STATUS_LEVELS[3])
const environmentStatus = computed(() => SYSTEM_STATUS_LEVELS[systemStatus.value.environment] || SYSTEM_STATUS_LEVELS[3])

// 当前身份
const currentTitle = computed(() => gameState.getCurrentTitle())

// 获取下一级身份
function getNextTitleInfo() {
  if (!currentTitle.value)
    return null
  return getNextTitle(meritPoints.value)
}

// 提示框位置
const tooltipPosition = ref({ top: 0, right: 0 })
const showTooltip = ref(false)
const titleElementRef = ref(null)

// 计算提示框位置
function updateTooltipPosition(_event) {
  if (!titleElementRef.value)
    return
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

// 游戏速度控制
const showSpeedSlider = ref(false)
const speedButtonRef = ref(null)
const speedMenuRef = ref(null)
const speedMenuStyle = ref({})
const speedOptions = [
  { value: 0.25, label: { zh: '0.25x', en: '0.25x' }, icon: '🐌' },
  { value: 0.5, label: { zh: '0.5x', en: '0.5x' }, icon: '⏱️' },
  { value: 1.0, label: { zh: '1x', en: '1x' }, icon: '▶️' },
  { value: 2.0, label: { zh: '2x', en: '2x' }, icon: '⏩' },
  { value: 3.0, label: { zh: '3x', en: '3x' }, icon: '⚡' },
]

// 计算菜单位置（显示在按钮下方）
function updateSpeedMenuPosition() {
  if (!speedButtonRef.value || !showSpeedSlider.value)
    return

  nextTick(() => {
    if (!speedButtonRef.value)
      return

    const buttonRect = speedButtonRef.value.getBoundingClientRect()
    speedMenuStyle.value = {
      top: `${buttonRect.bottom + 8}px`,
      left: `${buttonRect.left + (buttonRect.width / 2)}px`,
      transform: 'translateX(-50%)',
    }
  })
}

// 处理鼠标离开（延迟关闭，避免快速移动时关闭）
let speedMenuTimeout = null
function handleSpeedMenuLeave() {
  speedMenuTimeout = setTimeout(() => {
    if (!speedMenuRef.value || !speedMenuRef.value.matches(':hover')) {
      showSpeedSlider.value = false
    }
  }, 200)
}

function setGameSpeed(speed) {
  gameState.setGameSpeed(speed)
  showSpeedSlider.value = false
  if (speedMenuTimeout) {
    clearTimeout(speedMenuTimeout)
  }
}

// 监听显示状态，更新位置
watch(showSpeedSlider, (newVal) => {
  if (newVal) {
    updateSpeedMenuPosition()
    // 监听窗口滚动和调整大小
    window.addEventListener('scroll', updateSpeedMenuPosition, true)
    window.addEventListener('resize', updateSpeedMenuPosition)
  }
  else {
    window.removeEventListener('scroll', updateSpeedMenuPosition, true)
    window.removeEventListener('resize', updateSpeedMenuPosition)
    if (speedMenuTimeout) {
      clearTimeout(speedMenuTimeout)
    }
  }
})

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

// 移动端菜单状态
const showMobileMenu = ref(false)
</script>

<template>
  <header class="industrial-panel shadow-industrial z-[10] relative overflow-visible" :class="[isMobileDevice ? 'p-1.5 m-0.5' : 'p-3 m-2']">
    <!-- 移动端：超简洁布局 -->
    <template v-if="isMobileDevice">
      <div class="flex justify-between items-center gap-2">
        <!-- 左侧：核心资源（只显示金币和关键警告） -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <!-- 金币（始终显示） -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 flex-shrink-0">
            <span class="text-industrial-green text-base">💰</span>
            <div class="text-xs font-bold text-industrial-green whitespace-nowrap">
              <AnimatedNumber :value="credits" :duration="3" separator="," />
            </div>
          </div>
          <!-- 人口警告（仅在有问题时显示） -->
          <div v-if="populationWarning" class="flex items-center gap-1 px-1.5 py-1 rounded bg-red-900/50 flex-shrink-0">
            <span class="text-red-500 text-sm">👥</span>
            <div class="text-xs font-bold text-red-500 whitespace-nowrap">
              <AnimatedNumber :value="totalJobs" :duration="3" />/<AnimatedNumber :value="maxPopulation" :duration="3" />
            </div>
          </div>
          <!-- 电力警告（仅在有问题时显示） -->
          <div v-if="powerWarning" class="flex items-center gap-1 px-1.5 py-1 rounded bg-red-900/50 flex-shrink-0">
            <span class="text-red-500 text-sm">⚡️</span>
            <div class="text-xs font-bold text-red-500 whitespace-nowrap">
              <AnimatedNumber :value="power" :duration="3" />/<AnimatedNumber :value="maxPower" :duration="3" />
            </div>
          </div>
        </div>
        <!-- 右侧：城市等级和天数 + 菜单按钮 -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="text-xs text-gray-400 whitespace-nowrap">
            Lv.{{ cityLevel }} • Day {{ gameDay }}
          </div>
          <button
            class="px-2 py-1 rounded bg-gray-700 text-white text-sm hover:bg-gray-600 transition"
            @click="showMobileMenu = !showMobileMenu"
          >
            ☰
          </button>
        </div>
      </div>

      <!-- 移动端菜单（下拉） -->
      <transition name="slide-down">
        <div
          v-if="showMobileMenu"
          class="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50 p-2"
          @click.stop
        >
          <div class="grid grid-cols-2 gap-2">
            <button
              class="px-3 py-2 rounded bg-gray-700 text-white text-xs font-bold hover:bg-gray-600"
              @click="toggleLang(); showMobileMenu = false"
            >
              {{ language === 'zh' ? '🌐 EN' : '🌐 中' }}
            </button>
            <button
              class="px-3 py-2 rounded bg-industrial-green text-white text-xs font-bold hover:bg-industrial-green/80"
              @click="toggleGuide(); showMobileMenu = false"
            >
              📖 {{ language === 'zh' ? '指南' : 'Guide' }}
            </button>
            <button
              class="px-3 py-2 rounded text-white text-xs font-bold hover:opacity-80"
              :class="musicEnabled ? 'bg-industrial-blue' : 'bg-gray-600'"
              @click="toggleMusic(); showMobileMenu = false"
            >
              {{ musicEnabled && isPlayingMusic ? '🔊' : '🔇' }} {{ language === 'zh' ? '音乐' : 'Music' }}
            </button>
            <button
              class="px-3 py-2 rounded bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
              @click="toggleQuestPanel(); showMobileMenu = false"
            >
              📋 {{ language === 'zh' ? '任务' : 'Quests' }}
            </button>
            <!-- 游戏速度 -->
            <div class="relative col-span-2">
              <button
                ref="speedButtonRef"
                class="w-full px-3 py-2 rounded bg-industrial-yellow text-gray-900 text-xs font-bold hover:bg-industrial-yellow/80"
                @click.stop="showSpeedSlider = !showSpeedSlider"
              >
                ⏱️ {{ gameSpeed }}x {{ language === 'zh' ? '速度' : 'Speed' }}
              </button>
              <!-- 速度菜单 -->
              <div
                v-if="showSpeedSlider"
                class="absolute top-full left-0 right-0 mt-1 p-2 bg-gray-800 rounded shadow-lg border border-gray-600 z-10"
                @click.stop
              >
                <div class="space-y-1">
                  <button
                    v-for="option in speedOptions"
                    :key="option.value"
                    class="w-full px-3 py-1.5 rounded text-xs font-bold text-left flex items-center space-x-2"
                    :class="gameSpeed === option.value ? 'bg-industrial-yellow text-gray-900' : 'bg-gray-700 text-white'"
                    @click.stop="setGameSpeed(option.value)"
                  >
                    <span>{{ option.icon }}</span>
                    <span>{{ option.label[language] }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </template>

    <!-- 桌面端：完整布局 -->
    <template v-else>
      <!-- 第一行：主要资源和城市信息 -->
      <div class="flex justify-between items-center mb-2">
        <!-- 左侧资源信息 (仅内城显示) -->
        <div v-if="gameState.currentScene === 'CITY'" class="flex items-center space-x-4">
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
        <!-- 外城资源占位 -->
        <div v-else class="flex items-center space-x-4">
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
        </div>

        <!-- 右侧城市信息和按钮 -->
        <div class="text-right flex items-center space-x-3">
          <!-- 城市信息 -->
          <div class="flex items-center gap-4">
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

            <!-- 场景切换按钮 -->
            <div class="flex bg-gray-800 rounded-lg p-1 border border-gray-600">
              <button
                class="px-3 py-1 rounded text-xs font-bold transition-colors duration-200"
                :class="gameState.currentScene === 'CITY' ? 'bg-industrial-yellow text-gray-900' : 'text-gray-400 hover:text-white'"
                @click="gameState.setScene('CITY')"
              >
                🏙️ {{ language === 'zh' ? '内城' : 'City' }}
              </button>
              <button
                class="px-3 py-1 rounded text-xs font-bold transition-colors duration-200"
                :class="gameState.currentScene === 'TD' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'"
                @click="gameState.setScene('TD')"
              >
                🛡️ {{ language === 'zh' ? '外城' : 'Defense' }}
              </button>
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

            <!-- 游戏速度控制 -->
            <div class="relative">
              <button
                ref="speedButtonRef"
                class="w-full px-2 py-1 rounded bg-industrial-yellow text-gray-900 text-sm font-bold shadow transition hover:bg-industrial-yellow/80"
                :title="language === 'zh' ? `当前速度: ${gameSpeed}x` : `Current Speed: ${gameSpeed}x`"
                @click.stop="showSpeedSlider = !showSpeedSlider"
                @mouseenter="showSpeedSlider = true"
                @mouseleave="handleSpeedMenuLeave"
              >
                ⏱️ {{ gameSpeed }}x
              </button>

              <!-- 速度选择菜单 - 使用 Teleport 确保在最上层 -->
              <Teleport to="body">
                <div
                  v-if="showSpeedSlider"
                  ref="speedMenuRef"
                  class="fixed p-2 bg-gray-800 rounded shadow-lg border border-gray-600 z-[9999] min-w-[200px]"
                  :style="speedMenuStyle"
                  @mouseenter="showSpeedSlider = true"
                  @mouseleave="showSpeedSlider = false"
                  @click.stop
                >
                  <div class="text-xs text-gray-400 mb-2 text-center uppercase">
                    {{ language === 'zh' ? '游戏速度' : 'Game Speed' }}
                  </div>
                  <div class="space-y-1">
                    <button
                      v-for="option in speedOptions"
                      :key="option.value"
                      class="w-full px-3 py-1.5 rounded text-sm font-bold transition text-left flex items-center space-x-2"
                      :class="gameSpeed === option.value ? 'bg-industrial-yellow text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'"
                      @click.stop="setGameSpeed(option.value)"
                    >
                      <span>{{ option.icon }}</span>
                      <span>{{ option.label[language] }}</span>
                    </button>
                  </div>
                  <!-- 自定义速度滑块 -->
                  <div class="mt-3 pt-3 border-t border-gray-700">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="text-xs text-gray-400">🐌</span>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        :value="gameSpeed"
                        class="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        @input.stop="(e) => gameState.setGameSpeed(Number.parseFloat(e.target.value))"
                      >
                      <span class="text-xs text-gray-400">⚡</span>
                    </div>
                    <div class="text-xs text-center text-gray-400">
                      {{ gameSpeed.toFixed(1) }}x
                    </div>
                  </div>
                </div>
              </Teleport>
            </div>
          </div>
        </div>
      </div>
      <!-- 第二行：城市指标和系统状态（移动端隐藏） -->
      <div v-if="!isMobileDevice && gameState.currentScene === 'CITY'" class="flex justify-between items-center pt-2 border-t border-gray-700">
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
            <div class="status-indicator" :class="powerStatus.indicatorClass" />
            <span class="text-xs uppercase" :class="powerStatus.color">
              {{ language === 'zh' ? powerStatus.zh : powerStatus.en }}
            </span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
              {{ $t('dashboardFooter.transport') }}:
            </span>
            <div class="status-indicator" :class="transportStatus.indicatorClass" />
            <span class="text-xs uppercase" :class="transportStatus.color">
              {{ language === 'zh' ? transportStatus.zh : transportStatus.en }}
            </span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
              {{ $t('dashboardFooter.security') }}:
            </span>
            <div class="status-indicator" :class="securityStatus.indicatorClass" />
            <span class="text-xs uppercase" :class="securityStatus.color">
              {{ language === 'zh' ? securityStatus.zh : securityStatus.en }}
            </span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs text-gray-400 uppercase" :class="language === 'zh' ? 'tracking-[0.2rem]' : 'tracking-wide'">
              {{ $t('dashboardFooter.environment') }}:
            </span>
            <div class="status-indicator" :class="environmentStatus.indicatorClass" />
            <span class="text-xs uppercase" :class="environmentStatus.color">
              {{ language === 'zh' ? environmentStatus.zh : environmentStatus.en }}
            </span>
          </div>
        </div>
      </div>
    </template>

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

/* 移动端菜单下拉动画 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease-out;
  transform-origin: top;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
