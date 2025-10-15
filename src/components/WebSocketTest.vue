<template>
    <div class="websocket-test">
        <h2>WebSocket连接测试</h2>
        <div class="test-results">
            <div class="test-item">
                <span class="test-label">Binance现货连接测试:</span>
                <span :class="['test-status', binanceSpotTestStatus]">{{ binanceSpotTestStatus }}</span>
            </div>
            <div class="test-item">
                <span class="test-label">Binance U本位合约连接测试:</span>
                <span :class="['test-status', binanceFuturesTestStatus]">{{ binanceFuturesTestStatus }}</span>
            </div>
            <div class="test-item">
                <span class="test-label">Toobit连接测试:</span>
                <span :class="['test-status', toobitTestStatus]">{{ toobitTestStatus }}</span>
            </div>
        </div>
        <div class="test-logs">
            <h3>测试日志:</h3>
            <div class="log-container">
                <div v-for="(log, index) in testLogs" :key="index" class="log-item">
                    {{ log }}
                </div>
            </div>
        </div>
        <button @click="runTests" class="test-button">运行连接测试</button>
    </div>
</template>

<script>
export default {
    name: 'WebSocketTest',
    data() {
        return {
            binanceSpotTestStatus: '未测试',
            binanceFuturesTestStatus: '未测试',
            toobitTestStatus: '未测试',
            testLogs: []
        }
    },
    methods: {
        addLog(message) {
            const timestamp = new Date().toLocaleTimeString()
            this.testLogs.unshift(`[${timestamp}] ${message}`)
            if (this.testLogs.length > 50) {
                this.testLogs.pop()
            }
        },

        async runTests() {
            this.testLogs = []
            this.addLog('开始WebSocket连接测试...')

            await this.testBinanceSpotConnection()
            await this.testBinanceFuturesConnection()
            await this.testToobitConnection()

            this.addLog('测试完成')
        },

        testBinanceSpotConnection() {
            return new Promise((resolve) => {
                this.binanceSpotTestStatus = '测试中'
                this.addLog('正在测试Binance现货WebSocket连接...')

                try {
                    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms')

                    const timeout = setTimeout(() => {
                        ws.close()
                        this.binanceSpotTestStatus = '超时'
                        this.addLog('Binance现货连接测试超时')
                        resolve()
                    }, 10000)

                    ws.onopen = () => {
                        clearTimeout(timeout)
                        this.binanceSpotTestStatus = '成功'
                        this.addLog('Binance现货WebSocket连接成功')
                        ws.close()
                        resolve()
                    }

                    ws.onerror = (error) => {
                        clearTimeout(timeout)
                        this.binanceSpotTestStatus = '失败'
                        this.addLog(`Binance现货WebSocket连接失败: ${error}`)
                        resolve()
                    }

                    ws.onclose = () => {
                        clearTimeout(timeout)
                        if (this.binanceSpotTestStatus === '测试中') {
                            this.binanceSpotTestStatus = '失败'
                            this.addLog('Binance现货WebSocket连接关闭')
                        }
                        resolve()
                    }
                } catch (error) {
                    this.binanceSpotTestStatus = '失败'
                    this.addLog(`Binance现货连接测试异常: ${error.message}`)
                    resolve()
                }
            })
        },

        testBinanceFuturesConnection() {
            return new Promise((resolve) => {
                this.binanceFuturesTestStatus = '测试中'
                this.addLog('正在测试Binance U本位合约WebSocket连接...')

                try {
                    const ws = new WebSocket('wss://fstream.binance.com/ws')

                    const timeout = setTimeout(() => {
                        ws.close()
                        this.binanceFuturesTestStatus = '超时'
                        this.addLog('Binance U本位合约连接测试超时')
                        resolve()
                    }, 10000)

                    ws.onopen = () => {
                        clearTimeout(timeout)
                        this.binanceFuturesTestStatus = '成功'
                        this.addLog('Binance U本位合约WebSocket连接成功')

                        // 发送订阅消息
                        const subscribeMessage = {
                            method: 'SUBSCRIBE',
                            params: ['btcusdt@depth20@100ms'],
                            id: Date.now()
                        }
                        ws.send(JSON.stringify(subscribeMessage))

                        setTimeout(() => {
                            ws.close()
                            resolve()
                        }, 2000)
                    }

                    ws.onerror = (error) => {
                        clearTimeout(timeout)
                        this.binanceFuturesTestStatus = '失败'
                        this.addLog(`Binance U本位合约WebSocket连接失败: ${error}`)
                        resolve()
                    }

                    ws.onclose = () => {
                        clearTimeout(timeout)
                        if (this.binanceFuturesTestStatus === '测试中') {
                            this.binanceFuturesTestStatus = '失败'
                            this.addLog('Binance U本位合约WebSocket连接关闭')
                        }
                        resolve()
                    }
                } catch (error) {
                    this.binanceFuturesTestStatus = '失败'
                    this.addLog(`Binance U本位合约连接测试异常: ${error.message}`)
                    resolve()
                }
            })
        },

        testToobitConnection() {
            return new Promise((resolve) => {
                this.toobitTestStatus = '测试中'
                this.addLog('正在测试Toobit WebSocket连接...')

                try {
                    const ws = new WebSocket('wss://stream.toobit.com/ws')

                    const timeout = setTimeout(() => {
                        ws.close()
                        this.toobitTestStatus = '超时'
                        this.addLog('Toobit连接测试超时')
                        resolve()
                    }, 10000)

                    ws.onopen = () => {
                        clearTimeout(timeout)
                        this.toobitTestStatus = '成功'
                        this.addLog('Toobit WebSocket连接成功')

                        // 发送订阅消息
                        const subscribeMessage = {
                            id: 1,
                            method: 'SUBSCRIBE',
                            params: ['btcusdt@depth20@100ms']
                        }
                        ws.send(JSON.stringify(subscribeMessage))

                        setTimeout(() => {
                            ws.close()
                            resolve()
                        }, 2000)
                    }

                    ws.onerror = (error) => {
                        clearTimeout(timeout)
                        this.toobitTestStatus = '失败'
                        this.addLog(`Toobit WebSocket连接失败: ${error}`)
                        resolve()
                    }

                    ws.onclose = () => {
                        clearTimeout(timeout)
                        if (this.toobitTestStatus === '测试中') {
                            this.toobitTestStatus = '失败'
                            this.addLog('Toobit WebSocket连接关闭')
                        }
                        resolve()
                    }
                } catch (error) {
                    this.toobitTestStatus = '失败'
                    this.addLog(`Toobit连接测试异常: ${error.message}`)
                    resolve()
                }
            })
        }
    }
}
</script>

<style scoped>
.websocket-test {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.websocket-test h2 {
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.test-results {
    margin-bottom: 30px;
}

.test-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
    background: #f8f9fa;
    border-radius: 5px;
}

.test-label {
    font-weight: 600;
    color: #495057;
}

.test-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.test-status.未测试 {
    background: #e9ecef;
    color: #6c757d;
}

.test-status.测试中 {
    background: #fff3cd;
    color: #856404;
}

.test-status.成功 {
    background: #d4edda;
    color: #155724;
}

.test-status.失败 {
    background: #f8d7da;
    color: #721c24;
}

.test-status.超时 {
    background: #f8d7da;
    color: #721c24;
}

.test-logs {
    margin-bottom: 20px;
}

.test-logs h3 {
    color: #333;
    margin-bottom: 10px;
}

.log-container {
    max-height: 300px;
    overflow-y: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 10px;
}

.log-item {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #495057;
    margin-bottom: 5px;
    padding: 2px 0;
    border-bottom: 1px solid #e9ecef;
}

.log-item:last-child {
    border-bottom: none;
}

.test-button {
    display: block;
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

.test-button:hover {
    transform: translateY(-2px);
}

.test-button:active {
    transform: translateY(0);
}
</style>
