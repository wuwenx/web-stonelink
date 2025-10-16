<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 简单头部 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img class="h-8 w-8" src="@/assets/logo.png" alt="Logo">
            <span class="ml-2 text-xl font-semibold text-gray-900"> StoneLink </span>
          </div>

          <!-- 导航链接 -->
          <nav class="flex space-x-8">
            <router-link to="/" class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              首页
            </router-link>
            <router-link to="/about" class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              关于
            </router-link>
            <router-link to="/contact" class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              联系
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- 简单尾部 -->
    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500">
          © {{ currentYear }} StoneLink. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'SimpleLayout',
  setup() {
    const currentYear = computed(() => new Date().getFullYear());

    return {
      currentYear,
    };
  },
};
</script>

<style scoped>
  /* 简单布局样式 */
</style>
