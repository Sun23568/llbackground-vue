# vue 前端模块

[根目录](../CLAUDE.md) > **vue**

## 变更记录 (Changelog)

### 2025-12-13 23:45:19
- 初始化模块文档

---

## 模块职责

Vue.js 2 单页应用（SPA），提供：
- 用户界面和交互体验
- 与后端 API 的通信（通过 Axios）
- 状态管理（Vuex）
- 路由管理（Vue Router）
- 权限控制（v-permission 指令）
- AI 对话和图像生成界面

## 入口与启动

### 主入口文件

**路径**: `/mnt/d/Java/SpringBoot-Shiro-Vue/vue/src/main.js`

```javascript
import Vue from 'vue'
import ElementUI from 'element-ui'
import App from './App'
import router from './router'
import store from './store'
import directives from "@/directives"
import {default as api} from './utils/api'

Vue.use(ElementUI)
Vue.prototype.api = api  // 全局 API 调用方法
Vue.use(directives)      // 注册指令（v-permission）

new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {App}
})
```

### 启动命令

```bash
# 安装依赖
cd /mnt/d/Java/SpringBoot-Shiro-Vue/vue && npm install

# 开发服务器（热重载）
npm run serve

# 生产构建
npm run build

# 代码检查
npm run lint
```

**默认端口**: 通常为 8080（可在 `vue.config.js` 配置）

## 对外接口（页面路由）

### 路由结构

**路径**: `/mnt/d/Java/SpringBoot-Shiro-Vue/vue/src/router/index.js`

#### 常量路由（无需权限）
- `/login` - 登录页
- `/404` - 404 页面
- `/` - 首页（重定向到 `/dashboard`）
  - `/dashboard` - 仪表盘

#### 异步路由（需要权限）

**功能模块** (`/system`):
- `/system/article` - 文章列表
- `/system/article/edit` - 编辑文章
- `/system/article/view` - 查看文章

**AI模块** (`/ai`):
- `/ai/girlAdventure` - 小飞（AI 对话）
- `/ai/girlAdventureAutoDL` - 小飞（AutoDL）
- `/ai/driverGuye` - 赛车手顾野
- `/ai/aiConfig` - AI 页面配置

**杂项** (`/user`):
- `/user/` - 用户列表
- `/user/access` - 授权管理
- `/user/upload` - 文件上传
- `/user/permission` - 权限管理

## 关键依赖与配置

### 核心依赖（package.json）

**UI 库**:
- **element-ui** 2.15.14: UI 组件库
- **normalize.css**: CSS 重置

**Vue 生态**:
- **vue** 2.6.14
- **vue-router** 3.0.6: 路由管理
- **vuex** 3.1.0: 状态管理
- **@vue/composition-api**: 组合式 API

**HTTP 与实时通信**:
- **axios** 0.18.1: HTTP 客户端
- **@microsoft/fetch-event-source**: SSE（Server-Sent Events）支持

**富文本与多媒体**:
- **quill** 1.3.7: 富文本编辑器
- **vue-quill-editor** 3.0.6
- **viewerjs** 1.11.7: 图片查看器
- **highlight.js** 11.11.1: 代码高亮

**工具库**:
- **js-cookie** 2.2.0: Cookie 管理
- **sm-crypto** 0.3.13: 国密算法（加密）
- **nprogress** 0.2.0: 进度条

### API 拦截器配置

**路径**: `/mnt/d/Java/SpringBoot-Shiro-Vue/vue/src/utils/api.js`

```javascript
import axios from 'axios'

const service = axios.create({
  baseURL: '/api',      // API 基础路径
  timeout: 150000000    // 超时时间
})

// 请求拦截器（添加 token）
service.interceptors.request.use(config => {
  let token = getToken();
  if (token) {
    config.headers.token = token;
  }
  return config;
})

// 响应拦截器（自动提取 data）
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === '200') {
      return res.data;  // 自动提取 data 字段
    } else {
      Message.error(res.msg);
      return Promise.reject(res);
    }
  },
  error => {
    // 统一错误处理（401/403/404 等）
    handleError(error);
    return Promise.reject(error);
  }
)
```

### Vuex 状态管理

**路径**: `/mnt/d/Java/SpringBoot-Shiro-Vue/vue/src/store/`

```
store/
├── index.js              # Store 入口
├── getters.js            # 全局 Getter
└── modules/
    ├── app.js            # 应用状态（侧边栏、设备等）
    ├── user.js           # 用户状态（token、信息、权限）
    └── permission.js     # 权限路由状态
```

**核心 State**:
- `user.token`: 用户令牌
- `user.name`: 用户名
- `user.avatar`: 头像
- `user.permissions`: 用户权限列表
- `permission.routes`: 动态路由

## 数据模型

### 主要视图组件

