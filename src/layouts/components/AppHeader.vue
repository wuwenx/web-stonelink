<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- 左侧：Logo和标题 -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <img class="h-8 w-8" src="@/assets/logo.png" alt="Logo">
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-semibold text-gray-900">
              StoneLink
            </h1>
          </div>
        </div>

        <!-- 中间：搜索框 -->
        <div class="flex-1 max-w-lg mx-8">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
        </div>

        <!-- 右侧：用户菜单和操作 -->
        <div class="flex items-center space-x-4">
          <!-- 主题切换 -->
          <button class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="appStore.toggleTheme">
            <svg v-if="appStore.isLightTheme" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </button>

          <!-- 通知 -->
          <button class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.5 3.5L6 8l4.5 4.5M6 8h12" />
            </svg>
          </button>

          <!-- 用户菜单 -->
          <div class="relative">
            <button class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showUserMenu = !showUserMenu">
              <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span class="text-sm font-medium text-gray-700">
                  {{ userStore.userName.charAt(0).toUpperCase() }}
                </span>
              </div>
            </button>

            <!-- 用户下拉菜单 -->
            <div v-show="showUserMenu" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div class="py-1">
                <div class="px-4 py-2 text-sm text-gray-700 border-b">
                  <div class="font-medium">
                    {{ userStore.userName }}
                  </div>
                  <div class="text-gray-500">
                    user@example.com
                  </div>
                </div>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">个人资料</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">设置</a>
                <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click="handleLogout">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

export default {
  name: 'AppHeader',
  setup() {
    const appStore = useAppStore();
    const userStore = useUserStore();
    const searchQuery = ref('');
    const showUserMenu = ref(false);

    const handleLogout = () => {
      userStore.logout();
      showUserMenu.value = false;
      // 可以在这里添加路由跳转到登录页
    };

    return {
      appStore,
      userStore,
      searchQuery,
      showUserMenu,
      handleLogout,
    };
  },
};
</script>

<style scoped>
  /* 头部样式 */
</style>
