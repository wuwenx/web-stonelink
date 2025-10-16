<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo和标题 -->
      <div class="flex justify-center">
        <img class="h-12 w-12" src="@/assets/logo.png" alt="Logo">
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ pageTitle }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ pageSubtitle }}
      </p>
    </div>

    <!-- 表单内容 -->
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <router-view />
      </div>
    </div>

    <!-- 底部链接 -->
    <div class="mt-8 text-center">
      <div class="text-sm text-gray-600">
        <span v-if="isLoginPage">
          还没有账户？
          <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500"> 立即注册 </router-link>
        </span>
        <span v-else>
          已有账户？
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500"> 立即登录 </router-link>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'AuthLayout',
  setup() {
    const route = useRoute();

    const isLoginPage = computed(() => route.path === '/login');

    const pageTitle = computed(() => {
      return isLoginPage.value ? '登录您的账户' : '创建新账户';
    });

    const pageSubtitle = computed(() => {
      return isLoginPage.value ? '欢迎回来，请登录您的账户' : '加入我们，开始您的旅程';
    });

    return {
      isLoginPage,
      pageTitle,
      pageSubtitle,
    };
  },
};
</script>

<style scoped>
  /* 认证布局样式 */
</style>