#### 1. 布局组件 (`views/layout/`)
- **Layout.vue**: 主布局（侧边栏 + 导航栏 + 内容区）
- **Navbar.vue**: 顶部导航栏
- **Sidebar/**: 侧边栏菜单

#### 2. 文章模块 (`views/article/`)
- **article.vue**: 文章列表（分页、搜索）
- **edit.vue**: 编辑文章（富文本编辑器）
- **view.vue**: 查看文章
- **Editor.vue**: Quill 编辑器封装
- **EditorView.vue**: 只读编辑器

#### 3. AI 模块 (`views/ai/`)
- **girlAdventure.vue**: AI 对话界面（SSE 流式传输）
- **girlAdventureAutoDL.vue**: AutoDL 版本
- **driverGuye.vue**: 赛车手顾野 AI
- **config.vue**: AI 配置管理
- **_template.vue**: AI 页面模板

#### 4. 用户模块 (`views/user/`)
- **user.vue**: 用户列表（CRUD）
- **access.vue**: 授权管理（权限分配）

#### 5. 文件模块 (`views/file/`)
- **FileUpload.vue**: 文件上传组件

#### 6. 公共组件 (`components/`)
- **AiChatContainer.vue**: AI 聊天容器
- **UploadBackgroundButton.vue**: 上传背景按钮
- **Breadcrumb/**: 面包屑导航
- **ScrollBar/**: 滚动条组件
- **SvgIcon/**: SVG 图标组件

## 测试与质量

**当前状态**: 无测试文件。

**建议**:
- 使用 **Jest** + **Vue Test Utils** 编写单元测试
- 测试组件的 Props、Events、Slots
- 测试 Vuex Actions 和 Mutations
- 端到端测试使用 **Cypress** 或 **Playwright**

## 常见问题 (FAQ)

### Q: 为什么要使用 this.api() 而不是直接 axios？
A: `this.api()` 封装了统一的错误处理和响应拦截，自动提取 `data` 字段并显示错误消息。

### Q: 如何添加新的路由页面？
A:
1. 在 `views/` 创建 Vue 组件
2. 在 `router/index.js` 的 `asyncRouterMap` 添加路由配置
3. 配置 `menu` 字段关联后端菜单代码

### Q: v-permission 指令如何使用？
A:
```vue
<el-button v-permission="'user:add'">添加用户</el-button>
```
没有权限时按钮会被隐藏。

### Q: 如何调用后端 API？
A:
```javascript
// GET 请求
this.api({
  url: '/user/list',
  method: 'get',
  params: {pageNum: 1, pageRow: 10}
}).then(data => {
  console.log(data);
});

// POST 请求
this.api({
  url: '/user/add',
  method: 'post',
  data: {userName: 'test', password: '123456'}
}).then(data => {
  this.$message.success('添加成功');
});
```

### Q: 如何使用 SSE（AI 对话）？
A:
```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

await fetchEventSource('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' }),
  onmessage(msg) {
    if (msg.data.startsWith('PROGRESS:')) {
      this.progress = parseInt(msg.data.substring(9));
    } else {
      this.response += msg.data;
    }
  }
});
```

## 相关文件清单

```
vue/
├── package.json              # 依赖配置
├── babel.config.js           # Babel 配置
├── vue.config.js             # Vue CLI 配置（如存在）
├── public/
│   ├── index.html
│   └── favicon.ico
└── src/
    ├── main.js               # 入口文件
    ├── App.vue               # 根组件
    ├── router/
    │   ├── index.js          # 路由配置
    │   └── _import_*.js      # 路由懒加载
    ├── store/
    │   ├── index.js          # Vuex Store
    │   ├── getters.js
    │   └── modules/
    │       ├── app.js
    │       ├── user.js
    │       └── permission.js
    ├── views/                # 页面组件
    │   ├── layout/
    │   ├── login/
    │   ├── dashboard/
    │   ├── article/
    │   ├── ai/
    │   ├── user/
    │   ├── file/
    │   └── 404.vue
    ├── components/           # 公共组件
    │   ├── AiChatContainer.vue
    │   ├── Breadcrumb/
    │   ├── ScrollBar/
    │   └── SvgIcon/
    ├── utils/
    │   ├── api.js            # Axios 封装
    │   ├── auth.js           # Token 管理
    │   └── hasPermission.js  # 权限判断
    ├── directives/           # 自定义指令
    │   └── permission.js     # v-permission
    ├── permission.js         # 路由权限守卫
    ├── icons/                # SVG 图标
    │   └── svg/
    └── assets/               # 静态资源
        ├── 404_images/
        └── avatar.jpg
```

## 下一步建议

1. 查看 [back/app/api 模块](../back/app/api/CLAUDE.md) 了解后端 API 接口
2. 查看根目录 [CLAUDE.md](../CLAUDE.md) 的"编码规范 > 前端规范"章节
3. 阅读 `src/utils/api.js` 理解响应拦截器逻辑
