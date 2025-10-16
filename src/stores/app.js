import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 应用配置
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'zh-CN',

    // 应用状态
    loading: false,
    sidebarCollapsed: false,

    // 系统信息
    systemInfo: {
      version: '1.0.0',
      buildTime: new Date().toISOString()
    }
  }),

  getters: {
    isDarkTheme: (state) => state.theme === 'dark',
    isLightTheme: (state) => state.theme === 'light'
  },

  actions: {
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', this.theme)
      // 可以在这里添加主题切换的逻辑
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    // 设置主题
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },

    // 切换侧边栏
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    // 设置侧边栏状态
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed
    },

    // 设置语言
    setLanguage(language) {
      this.language = language
      localStorage.setItem('language', language)
    },

    // 设置加载状态
    setLoading(loading) {
      this.loading = loading
    },

    // 初始化应用
    initApp() {
      // 应用启动时的初始化逻辑
      document.documentElement.setAttribute('data-theme', this.theme)
      document.documentElement.setAttribute('lang', this.language)
    }
  }
})
