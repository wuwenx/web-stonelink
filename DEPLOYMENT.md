# 部署指南

## 本地开发

### 启动开发服务器
```bash
npm run serve
# 或
pnpm serve
```

应用将在 `http://localhost:8080` 启动

### 热重载
开发服务器支持热重载，修改代码后会自动刷新页面。

## 生产部署

### 构建生产版本
```bash
npm run build
# 或
pnpm build
```

构建完成后，`dist` 目录包含所有静态文件。

### 静态文件部署

#### 使用Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 使用Apache
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist

    <Directory /path/to/dist>
        AllowOverride All
        Require all granted
    </Directory>

    # 处理Vue Router的history模式
    FallbackResource /index.html
</VirtualHost>
```

#### 使用Docker
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CDN部署
可以将 `dist` 目录的内容上传到任何静态文件托管服务：
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Blob Storage
- Vercel
- Netlify
- GitHub Pages

## 环境配置

### 开发环境
- 开发服务器自动处理跨域问题
- 支持热重载和源码映射

### 生产环境
- 确保使用HTTPS（WebSocket需要安全连接）
- 配置适当的缓存策略
- 启用gzip压缩

## 性能优化

### 构建优化
```bash
# 分析构建包大小
npm run build -- --report
```

### 运行时优化
- 启用浏览器缓存
- 使用CDN加速
- 配置适当的HTTP头

## 监控和日志

### 错误监控
建议集成错误监控服务：
- Sentry
- Bugsnag
- LogRocket

### 性能监控
- Google Analytics
- New Relic
- DataDog

## 安全考虑

### HTTPS
生产环境必须使用HTTPS，因为：
- WebSocket连接需要安全上下文
- 保护用户数据安全

### 内容安全策略
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' wss://stream.binance.com wss://stream.toobit.com;">
```

### 安全头
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

## 故障排除

### 常见问题

**WebSocket连接失败**
- 检查防火墙设置
- 确认交易所API服务正常
- 验证网络连接

**页面空白**
- 检查控制台错误
- 确认构建文件完整性
- 验证服务器配置

**数据不更新**
- 检查WebSocket连接状态
- 验证API端点可用性
- 查看网络请求日志

### 调试工具
- 浏览器开发者工具
- WebSocket测试工具
- 网络监控工具

## 更新和维护

### 版本更新
1. 更新依赖包
2. 运行测试
3. 构建新版本
4. 部署到生产环境

### 监控检查
- 定期检查应用性能
- 监控错误日志
- 验证数据准确性

### 备份策略
- 定期备份构建文件
- 保存配置文件
- 记录部署历史
