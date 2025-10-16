<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 顶部工具栏 -->
    <header class="bg-white border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center justify-between px-4 py-2">
        <!-- 左侧：标题和面包屑 -->
        <div class="flex items-center space-x-4">
          <h1 class="text-lg font-semibold text-gray-900">
            {{ pageTitle }}
          </h1>
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li v-for="(item, index) in breadcrumbs" :key="index" class="flex items-center">
                <router-link v-if="item.href" :to="item.href" class="text-sm text-gray-500 hover:text-gray-700">
                  {{ item.name }}
                </router-link>
                <span v-else class="text-sm text-gray-900">
                  {{ item.name }}
                </span>
                <svg v-if="index < breadcrumbs.length - 1" class="ml-2 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </li>
            </ol>
          </nav>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="flex items-center space-x-2">
          <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="刷新" @click="$emit('refresh')">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="全屏" @click="$emit('fullscreen')">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'FullScreenLayout',
  emits: ['refresh', 'fullscreen'],
  setup() {
    const route = useRoute();

    const pageTitle = computed(() => {
      return route.meta?.title || 'StoneLink';
    });

    const breadcrumbs = computed(() => {
      const breadcrumbs = [];
      const pathSegments = route.path.split('/').filter(Boolean);

      // 添加首页
      breadcrumbs.push({ name: '首页', href: '/' });

      // 添加路径段
      let currentPath = '';
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;

        breadcrumbs.push({
          name: formatSegmentName(segment),
          href: isLast ? null : currentPath,
        });
      });

      return breadcrumbs;
    });

    const formatSegmentName = segment => {
      // 将路径段转换为友好的名称
      const nameMap = {
        depth: '深度聚合器',
        analytics: '数据分析',
        users: '用户管理',
        settings: '设置',
        docs: '文档',
      };

      return nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    return {
      pageTitle,
      breadcrumbs,
    };
  },
};
</script>

<style scoped>
  /* 全屏布局样式 */
</style>
