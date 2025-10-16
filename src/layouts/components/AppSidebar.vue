<template>
    <aside :class="[
        'bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
    ]">
        <div class="flex flex-col h-full">
            <!-- 侧边栏头部 -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200">
                <div v-if="!collapsed" class="text-lg font-semibold text-gray-900">
                    导航菜单
                </div>
                <button @click="$emit('toggle')"
                    class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="collapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- 导航菜单 -->
            <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                <router-link v-for="item in navigationItems" :key="item.name" :to="item.href" :class="[
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    $route.path === item.href
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                ]">
                    <component :is="item.icon" :class="[
                        'mr-3 flex-shrink-0 h-5 w-5',
                        $route.path === item.href ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    ]" />
                    <span v-if="!collapsed">{{ item.name }}</span>
                </router-link>
            </nav>

            <!-- 侧边栏底部 -->
            <div class="p-4 border-t border-gray-200">
                <div v-if="!collapsed" class="text-xs text-gray-500">
                    <div>版本: {{ appStore.systemInfo.version }}</div>
                    <div>构建时间: {{ formatDate(appStore.systemInfo.buildTime) }}</div>
                </div>
                <div v-else class="text-center">
                    <div class="text-xs text-gray-400">v{{ appStore.systemInfo.version }}</div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script>
import { useAppStore } from '@/stores/app'

// 图标组件
const HomeIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  `
}

const ChartBarIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  `
}

const CogIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `
}

const UsersIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  `
}

const DocumentTextIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `
}

export default {
  name: 'AppSidebar',
  components: {
    HomeIcon,
    ChartBarIcon,
    CogIcon,
    UsersIcon,
    DocumentTextIcon
  },
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle'],
  setup() {
    const appStore = useAppStore()

    const navigationItems = [
      { name: '首页', href: '/', icon: 'HomeIcon' },
      { name: '深度聚合器', href: '/depth', icon: 'ChartBarIcon' },
      { name: '数据分析', href: '/analytics', icon: 'ChartBarIcon' },
      { name: '用户管理', href: '/users', icon: 'UsersIcon' },
      { name: '文档', href: '/docs', icon: 'DocumentTextIcon' },
      { name: '设置', href: '/settings', icon: 'CogIcon' }
    ]

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-CN')
    }

    return {
      appStore,
      navigationItems,
      formatDate
    }
  }
}
</script>

<style scoped>
/* 侧边栏样式 */
</style>
