<template>
  <AiChatContainer
    ref="chatContainer"
    :characterCardId="cardId"
    :pageTitle="pageTitle"
    :customBackgroundImage="backgroundImage"
    :ollamaModelId="ollamaModelId"
    :userAvatar="userAvatar"
    :userName="userName"
    :aiAvatar="aiAvatar"
    :aiName="aiName"
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
      ollamaModelId: 'jiuguan',
      aiAvatar: '',
      aiName: 'AI',
      userAvatar: '',
      userName: 'UserName', // 默认值，将从角色卡配置获取
      firstMes: '', // 角色卡的开场白
      initialPrompt: '' // 初始提示词（用于图片生成）
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
    // 获取用户头像
    const avatarId = this.$store.state.user.avatar;
    if (avatarId) {
      this.api({
        url: "/sa/avatar?avatarId=" + avatarId,
        method: "get"
      }).then(data => {
        this.userAvatar = data;  // 修复：使用 this 而不是 _this
      }).catch(error => {
        console.error('获取用户头像失败:', error);
      });
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

        if (card) {
          // 设置背景图片
          if (card.avatar) {
            this.backgroundImage = card.avatar
            // AI头像使用角色卡头像
            this.aiAvatar = card.avatar
          }

          // 设置AI名称（从角色卡的cardName获取）
          if (card.characterName) {
            this.aiName = card.characterName
          }

          // 设置用户名称（从角色卡的userName配置获取）
          if (card.userName) {
            this.userName = card.userName
          }

          // 初始化角色开场白
          if (card.firstMes) {
            this.firstMes = card.firstMes
            // 等待组件挂载完成后初始化开场白
            this.$nextTick(() => {
              if (this.$refs.chatContainer) {
                this.$refs.chatContainer.initFirstMessage(card.firstMes)
              }
            })
          }

          // 设置初始提示词（用于图片生成）
          if (card.initialPrompt) {
            this.initialPrompt = card.initialPrompt
            this.$nextTick(() => {
              if (this.$refs.chatContainer) {
                this.$refs.chatContainer.initialCharacterState = card.initialPrompt
              }
            })
          }
        }
      } catch (error) {
        console.error('获取角色卡详情失败:', error)
        // 失败也不影响对话功能，只是没有背景图片和名称
      }
    }
  }
}
</script>

<style scoped>
/* 使用默认样式 */
</style>
