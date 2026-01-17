<template>
  <div class="app-wrapper" :class="{hideSidebar:!sidebar.opened}">
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile"
      class="mobile-mask"
      :class="{ 'show': sidebar.opened }"
      @click="closeSidebar"
    ></div>

    <!-- 侧边栏 -->
    <sidebar
      class="sidebar-container"
      :class="{'mobile-opened': isMobile && sidebar.opened}"
    ></sidebar>

    <!-- 主容器 -->
    <div class="main-container">
      <navbar></navbar>
      <app-main></app-main>
    </div>
  </div>
</template>

<script>
import { Navbar, Sidebar, AppMain } from '@/views/layout/components'
import responsiveMixin from '@/mixins/responsiveMixin'

export default {
  name: 'layout',
  components: {
    Navbar,
    Sidebar,
    AppMain
  },
  mixins: [responsiveMixin],
  computed: {
    sidebar() {
      return this.$store.state.app.sidebar
    }
  },
  methods: {
    /**
     * 关闭侧边栏（移动端点击遮罩层时调用）
     */
    closeSidebar() {
      this.$store.dispatch('CloseSideBar')
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@use "@/styles/mixin.scss" as *;
.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
