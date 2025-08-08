<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style lang="scss">
  @use 'normalize.css/normalize.css';// normalize.css 样式格式化
  @use './styles/index.scss'; // 全局自定义的css样式
</style>
