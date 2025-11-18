import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import en from './assets/i18n/en.json'
import zh from './assets/i18n/zh.json'
import { useGameState } from './stores/useGameState.js'
import { initGoogleAnalytics, initSessionTracker, trackPageView } from './js/utils/analytics.js'
import './css/global.css'
import './scss/global.scss'
import './scss/index.scss'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: { zh, en },
})

// 初始化 Google Analytics
initGoogleAnalytics()

// 初始化停留时长跟踪
initSessionTracker()

// 发送初始页面浏览
trackPageView(window.location.pathname, document.title)

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(i18n)
app.mount('#app')

// 监听 pinia 语言变化，动态切换 i18n 语言
const gameState = useGameState()
watch(
  () => gameState.language,
  (lang) => {
    i18n.global.locale.value = 'zh'
  },
)
