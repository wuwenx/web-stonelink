<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- 404 图标 -->
      <div class="relative">
        <div class="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
          404
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <el-icon size="48" class="text-white">
              <Warning />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="space-y-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          页面未找到
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          抱歉，您访问的页面不存在或已被移动
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          请检查URL是否正确，或返回首页继续浏览
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <el-button 
          type="primary" 
          size="large"
          class="px-8"
          @click="goHome"
        >
          <el-icon class="mr-2">
            <House />
          </el-icon>
          返回首页
        </el-button>
        <el-button 
          size="large"
          class="px-8"
          @click="goBack"
        >
          <el-icon class="mr-2">
            <Back />
          </el-icon>
          返回上页
        </el-button>
      </div>

      <!-- 快速导航 -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200 mb-4">
          快速导航
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <router-link 
            to="/" 
            class="flex items-center justify-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
          >
            <el-icon class="mr-2">
              <House />
            </el-icon>
            首页
          </router-link>
          <router-link 
            to="/depth" 
            class="flex items-center justify-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
          >
            <el-icon class="mr-2">
              <TrendCharts />
            </el-icon>
            深度对比
          </router-link>
        </div>
      </div>

      <!-- 错误详情（开发环境显示） -->
      <div v-if="isDevelopment" class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
          错误详情
        </h4>
        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>路径:</strong> {{ currentPath }}</p>
          <p><strong>时间:</strong> {{ currentTime }}</p>
          <p><strong>用户代理:</strong> {{ userAgent }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Back, House, TrendCharts, Warning } from '@element-plus/icons-vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 响应式数据
const currentTime = ref('');
const userAgent = ref('');

// 计算属性
const currentPath = computed(() => route.path);
const isDevelopment = computed(() => process.env.NODE_ENV === 'development');

// 方法
const goHome = () => {
  router.push('/');
};

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};

// 生命周期
onMounted(() => {
  currentTime.value = new Date().toLocaleString('zh-CN');
  userAgent.value = navigator.userAgent;
  
  // 设置页面标题
  document.title = '404 - 页面未找到 | StoneLink';
});
</script>

<style scoped>
/* 确保在暗色模式下正常显示 */
:deep(.el-button) {
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 404 数字动画 */
.text-9xl {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图标动画 */
.el-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
