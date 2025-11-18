<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import BuildingSidebar from './components/BuildingSidebar.vue'
import RightInfoPanel from './components/RightInfoPanel.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import GameCanvas from './components/GameCanvas.vue'
import MapOverview from './components/MapOverview.vue'
import ModeIndicator from './components/ModeIndicator.vue'
import RestorePrompt from './components/RestorePrompt.vue'
import SelectedIndicator from './components/SelectedIndicator.vue'
import ToastContainer from './components/ToastContainer.vue'
import TopBar from './components/TopBar.vue'
import QuestPanel from './components/QuestPanel.vue'
import LevelUnlockModal from './components/LevelUnlockModal.vue'
import AchievementPanel from './components/AchievementPanel.vue'
import TechTreePanel from './components/TechTreePanel.vue'
import { useBuilding } from './hooks/useBuilding.js'
import { useMobile } from './composables/useMobile.js'

// 移动端检测
const { isMobile, isMobileDevice } = useMobile()

const showDialog = ref(false)
const dialogData = ref({})
const { getDialogConfig, handleBuildingTransaction } = useBuilding()
const gameState = useGameState()
const { gameSpeed } = storeToRefs(gameState)

// 移动端抽屉状态
const showBuildingDrawer = ref(false)
const showInfoDrawer = ref(false)

// 时间管理 - 可调节速度的计时器
let dayInterval = null
let isPaused = false
const BASE_DAY_INTERVAL = 5000 // 基础间隔：5秒 = 1天（1倍速）

// 页面可见性监听 - 实现HX-43离屏暂停功能
function handleVisibilityChange() {
  if (document.hidden && !isPaused) {
    // 页面不可见时暂停计时器
    if (dayInterval) {
      clearInterval(dayInterval)
      isPaused = true
    }
  }
  else if (!document.hidden && isPaused) {
    // 页面可见时恢复计时器
    startDayTimer()
    isPaused = false
  }
}

// 启动每日计时器（根据游戏速度调整间隔）
function startDayTimer() {
  if (dayInterval) {
    clearInterval(dayInterval)
  }
  
  // 根据游戏速度计算实际间隔：速度越快，间隔越短
  // 例如：2倍速 = 5000/2 = 2500ms，0.5倍速 = 5000/0.5 = 10000ms
  const actualInterval = BASE_DAY_INTERVAL / gameState.gameSpeed
  
  dayInterval = setInterval(() => {
    gameState.nextDay()
  }, actualInterval)
}

// 监听游戏速度变化，重新启动计时器
let speedWatcher = null

// 监听 mitt 事件
// 只监听一次即可
if (!window.__confirmDialogListenerAdded) {
  eventBus.on('ui:confirm-action', (data) => {
    dialogData.value = getDialogConfig(data.action, data.buildingType, data.buildingLevel)
    showDialog.value = true
  })
  window.__confirmDialogListenerAdded = true
}

function handleConfirm() {
  const result = handleBuildingTransaction(dialogData.value.action, dialogData.value.buildingType, dialogData.value.buildingLevel)
  if (result) {
    eventBus.emit('ui:action-confirmed', dialogData.value.action)
  }
  showDialog.value = false
}

function handleCancel() {
  showDialog.value = false
}

