<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="closePanel"
  >
    <div
      class="industrial-panel shadow-industrial max-w-4xl w-full max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- 标题栏 -->
      <div class="p-4 border-b border-gray-600 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-industrial-accent uppercase tracking-wide neon-text">
            🔬 {{ language === 'zh' ? '科技树' : 'Tech Tree' }}
          </h2>
          <p v-if="buildingInfo" class="text-sm text-gray-400 mt-1">
            {{ buildingInfo.name[language] }} ({{ language === 'zh' ? '等级' : 'Level' }} {{ buildingInfo.level }})
          </p>
        </div>
        <button
          class="text-gray-400 hover:text-white transition-colors text-2xl"
          @click="closePanel"
        >
          ✕
        </button>
      </div>

      <!-- 内容区域 -->
      <div v-if="buildingInfo" class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
        <div v-if="availableTechs.length === 0" class="text-center py-8">
          <p class="text-gray-400">
            {{ language === 'zh' ? '该建筑暂无科技树' : 'No tech tree available for this building' }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <!-- 科技列表 -->
          <div
            v-for="tech in availableTechs"
            :key="tech.id"
            class="bg-gray-800/50 rounded-lg p-4 border-2 transition-all"
            :class="getTechCardClass(tech)"
          >
            <!-- 科技头部 -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <span class="text-3xl">{{ tech.icon }}</span>
                <div>
                  <h3 class="text-lg font-bold text-industrial-accent uppercase">
                    {{ tech.name[language] }}
                  </h3>
                  <p class="text-sm text-gray-400 mt-1">
                    {{ tech.description[language] }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-industrial-yellow">
                  {{ tech.cost }} 💰
                </div>
                <div
                  v-if="tech.researched"
                  class="text-xs text-industrial-green mt-1"
                >
                  ✓ {{ language === 'zh' ? '已研发' : 'Researched' }}
                </div>
              </div>
            </div>

            <!-- 前置科技 -->
            <div v-if="tech.prerequisites && tech.prerequisites.length > 0" class="mb-3">
              <div class="text-xs text-gray-400 uppercase mb-1">
                {{ language === 'zh' ? '前置科技' : 'Prerequisites' }}:
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="prereqId in tech.prerequisites"
                  :key="prereqId"
                  class="text-xs px-2 py-1 rounded"
                  :class="isPrereqResearched(prereqId) ? 'bg-industrial-green/20 text-industrial-green' : 'bg-gray-700 text-gray-500'"
                >
                  {{ getTechName(prereqId) }}
                  <span v-if="isPrereqResearched(prereqId)">✓</span>
                </span>
              </div>
            </div>

            <!-- 科技效果 -->
            <div class="mb-3">
              <div class="text-xs text-gray-400 uppercase mb-2">
                {{ language === 'zh' ? '效果' : 'Effects' }}:
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div
                  v-for="(value, key) in tech.effects"
                  :key="key"
                  class="flex items-center space-x-2"
                >
                  <span class="text-gray-300">{{ getEffectLabel(key, language) }}:</span>
                  <span
                    class="font-bold"
                    :class="getEffectColor(key, value)"
                  >
                    {{ formatEffectValue(key, value) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 研发按钮 -->
            <button
              v-if="!tech.researched"
              class="w-full py-2 px-4 rounded font-bold text-sm uppercase tracking-wide transition"
              :class="getResearchButtonClass(tech)"
              :disabled="!tech.unlocked || credits < tech.cost"
              @click="researchTech(tech.id)"
            >
              <span v-if="tech.unlocked && credits >= tech.cost">
                🔬 {{ language === 'zh' ? '研发科技' : 'Research Tech' }}
              </span>
              <span v-else-if="!tech.unlocked">
                🔒 {{ language === 'zh' ? '前置科技未完成' : 'Prerequisites Not Met' }}
              </span>
              <span v-else>
                💰 {{ language === 'zh' ? '金币不足' : 'Insufficient Credits' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGameState } from '../stores/useGameState'
import { getTechById, TECH_EFFECT_TYPES } from '@/constants/tech-tree-config.js'
import { BUILDING_DATA } from '@/constants/constants.js'

const gameState = useGameState()
const { t, locale } = useI18n()
const { showTechTreePanel, selectedBuildingForTech, credits, language } = storeToRefs(gameState)

const show = computed(() => showTechTreePanel.value)

// 建筑信息
const buildingInfo = computed(() => {
  if (!selectedBuildingForTech.value) return null
  const { x, y } = selectedBuildingForTech.value
  const tile = gameState.getTile(x, y)
  if (!tile || !tile.building) return null

  const buildingData = BUILDING_DATA[tile.building]
  const levelData = buildingData?.levels[tile.level]
  if (!buildingData || !levelData) return null

  return {
    type: tile.building,
    level: tile.level,
    name: buildingData.name,
    x,
    y,
  }
})

// 可用的科技列表
const availableTechs = computed(() => {
  if (!buildingInfo.value) {
    console.log('TechTreePanel: No buildingInfo')
    return []
  }
  
  if (!window.techSystem) {
    console.error('TechTreePanel: window.techSystem is not available')
    return []
  }
  
  const researchedTechs = gameState.getBuildingTechs(buildingInfo.value.x, buildingInfo.value.y)
  const techs = window.techSystem.getAvailableTechs(buildingInfo.value.type, researchedTechs)
  
  console.log('TechTreePanel: Available techs for', buildingInfo.value.type, ':', techs)
  
  return techs || []
})

// 获取科技卡片样式
function getTechCardClass(tech) {
  if (tech.researched) {
    return 'border-industrial-green bg-industrial-green/10'
  }
  if (tech.unlocked) {
    return 'border-industrial-yellow hover:border-industrial-yellow/80'
  }
  return 'border-gray-700 opacity-60'
}

// 获取研发按钮样式
function getResearchButtonClass(tech) {
  if (tech.unlocked && credits.value >= tech.cost) {
    return 'bg-industrial-green hover:bg-industrial-green/80 text-white'
  }
  return 'bg-gray-700 text-gray-400 cursor-not-allowed'
}

// 检查前置科技是否已研发
function isPrereqResearched(prereqId) {
  if (!buildingInfo.value) return false
  const researchedTechs = gameState.getBuildingTechs(buildingInfo.value.x, buildingInfo.value.y)
  return researchedTechs.includes(prereqId)
}

// 获取科技名称
function getTechName(techId) {
  const tech = getTechById(techId)
  return tech ? tech.name[language.value] : techId
}

// 获取效果标签
function getEffectLabel(key, lang) {
  const labels = {
    [TECH_EFFECT_TYPES.OUTPUT]: { zh: '产出', en: 'Output' },
    [TECH_EFFECT_TYPES.POLLUTION]: { zh: '污染', en: 'Pollution' },
    [TECH_EFFECT_TYPES.STABILITY]: { zh: '稳定度', en: 'Stability' },
    [TECH_EFFECT_TYPES.POPULATION]: { zh: '人口', en: 'Population' },
    [TECH_EFFECT_TYPES.POWER]: { zh: '电力', en: 'Power' },
    [TECH_EFFECT_TYPES.EFFICIENCY]: { zh: '效率', en: 'Efficiency' },
    [TECH_EFFECT_TYPES.CAPACITY]: { zh: '容量', en: 'Capacity' },
  }
  return labels[key]?.[lang] || key
}

// 格式化效果值
function formatEffectValue(key, value) {
  if (key === TECH_EFFECT_TYPES.POLLUTION || key === TECH_EFFECT_TYPES.POWER) {
    // 负数表示减少，正数表示增加
    const sign = value > 0 ? '+' : ''
    return `${sign}${(value * 100).toFixed(0)}%`
  }
  // 其他都是正数加成
  return `+${(value * 100).toFixed(0)}%`
}

// 获取效果颜色
function getEffectColor(key, value) {
  if (key === TECH_EFFECT_TYPES.POLLUTION) {
    return value < 0 ? 'text-industrial-green' : 'text-red-500'
  }
  if (key === TECH_EFFECT_TYPES.POWER && value < 0) {
    return 'text-industrial-green' // 减少电力消耗是好事
  }
  return 'text-industrial-yellow'
}

// 研发科技
function researchTech(techId) {
  if (!buildingInfo.value) {
    console.error('TechTreePanel: No buildingInfo when researching tech')
    return
  }
  
  if (!window.techSystem) {
    console.error('TechTreePanel: window.techSystem is not available')
    return
  }
  
  const { x, y } = buildingInfo.value
  console.log('TechTreePanel: Researching tech', techId, 'for building at', x, y)
  
  const result = window.techSystem.researchTech(x, y, techId)
  console.log('TechTreePanel: Research result:', result)
  
  if (result) {
    // 研发成功后，面板会自动更新（因为 availableTechs 是 computed）
    // 如果需要，可以在这里触发一些UI更新
  }
}

// 关闭面板
function closePanel() {
  gameState.setShowTechTreePanel(false)
  gameState.setSelectedBuildingForTech(null)
}
</script>

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
</style>

