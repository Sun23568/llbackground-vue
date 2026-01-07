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
          <el-button
            type="primary"
            icon="el-icon-upload"
            size="medium"
            @click="uploadDialogVisible = true">
            上传角色卡
          </el-button>
          <el-button
            icon="el-icon-refresh"
            size="medium"
            @click="loadCardList">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 角色卡列表 -->
    <el-card class="list-card" shadow="never" v-loading="loading">
      <!-- 空状态 -->
      <el-empty
        v-if="!loading && cardList.length === 0"
        description="暂无角色卡，请上传新的角色卡"
        :image-size="120">
      </el-empty>

      <!-- 卡片网格 -->
      <el-row :gutter="20" v-else>
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          v-for="card in cardList"
          :key="card.id"
          class="card-col">
          <el-card class="character-card" shadow="hover">
            <!-- 卡片头部 -->
            <div slot="header" class="card-header">
              <span class="card-title">{{ card.cardName }}</span>
              <el-tag size="mini" type="success">有效</el-tag>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="card-description">
                {{ card.cardDescription || '暂无描述' }}
              </div>
              <div class="card-time">
                <i class="el-icon-time"></i>
                {{ card.createTime }}
              </div>
            </div>

            <!-- 卡片操作 -->
            <div class="card-actions">
              <el-button
                type="primary"
                icon="el-icon-view"
                size="small"
                plain
                @click="viewDetail(card)">
                查看详情
              </el-button>
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="small"
                plain
                @click="handleDelete(card)">
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 上传弹窗 -->
    <el-dialog
      title="上传角色卡"
      :visible.sync="uploadDialogVisible"
      width="500px"
      :close-on-click-modal="false">
      <el-upload
        class="upload-demo"
        drag
        :action="uploadAction"
        :http-request="uploadFile"
        :before-upload="beforeUpload"
        :show-file-list="false"
        accept=".json">
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
    <el-dialog
      title="角色卡详情"
      :visible.sync="detailDialogVisible"
      width="700px"
      top="5vh">
      <div v-if="currentCard" class="detail-container">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="角色名称">
            <el-tag type="primary">{{ currentCard.cardName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="角色描述">
            {{ currentCard.cardDescription || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            <i class="el-icon-time"></i>
            {{ currentCard.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="完整内容">
            <div class="json-viewer-wrapper">
              <div class="json-header">
                <span class="json-title">
                  <i class="el-icon-document"></i>
                  JSON内容
                </span>
                <el-button
                  type="primary"
                  size="mini"
                  icon="el-icon-document-copy"
                  @click="copyJSON">
                  复制
                </el-button>
              </div>
              <div class="json-content" v-html="highlightJSON(currentCard.cardContent)"></div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CharacterCard',
  data() {
    return {
      cardList: [],
      loading: false,
      uploadDialogVisible: false,
      detailDialogVisible: false,
      currentCard: null,
      uploadAction: '' // 不使用默认action
    }
  },
  mounted() {
    this.loadCardList()
  },
  methods: {
    /**
     * 加载角色卡列表
     */
    loadCardList() {
      this.loading = true
      this.api({
        url: '/character-card/list',
        method: 'get'
      }).then(data => {
        this.cardList = data || []
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
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
     * 格式化JSON显示
     */
    formatJSON(jsonStr) {
      if (!jsonStr) return ''
      try {
        const obj = JSON.parse(jsonStr)
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return jsonStr
      }
    },

    /**
     * JSON语法高亮
     */
    highlightJSON(jsonStr) {
      if (!jsonStr) return ''
      try {
        const obj = JSON.parse(jsonStr)
        const formatted = JSON.stringify(obj, null, 2)

        // 语法高亮处理
        let highlighted = formatted
          // 处理字符串键（带引号的键）
          .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)/g, '<span class="json-key">$1</span>$3')
          // 处理字符串值
          .replace(/:\s*("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="json-string">$1</span>')
          // 处理数字
          .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
          // 处理布尔值
          .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
          // 处理null
          .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')

        // 添加行号
        const lines = highlighted.split('\n')
        const numberedLines = lines.map((line, index) => {
          return `<div class="json-line"><span class="line-number">${index + 1}</span><span class="line-content">${line}</span></div>`
        }).join('')

        return numberedLines
      } catch (e) {
        return `<pre>${jsonStr}</pre>`
      }
    },

    /**
     * 复制JSON内容
     */
    copyJSON() {
      if (!this.currentCard || !this.currentCard.cardContent) {
        this.$message.warning('没有可复制的内容')
        return
      }

      try {
        const formatted = this.formatJSON(this.currentCard.cardContent)
        const textarea = document.createElement('textarea')
        textarea.value = formatted
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message.success('复制成功！')
      } catch (e) {
        this.$message.error('复制失败')
      }
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
  height: 100%;
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08),
              0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;

  /* 卡片悬浮效果 */
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12),
                0 6px 12px rgba(0, 0, 0, 0.08),
                0 0 0 1px rgba(102, 126, 234, 0.1);
  }

  /* 头部渐变背景 */
  ::v-deep .el-card__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    padding: 16px 20px;
    position: relative;

    /* 添加装饰光效 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.5) 50%,
        transparent 100%);
      opacity: 0;
      transition: opacity 0.4s;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      letter-spacing: 0.5px;
    }

    .el-tag {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .card-content {
    min-height: 120px;
    padding: 20px;

    .card-description {
      margin-bottom: 16px;
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.3s;
    }

    .card-time {
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      transition: color 0.3s;

      i {
        margin-right: 6px;
        font-size: 14px;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);

    .el-button {
      flex: 1;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  /* 整体悬浮时内容微调 */
  &:hover {
    .card-description {
      color: #303133;
    }

    .card-time {
      color: #606266;
    }
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
  .json-viewer-wrapper {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .json-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);

      .json-title {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        display: flex;
        align-items: center;

        i {
          margin-right: 6px;
          font-size: 16px;
        }
      }

      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        transition: all 0.3s;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .json-content {
      max-height: 450px;
      overflow-y: auto;
      background: #1e1e1e;
      padding: 16px 0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;

      /* 滚动条样式 */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #2d2d2d;
      }

      &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;

        &:hover {
          background: #666;
        }
      }

      .json-line {
        display: flex;
        padding: 0 16px;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .line-number {
          display: inline-block;
          width: 40px;
          text-align: right;
          margin-right: 16px;
          color: #858585;
          user-select: none;
          flex-shrink: 0;
        }

        .line-content {
          flex: 1;
          color: #d4d4d4;
          white-space: pre;
        }
      }

      /* JSON语法高亮颜色 */
      ::v-deep .json-key {
        color: #9cdcfe;
        font-weight: 500;
      }

      ::v-deep .json-string {
        color: #ce9178;
      }

      ::v-deep .json-number {
        color: #b5cea8;
      }

      ::v-deep .json-boolean {
        color: #569cd6;
        font-weight: 600;
      }

      ::v-deep .json-null {
        color: #808080;
        font-style: italic;
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
