<template>
    <div class="container mx-auto p-5 font-sans bg-gray-50 min-h-screen">
        <!-- 页面标题 -->
        <div
            class="text-center mb-8 bg-gradient-to-r from-primary-500 to-purple-600 text-white p-8 rounded-lg shadow-lg">
            <h1 class="text-4xl font-light mb-2">深度聚合 - 实时对比</h1>
            <p class="text-lg opacity-90">实时展示Binance和Toobit交易所的深度数据对比</p>
        </div>

        <!-- 控制面板 -->
        <div class="flex justify-between items-center bg-white p-5 rounded-lg shadow-md mb-5 flex-wrap gap-4">
            <div class="flex items-center gap-3">
                <label for="exchangeType" class="font-semibold text-gray-700 whitespace-nowrap">选择交易所类型：</label>
                <select id="exchangeType" v-model="exchangeType" @change="onExchangeTypeChange"
                    class="px-3 py-2 border-2 border-gray-300 rounded-md text-sm bg-white cursor-pointer transition-colors duration-200 min-w-32 focus:outline-none focus:border-primary-500">
                    <option value="spot">现货交易</option>
                    <option value="futures">U本位合约</option>
                </select>
            </div>

            <div class="flex items-center gap-3">
                <label for="symbol" class="font-semibold text-gray-700 whitespace-nowrap">选择交易对：</label>
                <select id="symbol" v-model="selectedSymbol" @change="onSymbolChange"
                    class="px-3 py-2 border-2 border-gray-300 rounded-md text-sm bg-white cursor-pointer transition-colors duration-200 min-w-32 focus:outline-none focus:border-primary-500">
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                </select>
            </div>

            <div class="flex gap-8">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-700">Binance {{ exchangeType === 'spot' ? '现货' : 'U本位合约'
                        }}:</span>
                    <span :class="getStatusClass(binanceStatus)"></span>
                    <span class="text-sm text-gray-600">{{ getStatusText(binanceStatus) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-700">Toobit:</span>
                    <span :class="getStatusClass(toobitStatus)"></span>
                    <span class="text-sm text-gray-600">{{ getStatusText(toobitStatus) }}</span>
                </div>
            </div>
        </div>

        <!-- 深度数据展示区域 -->
        <div class="flex flex-col gap-5 mb-5">
            <!-- 卖盘对比区域 -->
            <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div
                    class="bg-gradient-to-r from-danger-500 to-red-600 text-white p-4 flex justify-between items-center">
                    <h2 class="text-2xl font-light">卖盘对比 (Asks)</h2>
                    <div class="text-sm opacity-90">
                        Binance: {{ binanceLastUpdate }} | Toobit: {{ toobitLastUpdate }}
                    </div>
                </div>
                <div class="max-h-96 overflow-y-auto">
                    <div class="grid grid-cols-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                        <div class="border-r border-gray-200 flex flex-col">
                            <div class="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 text-center">
                                Binance {{ exchangeType === 'spot' ? '现货' : 'U本位合约' }}
                            </div>
                            <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                                <span>价格</span>
                                <span>数量</span>
                                <span>总计</span>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <div class="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 text-center">
                                Toobit
                            </div>
                            <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                                <span>价格</span>
                                <span>数量</span>
                                <span>总计</span>
                            </div>
                        </div>
                    </div>
                    <div v-for="(item, index) in Math.max(binanceAsks.length, toobitAsks.length)" :key="`ask-${index}`"
                        class="grid grid-cols-2 border-b border-gray-100">
                        <div class="border-r border-gray-200">
                            <div v-if="binanceAsks[index]"
                                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-red-50 transition-colors duration-200"
                                :style="{ backgroundColor: `rgba(239, 68, 68, ${0.1 + (index / Math.max(binanceAsks.length, 1)) * 0.2})` }">
                                <span class="text-danger-600 font-semibold">{{ formatPrice(binanceAsks[index].price)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(binanceAsks[index].quantity)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(binanceAsks[index].total)
                                    }}</span>
                            </div>
                            <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 italic">
                                <span>--</span>
                                <span class="text-right">--</span>
                                <span class="text-right">--</span>
                            </div>
                        </div>
                        <div>
                            <div v-if="toobitAsks[index]"
                                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-red-50 transition-colors duration-200"
                                :style="{ backgroundColor: `rgba(239, 68, 68, ${0.1 + (index / Math.max(toobitAsks.length, 1)) * 0.2})` }">
                                <span class="text-danger-600 font-semibold">{{ formatPrice(toobitAsks[index].price)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(toobitAsks[index].quantity)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(toobitAsks[index].total)
                                    }}</span>
                            </div>
                            <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 italic">
                                <span>--</span>
                                <span class="text-right">--</span>
                                <span class="text-right">--</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 买盘对比区域 -->
            <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div
                    class="bg-gradient-to-r from-success-500 to-green-600 text-white p-4 flex justify-between items-center">
                    <h2 class="text-2xl font-light">买盘对比 (Bids)</h2>
                    <div class="text-sm opacity-90">
                        Binance: {{ binanceLastUpdate }} | Toobit: {{ toobitLastUpdate }}
                    </div>
                </div>
                <div class="max-h-96 overflow-y-auto">
                    <div class="grid grid-cols-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                        <div class="border-r border-gray-200 flex flex-col">
                            <div class="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 text-center">
                                Binance {{ exchangeType === 'spot' ? '现货' : 'U本位合约' }}
                            </div>
                            <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                                <span>价格</span>
                                <span>数量</span>
                                <span>总计</span>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <div class="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 text-center">
                                Toobit
                            </div>
                            <div class="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                                <span>价格</span>
                                <span>数量</span>
                                <span>总计</span>
                            </div>
                        </div>
                    </div>
                    <div v-for="(item, index) in Math.max(binanceBids.length, toobitBids.length)" :key="`bid-${index}`"
                        class="grid grid-cols-2 border-b border-gray-100">
                        <div class="border-r border-gray-200">
                            <div v-if="binanceBids[index]"
                                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-green-50 transition-colors duration-200"
                                :style="{ backgroundColor: `rgba(34, 197, 94, ${0.1 + (index / Math.max(binanceBids.length, 1)) * 0.2})` }">
                                <span class="text-success-600 font-semibold">{{ formatPrice(binanceBids[index].price)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(binanceBids[index].quantity)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(binanceBids[index].total)
                                    }}</span>
                            </div>
                            <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 italic">
                                <span>--</span>
                                <span class="text-right">--</span>
                                <span class="text-right">--</span>
                            </div>
                        </div>
                        <div>
                            <div v-if="toobitBids[index]"
                                class="grid grid-cols-3 px-4 py-2 text-sm font-mono hover:bg-green-50 transition-colors duration-200"
                                :style="{ backgroundColor: `rgba(34, 197, 94, ${0.1 + (index / Math.max(toobitBids.length, 1)) * 0.2})` }">
                                <span class="text-success-600 font-semibold">{{ formatPrice(toobitBids[index].price)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(toobitBids[index].quantity)
                                    }}</span>
                                <span class="text-gray-600 text-right">{{ formatQuantity(toobitBids[index].total)
                                    }}</span>
                            </div>
                            <div v-else class="grid grid-cols-3 px-4 py-2 text-sm font-mono text-gray-400 italic">
                                <span>--</span>
                                <span class="text-right">--</span>
                                <span class="text-right">--</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 统计信息 -->
        <div class="bg-white p-5 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-primary-500">
                <span class="font-semibold text-gray-700">Binance 最佳买价:</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatPrice(binanceBestBid) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-primary-500">
                <span class="font-semibold text-gray-700">Binance 最佳卖价:</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatPrice(binanceBestAsk) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-primary-500">
                <span class="font-semibold text-gray-700">Toobit 最佳买价:</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatPrice(toobitBestBid) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-primary-500">
                <span class="font-semibold text-gray-700">Toobit 最佳卖价:</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatPrice(toobitBestAsk) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-primary-500">
                <span class="font-semibold text-gray-700">价差 (Binance - Toobit):</span>
                <span class="font-mono font-semibold text-gray-800">{{ formatPrice(priceDifference) }}</span>
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

const getStatusClass = (status) => {
    const statusClasses = {
        connected: 'w-3 h-3 bg-success-500 rounded-full animate-pulse',
        connecting: 'w-3 h-3 bg-yellow-500 rounded-full animate-bounce',
        disconnected: 'w-3 h-3 bg-danger-500 rounded-full',
        error: 'w-3 h-3 bg-danger-500 rounded-full animate-pulse'
    }
    return statusClasses[status] || 'w-3 h-3 bg-gray-500 rounded-full'
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
        const processedAsks = DepthDataProcessor.processDepthData(data.a, 'asks')
        const processedBids = DepthDataProcessor.processDepthData(data.b, 'bids')

        binanceAsks.value = processedAsks
        binanceBids.value = processedBids

        const bestPrices = DepthDataProcessor.calculateBestPrices(processedBids, processedAsks)
        binanceBestBid.value = bestPrices.bestBid
        binanceBestAsk.value = bestPrices.bestAsk

        binanceLastUpdate.value = new Date().toLocaleTimeString()
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
