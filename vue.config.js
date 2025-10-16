const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
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
