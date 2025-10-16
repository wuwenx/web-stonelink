<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <!-- 左侧：版权信息 -->
          <div class="flex items-center space-x-4 mb-4 md:mb-0">
            <div class="flex items-center">
              <img class="h-6 w-6" src="@/assets/logo.png" alt="Logo">
              <span class="ml-2 text-sm text-gray-600"> StoneLink </span>
            </div>
            <div class="text-sm text-gray-500">
              © {{ currentYear }} StoneLink. All rights reserved.
            </div>
          </div>

          <!-- 中间：快速链接 -->
          <div class="flex items-center space-x-6 mb-4 md:mb-0">
            <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors"> 帮助中心 </a>
            <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors"> 隐私政策 </a>
            <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors"> 服务条款 </a>
            <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors"> 联系我们 </a>
          </div>

          <!-- 右侧：状态信息 -->
          <div class="flex items-center space-x-4">
            <!-- 系统状态 -->
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <div class="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                <span class="ml-2 text-xs text-gray-500">系统正常</span>
              </div>
            </div>

            <!-- 语言切换 -->
            <div class="relative">
              <button class="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors" @click="showLanguageMenu = !showLanguageMenu">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                {{ currentLanguage }}
              </button>

              <!-- 语言下拉菜单 -->
              <div v-show="showLanguageMenu" class="origin-bottom-right absolute bottom-full right-0 mb-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="py-1">
                  <button
                    v-for="lang in languages"
                    :key="lang.code"
                    :class="['block w-full text-left px-4 py-2 text-sm transition-colors', appStore.language === lang.code ? 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-100']"
                    @click="changeLanguage(lang.code)"
                  >
                    {{ lang.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部信息 -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div class="mb-2 md:mb-0">
              版本: {{ appStore.systemInfo.version }} | 构建时间: {{ formatDate(appStore.systemInfo.buildTime) }}
            </div>
            <div class="flex items-center space-x-4">
              <span>在线用户: {{ onlineUsers }}</span>
              <span>服务器时间: {{ currentTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/app';

export default {
  name: 'AppFooter',
  setup() {
    const appStore = useAppStore();
    const showLanguageMenu = ref(false);
    const onlineUsers = ref(1234);
    const currentTime = ref('');

    const currentYear = computed(() => new Date().getFullYear());

    const currentLanguage = computed(() => {
      const lang = languages.find(l => l.code === appStore.language);
      return lang ? lang.name : '中文';
    });

    const languages = [
      { code: 'zh-CN', name: '中文' },
      { code: 'en-US', name: 'English' },
      { code: 'ja-JP', name: '日本語' },
    ];

    const changeLanguage = langCode => {
      appStore.setLanguage(langCode);
      showLanguageMenu.value = false;
    };

    const formatDate = dateString => {
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    const updateTime = () => {
      currentTime.value = new Date().toLocaleTimeString('zh-CN');
    };

    let timeInterval;

    onMounted(() => {
      updateTime();
      timeInterval = setInterval(updateTime, 1000);
    });

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    });

    return {
      appStore,
      showLanguageMenu,
      onlineUsers,
      currentTime,
      currentYear,
      currentLanguage,
      languages,
      changeLanguage,
      formatDate,
    };
  },
};
</script>

<style scoped>
  /* 尾部样式 */
</style>
