import { computed, onMounted, onUnmounted, ref } from 'vue'

/**
 * 移动端检测和响应式工具
 */
export function useMobile() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // 检测设备类型
  function checkDevice() {
    if (typeof window === 'undefined') return

    screenWidth.value = window.innerWidth

    // 移动端：宽度 < 768px
    isMobile.value = screenWidth.value < 768

    // 平板：768px <= 宽度 < 1024px
    isTablet.value = screenWidth.value >= 768 && screenWidth.value < 1024
  }

  // 处理窗口大小变化
  function handleResize() {
    checkDevice()
  }

  onMounted(() => {
    checkDevice()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  // 是否为移动设备（包括平板）
  const isMobileDevice = computed(() => isMobile.value || isTablet.value)

  return {
    isMobile,
    isTablet,
    isMobileDevice,
    screenWidth,
  }
}

