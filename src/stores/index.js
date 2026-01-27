import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

// 导出所有 stores
export { useAppStore } from './app.js';
export { useDepthStore } from './depth.js';
export { useSymbolStore } from './symbol.js';
