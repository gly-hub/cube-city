<script setup>
import { computed } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { WAVE_COMPOSITION, ENEMY_BASE_CONFIG } from '@/js/td/enemy-types.js'

const props = defineProps({
  currentWave: {
    type: Number,
    required: true
  },
  isWaveActive: {
    type: Boolean,
    default: false
  }
})

const gameState = useGameState()
const language = computed(() => gameState.language)

// 获取下一波的怪物组成
const nextWave = computed(() => props.currentWave + 1)
const nextWaveData = computed(() => {
  const composition = WAVE_COMPOSITION[nextWave.value]
  if (!composition) return null
  
  return composition.map(group => {
    const config = ENEMY_BASE_CONFIG[group.type]
    return {
      type: group.type,
      count: group.count,
      name: config?.name || '未知',
      color: config?.color || '#ffffff',
      icon: getEnemyIcon(group.type),
    }
  })
})

// 获取怪物图标
function getEnemyIcon(type) {
  const icons = {
    scout: '🏃',
    tank: '🛡️',
    runner: '⚡',
    armored: '🔰',
    elite: '👑',
    boss: '💀',
    flying: '🦅',
    stealth: '👻',
    healer: '⚕️',
    splitter: '🧬',
  }
  return icons[type] || '👾'
}

// 计算总奖励
const totalReward = computed(() => {
  if (!nextWaveData.value) return 0
  
  return nextWaveData.value.reduce((sum, group) => {
    const config = ENEMY_BASE_CONFIG[group.type]
    const baseReward = config?.baseReward || 0
    const growthRate = config?.growthRates?.reward || 0
    // 简化计算：基础奖励 * (1 + 成长率 * 波数)
    const reward = Math.round(baseReward * (1 + growthRate * nextWave.value))
    return sum + (reward * group.count)
  }, 0)
})

// 是否是 Boss 波
const isBossWave = computed(() => {
  return nextWaveData.value?.some(group => group.type === 'boss')
})
</script>

<template>
  <div 
    v-if="!isWaveActive && nextWaveData" 
    class="wave-preview rounded-lg p-4 border"
    :class="isBossWave ? 'border-red-500 bg-red-950/30' : 'border-industrial-accent bg-industrial-gray'"
  >
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🔮</span>
        <h3 class="text-sm font-bold text-gray-300 uppercase" :class="language === 'zh' ? 'tracking-[0.3rem]' : ''">
          {{ language === 'zh' ? '下一波' : 'Next Wave' }}
        </h3>
        <span class="text-industrial-accent font-bold text-lg">
          {{ nextWave }}
        </span>
      </div>
      
      <!-- Boss 标记 -->
      <div v-if="isBossWave" class="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
        <span>⚠️</span>
        <span>{{ language === 'zh' ? 'BOSS波' : 'BOSS WAVE' }}</span>
      </div>
    </div>
    
    <!-- 怪物列表 -->
    <div class="space-y-2">
      <div
        v-for="(enemyGroup, index) in nextWaveData"
        :key="index"
        class="flex items-center justify-between p-2 rounded bg-black/20 hover:bg-black/40 transition-colors"
      >
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xl">{{ enemyGroup.icon }}</span>
          <div class="flex-1">
            <div class="text-xs font-bold text-white">
              {{ enemyGroup.name }}
            </div>
            <div class="text-[10px] text-gray-500">
              {{ language === 'zh' ? '数量' : 'Count' }}: {{ enemyGroup.count }}
            </div>
          </div>
        </div>
        
        <!-- 颜色指示器 -->
        <div 
          class="w-3 h-3 rounded-full border border-gray-600"
          :style="{ backgroundColor: enemyGroup.color }"
        />
      </div>
    </div>
    
    <!-- 奖励预览 -->
    <div class="mt-3 pt-3 border-t border-gray-700">
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-400">
          {{ language === 'zh' ? '预计奖励' : 'Est. Reward' }}:
        </span>
        <span class="text-industrial-yellow font-bold flex items-center gap-1">
          <span>💰</span>
          <span>+{{ totalReward }}</span>
        </span>
      </div>
    </div>
    
    <!-- 提示 -->
    <div class="mt-2 text-[10px] text-gray-500 text-center">
      {{ language === 'zh' ? '做好准备！' : 'Prepare yourself!' }}
    </div>
  </div>
</template>

<style scoped>
.wave-preview {
  box-shadow: 0 0 20px rgba(255, 184, 0, 0.1);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>



