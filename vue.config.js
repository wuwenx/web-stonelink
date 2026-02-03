const { defineConfig } = require('@vue/cli-service');

// 生产构建时若未从 .env.production 读到，则用线上地址，避免 build 后仍走 localhost
if (process.env.NODE_ENV === 'production' && !process.env.VUE_APP_API_BASE_URL) {
  process.env.VUE_APP_API_BASE_URL = 'http://10.246.2.52/api/v1';
}

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: error => {
          // 不显示 ResizeObserver 的无害错误
          if (error?.message?.includes('ResizeObserver')) return false;
          return true;
        },
      },
    },
  },
  // 配置 GitHub Pages 部署
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/web-stonelink/'  // 仓库名：web-stonelink
    : '/',
  // 输出目录
  outputDir: 'dist',
  // 静态资源目录
  assetsDir: 'static',
  // 是否在构建生产包时生成 sourceMap 文件
  productionSourceMap: false
});
