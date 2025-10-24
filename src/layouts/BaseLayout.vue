<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
    <!-- 头部 -->
    <AppHeader />

    <div class="flex flex-1">
      <!-- 左侧导航 -->
      <AppSidebar :collapsed="appStore.sidebarCollapsed" @toggle="appStore.toggleSidebar" />

      <!-- 主内容区域 -->
      <main class="flex-1 overflow-auto">
        <div class="p-6">
          <router-view />
        </div>
      </main>
    </div>

    <!-- 尾部 -->
    <AppFooter />
  </div>
</template>

<script>
import { useAppStore } from '@/stores/app';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';

export default {
  name: 'BaseLayout',
  components: {
    AppHeader,
    AppSidebar,
    AppFooter,
  },
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
};
</script>

<style scoped>
  /* 基础布局样式 */
</style>
