<template>
  <!--
    ✨ AI角色快速创建模板

    使用步骤：
    1. 复制此文件，重命名为你的角色名（如 xiaomingAdventure.vue）
    2. 修改下面的 aiMenuId（必须与后端配置的 menuCode 一致）
    3. 修改 pageTitle（页面标题）
    4. 修改 script 中的组件名称
    5. 在 router/index.js 中添加路由配置
    6. 完成！

    示例：创建"小明历险记"
    - aiMenuId: "xiaomingAdventure"
    - pageTitle: "小明历险记"
    - name: "XiaomingAdventure"
  -->
  <AiChatContainer
    aiMenuId="yourMenuCode"
    pageTitle="你的角色名称"
  />
</template>

<script>
import AiChatContainer from '@/components/AiChatContainer';

export default {
  name: 'YourCharacterName', // ⚠️ 修改为你的组件名（PascalCase）
  components: {
    AiChatContainer
  }
};
</script>

<style scoped>
/*
  个性化样式（可选）

  使用深度选择器修改组件内部样式：

  >>> .chat-title {
    color: #ff6b6b;
  }

  >>> .page-container::before {
    background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 255, 0.1) 100%);
  }

  >>> .action-buttons .el-button--primary {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  }
*/
</style>
