/**
 * 测试修复后的Binance U本位合约WebSocket连接
 * 运行方式: node test-fixed-connection.js
 */

const WebSocket = require('ws');

console.log('测试修复后的Binance U本位合约WebSocket连接...');

const ws = new WebSocket('wss://fstream.binance.com/ws');

let messageCount = 0;
let pingCount = 0;

ws.on('open', function open() {
  console.log('✅ WebSocket连接成功');
  
  // 发送订阅消息
  const subscribeMessage = {
    method: 'SUBSCRIBE',
    params: ['btcusdt@depth20@100ms'],
    id: Date.now()
  };
  
  console.log('📤 发送订阅消息:', JSON.stringify(subscribeMessage));
  ws.send(JSON.stringify(subscribeMessage));
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data.toString());
    
    // 处理ping消息
    if (parsed.ping) {
      pingCount++;
      console.log(`🏓 收到ping消息 #${pingCount}，回复pong`);
      ws.send(JSON.stringify({ pong: parsed.ping }));
      return;
    }
    
    if (parsed.result === null && parsed.id) {
      console.log('✅ 订阅成功确认');
    } else if (parsed.e === 'depthUpdate') {
      messageCount++;
      console.log(`📊 收到深度数据 #${messageCount}:`, {
        stream: parsed.s,
        asks: parsed.a?.length || 0,
        bids: parsed.b?.length || 0,
        timestamp: new Date().toLocaleTimeString()
      });
    } else {
      console.log('📨 收到其他消息:', parsed);
    }
  } catch (error) {
    console.error('❌ 消息解析错误:', error.message);
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket错误:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket连接关闭: ${code} - ${reason}`);
  console.log(`📈 总共收到 ${messageCount} 条深度数据消息`);
  console.log(`🏓 总共收到 ${pingCount} 条ping消息`);
});

// 30秒后自动关闭
setTimeout(() => {
  console.log('⏰ 测试完成，关闭连接');
  ws.close();
  process.exit(0);
}, 30000);
