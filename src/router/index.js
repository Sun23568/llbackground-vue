import Vue from 'vue'
import Router from 'vue-router'
// in development env not use Lazy Loading,because Lazy Loading too many pages will cause webpack hot update too slow.so only in production use Lazy Loading
/* layout */
import Layout from '../views/layout/Layout'

const _import = require('./_import_' + process.env.NODE_ENV)
Vue.use(Router)
export const constantRouterMap = [
  { path: '/login', component: _import('login/index'), hidden: true },
  { path: '/404', component: _import('404'), hidden: true },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    name: '首页',
    hidden: true,
    children: [{
      path: 'dashboard', component: _import('dashboard/index')
    }]
  }
]
export default new Router({
  // mode: 'history', //后端支持可开
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRouterMap
})
export const asyncRouterMap = [
  // ========== 功能模块 ==========
  {
    path: '/system',
    component: Layout,
    redirect: '/system/article',
    name: '功能模块',
    meta: { title: '功能模块', icon: 'function-line' },
    children: [
      {
        path: 'article',
        name: '文章列表',
        component: _import('article/article'),
        meta: { title: '文章列表', icon: 'article-line' },
        menu: 'article'
      },
      {
        path: 'article/edit',
        name: '编辑文章',
        component: _import('article/edit'),
        meta: { title: '编辑文章' },
        hidden: true
      },
      {
        path: 'article/view',
        name: '查看文章',
        component: _import('article/view'),
        meta: { title: '查看文章' },
        hidden: true
      }
    ]
  },
  // ========== AI模块 ==========
  {
    path: '/ai',
    component: Layout,
    redirect: '/ai/characterCard',
    name: 'AI模块',
    meta: { title: 'AI模块', icon: 'ai-line' },
    children: [
      {
        path: 'characterCard',
        name: '角色卡管理',
        component: _import('ai/characterCard'),
        meta: { title: '角色卡管理', icon: 'postcard-line' },
        menu: 'characterCard'
      },
      {
        path: 'chat',
        name: '角色对话',
        component: _import('ai/chat'),
        meta: { title: '角色对话' },
        hidden: true  // 不在菜单中显示
      }
    ]
  },
  // ========== 用户管理 ==========
  {
    path: '/user-manage',
    component: Layout,
    redirect: '/user-manage/',
    name: '用户管理',
    meta: { title: '用户管理', icon: 'user-manage-line' },
    children: [
      {
        path: '',
        name: '用户列表',
        component: _import('user/user'),
        meta: { title: '用户列表', icon: 'user-line' },
        menu: 'user'
      },
      {
        path: 'access',
        name: '授权管理',
        component: _import('user/access'),
        meta: { title: '授权管理', icon: 'user-check-line' },
        menu: 'access'
      }
    ]
  },
  // ========== 系统配置 ==========
  {
    path: '/system-config',
    component: Layout,
    redirect: '/system-config/permission',
    name: '系统配置',
    meta: { title: '系统配置', icon: 'system-config-line' },
    children: [
      {
        path: 'permission',
        name: '权限配置',
        component: _import('user/permission'),
        meta: { title: '权限配置', icon: 'shield-keyhole-line' },
        menu: 'permission'
      },
      {
        path: 'menu',
        name: '菜单配置',
        component: _import('user/menu'),
        meta: { title: '菜单配置', icon: 'menu-line' },
        menu: 'menu'
      },
      {
        path: 'ai-config',
        name: 'AI页面配置',
        component: _import('ai/config'),
        meta: { title: 'AI页面配置', icon: 'ai-settings-line' },
        menu: 'aiConfig'
      }
    ]
  },
  // ========== 文件管理 ==========
  {
    path: '/file-manage',
    component: Layout,
    redirect: '/file-manage/',
    name: '文件管理',
    meta: { title: '文件管理', icon: 'file-manage-line' },
    children: [
      {
        path: '',
        name: '文件上传',
        component: _import('file/FileUpload'),
        meta: { title: '文件上传', icon: 'upload-cloud-line' },
        menu: 'fileUpload'
      }
    ]
  }
]
