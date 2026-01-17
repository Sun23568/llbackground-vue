<template>
  <div class="mobile-menu" @click="toggleSidebar">
    <div class="hamburger" :class="{ 'is-active': isActive }">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script>
/**
 * 移动端汉堡菜单组件
 * 三横线图标，点击切换侧边栏显示/隐藏
 */
export default {
  name: 'MobileMenu',
  props: {
    /**
     * 是否处于激活状态（侧边栏是否打开）
     */
    isActive: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * 切换侧边栏显示/隐藏
     */
    toggleSidebar() {
      this.$store.dispatch('ToggleSideBar')
    }
  }
}
</script>

<style lang="scss" scoped>
@import './style.scss';
</style>
