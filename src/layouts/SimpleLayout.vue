<template>
  <div class="layout-container">
    <!-- 金融科技风格头部 -->
    <header class="fintech-header">
      <div class="header-inner">
        <!-- Logo -->
        <router-link to="/" class="logo-link">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="logo-text">StoneLink</span>
        </router-link>

        <!-- 导航和主题切换 -->
        <div class="header-right">
          <!-- 导航链接 -->
          <nav class="nav-links">
            <router-link to="/" class="nav-link" exact-active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>首页</span>
            </router-link>
            <router-link to="/multi-depth" class="nav-link" active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>多交易所深度</span>
            </router-link>
            <router-link to="/symbol/BTCUSDT" class="nav-link" active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>单币对详情</span>
            </router-link>
            <router-link to="/orderbook" class="nav-link" active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>订单簿</span>
            </router-link>
            <router-link to="/market" class="nav-link" active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8v8M3 21h18M3 10h18M3 7l9-4 9 4M3 21V7M21 21V7l-9 4" />
              </svg>
              <span>市场</span>
            </router-link>
            <router-link to="/kline" class="nav-link" active-class="nav-link-active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span>K 线</span>
            </router-link>
            <router-link to="/news" class="nav-link" :class="{ 'nav-link-active': isNewsActive }">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span>快讯</span>
            </router-link>
          </nav>

          <!-- 现货/合约全局切换 -->
          <div class="exchange-type-switch">
            <el-dropdown trigger="click" @command="handleExchangeTypeChange">
              <span class="exchange-type-trigger">
                <span class="type-label">{{ exchangeType === 'futures' ? '合约' : '现货' }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="futures" :class="{ active: exchangeType === 'futures' }">
                    合约
                  </el-dropdown-item>
                  <el-dropdown-item command="spot" :class="{ active: exchangeType === 'spot' }">
                    现货
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 连接状态指示器 -->
          <div class="connection-indicator" :class="connectionClass">
            <span class="indicator-dot" />
            <span class="indicator-text">{{ connectionStatus }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 - 无间距限制，快讯列表使用 keep-alive 避免返回时刷新 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['News']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <!-- 金融科技风格尾部 -->
    <footer class="fintech-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="footer-name">StoneLink</span>
        </div>
        <div class="footer-divider" />
        <div class="footer-copyright">
          © {{ currentYear }} StoneLink. All rights reserved.
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">关于我们</a>
          <span class="footer-link-divider">·</span>
          <a href="#" class="footer-link">使用条款</a>
          <span class="footer-link-divider">·</span>
          <a href="#" class="footer-link">隐私政策</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default { name: 'SimpleLayout' };
</script>
<script setup>
import { ArrowDown } from '@element-plus/icons-vue';
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDepthStore, useSymbolStore } from '../stores/index.js';

const route = useRoute();
const depthStore = useDepthStore();
const symbolStore = useSymbolStore();

const currentYear = computed(() => new Date().getFullYear());

// 快讯列表与详情页都高亮「快讯」菜单
const isNewsActive = computed(() =>
  route.path.startsWith('/news') ||
  route.name === 'News' ||
  route.name === 'NewsDetail'
);

// 当前交易类型（从 store 获取）
const exchangeType = computed({
  get: () => depthStore.config.exchangeType,
  set: val => depthStore.switchExchangeType(val),
});

// 切换交易类型 - 保存后刷新页面
function handleExchangeTypeChange(type) {
  depthStore.switchExchangeType(type);
  window.location.reload();
}

// 连接状态
const connectionStatus = computed(() => {
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '错误',
  };
  return statusMap[depthStore.connectionStatus] || '未知';
});

const connectionClass = computed(() =>
  depthStore.connectionStatus === 'connected' ? 'connected' : 'disconnected'
);

// 初始化 WebSocket 连接
async function initializeWebSockets() {
  try {
    await depthStore.connect();
  } catch (error) {
    console.error('SimpleLayout: WebSocket 连接失败:', error);
  }
}

// 从交易对列表中选取默认订阅（BTC、ETH 或前两个）
function getDefaultSymbols(list) {
  const btcSymbol = list.find(s => s.includes('BTC'));
  const ethSymbol = list.find(s => s.includes('ETH'));
  const defaultSymbols = [];
  if (btcSymbol) defaultSymbols.push(btcSymbol);
  if (ethSymbol) defaultSymbols.push(ethSymbol);
  return defaultSymbols.length >= 2
    ? defaultSymbols.slice(0, 2)
    : list.slice(0, 2);
}

