# Views 目录说明

这个目录包含所有的页面组件，每个页面组件对应一个路由。

## 目录结构

```
views/
├── Analytics.vue          # 数据分析页面
├── Users.vue             # 用户管理页面
├── Settings.vue          # 设置页面
├── SimpleHome.vue        # 简单首页
├── About.vue             # 关于我们页面
├── Contact.vue           # 联系我们页面
├── Login.vue             # 登录页面
├── Register.vue          # 注册页面
└── FullScreenDashboard.vue # 全屏仪表板页面
```

## 使用说明

这些页面组件通过路由懒加载的方式引入，可以提高应用的初始加载速度。

每个页面组件都应该：
1. 使用合适的布局
2. 包含页面特定的逻辑
3. 遵循Vue 3 Composition API的最佳实践
4. 使用Pinia进行状态管理
5. 使用Tailwind CSS进行样式设计
