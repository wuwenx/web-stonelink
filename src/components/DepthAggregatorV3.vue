<template>
    <div class="depth-aggregator">
        <!-- 页面标题 -->
        <div class="header">
            <h1>深度聚合 - 实时对比 (Vue 3)</h1>
            <p>实时展示Binance和Toobit交易所的深度数据对比</p>
        </div>

        <!-- 控制面板 -->
        <div class="control-panel">
            <div class="exchange-selector">
                <label for="exchangeType">选择交易所类型：</label>
                <select id="exchangeType" v-model="exchangeType" @change="onExchangeTypeChange">
                    <option value="spot">现货交易</option>
                    <option value="futures">U本位合约</option>
                </select>
            </div>

            <div class="symbol-selector">
                <label for="symbol">选择交易对：</label>
                <select id="symbol" v-model="selectedSymbol" @change="onSymbolChange">
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                </select>
            </div>

            <div class="connection-status">
                <div class="status-item">
                    <span class="status-label">Binance {{ exchangeType === 'spot' ? '现货' : 'U本位合约' }}:</span>
                    <span :class="['status-indicator', binanceStatus]"></span>
                    <span class="status-text">{{ getStatusText(binanceStatus) }}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Toobit:</span>
                    <span :class="['status-indicator', toobitStatus]"></span>
                    <span class="status-text">{{ getStatusText(toobitStatus) }}</span>
                </div>
            </div>
        </div>

        <!-- 深度数据展示区域 -->
        <div class="depth-container">
            <!-- Binance深度数据 -->
            <div class="exchange-panel">
                <div class="exchange-header">
                    <h2>Binance {{ exchangeType === 'spot' ? '现货' : 'U本位合约' }}</h2>
                    <div class="last-update">最后更新: {{ binanceLastUpdate }}</div>
                </div>
                <div class="depth-table">
                    <div class="depth-header">
                        <span>价格 (USDT)</span>
                        <span>数量</span>
                        <span>总计</span>
                    </div>
                    <!-- 卖盘数据 -->
                    <div class="asks-section">
                        <div class="section-title">卖盘 (Asks)</div>
                        <div v-for="(ask, index) in binanceAsks" :key="`binance-ask-${index}`" class="depth-row ask-row"
                            :style="{ backgroundColor: `rgba(255, 0, 0, ${0.1 + (index / binanceAsks.length) * 0.3})` }">
                            <span class="price">{{ formatPrice(ask.price) }}</span>
                            <span class="quantity">{{ formatQuantity(ask.quantity) }}</span>
                            <span class="total">{{ formatQuantity(ask.total) }}</span>
                        </div>
                    </div>
                    <!-- 买盘数据 -->
                    <div class="bids-section">
                        <div class="section-title">买盘 (Bids)</div>
                        <div v-for="(bid, index) in binanceBids" :key="`binance-bid-${index}`" class="depth-row bid-row"
                            :style="{ backgroundColor: `rgba(0, 255, 0, ${0.1 + (index / binanceBids.length) * 0.3})` }">
                            <span class="price">{{ formatPrice(bid.price) }}</span>
                            <span class="quantity">{{ formatQuantity(bid.quantity) }}</span>
                            <span class="total">{{ formatQuantity(bid.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toobit深度数据 -->
            <div class="exchange-panel">
                <div class="exchange-header">
                    <h2>Toobit</h2>
                    <div class="last-update">最后更新: {{ toobitLastUpdate }}</div>
                </div>
                <div class="depth-table">
                    <div class="depth-header">
                        <span>价格 (USDT)</span>
                        <span>数量</span>
                        <span>总计</span>
                    </div>
                    <!-- 卖盘数据 -->
                    <div class="asks-section">
                        <div class="section-title">卖盘 (Asks)</div>
                        <div v-for="(ask, index) in toobitAsks" :key="`toobit-ask-${index}`" class="depth-row ask-row"
                            :style="{ backgroundColor: `rgba(255, 0, 0, ${0.1 + (index / toobitAsks.length) * 0.3})` }">
                            <span class="price">{{ formatPrice(ask.price) }}</span>
                            <span class="quantity">{{ formatQuantity(ask.quantity) }}</span>
                            <span class="total">{{ formatQuantity(ask.total) }}</span>
                        </div>
                    </div>
                    <!-- 买盘数据 -->
                    <div class="bids-section">
                        <div class="section-title">买盘 (Bids)</div>
                        <div v-for="(bid, index) in toobitBids" :key="`toobit-bid-${index}`" class="depth-row bid-row"
                            :style="{ backgroundColor: `rgba(0, 255, 0, ${0.1 + (index / toobitBids.length) * 0.3})` }">
                            <span class="price">{{ formatPrice(bid.price) }}</span>
                            <span class="quantity">{{ formatQuantity(bid.quantity) }}</span>
                            <span class="total">{{ formatQuantity(bid.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-panel">
            <div class="stat-item">
                <span class="stat-label">Binance 最佳买价:</span>
                <span class="stat-value">{{ formatPrice(binanceBestBid) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Binance 最佳卖价:</span>
                <span class="stat-value">{{ formatPrice(binanceBestAsk) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Toobit 最佳买价:</span>
                <span class="stat-value">{{ formatPrice(toobitBestBid) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Toobit 最佳卖价:</span>
                <span class="stat-value">{{ formatPrice(toobitBestAsk) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">价差 (Binance - Toobit):</span>
                <span class="stat-value">{{ formatPrice(priceDifference) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { WebSocketService, DepthDataProcessor } from '../services/WebSocketService.js'

// 响应式数据
const selectedSymbol = ref('BTCUSDT')
const exchangeType = ref('futures')
const binanceStatus = ref('disconnected')
const toobitStatus = ref('disconnected')
const binanceLastUpdate = ref('--')
const toobitLastUpdate = ref('--')
const binanceAsks = ref([])
const binanceBids = ref([])
const toobitAsks = ref([])
const toobitBids = ref([])
const binanceBestBid = ref(0)
const binanceBestAsk = ref(0)
const toobitBestBid = ref(0)
const toobitBestAsk = ref(0)

// WebSocket服务实例
let wsService = null
let reconnectTimer = null

// 计算属性
const priceDifference = computed(() => {
    return binanceBestBid.value - toobitBestBid.value
})

// 方法
const getStatusText = (status) => {
    const statusMap = {
        connected: '已连接',
        connecting: '连接中',
        disconnected: '未连接',
        error: '错误'
    }
    return statusMap[status] || '未知'
}

const formatPrice = (price) => {
    return DepthDataProcessor.formatPrice(price)
}

const formatQuantity = (quantity) => {
    return DepthDataProcessor.formatQuantity(quantity)
}

// WebSocket连接管理
const initializeWebSockets = () => {
    console.log('初始化WebSocket连接')
    wsService = new WebSocketService()
    connectBinance()
    connectToobit()
}

const connectBinance = () => {
    console.log('连接Binance WebSocket, 类型:', exchangeType.value)
    if (exchangeType.value === 'futures') {
        wsService.connectBinanceFutures(
            selectedSymbol.value,
            handleBinanceData,
            (status) => {
                console.log('Binance U本位合约状态更新:', status)
                binanceStatus.value = status
            }
        )
    } else {
        wsService.connectBinance(
            selectedSymbol.value,
            handleBinanceData,
            (status) => {
                console.log('Binance现货状态更新:', status)
                binanceStatus.value = status
            }
        )
    }
}

const connectToobit = () => {
    wsService.connectToobit(
        selectedSymbol.value,
        handleToobitData,
        (status) => {
            console.log('Toobit状态更新:', status)
            toobitStatus.value = status
        }
    )
}

// 数据处理
const handleBinanceData = (data) => {
    if (data.e === 'depthUpdate') {
        // console.log('处理Binance深度数据:', {
        //     asks: data.a?.length || 0,
        //     bids: data.b?.length || 0
        // })

        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks')
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids')

        binanceAsks.value = processedAsks
        binanceBids.value = processedBids

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks)
        binanceBestBid.value = bestPrices.bestBid
        binanceBestAsk.value = bestPrices.bestAsk

        binanceLastUpdate.value = new Date().toLocaleTimeString()
        // console.log('Binance数据处理完成:', {
        //     asksCount: binanceAsks.value.length,
        //     bidsCount: binanceBids.value.length,
        //     bestBid: binanceBestBid.value,
        //     bestAsk: binanceBestAsk.value
        // })
    } else {
        console.log('Binance数据格式不匹配:', data)
    }
}

const handleToobitData = (data) => {
    console.log('收到Toobit数据:', data)

    // 检查数据格式是否正确
    if (!data || (!data.a && !data.b)) {
        console.log('Toobit数据格式不正确:', data)
        return
    }

    const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks')
    const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids')

    toobitAsks.value = processedAsks
    toobitBids.value = processedBids

    const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks)
    toobitBestBid.value = bestPrices.bestBid
    toobitBestAsk.value = bestPrices.bestAsk

    toobitLastUpdate.value = new Date().toLocaleTimeString()
    console.log('Toobit数据处理完成:', {
        asksCount: toobitAsks.value.length,
        bidsCount: toobitBids.value.length,
        bestBid: toobitBestBid.value,
        bestAsk: toobitBestAsk.value
    })
}

// 事件处理
const onSymbolChange = () => {
    console.log('币对变更:', selectedSymbol.value)
    handleConnectionChange()
}

const onExchangeTypeChange = () => {
    console.log('交易所类型变更:', exchangeType.value)
    handleConnectionChange()
}

// 统一的连接变更处理
const handleConnectionChange = () => {
    // 清除之前的重连定时器
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }

    // 立即清空数据和重置状态
    closeWebSockets()

    // 延迟重新连接，确保旧连接完全关闭
    reconnectTimer = setTimeout(() => {
        console.log('重新初始化WebSocket连接')
        initializeWebSockets()
        reconnectTimer = null
    }, 1500)
}

const closeWebSockets = () => {
    if (wsService) {
        console.log('关闭所有WebSocket连接')
        wsService.disconnectAll()
    }

    // 清空所有数据
    binanceAsks.value = []
    binanceBids.value = []
    toobitAsks.value = []
    toobitBids.value = []

    // 重置最佳价格
    binanceBestBid.value = 0
    binanceBestAsk.value = 0
    toobitBestBid.value = 0
    toobitBestAsk.value = 0

    // 重置状态
    binanceStatus.value = 'disconnected'
    toobitStatus.value = 'disconnected'
    binanceLastUpdate.value = '--'
    toobitLastUpdate.value = '--'

    console.log('数据已清空，状态已重置')
}

// 监听器
watch([selectedSymbol, exchangeType], () => {
    console.log('监听器触发:', { symbol: selectedSymbol.value, type: exchangeType.value })
})

// 生命周期
onMounted(() => {
    console.log('组件挂载，初始化WebSocket')
    initializeWebSockets()
})

onUnmounted(() => {
    console.log('组件卸载，关闭WebSocket')

    // 清除重连定时器
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }

    // 关闭所有连接
    closeWebSockets()
})
</script>

<style scoped>
.depth-aggregator {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f5f5;
    min-height: 100vh;
}

.header {
    text-align: center;
    margin-bottom: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header h1 {
    margin: 0 0 10px 0;
    font-size: 2.5em;
    font-weight: 300;
}

.header p {
    margin: 0;
    font-size: 1.1em;
    opacity: 0.9;
}

.control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.exchange-selector,
.symbol-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.exchange-selector label,
.symbol-selector label {
    font-weight: 600;
    color: #333;
    white-space: nowrap;
}

.exchange-selector select,
.symbol-selector select {
    padding: 8px 12px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: border-color 0.3s;
    min-width: 120px;
}

.exchange-selector select:focus,
.symbol-selector select:focus {
    outline: none;
    border-color: #667eea;
}

.connection-status {
    display: flex;
    gap: 30px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-label {
    font-weight: 600;
    color: #333;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.status-indicator.connected {
    background-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.status-indicator.connecting {
    background-color: #FF9800;
    animation: pulse 1.5s infinite;
}

.status-indicator.disconnected {
    background-color: #f44336;
}

.status-indicator.error {
    background-color: #f44336;
    animation: blink 1s infinite;
}

.status-text {
    font-size: 14px;
    color: #666;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }

    100% {
        opacity: 1;
    }
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0.3;
    }
}

.depth-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.exchange-panel {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.exchange-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.exchange-header h2 {
    margin: 0;
    font-size: 1.5em;
    font-weight: 300;
}

.last-update {
    font-size: 0.9em;
    opacity: 0.9;
}

.depth-table {
    max-height: 600px;
    overflow-y: auto;
}

.depth-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 15px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 600;
    color: #495057;
    position: sticky;
    top: 0;
    z-index: 10;
}

.asks-section,
.bids-section {
    margin-bottom: 20px;
}

.section-title {
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.asks-section .section-title {
    background: rgba(255, 0, 0, 0.1);
    color: #d32f2f;
}

.bids-section .section-title {
    background: rgba(0, 255, 0, 0.1);
    color: #388e3c;
}

.depth-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 8px 20px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

.depth-row:hover {
    background-color: rgba(0, 0, 0, 0.05) !important;
}

.ask-row .price {
    color: #d32f2f;
    font-weight: 600;
}

.bid-row .price {
    color: #388e3c;
    font-weight: 600;
}

.quantity,
.total {
    color: #666;
    text-align: right;
}

.stats-panel {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    border-left: 4px solid #667eea;
}

.stat-label {
    font-weight: 600;
    color: #495057;
}

.stat-value {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .depth-container {
        grid-template-columns: 1fr;
    }

    .control-panel {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
    }

    .exchange-selector,
    .symbol-selector {
        justify-content: space-between;
    }

    .connection-status {
        flex-direction: column;
        gap: 10px;
    }

    .stats-panel {
        grid-template-columns: 1fr;
    }

    .header h1 {
        font-size: 2em;
    }
}

/* 滚动条样式 */
.depth-table::-webkit-scrollbar {
    width: 6px;
}

.depth-table::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.depth-table::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.depth-table::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
