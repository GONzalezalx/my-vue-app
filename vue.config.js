const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  // Use relative publicPath when building for production so Electron can load assets from file://
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  transpileDependencies: true,
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: false,
        pathRewrite: { '^/api': '/api' }
      }
    }
  }
})
