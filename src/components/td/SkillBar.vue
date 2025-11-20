<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { SKILL_CONFIG } from '@/js/td/active-skills.js'

const gameState = useGameState()
const language = computed(() => gameState.language)
const credits = computed(() => gameState.credits)

// 拖拽状态
const isDragging = ref(false)
const draggedSkillId = ref(null)

// 技能状态
const skills = ref([
  {
    id: 'airstrike',
    ...SKILL_CONFIG.airstrike,
    remainingCooldown: 0,
    progress: 1,
    canUse: true,
    isActive: false,
  },
  {
    id: 'freeze',
    ...SKILL_CONFIG.freeze,
    remainingCooldown: 0,
    progress: 1,
    canUse: true,
    isActive: false,
  },
  {
    id: 'lightning',
    ...SKILL_CONFIG.lightning,
    remainingCooldown: 0,
    progress: 1,
    canUse: true,
    isActive: false,
  },
])

// 更新技能状态
function updateSkillStatus(skillsStatus) {
  skillsStatus.forEach(status => {
    const skill = skills.value.find(s => s.id === status.id)
    if (skill) {
      skill.remainingCooldown = status.remainingCooldown
      skill.progress = status.progress
      skill.canUse = status.canUse
      skill.isActive = status.isActive
    }
  })
}

// ===== 拖拽开始 =====
function handleDragStart(event, skillId) {
  console.log('🔥 handleDragStart 被调用!', skillId, {
    draggable: event.target.draggable,
    eventType: event.type,
    target: event.target
  })
  
  const skill = skills.value.find(s => s.id === skillId)
  
  if (!skill) {
    console.error('❌ 技能不存在:', skillId)
    event.preventDefault()
    return false
  }
  
  // 检查冷却
  if (skill.remainingCooldown > 0) {
    console.warn('⚠️ 技能冷却中，阻止拖拽')
    event.preventDefault()
    event.stopPropagation()
    eventBus.emit('toast:add', {
      message: language.value === 'zh' 
        ? `技能冷却中，还需 ${Math.ceil(skill.remainingCooldown)} 秒` 
        : `Cooldown: ${Math.ceil(skill.remainingCooldown)}s`,
      type: 'warning',
      duration: 2000,
    })
    return false
  }
  
  // 检查金币
  if (credits.value < skill.cost) {
    console.warn('⚠️ 金币不足，阻止拖拽')
    event.preventDefault()
    event.stopPropagation()
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '金币不足！' : 'Not enough credits!',
      type: 'warning',
      duration: 2000,
    })
    return false
  }
  
  console.log('✅ 开始拖拽技能:', skillId, {
    skill,
    credits: credits.value,
    cost: skill.cost,
    dataTransfer: event.dataTransfer,
    target: event.target
  })
  isDragging.value = true
  draggedSkillId.value = skillId
  
  // ===== 设置拖拽数据（和塔保持一致）=====
  try {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('skillId', skillId)
    event.dataTransfer.setData('text/plain', skillId) // 兼容性设置
    console.log('✅ 拖拽数据已设置:', {
      types: Array.from(event.dataTransfer.types),
      skillId
    })
  } catch (error) {
    console.error('❌ 设置拖拽数据失败:', error)
  }
  
  // ===== 创建拖拽预览图像（和塔保持一致）=====
  try {
    const dragImage = event.target.cloneNode(true)
    dragImage.style.opacity = '0.6'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.left = '-1000px'
    dragImage.style.pointerEvents = 'none'
    dragImage.style.transform = 'scale(1.1)'
    dragImage.style.zIndex = '9999'
    document.body.appendChild(dragImage)
    
    // 计算拖拽图像的偏移量（相对于鼠标位置）
    const rect = event.target.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    
    event.dataTransfer.setDragImage(dragImage, offsetX, offsetY)
    
    // 延迟清理
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
    
    console.log('✅ 拖拽预览图像已创建')
  } catch (error) {
    console.error('❌ 创建拖拽预览图像失败:', error)
  }
  
  // 发送技能选择事件
  eventBus.emit('td:skill-select', { skillId })
  
  // 提示玩家
  const rangeText = skill.radius ? `${skill.radius}` : '链式'
  eventBus.emit('toast:add', {
    message: language.value === 'zh' 
      ? `${skill.name}已选中 | 范围:${rangeText} | 拖拽到地面释放` 
      : `${skill.nameEn} | Range:${rangeText} | Drag to ground`,
    type: 'info',
    duration: 5000,
  })
}

// ===== 拖拽结束 =====
function handleDragEnd(event) {
  console.log('🛑 拖拽结束', {
    dropEffect: event.dataTransfer.dropEffect,
    effectAllowed: event.dataTransfer.effectAllowed
  })
  isDragging.value = false
  
  // 如果没有成功释放，取消技能选择
  if (event.dataTransfer.dropEffect === 'none' || event.dataTransfer.dropEffect === '') {
    console.log('❌ 拖拽取消或未成功释放')
    eventBus.emit('td:skill-cancel')
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '技能已取消' : 'Skill cancelled',
      type: 'info',
      duration: 2000,
    })
  }
  
  draggedSkillId.value = null
}

// 监听技能状态更新
function handleSkillStatusUpdate(status) {
  updateSkillStatus(status)
}

// 格式化冷却时间
function formatCooldown(seconds) {
  if (seconds === 0) return language.value === 'zh' ? '就绪' : 'READY'
  return `${Math.ceil(seconds)}s`
}

