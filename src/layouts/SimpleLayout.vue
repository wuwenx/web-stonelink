<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- 简单头部 -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div class="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img class="h-8 w-8" src="@/assets/logo.png" alt="Logo">
            <span class="ml-2 text-xl font-semibold text-gray-900 dark:text-white"> StoneLink </span>
          </div>

          <!-- 导航和主题切换 -->
          <div class="flex items-center space-x-8">
            <!-- 导航链接 -->
            <nav class="flex space-x-8">
              <router-link to="/" class="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                首页
              </router-link>
              <router-link to="/depth" class="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                深度对比
              </router-link>
              <router-link to="/depth-aggregator" class="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                深度聚合器
              </router-link>
              <router-link to="/multi-symbol" class="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                多币对示例
              </router-link>
            </nav>

            <!-- 主题切换按钮 -->
            <button
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="isDark ? '切换到浅色模式' : '切换到暗色模式'"
              type="button"
              @click="toggleTheme"
            >
              <!-- 太阳图标 (浅色模式) -->
              <svg v-if="isDark" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>
              <!-- 月亮图标 (暗色模式) -->
              <svg v-else class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-10xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- 简单尾部 -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          © {{ currentYear }} StoneLink. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useBinanceStore, useToobitStore } from '../stores/index.js';

export default {
  name: 'SimpleLayout',
  setup() {
    const currentYear = computed(() => new Date().getFullYear());
    const isDark = ref(false);
    
    // 使用stores
    const binanceStore = useBinanceStore();
    const toobitStore = useToobitStore();

    // 切换主题
    const toggleTheme = () => {
      console.log('切换主题被点击，当前状态:', isDark.value);
      isDark.value = !isDark.value;
      console.log('切换后状态:', isDark.value);
      
      if (isDark.value) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        console.log('已切换到暗色模式');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        console.log('已切换到浅色模式');
      }
    };

    // 初始化主题
    const initTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      console.log('初始化主题 - 保存的主题:', savedTheme, '系统偏好暗色:', prefersDark);
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        isDark.value = true;
        document.documentElement.classList.add('dark');
        console.log('初始化: 设置为暗色模式');
      } else {
        isDark.value = false;
        document.documentElement.classList.remove('dark');
        console.log('初始化: 设置为浅色模式');
      }
    };

    // 监听系统主题变化
    const watchSystemTheme = () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          if (e.matches) {
            isDark.value = true;
            document.documentElement.classList.add('dark');
          } else {
            isDark.value = false;
            document.documentElement.classList.remove('dark');
          }
        }
      });
    };

    // 初始化WebSocket连接
    const initializeWebSockets = async() => {
      try {
        console.log('SimpleLayout: 初始化WebSocket连接');
        await Promise.all([
          binanceStore.connectWebSockets(),
          toobitStore.connectWebSockets()
        ]);
        console.log('SimpleLayout: WebSocket连接初始化完成');
      } catch (error) {
        console.error('SimpleLayout: WebSocket连接失败:', error);
      }
    };

    onMounted(async() => {
      initTheme();
      watchSystemTheme();
      // 初始化WebSocket连接
      await initializeWebSockets();
    });

    return {
      currentYear,
      isDark,
      toggleTheme
    };
  },
};
</script>

<style scoped>
  /* 简单布局样式 */
</style>
