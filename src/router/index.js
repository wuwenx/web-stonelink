import { createRouter, createWebHashHistory } from 'vue-router';
import DepthAggregatorTailwind from '../components/DepthAggregatorTailwind.vue';
// import BaseLayout from '../layouts/BaseLayout.vue';
import SimpleLayout from '../layouts/SimpleLayout.vue';
// import AuthLayout from '../layouts/AuthLayout.vue'
// import FullScreenLayout from '../layouts/FullScreenLayout.vue'
import index from '../pages/index.vue';

const routes = [
  {
    path: '/',
    component: SimpleLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: index,
        meta: { title: '首页' },
      },
      {
        path: 'depth',
        name: 'DepthAggregator',
        component: DepthAggregatorTailwind,
        meta: { title: '深度聚合器' },
      },
      {
        path: 'depth-test',
        name: 'DepthTest',
        component: () => import('../views/DepthTest.vue'),
        meta: { title: '深度数据Store测试' },
      },
      // {
      //   path: 'analytics',
      //   name: 'Analytics',
      //   component: () => import('../views/Analytics.vue'),
      //   meta: { title: '数据分析' }
      // },
      // {
      //   path: 'users',
      //   name: 'Users',
      //   component: () => import('../views/Users.vue'),
      //   meta: { title: '用户管理' }
      // },
      // {
      //   path: 'settings',
      //   name: 'Settings',
      //   component: () => import('../views/Settings.vue'),
      //   meta: { title: '设置' }
      // }
    ],
  },
  // {
  //   path: '/simple',
  //   component: SimpleLayout,
  //   children: [
  //     {
  //       path: '',
  //       name: 'SimpleHome',
  //       component: () => import('../views/SimpleHome.vue'),
  //       meta: { title: '简单首页' }
  //     },
  //     {
  //       path: 'about',
  //       name: 'About',
  //       component: () => import('../views/About.vue'),
  //       meta: { title: '关于我们' }
  //     },
  //     {
  //       path: 'contact',
  //       name: 'Contact',
  //       component: () => import('../views/Contact.vue'),
  //       meta: { title: '联系我们' }
  //     }
  //   ]
  // },
  // {
  //   path: '/auth',
  //   component: AuthLayout,
  //   children: [
  //     {
  //       path: 'login',
  //       name: 'Login',
  //       component: () => import('../views/Login.vue'),
  //       meta: { title: '登录' }
  //     },
  //     {
  //       path: 'register',
  //       name: 'Register',
  //       component: () => import('../views/Register.vue'),
  //       meta: { title: '注册' }
  //     }
  //   ]
  // },
  // {
  //   path: '/fullscreen',
  //   component: FullScreenLayout,
  //   children: [
  //     {
  //       path: 'dashboard',
  //       name: 'FullScreenDashboard',
  //       component: () => import('../views/FullScreenDashboard.vue'),
  //       meta: { title: '全屏仪表板' }
  //     }
  //   ]
  // },
  // 404 页面 - 必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '404 - 页面未找到' }
  }
];

const router = createRouter({
  // 使用 hash 模式，更适合 GitHub Pages 部署
  history: createWebHashHistory(),
  routes,
});

export default router;
