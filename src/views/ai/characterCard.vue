<template>
  <div class="character-card-container">
    <!-- 页面标题和操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">
            <i class="el-icon-postcard"></i>
            角色卡管理
          </h2>
          <p class="page-subtitle">管理您的AI角色卡，支持新增、查看和删除操作</p>
        </div>
        <div class="action-section">
          <el-button type="primary" icon="el-icon-upload" size="medium" @click="uploadDialogVisible = true">
            上传角色卡
          </el-button>
          <el-button icon="el-icon-refresh" size="medium" @click="loadCardList">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 角色卡列表 -->
    <el-card class="list-card" shadow="never" v-loading="loading">
      <!-- 空状态 -->
      <el-empty v-if="!loading && cardList.length === 0" description="暂无角色卡，请上传新的角色卡" :image-size="120">
      </el-empty>

      <!-- 卡片网格 -->
      <el-row :gutter="20" v-else>
        <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="card in cardList" :key="card.id" class="card-col">
          <div class="character-card" @click="handleMenuCommand({ action: 'chat', card: card })">
            <!-- 右上角悬浮菜单 -->
            <el-dropdown trigger="click" class="card-menu" @command="handleMenuCommand" @click.native.stop>
              <span class="el-dropdown-link">
                <i class="el-icon-more"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{ action: 'chat', card: card }" icon="el-icon-chat-dot-round">
                  开始聊天
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'view', card: card }" icon="el-icon-view" divided>
                  查看详情
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'config', card: card }" icon="el-icon-setting">
                  配置角色
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'delete', card: card }" icon="el-icon-delete" divided>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>

            <!-- 角色头像 -->
            <div class="avatar-wrapper">
              <img :src="card.avatar || 'https://via.placeholder.com/300x400?text=No+Image'" :alt="card.cardName"
                class="character-avatar">

              <!-- 悬停遮罩层 -->
              <div class="avatar-overlay">
                <i class="el-icon-chat-dot-round"></i>
              </div>

              <!-- 角色信息（浮在图片上） -->
              <div class="card-info">
                <h3 class="card-name">{{ card.cardName }}</h3>
                <p class="card-description">
                  {{ card.cardDescription || '暂无描述' }}
                </p>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 上传弹窗 -->
    <el-dialog title="上传角色卡" :visible.sync="uploadDialogVisible" width="500px" :close-on-click-modal="false">
      <el-upload class="upload-demo" drag :action="uploadAction" :http-request="uploadFile"
        :before-upload="beforeUpload" :show-file-list="false" accept=".json">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将JSON文件拖到此处,或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">
          只支持JSON格式的角色卡文件
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="角色卡详情" :visible.sync="detailDialogVisible" width="700px" top="5vh">
      <div v-if="currentCard" class="detail-container">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="角色名称">
            <el-tag type="primary">{{ currentCard.cardName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="角色描述">
            <div class="description-content">
              {{ currentCard.cardDescription || '暂无描述' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="开场白" v-if="currentCard.firstMes">
            <div class="description-content">
              {{ currentCard.firstMes }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="场景" v-if="currentCard.scenario">
            <el-tag type="success">{{ currentCard.scenario }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对话示例" v-if="currentCard.mesExample">
            <div class="description-content example-content">
              {{ currentCard.mesExample }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            <i class="el-icon-time"></i>
            {{ currentCard.createTime }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 配置弹窗 -->
    <el-dialog title="配置角色卡" :visible.sync="configDialogVisible" width="600px" :close-on-click-modal="false">
      <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="120px">

        <el-form-item label="角色名称" prop="cardName">
          <el-input v-model="configForm.cardName" placeholder="请输入角色名称" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="configForm.userName" placeholder="请输入用户名称（对应角色卡中的{user}占位符）" maxlength="100"
            show-word-limit>
            <template slot="prepend">{user}</template>
          </el-input>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            此名称将替换角色卡中的 {user} 占位符
          </div>
        </el-form-item>

        <el-form-item label="角色昵称" prop="characterName">
          <el-input v-model="configForm.characterName" placeholder="请输入角色昵称（对应角色卡中的{char}占位符）" maxlength="100"
            show-word-limit>
            <template slot="prepend">{char}</template>
          </el-input>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            此名称将替换角色卡中的 {char} 占位符，用于AI对话时称呼角色
          </div>
        </el-form-item>

        <el-form-item label="人物描述" prop="characterDescription">
          <el-input type="textarea" v-model="configForm.characterDescription" :rows="3"
            placeholder="请描述人物的外观特征（自动从角色卡填充）" :disabled="isGeneratingKeywords">
          </el-input>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            用于AI生成初始提示词，会自动填充角色卡的描述信息
          </div>
        </el-form-item>

        <!-- AI生成关键词按钮 -->
        <div class="keyword-actions">
          <el-button size="small" type="primary" icon="el-icon-magic-stick" :loading="isGeneratingKeywords"
            :disabled="!configForm.characterDescription.trim() || isGeneratingKeywords" @click="generateKeywords">
            {{ isGeneratingKeywords ? '生成中...' : 'AI生成关键词' }}
          </el-button>
          <el-button size="small" icon="el-icon-delete" :disabled="isGeneratingKeywords" @click="clearKeywords">
            清空
          </el-button>
        </div>

        <el-form-item label="初始提示词" prop="initialPrompt">
          <el-input type="textarea" v-model="configForm.initialPrompt"
            placeholder="请输入初始提示词（例如：发色: long silver hair, 面部: blue eyes, smile）" :rows="6" maxlength="2000"
            show-word-limit />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            用于AI首次生成图片时的初始人物状态描述
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="configSaving">
          保存配置
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { fetchEventSource } from '@microsoft/fetch-event-source'
import Cookies from 'js-cookie'
import aiChatMixin from '@/mixins/aiChatMixin';

export default {
  name: 'CharacterCard',
  mixins: [aiChatMixin],
  data() {
    return {
      aiMenuId: 'character',
      cardList: [],
      loading: false,
      uploadDialogVisible: false,
      detailDialogVisible: false,
      currentCard: null,
      uploadAction: '', // 不使用默认action

      // NSFW 模式相关
      showNsfw: false,
      keySequence: '', // 存储按键序列
      keySequenceTimeout: null, // 按键序列超时定时器

      // 配置弹窗相关
      configDialogVisible: false,
      configSaving: false,
      isGeneratingKeywords: false,
      configForm: {
        id: '',
        cardName: '',
        userName: '',
        characterName: '',
        characterDescription: '',
        initialPrompt: ''
      },
      configRules: {
        cardName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        userName: [
          { max: 100, message: '用户名称不能超过100个字符', trigger: 'blur' }
        ],
        initialPrompt: [
          { max: 2000, message: '初始提示词不能超过2000个字符', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    this.loadCardList()
    // 添加键盘监听
    window.addEventListener('keydown', this.handleKeyDown)
  },
  beforeDestroy() {
    // 移除键盘监听
    window.removeEventListener('keydown', this.handleKeyDown)
    // 清除定时器
    if (this.keySequenceTimeout) {
      clearTimeout(this.keySequenceTimeout)
    }
  },
  methods: {
    /**
     * 加载角色卡列表
     */
    loadCardList() {
      this.loading = true
      this.api({
        url: '/character-card/list',
        method: 'get',
        params: {
          showNsfw: this.showNsfw
        }
      }).then(data => {
        this.cardList = data || []
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 键盘按下事件处理
     */
    handleKeyDown(event) {
      // 如果正在输入框中输入，忽略按键
      const tagName = event.target.tagName.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea') {
        return
      }

      // 获取按键（转换为大写）
      const key = event.key.toUpperCase()

      // 只处理字母键
      if (key.length === 1 && /[A-Z]/.test(key)) {
        // 添加到按键序列
        this.keySequence += key

        // 清除之前的超时定时器
        if (this.keySequenceTimeout) {
          clearTimeout(this.keySequenceTimeout)
        }

        // 设置新的超时定时器（2秒后重置按键序列）
        this.keySequenceTimeout = setTimeout(() => {
          this.keySequence = ''
        }, 2000)

        // 检查是否匹配 "NSFW"
        if (this.keySequence.includes('NSFW')) {
          this.toggleNsfwMode()
          // 重置按键序列
          this.keySequence = ''
        }

        // 限制按键序列长度，避免内存占用过多
        if (this.keySequence.length > 10) {
          this.keySequence = this.keySequence.slice(-10)
        }
      }
    },

    /**
     * 切换 NSFW 模式
     */
    toggleNsfwMode() {
      this.showNsfw = !this.showNsfw

      // 显示提示消息
      const message = this.showNsfw
        ? '🔓 已开启全部内容显示模式'
        : '🔒 已切换为工作场景模式'

      this.$message({
        message: message,
        type: this.showNsfw ? 'warning' : 'success',
        duration: 2000,
        showClose: true
      })

      // 重新加载列表
      this.loadCardList()
    },

    /**
     * 文件上传前验证
     */
    beforeUpload(file) {
      const isJSON = file.name.toLowerCase().endsWith('.json')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isJSON) {
        this.$message.error('只能上传JSON格式的文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('文件大小不能超过5MB!')
        return false
      }
      return true
    },

    /**
     * 自定义上传文件
     */
    uploadFile(param) {
      const formData = new FormData()
      formData.append('file', param.file)

      this.api({
        url: '/character-card/upload',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(data => {
        this.$message.success('上传成功: ' + data.cardName)
        this.uploadDialogVisible = false
        this.loadCardList() // 刷新列表
      })
    },

    /**
     * 查看详情
     */
    viewDetail(card) {
      this.currentCard = card
      this.detailDialogVisible = true
    },

    /**
     * 删除角色卡
     */
    handleDelete(card) {
      this.$confirm('确定要删除角色卡 "' + card.cardName + '" 吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteCard(card.id)
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },

    /**
     * 执行删除
     */
    deleteCard(cardId) {
      this.api({
        url: '/character-card/remove',
        method: 'post',
        data: { cardId: cardId }
      }).then(() => {
        this.$message.success('删除成功')
        this.loadCardList() // 刷新列表
      })
    },

    /**
     * 统一处理菜单命令
     */
    handleMenuCommand(command) {
      const { action, card } = command
      switch (action) {
        case 'chat':
          this.handleChat(card)
          break
        case 'view':
          this.viewDetail(card)
          break
        case 'config':
          this.openConfigDialog(card)
          break
        case 'delete':
          this.handleDelete(card)
          break
      }
    },

    /**
     * 开始聊天 - 跳转到AI对话页面
     */
    handleChat(card) {
      // 跳转到统一的AI对话页面，通过cardId参数区分角色卡
      this.$router.push({
        path: '/ai/chat',
        query: {
          cardId: card.id,
          cardName: card.cardName
        }
      })
    },

    /**
     * 打开配置弹窗
     */
    openConfigDialog(card) {
      this.configForm = {
        id: card.id,
        cardName: card.cardName,
        userName: card.userName || '',
        characterName: card.characterName || card.cardName,
        characterDescription: card.cardDescription || '',
        initialPrompt: card.initialPrompt || ''
      }
      this.configDialogVisible = true
    },

    /**
     * 保存角色卡配置
     */
    async saveConfig() {
      try {
        // 表单验证
        await this.$refs.configFormRef.validate()

        this.configSaving = true

        // 调用API
        await this.api({
          url: '/character-card/update-config',
          method: 'post',
          data: this.configForm
        })

        this.$message.success('配置保存成功')

        // 关闭弹窗
        this.configDialogVisible = false

        // 刷新列表
        this.loadCardList()

      } catch (error) {
        // 验证失败或API错误，拦截器已处理
        console.error('保存配置失败:', error)
      } finally {
        this.configSaving = false
      }
    },

    /**
     * AI生成关键词
     */
    async generateKeywords() {
      if (!this.configForm.characterDescription.trim()) {
        this.$message.warning('请先输入人物描述')
        return
      }


      this.isGeneratingKeywords = true
      this.configForm.initialPrompt = ''

      var abortController = new AbortController();
      const body = {
        model: 'makeKey',
        message: this.configForm.characterDescription,
        context: []
      };

      try {
        await this.fetchStream(body, (decodedValue) => {
          this.configForm.initialPrompt += decodedValue;
        }, () => {
          this.isGeneratingKeywords = false
          if (this.configForm.initialPrompt) {
            this.$message.success('关键词生成完成')
          }
        }, abortController.signal);

      } catch (error) {
        this.isGeneratingKeywords = false
        console.error('生成关键词错误:', error)
      }
    },

    /**
     * 清空关键词
     */
    clearKeywords() {
      this.$confirm('确定要清空初始提示词吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.configForm.initialPrompt = ''
        this.$message.success('已清空')
      }).catch(() => {
        // 取消操作
      })
    }
  }
}
</script>

<style scoped lang="scss">
.character-card-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 50px);
}

/* 头部卡片 */
.header-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fe 100%);
  border: 1px solid rgba(102, 126, 234, 0.1);

  ::v-deep .el-card__body {
    padding: 24px 28px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-section {
      position: relative;
      padding-left: 12px;

      /* 装饰线条 */
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 60%;
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        border-radius: 2px;
      }

      .page-title {
        margin: 0 0 8px 0;
        font-size: 26px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        display: flex;
        align-items: center;
        letter-spacing: 0.5px;

        i {
          margin-right: 10px;
          font-size: 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: #909399;
        font-weight: 400;
      }
    }

    .action-section {
      display: flex;
      gap: 12px;

      .el-button {
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        &:active {
          transform: translateY(0);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;

          &:hover {
            background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
          }
        }
      }
    }
  }
}

/* 列表卡片 */
.list-card {
  border-radius: 12px;
  min-height: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: #ffffff;

  ::v-deep .el-card__body {
    padding: 24px;
  }

  .card-col {
    margin-bottom: 24px;
    transition: all 0.3s;
  }
}

/* 角色卡片 */
.character-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);

  /* 右上角悬浮菜单 */
  .card-menu {
    position: absolute;
    top: 12px;
    right: 12px;
    cursor: pointer;
    z-index: 10;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        transform: scale(1.1) rotate(90deg);
      }

      &:active {
        transform: scale(0.95) rotate(90deg);
      }

      i {
        font-size: 18px;
        color: #667eea;
        font-weight: 700;
      }
    }
  }

  /* 头像容器 */
  .avatar-wrapper {
    position: relative;
    width: 100%;
    padding-top: 125%;
    /* 4:5 比例，更紧凑 */
    overflow: hidden;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);

    .character-avatar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* 悬停遮罩层 */
    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      i {
        font-size: 48px;
        color: #fff;
        transform: scale(0.5);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    /* 角色信息（浮在图片上） */
    .card-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px 16px 16px;
      background: linear-gradient(to top,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.65) 60%,
          rgba(0, 0, 0, 0) 100%);
      z-index: 2;
      transition: all 0.3s;

      .card-name {
        margin: 0 0 6px 0;
        font-size: 17px;
        font-weight: 700;
        color: #fff;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: all 0.3s;
      }

      .card-description {
        margin: 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        white-space: pre-line;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        transition: all 0.3s;
      }
    }
  }

  /* 卡片悬浮效果 */
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15),
      0 8px 16px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(102, 126, 234, 0.2);

    .character-avatar {
      transform: scale(1.1);
      filter: brightness(1.05);
    }

    .avatar-overlay {
      opacity: 1;

      i {
        transform: scale(1);
      }
    }

    .card-info {
      background: linear-gradient(to top,
          rgba(0, 0, 0, 0.9) 0%,
          rgba(0, 0, 0, 0.7) 60%,
          rgba(0, 0, 0, 0) 100%);

      .card-name {
        color: #fff;
        text-shadow: 0 2px 6px rgba(102, 126, 234, 0.8);
      }

      .card-description {
        color: rgba(255, 255, 255, 0.95);
      }
    }
  }

  /* 点击动画 */
  &:active {
    transform: translateY(-4px) scale(0.98);
    transition: all 0.1s;
  }
}

/* 上传区域 */
.upload-demo {
  ::v-deep .el-upload {
    width: 100%;
  }

  ::v-deep .el-upload-dragger {
    width: 100%;
    height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  i {
    font-size: 67px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }

  .el-upload__text {
    color: #606266;
    font-size: 14px;

    em {
      color: #409eff;
      font-style: normal;
    }
  }
}

/* 详情弹窗 */
.detail-container {
  .description-content {
    white-space: pre-line;
    line-height: 1.6;
    color: #606266;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }

  .example-content {
    max-height: 300px;
    font-size: 13px;
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
  }
}

/* 表单提示样式 */
.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;

  i {
    margin-right: 4px;
  }
}

/* AI生成关键词按钮样式 */
.keyword-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-left: 120px;

  .el-button {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
    }

    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
      }
    }
  }
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start !important;

    .action-section {
      margin-top: 12px;
      width: 100%;

      button {
        flex: 1;
      }
    }
  }
}
</style>
