import { createRouter, createWebHashHistory } from 'vue-router';
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
        path: 'multi-depth',
        name: 'MultiExchangeDepth',
        component: () => import('../pages/MultiExchangeDepth.vue'),
        meta: { title: '多交易所深度对比' },
      },
      {
        path: 'symbol/:symbol',
        name: 'SymbolDetail',
        component: () => import('../pages/SymbolDetail.vue'),
        meta: { title: '单币种详情' },
      },
      {
        path: 'orderbook',
        name: 'OrderBook',
        component: () => import('../pages/OrderBook.vue'),
        meta: { title: '实时订单簿' },
      },
      {
        path: 'market',
        name: 'Market',
        component: () => import('../pages/Market.vue'),
        meta: { title: '市场行情' },
      },
      {
        path: 'kline',
        name: 'Kline',
        component: () => import('../pages/Kline.vue'),
        meta: { title: 'K 线图表' },
      },
      {
        path: 'news',
        name: 'News',
        component: () => import('../pages/News.vue'),
        meta: { title: '快讯' },
      },
      {
        path: 'news/:id',
        name: 'NewsDetail',
        component: () => import('../pages/NewsDetail.vue'),
        meta: { title: '快讯详情' },
      },
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
