<script setup>
import { computed, ref } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'

const gameState = useGameState()

// 防御塔类型定义
const towerTypes = [
  { 
    id: 'basic', 
    name: { zh: '基础塔', en: 'Basic Tower' }, 
    cost: 100, 
    icon: '🔵', 
    damage: 20, 
    range: 5,
    description: { zh: '平衡型防御塔，适合新手', en: 'Balanced tower for beginners' }
  },
  { 
    id: 'rapid', 
    name: { zh: '速射塔', en: 'Rapid Tower' }, 
    cost: 150, 
    icon: '⚡', 
    damage: 15, 
    range: 4,
    description: { zh: '攻速快，伤害低', en: 'Fast attack, low damage' }
  },
  { 
    id: 'heavy', 
    name: { zh: '重炮塔', en: 'Heavy Tower' }, 
    cost: 200, 
    icon: '💣', 
    damage: 40, 
    range: 6,
    description: { zh: '高伤害，攻速慢', en: 'High damage, slow attack' }
  },
]

const language = computed(() => gameState.language)
const draggingTower = ref(null)
const hoveredTower = ref(null)

// 开始拖拽
function handleDragStart(event, towerType) {
  draggingTower.value = towerType
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('towerType', JSON.stringify(towerType))
  // 创建拖拽预览
  const dragImage = event.target.cloneNode(true)
  dragImage.style.opacity = '0.5'
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-1000px'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, event.offsetX, event.offsetY)
  setTimeout(() => document.body.removeChild(dragImage), 0)
  
  eventBus.emit('td:drag-start', towerType)
}

// 结束拖拽
function handleDragEnd() {
  draggingTower.value = null
  eventBus.emit('td:drag-end')
}
</script>

<template>
  <aside class="industrial-panel shadow-industrial overflow-y-auto relative z-[10] custom-scrollbar" :class="$attrs.class || 'w-72'">
    <div class="p-4">
      <h2 class="text-lg font-bold text-industrial-accent uppercase tracking-wide mb-4 border-b border-gray-600 pb-2">
        <span class="neon-text">{{ language === 'zh' ? '防御系统' : 'Defense System' }}</span>
      </h2>
      
      <!-- 提示信息 -->
      <div class="mb-4 text-xs text-gray-400 bg-industrial-gray rounded-lg p-3 border border-gray-700">
        <div class="flex items-center mb-2">
          <span class="text-industrial-yellow mr-2">💡</span>
          <span class="text-industrial-accent font-bold uppercase tracking-wide">
            {{ language === 'zh' ? '操作提示' : 'Tips' }}
          </span>
        </div>
        <p class="leading-relaxed">
          {{ language === 'zh' ? '拖拽防御塔到地图空地上放置' : 'Drag towers to empty tiles on the map' }}
        </p>
      </div>

      <!-- 防御塔分类标题 -->
      <h3 class="text-sm font-bold text-gray-300 mb-3 uppercase flex items-center" :class="language === 'zh' ? 'tracking-[0.3rem]' : ''">
        <span class="w-2 h-2 rounded-full mr-2 bg-blue-500" />
        {{ language === 'zh' ? '防御塔' : 'Towers' }}
      </h3>
      
      <!-- 防御塔列表（可拖拽） - 使用网格布局 -->
      <div class="grid grid-cols-2 gap-2 mb-6">
        <div
          v-for="tower in towerTypes"
          :key="tower.id"
          class="building-card-industrial rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all"
          :class="[
            draggingTower?.id === tower.id ? 'ring-2 ring-industrial-accent scale-105' : '',
            gameState.credits < tower.cost ? 'pointer-events-none opacity-50 grayscale' : '',
          ]"
          :draggable="gameState.credits >= tower.cost"
          :title="gameState.credits < tower.cost 
            ? (language === 'zh' ? `金币不足！需要 ${tower.cost} 金币` : `Insufficient credits! Need ${tower.cost} coins`)
            : tower.description[language]
          "
          @dragstart="handleDragStart($event, tower)"
          @dragend="handleDragEnd"
          @mouseenter="hoveredTower = tower"
          @mouseleave="hoveredTower = null"
        >
          <div class="text-2xl text-center mb-1">
            {{ tower.icon }}
          </div>
          <div class="text-xs text-center font-bold text-gray-300 mb-1" :class="language === 'zh' ? 'tracking-[0.3rem]' : ''">
            {{ tower.name[language] }}
          </div>
          <div class="text-xs text-center text-industrial-yellow">
            <span class="text-xs">💰</span>
            <span class="tracking-widest">{{ tower.cost }}</span>
          </div>
          <div class="text-[10px] text-center text-gray-500 mt-1 space-x-2">
            <span>⚔️{{ tower.damage }}</span>
            <span>📡{{ tower.range }}</span>
          </div>
        </div>
      </div>

      <!-- 详细信息（悬停时显示） -->
      <div v-if="hoveredTower" class="resource-display rounded-lg p-3 border border-industrial-accent">
        <div class="flex items-center mb-2">
          <span class="text-2xl mr-2">{{ hoveredTower.icon }}</span>
          <div>
            <div class="text-sm font-bold text-white">{{ hoveredTower.name[language] }}</div>
            <div class="text-xs text-gray-400">{{ hoveredTower.description[language] }}</div>
          </div>
        </div>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '伤害' : 'Damage' }}:</span>
            <span class="text-white font-bold">{{ hoveredTower.damage }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '范围' : 'Range' }}:</span>
            <span class="text-white font-bold">{{ hoveredTower.range }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">{{ language === 'zh' ? '成本' : 'Cost' }}:</span>
            <span class="text-industrial-yellow font-bold">💰{{ hoveredTower.cost }}</span>
          </div>
        </div>
      </div>

      <!-- 战术提示 -->
      <div class="mt-4 text-xs text-gray-500 bg-industrial-gray rounded-lg p-3 border border-gray-800">
        <div class="flex items-center mb-2">
          <span class="text-lg mr-2">🎯</span>
          <span class="text-gray-400 font-bold uppercase tracking-wide">
            {{ language === 'zh' ? '战术提示' : 'Strategy' }}
          </span>
        </div>
        <ul class="space-y-1 leading-relaxed">
          <li>• {{ language === 'zh' ? '基础塔适合早期防御' : 'Basic towers for early defense' }}</li>
          <li>• {{ language === 'zh' ? '速射塔对付快速敌人' : 'Rapid towers for fast enemies' }}</li>
          <li>• {{ language === 'zh' ? '重炮塔对付重装单位' : 'Heavy towers for armored units' }}</li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 确保 industrial-panel 背景生效 */
aside.industrial-panel {
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a) !important;
  border: 1px solid #404040;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b3b3b #18181b;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #18181b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3b3b3b 60%, #ffb800 100%);
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ffb800 60%, #3b3b3b 100%);
}
</style>

