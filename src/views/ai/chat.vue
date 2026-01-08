<template>
  <AiChatContainer
    :aiMenuId="aiMenuId"
    :pageTitle="pageTitle"
  />
</template>

<script>
import AiChatContainer from '@/components/AiChatContainer'

export default {
  name: 'CharacterCardChat',
  components: {
    AiChatContainer
  },
  data() {
    return {
      aiMenuId: '',
      pageTitle: '角色对话'
    }
  },
  created() {
    // 从路由参数获取角色卡ID和名称
    const cardId = this.$route.query.cardId
    const cardName = this.$route.query.cardName

    if (cardId) {
      // 使用角色卡ID作为aiMenuId
      this.aiMenuId = `character-card-${cardId}`
      this.pageTitle = cardName ? `${cardName} - 角色对话` : '角色对话'
    } else {
      // 如果没有cardId，提示错误并返回
      this.$message.error('缺少角色卡信息')
      this.$router.push('/ai/characterCard')
    }
  }
}
</script>

<style scoped>
/* 使用默认样式 */
</style>
