<template>
  <div class="fintech-home">
    <!-- 动态背景 -->
    <div class="animated-bg">
      <div class="grid-lines" />
      <div class="glow-orb orb-1" />
      <div class="glow-orb orb-2" />
      <div class="glow-orb orb-3" />
    </div>

    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot" />
          <span>实时数据监控</span>
        </div>
        <h1 class="hero-title">
          <span class="gradient-text">StoneLink</span>
          <br>
          <span class="sub-title">多交易所深度分析平台</span>
        </h1>
        <p class="hero-desc">
          专业级深度数据聚合 · 实时 K 线 · 滑点模拟 · 订单簿监控 · 市场快讯
        </p>
        <div class="hero-actions">
          <router-link to="/multi-depth" class="btn-primary">
            <span class="btn-glow" />
            <span class="btn-text">深度对比</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
          <router-link to="/kline" class="btn-secondary">
            K 线图表
          </router-link>
          <router-link to="/orderbook" class="btn-secondary">
            订单簿
          </router-link>
        </div>
      </div>

      <!-- 右侧数据展示 -->
      <div class="hero-visual">
        <div class="data-card main-card">
          <div class="card-header">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span class="card-label">实时行情</span>
            <span class="live-indicator">
              <span class="live-dot" />
              LIVE
            </span>
          </div>
          <div class="price-display">
            <div class="price-row">
              <span class="symbol">BTC/USDT</span>
              <span class="price" :class="btcPriceClass">{{ formatPrice(btcPrice) }}</span>
            </div>
            <div class="price-row">
              <span class="symbol">ETH/USDT</span>
              <span class="price" :class="ethPriceClass">{{ formatPrice(ethPrice) }}</span>
            </div>
          </div>
        </div>

        <div class="data-card stats-card">
          <div class="stat-item">
            <span class="stat-label">已连接交易所</span>
            <span class="stat-value">{{ connectedExchanges }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">监控币对</span>
            <span class="stat-value">{{ monitoredSymbols }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">连接状态</span>
            <span class="stat-value status" :class="connectionClass">{{ connectionStatus }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能卡片区域 -->
    <section class="features-section">
      <h2 class="section-title">
        <span class="title-line" />
        <span>核心功能</span>
        <span class="title-line" />
      </h2>

      <div class="features-grid">
        <router-link to="/multi-depth" class="feature-card">
          <div class="feature-icon depth-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="feature-title">多交易所深度对比</h3>
          <p class="feature-desc">实时对比 Binance、Toobit 等交易所深度数据，快速发现套利机会</p>
          <div class="feature-tags">
            <span class="tag">实时数据</span>
            <span class="tag">多维分析</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/symbol/BTCUSDT" class="feature-card">
          <div class="feature-icon slippage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="feature-title">滑点模拟计算</h3>
          <p class="feature-desc">模拟大额交易滑点，精准计算成交均价与预期损耗</p>
          <div class="feature-tags">
            <span class="tag">精准计算</span>
            <span class="tag">风险评估</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/symbol/ETHUSDT" class="feature-card">
          <div class="feature-icon liquidity-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="feature-title">流动性深度分析</h3>
          <p class="feature-desc">多层级流动性分析，从万分之一到 10% 价差范围全覆盖</p>
          <div class="feature-tags">
            <span class="tag">8档深度</span>
            <span class="tag">全面分析</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/orderbook" class="feature-card">
          <div class="feature-icon orderbook-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 class="feature-title">实时订单簿</h3>
          <p class="feature-desc">可视化买卖深度图表、市场压力分析、大单追踪与实时订单簿监控</p>
          <div class="feature-tags">
            <span class="tag">深度图表</span>
            <span class="tag">大单追踪</span>
            <span class="tag">压力分析</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/kline" class="feature-card">
          <div class="feature-icon kline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 class="feature-title">K 线图表</h3>
          <p class="feature-desc">蜡烛/折线/面积多种图表类型，实时 WebSocket 推送，支持多周期切换</p>
          <div class="feature-tags">
            <span class="tag">实时推送</span>
            <span class="tag">多周期</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/market" class="feature-card">
          <div class="feature-icon market-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8v8M3 21h18M3 10h18M3 7l9-4 9 4M3 21V7M21 21V7l-9 4" />
            </svg>
          </div>
          <h3 class="feature-title">市场行情</h3>
          <p class="feature-desc">多交易所行情概览，涨跌幅排行与实时价格监控</p>
          <div class="feature-tags">
            <span class="tag">行情概览</span>
            <span class="tag">涨跌排行</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>

        <router-link to="/news" class="feature-card">
          <div class="feature-icon news-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 class="feature-title">快讯</h3>
          <p class="feature-desc">行业资讯与市场动态，第一时间掌握重要信息</p>
          <div class="feature-tags">
            <span class="tag">行业资讯</span>
            <span class="tag">市场动态</span>
          </div>
          <div class="feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 技术指标区域 -->
    <section class="metrics-section">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-number">
            <span class="counter">250</span>
            <span class="unit">+</span>
          </div>
          <div class="metric-label">深度档位</div>
        </div>
        <div class="metric-card">
          <div class="metric-number">
            <span class="counter">&lt;50</span>
            <span class="unit">ms</span>
          </div>
          <div class="metric-label">数据延迟</div>
        </div>
        <div class="metric-card">
          <div class="metric-number">
            <span class="counter">8</span>
            <span class="unit">级</span>
          </div>
          <div class="metric-label">深度范围</div>
        </div>
        <div class="metric-card">
          <div class="metric-number">
            <span class="counter">24/7</span>
          </div>
          <div class="metric-label">全天候监控</div>
        </div>
      </div>
    </section>

    <!-- 底部 CTA -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">开始您的专业深度分析</h2>
        <p class="cta-desc">深度对比 · K 线图表 · 订单簿 · 市场快讯 · 实时数据</p>
        <router-link to="/multi-depth" class="cta-btn">
          深度对比
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDepthStore } from '../stores/depth';

const depthStore = useDepthStore();

// 响应式数据
const btcPrice = ref(0);
const ethPrice = ref(0);
const prevBtcPrice = ref(0);
const prevEthPrice = ref(0);

// 计算属性
const connectionStatus = computed(() => {
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '错误',
  };
  return statusMap[depthStore.connectionStatus] || '未知';
});

const connectionClass = computed(() => {
  return depthStore.connectionStatus === 'connected' ? 'connected' : 'disconnected';
});

const connectedExchanges = computed(() => {
  return depthStore.isConnected ? 2 : 0;
});

const monitoredSymbols = computed(() => {
  return depthStore.symbols?.length || 2;
});

const btcPriceClass = computed(() => {
  if (btcPrice.value > prevBtcPrice.value) return 'price-up';
  if (btcPrice.value < prevBtcPrice.value) return 'price-down';
  return '';
});

const ethPriceClass = computed(() => {
  if (ethPrice.value > prevEthPrice.value) return 'price-up';
  if (ethPrice.value < prevEthPrice.value) return 'price-down';
  return '';
});

// 格式化价格
const formatPrice = price => {
  if (!price || price === 0) return '----.--';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 更新价格数据
const updatePrices = () => {
  const btcData = depthStore.getDepthData('BTCUSDT', depthStore.compareExchanges[0]);
  const ethData = depthStore.getDepthData('ETHUSDT', depthStore.compareExchanges[0]);

  if (btcData?.bestBid) {
    prevBtcPrice.value = btcPrice.value;
    btcPrice.value = btcData.bestBid;
  }

  if (ethData?.bestBid) {
    prevEthPrice.value = ethPrice.value;
    ethPrice.value = ethData.bestBid;
  }
};

// 定时更新
let updateTimer = null;

onMounted(() => {
  // 确保连接
  if (!depthStore.isConnected) {
    depthStore.connect();
  }

  // 定时更新价格
  updateTimer = setInterval(updatePrices, 500);
});

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer);
  }
});
</script>

