# 深度聚合前端页面

一个实时对比展示Binance和Toobit交易所深度数据的前端应用，完全基于WebSocket技术实现，无需后端支持。

## 功能特性

### 🚀 核心功能
- **实时深度数据**: 通过WebSocket实时获取Binance和Toobit的深度数据
- **多交易类型支持**: 支持Binance现货交易和U本位合约交易
- **双交易所对比**: 并排展示两个交易所的买卖盘数据
- **多币对支持**: 支持BTC/USDT、ETH/USDT、BNB/USDT、ADA/USDT、SOL/USDT等主流币对
- **自动重连**: 智能重连机制，确保数据连接的稳定性
- **响应式设计**: 适配桌面和移动设备

### 📊 数据展示
- **深度表格**: 清晰展示买卖盘价格、数量、累计数量
- **实时更新**: 数据实时刷新，显示最后更新时间
- **连接状态**: 实时显示各交易所的连接状态
- **统计信息**: 显示最佳买卖价和价差对比

### 🎨 用户界面
- **现代化设计**: 采用渐变色彩和卡片式布局
- **直观展示**: 买盘绿色背景，卖盘红色背景，便于区分
- **交互友好**: 支持币对切换，状态指示清晰

## 技术架构

### 前端技术栈
- **Vue 3**: 使用Composition API和响应式系统
- **WebSocket**: 原生WebSocket API实现实时数据连接
- **CSS3**: 现代CSS特性，包括Grid布局、Flexbox、动画等
- **ES6+**: 使用现代JavaScript特性

### 核心模块
- **WebSocketService**: WebSocket连接管理服务
- **DepthDataProcessor**: 深度数据处理工具类
- **DepthAggregator**: 主组件，负责UI展示和用户交互

## 安装和运行

### 环境要求
- Node.js 14+
- npm 或 pnpm

### 安装依赖
```bash
# 使用npm
npm install

# 或使用pnpm
pnpm install
```

### 启动开发服务器
```bash
# 使用npm
npm run serve

# 或使用pnpm
pnpm serve
```

应用将在 `http://localhost:8080` 启动

### 构建生产版本
```bash
# 使用npm
npm run build

# 或使用pnpm
pnpm build
```

## 使用说明

### 基本操作
1. **选择交易类型**: 在页面顶部选择"现货交易"或"U本位合约"
2. **选择币对**: 在下拉菜单中选择要查看的交易对
3. **查看连接状态**: 观察右上角的连接状态指示器
4. **分析深度数据**: 对比两个交易所的买卖盘数据
5. **监控价差**: 查看底部统计面板中的价差信息

### 数据解读
- **买盘 (Bids)**: 绿色背景，显示买入订单
- **卖盘 (Asks)**: 红色背景，显示卖出订单
- **价格**: 订单价格，以USDT计价
- **数量**: 该价格档位的订单数量
- **总计**: 累计订单数量

### 连接状态
- 🟢 **已连接**: WebSocket连接正常，数据实时更新
- 🟡 **连接中**: 正在建立WebSocket连接
- 🔴 **未连接**: WebSocket连接断开
- 🔴 **错误**: 连接出现错误

## API接口

### Binance WebSocket

#### 现货交易
- **连接地址**: `wss://stream.binance.com:9443/ws/{symbol}@depth20@100ms`
- **数据格式**: JSON格式的深度更新数据
- **更新频率**: 100ms

#### U本位合约
- **连接地址**: `wss://fstream.binance.com/ws`
- **订阅方式**: 发送订阅消息到WebSocket
- **订阅格式**: `{"method": "SUBSCRIBE", "params": ["{symbol}@depth20@100ms"], "id": timestamp}`
- **数据格式**: JSON格式的深度更新数据
- **更新频率**: 100ms

### Toobit WebSocket
- **连接地址**: `wss://stream.toobit.com/ws`
- **订阅方式**: 发送订阅消息到WebSocket
- **数据格式**: JSON格式的深度更新数据
- **更新频率**: 100ms

## 性能优化

### 数据处理优化
- **数据过滤**: 自动过滤数量为0的无效订单
- **档位限制**: 只显示前20档深度数据，减少渲染负担
- **内存管理**: 及时清理WebSocket连接，避免内存泄漏

### 网络优化
- **心跳检测**: 定期发送心跳包，保持连接活跃
- **自动重连**: 连接断开时自动重连，最多重试5次
- **错误处理**: 完善的错误处理机制，提供友好的错误提示

### 渲染优化
- **虚拟滚动**: 深度表格支持滚动，避免一次性渲染大量数据
- **CSS优化**: 使用CSS Grid和Flexbox，提高布局性能
- **响应式设计**: 适配不同屏幕尺寸，提供最佳用户体验

## 浏览器兼容性

### 支持的浏览器
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### WebSocket支持
- 所有现代浏览器都支持WebSocket API
- 自动检测WebSocket支持情况
- 提供降级方案（如需要）

## 安全考虑

### 数据安全
- **只读访问**: 仅获取公开的深度数据，不涉及用户账户信息
- **无认证**: 不需要API密钥，使用公开的WebSocket接口
- **HTTPS**: 生产环境建议使用HTTPS部署

### 网络安全
- **CORS**: 正确处理跨域请求
- **错误处理**: 避免敏感信息泄露
- **输入验证**: 对用户输入进行验证和过滤

## 故障排除

### 常见问题

**Q: 页面显示"未连接"状态**
A: 检查网络连接，确保可以访问交易所的WebSocket服务

**Q: 数据不更新**
A: 可能是WebSocket连接断开，页面会自动重连，请稍等片刻

**Q: 某些币对没有数据**
A: 确保选择的币对在两个交易所都有交易

**Q: 页面加载缓慢**
A: 检查网络速度，首次加载可能需要一些时间建立WebSocket连接

### 调试信息
- 打开浏览器开发者工具查看控制台日志
- 检查Network标签页中的WebSocket连接状态
- 查看Console中的错误信息和连接日志

## 开发指南

### 项目结构
```
src/
├── components/
│   └── DepthAggregator.vue    # 主组件
├── services/
│   └── WebSocketService.js    # WebSocket服务
├── App.vue                    # 根组件
└── main.js                    # 入口文件
```

### 添加新交易所
1. 在`WebSocketService.js`中添加新的连接方法
2. 在`DepthAggregator.vue`中添加对应的数据处理逻辑
3. 更新UI布局以展示新交易所的数据

### 自定义样式
- 修改`DepthAggregator.vue`中的CSS样式
- 支持主题切换（可扩展）
- 响应式断点可自定义

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 支持Binance和Toobit深度数据对比
- 实现WebSocket实时连接
- 添加自动重连机制
- 响应式UI设计