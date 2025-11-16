<template>
  <scroll-bar>
    <el-menu mode="vertical" unique-opened :default-active="$route.path" :collapse="isCollapse"
             background-color="transparent" text-color="#cbd5e1" active-text-color="#ffffff">
      <sidebar-item :routes="permission_routers"></sidebar-item>
    </el-menu>
  </scroll-bar>
</template>
<script>
  import {mapGetters} from 'vuex'
  import SidebarItem from './SidebarItem'
  import ScrollBar from '@/components/ScrollBar'

  export default {
    components: {SidebarItem, ScrollBar},
    computed: {
      ...mapGetters([
        'permission_routers',
        'sidebar'
      ]),
      isCollapse() {
        return !this.sidebar.opened
      }
    }
  }
</script>
