<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">关于 StoneLink</h1>
        
        <div class="prose dark:prose-invert max-w-none">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            StoneLink 是一个现代化的 Web 应用程序，致力于为用户提供优质的体验。
          </p>
          
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">我们的使命</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            通过创新的技术解决方案，连接用户与数字世界，创造更美好的未来。
          </p>
          
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">技术特色</h2>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>现代化的 Vue.js 3 框架</li>
            <li>响应式设计，支持各种设备</li>
            <li>暗色模式支持，保护用户视力</li>
            <li>高性能的 Tailwind CSS 样式系统</li>
            <li>优雅的用户界面设计</li>
          </ul>
          
          <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">暗色模式测试</h3>
            <p class="text-gray-600 dark:text-gray-300">
              这个页面展示了暗色模式的效果。点击右上角的主题切换按钮来体验不同的主题。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About',
  meta: {
    title: '关于我们'
  }
}
</script>

<style scoped>
/* 自定义样式 */
</style>
