import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

// 导出所有stores
export { useAppStore } from './app.js';
export { useBinanceStore } from './binance.js';
export { useDepthStore } from './depth.js';
export { useOKXStore } from './okx.js';
export { useToobitStore } from './toobit.js';