// 获取技能按钮类名
function getSkillButtonClass(skill) {
  const baseClass = 'skill-button relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all'
  
  // 检查是否可用
  const hasEnoughCredits = credits.value >= skill.cost
  const isReady = skill.remainingCooldown === 0
  
  if (!isReady) {
    // 冷却中
    return `${baseClass} bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed`
  }
  
  if (!hasEnoughCredits) {
    // 金币不足
    return `${baseClass} bg-gray-800 border-red-500 opacity-70 cursor-pointer`
  }
  
  if (skill.isActive || draggedSkillId.value === skill.id) {
    // 已选中或正在拖拽
    return `${baseClass} bg-industrial-accent border-industrial-accent animate-pulse`
  }
  
  // 可用状态
  return `${baseClass} bg-industrial-gray border-industrial-accent hover:bg-industrial-accent/20 hover:scale-105 active:scale-95`
}

// 获取冷却进度样式
function getCooldownStyle(skill) {
  if (skill.progress >= 1) return { display: 'none' }
  
  const percentage = skill.progress * 100
  return {
    background: `conic-gradient(
      rgba(255, 184, 0, 0.3) ${percentage}%, 
      rgba(0, 0, 0, 0.5) ${percentage}%
    )`,
  }
}

onMounted(() => {
  eventBus.on('td:skill-status-update', handleSkillStatusUpdate)
})

onUnmounted(() => {
  eventBus.off('td:skill-status-update', handleSkillStatusUpdate)
})
</script>

<template>
  <div class="skill-bar flex items-center justify-center gap-3 p-3 rounded-lg bg-industrial-gray/80 backdrop-blur-sm border border-gray-700">
    <!-- 技能标题 -->
    <div class="text-xs text-gray-400 uppercase font-bold" :class="language === 'zh' ? 'tracking-[0.3rem]' : ''">
      {{ language === 'zh' ? '技能' : 'Skills' }}:
    </div>
    
    <!-- 技能按钮 -->
    <div 
      v-for="skill in skills" 
      :key="skill.id"
      :class="getSkillButtonClass(skill)"
      class="cursor-grab active:cursor-grabbing select-none user-select-none"
      :draggable="skill.remainingCooldown === 0 && credits >= skill.cost"
      @mousedown="() => console.log('🖱️ mousedown on skill:', skill.id, 'draggable:', skill.remainingCooldown === 0 && credits >= skill.cost, 'credits:', credits, 'cost:', skill.cost, 'cooldown:', skill.remainingCooldown)"
      @dragstart="handleDragStart($event, skill.id)"
      @dragend="handleDragEnd"
      :title="`${language === 'zh' ? skill.name : skill.nameEn}\n${skill.description}\n${language === 'zh' ? '消耗' : 'Cost'}: ${skill.cost} ${language === 'zh' ? '金币' : 'credits'}\n${language === 'zh' ? '冷却' : 'Cooldown'}: ${skill.cooldown}s`"
    >
      <!-- 冷却遮罩 -->
      <div 
        v-if="skill.progress < 1"
        class="absolute inset-0 rounded-lg"
        :style="getCooldownStyle(skill)"
      />
      
      <!-- 技能图标 -->
      <div class="text-3xl relative z-10">
        {{ skill.icon }}
      </div>
      
      <!-- 技能名称 -->
      <div class="text-xs font-bold text-white relative z-10 whitespace-nowrap">
        {{ language === 'zh' ? skill.name : skill.nameEn }}
      </div>
      
      <!-- 冷却时间 -->
      <div 
        class="text-[10px] font-mono relative z-10 min-w-[40px] text-center"
        :class="skill.remainingCooldown > 0 ? 'text-red-400 font-bold' : 'text-green-400'"
      >
        {{ formatCooldown(skill.remainingCooldown) }}
      </div>
      
      <!-- 金币消耗 -->
      <div class="flex items-center gap-1 text-[10px] relative z-10">
        <span>💰</span>
        <span 
          class="font-bold"
          :class="credits < skill.cost ? 'text-red-400' : 'text-industrial-yellow'"
        >
          {{ skill.cost }}
        </span>
      </div>
      
      <!-- 快捷键提示（可选） -->
      <div class="absolute top-1 right-1 text-[8px] text-gray-500 font-mono bg-black/50 px-1 rounded">
        {{ skill.id === 'airstrike' ? '1' : skill.id === 'freeze' ? '2' : '3' }}
      </div>
      
      <!-- 激活状态指示 -->
      <div 
        v-if="skill.isActive"
        class="absolute -top-1 -right-1 w-3 h-3 bg-industrial-accent rounded-full animate-ping"
      />
      
      <!-- 范围显示（新增） -->
      <div 
        v-if="skill.radius"
        class="absolute -bottom-1 right-1 text-[8px] text-gray-400 bg-black/70 px-1 rounded"
      >
        {{ language === 'zh' ? '范围' : 'R' }}: {{ skill.radius }}
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="text-[10px] text-gray-500 ml-2 max-w-[200px]">
      {{ language === 'zh' ? '拖拽技能到地面释放' : 'Drag skill to ground to use' }}
    </div>
  </div>
</template>

<style scoped>
.skill-button {
  min-width: 80px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.skill-button:hover:not(.cursor-not-allowed) {
  box-shadow: 0 6px 12px rgba(255, 184, 0, 0.4);
}

.skill-button:active:not(.cursor-not-allowed) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

@keyframes ping {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>