// 初始化交易对数据
async function initSymbols() {
  const apiType = depthStore.config.exchangeType === 'futures' ? 'contract' : 'spot';
  symbolStore.setCurrentType(apiType);
  symbolStore.setCurrentExchange('toobit');
  try {
    await symbolStore.fetchSymbols({
      exchange: 'toobit',
      type: apiType,
      forceRefresh: true,
    });
    if (symbolStore.symbolList.length > 0) {
      depthStore.updateSymbols(getDefaultSymbols(symbolStore.symbolList));
    }
  } catch (error) {
    console.error('SimpleLayout: 初始化交易对列表失败:', error);
  }
}

onMounted(async() => {
  document.documentElement.classList.add('dark');
  await initSymbols();
  await initializeWebSockets();
});

// 监听交易所类型变化，更新交易对列表
watch(
  () => depthStore.config.exchangeType,
  async() => {
    const apiType = depthStore.config.exchangeType === 'futures' ? 'contract' : 'spot';
    symbolStore.setCurrentType(apiType);
    try {
      await symbolStore.fetchSymbols({
        exchange: 'toobit',
        type: apiType,
        forceRefresh: true,
      });
      if (symbolStore.symbolList.length > 0) {
        depthStore.updateSymbols(getDefaultSymbols(symbolStore.symbolList));
      }
    } catch (error) {
      console.error('SimpleLayout: 更新交易对列表失败:', error);
    }
  }
);

// 监听交易对列表变化，更新 WebSocket 订阅
watch(
  () => symbolStore.symbolList,
  newList => {
    if (newList.length > 0 && depthStore.isConnected) {
      depthStore.updateSymbols(getDefaultSymbols(newList));
    }
  }
);
</script>

<style scoped>
/* ============================================
   金融科技风格布局
   ============================================ */

.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0e17 0%, #1a1f2e 50%, #0d1117 100%);
}

/* 头部样式 */
.fintech-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 14, 23, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 32px;
  max-width: 1920px;
  margin: 0 auto;
}

/* Logo */
.logo-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.logo-link:hover {
  transform: translateY(-1px);
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(138, 43, 226, 0.2));
  border-radius: 10px;
  color: #00d4ff;
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 头部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 导航链接 */
.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #a0aec0;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.nav-link:hover {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.2);
}

.nav-link-active {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.3);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

/* 现货/合约切换 */
.exchange-type-switch {
  display: flex;
  align-items: center;
}

.exchange-type-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  color: #00d4ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exchange-type-trigger:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.5);
}

.exchange-type-trigger .type-label {
  min-width: 32px;
  text-align: center;
}

.exchange-type-trigger .el-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.exchange-type-switch :deep(.el-dropdown__popper) {
  background: rgba(26, 31, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  border-radius: 8px !important;
}

.exchange-type-switch :deep(.el-dropdown-menu) {
  background: transparent;
  padding: 6px;
}

.exchange-type-switch :deep(.el-dropdown-menu__item) {
  color: #a0aec0;
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.exchange-type-switch :deep(.el-dropdown-menu__item:hover) {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.exchange-type-switch :deep(.el-dropdown-menu__item.active) {
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
  font-weight: 600;
}

/* 连接状态指示器 */
.connection-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.connection-indicator.connected .indicator-dot {
  background: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.connection-indicator.connected .indicator-text {
  color: #00ff88;
}

.connection-indicator.disconnected .indicator-dot {
  background: #ff4757;
  box-shadow: 0 0 10px rgba(255, 71, 87, 0.5);
}

.connection-indicator.disconnected .indicator-text {
  color: #ff4757;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

/* 主内容区域 */
.main-content {
  flex: 1;
  width: 100%;
}

/* 尾部样式 */
.fintech-footer {
  background: rgba(10, 14, 23, 0.9);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  padding: 24px 32px;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  max-width: 1920px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-logo {
  width: 24px;
  height: 24px;
  color: #00d4ff;
}

.footer-logo svg {
  width: 100%;
  height: 100%;
}

.footer-name {
  font-size: 14px;
  font-weight: 600;
  color: #a0aec0;
}

.footer-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
}

.footer-copyright {
  font-size: 13px;
  color: #718096;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-link {
  font-size: 13px;
  color: #718096;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #00d4ff;
}

.footer-link-divider {
  color: #4a5568;
}

/* 响应式 */
@media (max-width: 1024px) {
  .header-inner {
    padding: 0 20px;
  }

  .nav-link span {
    display: none;
  }

  .nav-link {
    padding: 10px 12px;
  }

  .connection-indicator .indicator-text {
    display: none;
  }

  .connection-indicator {
    padding: 8px;
  }
}

@media (max-width: 768px) {
  .header-inner {
    padding: 0 16px;
  }

  .nav-links {
    gap: 4px;
  }

  .header-right {
    gap: 12px;
  }

  .footer-inner {
    flex-direction: column;
    gap: 16px;
  }

  .footer-divider {
    display: none;
  }
}
</style>
