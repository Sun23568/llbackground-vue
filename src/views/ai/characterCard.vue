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
            <div class="json-content">
              <pre>{{ formatJSON(currentCard.cardContent) }}</pre>
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
  margin-bottom: 20px;
  border-radius: 8px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-section {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;

        i {
          margin-right: 8px;
          color: #409eff;
        }
      }

      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }

    .action-section {
      display: flex;
      gap: 10px;
    }
  }
}

/* 列表卡片 */
.list-card {
  border-radius: 8px;
  min-height: 400px;

  .card-col {
    margin-bottom: 20px;
  }
}

/* 角色卡片 */
.character-card {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .card-content {
    min-height: 100px;

    .card-description {
      margin-bottom: 12px;
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-time {
      font-size: 12px;
      color: #909399;

      i {
        margin-right: 4px;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
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
  .json-content {
    max-height: 400px;
    overflow-y: auto;
    background: #f5f7fa;
    border-radius: 4px;
    padding: 12px;

    pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #303133;
      white-space: pre-wrap;
      word-wrap: break-word;
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
