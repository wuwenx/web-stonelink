<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">联系我们</h1>
        
        <div class="grid md:grid-cols-2 gap-8">
          <!-- 联系信息 -->
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">联系信息</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="text-gray-600 dark:text-gray-300">contact@stonelink.com</span>
              </div>
              
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span class="text-gray-600 dark:text-gray-300">+86 138-0000-0000</span>
              </div>
              
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="text-gray-600 dark:text-gray-300">北京市朝阳区</span>
              </div>
            </div>
          </div>
          
          <!-- 联系表单 -->
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">发送消息</h2>
            <form class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名</label>
                <input 
                  type="text" 
                  id="name" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="请输入您的姓名"
                >
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
                <input 
                  type="email" 
                  id="email" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="请输入您的邮箱"
                >
              </div>
              
              <div>
                <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">消息</label>
                <textarea 
                  id="message" 
                  rows="4" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="请输入您的消息"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                发送消息
              </button>
            </form>
          </div>
        </div>
        
        <!-- 暗色模式测试区域 -->
        <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">暗色模式测试</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-3">
            这个联系页面展示了暗色模式下的表单和内容效果。所有输入框、按钮和文本都会根据当前主题自动调整颜色。
          </p>
          <div class="flex flex-wrap gap-2">
            <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded text-sm">主要标签</span>
            <span class="px-2 py-1 bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200 rounded text-sm">成功标签</span>
            <span class="px-2 py-1 bg-danger-100 dark:bg-danger-900 text-danger-800 dark:text-danger-200 rounded text-sm">警告标签</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Contact',
  meta: {
    title: '联系我们'
  }
}
</script>

<style scoped>
/* 自定义样式 */
</style>
