<template>
  <AiChatContainer
    :characterCardId="cardId"
    :pageTitle="pageTitle"
    :customBackgroundImage="backgroundImage"
    :ollamaModelId="ollamaModelId"
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
      pageTitle: '角色对话',
      backgroundImage: '',
      cardId: '',
      ollamaModelId: 'jiuguan'
    }
  },
  created() {
    // 从路由参数获取角色卡ID和名称
    const cardId = this.$route.query.cardId
    const cardName = this.$route.query.cardName

    if (cardId) {
      this.cardId = cardId
      this.pageTitle = cardName ? `${cardName} - 角色对话` : '角色对话'

      // 获取角色卡详情（包括avatar）
      this.fetchCharacterCardDetail()
    } else {
      // 如果没有cardId，提示错误并返回
      this.$message.error('缺少角色卡信息')
      this.$router.push('/ai/characterCard')
    }
  },
  methods: {
    /**
     * 获取角色卡详情
     */
    async fetchCharacterCardDetail() {
      try {
        const card = await this.api({
          url: `/character-card/detail?cardId=${this.cardId}`,
          method: 'get'
        })

        // 设置背景图片为角色卡的avatar
        if (card && card.avatar) {
          this.backgroundImage = card.avatar
        }
      } catch (error) {
        console.error('获取角色卡详情失败:', error)
        // 失败也不影响对话功能，只是没有背景图片
      }
    }
  }
}
</script>

<style scoped>
/* 使用默认样式 */
</style>