<style scoped>
/* ============================================
   金融科技风格首页样式
   ============================================ */

.fintech-home {
  position: relative;
  overflow: hidden;
  color: #e4e8f0;
}

/* 动态背景 */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(60px, 60px); }
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: orbFloat 15s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.4), transparent);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.3), transparent);
  bottom: 20%;
  left: -50px;
  animation-delay: -5s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.2), transparent);
  top: 40%;
  right: 10%;
  animation-delay: -10s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(20px, 30px) scale(1.05); }
}

/* Hero 区域 */
.hero-section {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  padding: 80px 60px;
  min-height: 70vh;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 30px;
  font-size: 13px;
  color: #00d4ff;
  margin-bottom: 24px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #00d4ff;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(135deg, #00d4ff 0%, #8a2be2 50%, #00ff88 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 5s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.sub-title {
  font-size: 32px;
  font-weight: 600;
  color: #a0aec0;
}

.hero-desc {
  font-size: 18px;
  color: #718096;
  line-height: 1.8;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 20px;
}

.btn-primary {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #0a0e17;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(0, 212, 255, 0.4);
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: btnGlow 3s ease-in-out infinite;
}

@keyframes btnGlow {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-arrow {
  width: 20px;
  height: 20px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 16px 32px;
  background: transparent;
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #00d4ff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
}

/* Hero 视觉区域 */
.hero-visual {
  flex: 1;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-card {
  background: rgba(26, 31, 46, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.data-card:hover {
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
}

.main-card {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.9), rgba(13, 17, 23, 0.9));
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(138, 43, 226, 0.2));
  border-radius: 10px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
  stroke: #00d4ff;
}

.card-label {
  font-size: 14px;
  font-weight: 600;
  color: #a0aec0;
  flex: 1;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #00ff88;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #00ff88;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.price-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.symbol {
  font-size: 14px;
  font-weight: 600;
  color: #a0aec0;
}

.price {
  font-size: 20px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  color: #e4e8f0;
  transition: color 0.3s ease;
}

.price.price-up {
  color: #00ff88;
}

.price.price-down {
  color: #ff4757;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #718096;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #00d4ff;
}

.stat-value.status.connected {
  color: #00ff88;
}

.stat-value.status.disconnected {
  color: #ff4757;
}

/* 功能区域 */
.features-section {
  position: relative;
  z-index: 1;
  padding: 80px 60px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 28px;
  font-weight: 700;
  color: #e4e8f0;
  margin-bottom: 60px;
}

.title-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 32px;
  background: rgba(26, 31, 46, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.4s ease;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, #8a2be2);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.depth-icon {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.1));
}

.depth-icon svg {
  stroke: #00d4ff;
}

.slippage-icon {
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(138, 43, 226, 0.1));
}

