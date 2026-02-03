import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/tailwind.css';
import ElementPlus from './plugins/element-plus';
import router from './router';
import pinia from './stores';

// 忽略 ResizeObserver 的无害错误（Chrome 已知问题，Element Plus 等库会触发）
window.addEventListener('error', e => {
  if (e.message?.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
}, true);

const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router).use(pinia).use(ElementPlus).mount('#app');
