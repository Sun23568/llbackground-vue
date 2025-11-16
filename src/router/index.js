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
    path: '/article/edit',
    component: () => import('../views/article/edit.vue'),
    hidden: true
  },
  {
    path: '/article/view',
    component: () => import('../views/article/view.vue'),
    hidden: true
  },
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
  {
    path: '/system',
    component: Layout,
    redirect: '/system/article',
    name: '功能模块',
    meta: { title: '功能模块', icon: 'tree' },
    children: [
      {
        path: 'article',
        name: '文章',
        component: _import('article/article'),
        meta: { title: '文章', icon: 'example' },
        menu: 'article'
      },
    ]
  },
  {
    path: '/ai',
    component: Layout,
    redirect: '/ai/girlAdventure',
    name: 'AI模块',
    meta: { title: 'AI模块', icon: 'ai' },
    children: [
      {
        path: 'girlAdventure',
        name: '小飞历险记',
        component: _import('ai/girlAdventure'),
        meta: { title: '少女历险记', icon: 'girl' },
        menu: 'girlAdventure'
      },
      {
        path: 'aiConfig',
        name: 'AI页面配置',
        component: _import('ai/config'),
        meta: { title: 'AI页面配置', icon: 'ai-config' },
        menu: 'aiConfig'
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    redirect: '/user/',
    name: '',
    meta: { title: '杂项', icon: 'table' },
    children: [
      {
        path: '',
        name: '用户列表',
        component: _import('user/user'),
        meta: { title: '用户列表', icon: 'user' },
        menu: 'user'
      },
      {
        path: 'access',
        name: '授权管理',
        component: _import('user/access'),
        meta: { title: '授权管理', icon: 'password' },
        menu: 'access'
      }
    ]
  }
]
