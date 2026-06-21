<template>
  <div class="menu-wrapper">
    <template v-for="item in routes" v-if="!item.hidden&&item.children">

      <a
        v-if="item.children.length===1 && !item.children[0].children && isNewTabRoute(item.children[0])"
        :key="item.children[0].name"
        :href="newTabHref(item, item.children[0])"
        target="_blank"
        rel="noopener noreferrer"
        class="external-link"
      >
        <el-menu-item :index="resolvePath(item.path, item.children[0].path)" class='submenu-title-noDropdown'>
          <svg-icon v-if="item.children[0].meta&&item.children[0].meta.icon" :icon-class="item.children[0].meta.icon"></svg-icon>
          <span v-if="item.children[0].meta&&item.children[0].meta.title" class="menu-title">{{item.children[0].meta.title}}</span>
        </el-menu-item>
      </a>

      <router-link v-else-if="item.children.length===1 && !item.children[0].children" :to="resolvePath(item.path, item.children[0].path)" :key="item.children[0].name">
        <el-menu-item :index="resolvePath(item.path, item.children[0].path)" class='submenu-title-noDropdown'>
          <svg-icon v-if="item.children[0].meta&&item.children[0].meta.icon" :icon-class="item.children[0].meta.icon"></svg-icon>
          <span v-if="item.children[0].meta&&item.children[0].meta.title" class="menu-title">{{item.children[0].meta.title}}</span>
        </el-menu-item>
      </router-link>

      <el-submenu v-else :index="item.name||item.path" :key="item.name">
        <template slot="title">
          <svg-icon v-if="item.meta&&item.meta.icon" :icon-class="item.meta.icon"></svg-icon>
          <span v-if="item.meta&&item.meta.title" class="menu-title">{{item.meta.title}}</span>
        </template>

        <template v-for="child in item.children" v-if="!child.hidden">
          <sidebar-item class="nest-menu" v-if="child.children&&child.children.length>0" :routes="[child]" :key="child.path"></sidebar-item>

          <a
            v-else-if="isNewTabRoute(child)"
            :key="child.name"
            :href="newTabHref(item, child)"
            target="_blank"
            rel="noopener noreferrer"
            class="external-link"
          >
            <el-menu-item :index="resolvePath(item.path, child.path)">
              <svg-icon v-if="child.meta&&child.meta.icon" :icon-class="child.meta.icon"></svg-icon>
              <span v-if="child.meta&&child.meta.title" class="menu-title">{{child.meta.title}}</span>
            </el-menu-item>
          </a>

          <router-link v-else :to="resolvePath(item.path, child.path)" :key="child.name">
            <el-menu-item :index="resolvePath(item.path, child.path)">
              <svg-icon v-if="child.meta&&child.meta.icon" :icon-class="child.meta.icon"></svg-icon>
              <span v-if="child.meta&&child.meta.title" class="menu-title">{{child.meta.title}}</span>
            </el-menu-item>
          </router-link>
        </template>
      </el-submenu>

    </template>
  </div>
</template>

<script>
export default {
  name: 'SidebarItem',
  props: {
    routes: {
      type: Array
    }
  },
  methods: {
    resolvePath(parentPath, childPath) {
      return `${parentPath}/${childPath}`.replace(/\/+/g, '/')
    },
    isNewTabRoute(route) {
      return route.meta && route.meta.openInNewTab
    },
    newTabHref(parent, child) {
      return child.meta.externalPath || this.resolvePath(parent.path, child.path)
    }
  }
}
</script>

<style lang="scss" scoped>
.menu-wrapper {
  .external-link {
    display: block;
    text-decoration: none;
  }

  .menu-title {
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
  }
}
</style>
