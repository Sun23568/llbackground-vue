// vue.config.js
const path = require('path');
const resolve = (dir) => path.join(__dirname, '.', dir);

module.exports = {
  chainWebpack: config => {
    // 1. 路径别名
    config.resolve
      .alias
      .set('vue$', 'vue/dist/vue.esm.js')
      .set('@', resolve('src'))

    // 2. 模块解析
    config.resolve.modules
      .add(resolve('node_modules'))
      .add(resolve('node_modules/.pnpm'))
      .add('node_modules')

    // 3. SVG 雪碧图配置
    config.module
      .rule('svg-sprite')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .exclude.add(resolve('node_modules/element-ui'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })

    // 4. 字体文件处理
    module.exports = {
      chainWebpack: config => {
        config.module
          .rule('fonts')
          .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
          .use('url-loader')
          .loader('url-loader')
          .options({
            limit: 4096,
            name: 'fonts/[name].[hash:8].[ext]'
          })
      }
    }

    module.exports = {
      css: {
        loaderOptions: {
          scss: {
            // 可选：全局注入 SCSS 变量或 mixins
            additionalData: `@use "@/styles/variables.scss" as *;`
          }
        }
      }
    }

    config.module.rules.delete("svg");
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('svg-sprite')
      .test(/\.(svg)(\?.*)?$/i)
      .include
      .add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })

    // 5. Quill 编辑器兼容处理
    config.module
      .rule('js')
      .exclude.add(/node_modules\/(?!(quill)\/)./)

    // 6. 图片加载配置（修复后）
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .options({
        name: 'img/[name].[hash:7].[ext]',
        limit: 10000
      })
  },

  devServer: {
    port: 8086,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
};