// ESC关闭地图总览
function handleKeydown(e) {
  if (gameState.showMapOverview && (e.key === 'Escape' || e.key === 'Esc')) {
    gameState.setShowMapOverview(false)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // 启动计时器（集成每日收益和稳定度更新）
  startDayTimer()
  // 监听页面可见性变化 - 实现HX-43离屏暂停功能
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 监听游戏速度变化，自动调整计时器
  speedWatcher = watch(() => gameSpeed.value, () => {
    if (!isPaused) {
      startDayTimer()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  // 清除计时器
  if (dayInterval) {
    clearInterval(dayInterval)
  }
  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // 移除速度监听
  if (speedWatcher) {
    speedWatcher()
  }
})
</script>

<template>
  <div>
    <RestorePrompt />
    <TopBar />
    <!-- 桌面端布局：水平排列 -->
    <div v-if="!isMobileDevice" class="flex gap-2 px-2 h-[calc(100vh-160px)]">
      <BuildingSidebar />
      <main class="flex-1 industrial-panel shadow-industrial relative overflow-hidden industrial-grid">
        <ModeIndicator />
        <SelectedIndicator />
      </main>
      <RightInfoPanel />
      <!-- 地图总览 -->
      <transition name="fade">
        <div v-if="gameState.showMapOverview" class="absolute top-[20%] right-[50%] translate-x-[50%] w-[min(90vw,600px)] h-[min(90vh,600px)] z-50 bg-[#212121] rounded-lg shadow-lg p-2" @contextmenu.prevent="gameState.setShowMapOverview(false)">
          <button
            class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-xl font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 focus:outline-none z-10"
            aria-label="关闭地图总览"
            tabindex="0"
            @click="gameState.setShowMapOverview(false)"
          >
            ❌
          </button>
          <MapOverview />
        </div>
      </transition>
    </div>

    <!-- 移动端布局：垂直排列，侧边栏和面板改为抽屉式 -->
    <div v-else class="flex flex-col h-[calc(100vh-100px)] relative">
      <!-- 主游戏区域 -->
      <main class="flex-1 industrial-panel shadow-industrial relative overflow-hidden industrial-grid">
        <ModeIndicator />
        <SelectedIndicator />
      </main>

      <!-- 移动端底部工具栏 -->
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700">
        <!-- 模式切换按钮 -->
        <div class="flex justify-around items-center p-2 border-b border-gray-700">
          <button
            v-for="mode in ['build', 'select', 'relocate', 'demolish']"
            :key="mode"
            class="flex-1 mx-1 px-3 py-2 rounded text-xs font-bold transition"
            :class="gameState.currentMode === mode ? 'bg-industrial-yellow text-gray-900' : 'bg-gray-700 text-gray-300'"
            @click="gameState.setMode(mode)"
          >
            {{ mode === 'build' ? '🏗️' : mode === 'select' ? '🔍' : mode === 'relocate' ? '🚚' : '💣' }}
            <span class="ml-1">{{ mode === 'build' ? '建造' : mode === 'select' ? '选择' : mode === 'relocate' ? '搬迁' : '拆除' }}</span>
          </button>
        </div>

        <!-- 快捷操作按钮 -->
        <div class="flex justify-around items-center p-2">
          <button
            class="px-4 py-2 bg-gray-800 text-white rounded text-sm font-bold"
            @click="showBuildingDrawer = !showBuildingDrawer"
          >
            🏛️ 建筑
          </button>
          <button
            class="px-4 py-2 bg-gray-800 text-white rounded text-sm font-bold"
            @click="showInfoDrawer = !showInfoDrawer"
          >
            ℹ️ 详情
          </button>
        </div>
      </div>

      <!-- 建筑选择抽屉（移动端） -->
      <transition name="slide-up">
        <div
          v-if="showBuildingDrawer"
          class="fixed inset-x-0 bottom-0 top-20 bg-gray-900 z-40 overflow-y-auto custom-scrollbar border-t border-gray-700"
          @click.self="showBuildingDrawer = false"
        >
          <div class="p-4 pb-24">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-industrial-accent">选择建筑</h2>
              <button
                class="text-2xl text-gray-400"
                @click="showBuildingDrawer = false"
              >
                ✕
              </button>
            </div>
            <BuildingSidebar class="w-full" />
          </div>
        </div>
      </transition>

      <!-- 信息面板抽屉（移动端） -->
      <transition name="slide-up">
        <div
          v-if="showInfoDrawer"
          class="fixed inset-x-0 bottom-0 top-20 bg-gray-900 z-40 overflow-y-auto custom-scrollbar border-t border-gray-700"
          @click.self="showInfoDrawer = false"
        >
          <div class="p-4 pb-24">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-industrial-accent">建筑详情</h2>
              <button
                class="text-2xl text-gray-400"
                @click="showInfoDrawer = false"
              >
                ✕
              </button>
            </div>
            <RightInfoPanel class="w-full" />
          </div>
        </div>
      </transition>

      <!-- 地图总览（移动端） -->
      <transition name="fade">
        <div
          v-if="gameState.showMapOverview"
          class="fixed inset-4 z-50 bg-[#212121] rounded-lg shadow-lg p-2"
          @contextmenu.prevent="gameState.setShowMapOverview(false)"
        >
          <button
            class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-xl font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 focus:outline-none z-10"
            aria-label="关闭地图总览"
            tabindex="0"
            @click="gameState.setShowMapOverview(false)"
          >
            ❌
          </button>
          <MapOverview />
        </div>
      </transition>
    </div>

    <ToastContainer />
    <ConfirmDialog
      v-if="dialogData"
      :show="showDialog"
      :title="dialogData.title"
      :message="dialogData.message"
      :confirm-text="dialogData.confirmText"
      :cancel-text="dialogData.cancelText"
      :action="dialogData.action"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    <QuestPanel />
    <LevelUnlockModal />
    <AchievementPanel />
    <TechTreePanel />
  </div>
  <GameCanvas />
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 移动端抽屉动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
</style>