.slippage-icon svg {
  stroke: #8a2be2;
}

.liquidity-icon {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
}

.liquidity-icon svg {
  stroke: #00ff88;
}

.orderbook-icon {
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1));
}

.orderbook-icon svg {
  stroke: #ffa500;
}

.kline-icon {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
}

.kline-icon svg {
  stroke: #00ff88;
}

.market-icon {
  background: linear-gradient(135deg, rgba(100, 149, 237, 0.2), rgba(100, 149, 237, 0.1));
}

.market-icon svg {
  stroke: #6495ed;
}

.news-icon {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0.1));
}

.news-icon svg {
  stroke: #ff69b4;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #e4e8f0;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 14px;
  color: #718096;
  line-height: 1.7;
  margin-bottom: 20px;
  flex: 1;
}

.feature-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 12px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  color: #00d4ff;
}

.feature-arrow {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.feature-arrow svg {
  width: 24px;
  height: 24px;
  stroke: #00d4ff;
}

.feature-card:hover .feature-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 指标区域 */
.metrics-section {
  position: relative;
  z-index: 1;
  padding: 60px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.metric-card {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.6), rgba(13, 17, 23, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-4px);
}

.metric-number {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 8px;
}

.counter {
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.unit {
  font-size: 24px;
  color: #718096;
}

.metric-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

/* CTA 区域 */
.cta-section {
  position: relative;
  z-index: 1;
  padding: 80px 60px;
}

.cta-content {
  text-align: center;
  padding: 60px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(138, 43, 226, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 24px;
}

.cta-title {
  font-size: 36px;
  font-weight: 700;
  color: #e4e8f0;
  margin-bottom: 12px;
}

.cta-desc {
  font-size: 16px;
  color: #718096;
  margin-bottom: 32px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 40px;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cta-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 40px rgba(0, 212, 255, 0.4);
}

.cta-btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.cta-btn:hover svg {
  transform: translateX(4px);
}

/* 响应式 */
@media (max-width: 1200px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 60px 30px;
  }

  .hero-content {
    max-width: 100%;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    max-width: 100%;
    width: 100%;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .sub-title {
    font-size: 20px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-card {
    grid-template-columns: 1fr;
  }

  .cta-title {
    font-size: 24px;
  }
}
</style>
