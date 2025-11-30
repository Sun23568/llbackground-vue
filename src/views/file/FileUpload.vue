<template>
  <div class="file-upload-container">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-folder-opened"></i>
        文件上传管理
      </h2>
      <p class="page-description">支持拖拽上传、自定义文件ID、文件替换等功能</p>
    </div>

    <el-card class="upload-card" shadow="never">
      <div class="card-title">
        <i class="el-icon-setting"></i>
        <span>上传配置</span>
      </div>

      <!-- 上传配置区域 -->
      <el-form :model="uploadForm" label-width="120px" class="upload-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="自定义文件ID">
              <el-input
                v-model="uploadForm.customFileId"
                placeholder="留空将自动生成UUID"
                clearable
                maxlength="50"
                prefix-icon="el-icon-key"
              />
              <div class="form-tip">
                <i class="el-icon-info"></i>
                自定义文件ID用于后续访问，建议使用有意义的标识符
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件已存在时">
              <el-radio-group v-model="uploadForm.replace" size="medium">
                <el-radio-button :label="false">提示错误</el-radio-button>
                <el-radio-button :label="true">替换文件</el-radio-button>
              </el-radio-group>
              <div class="form-tip warning">
                <i class="el-icon-warning"></i>
                替换文件将删除FTP上的旧文件并更新数据库记录
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 文件上传区域 -->
      <el-upload
        ref="upload"
        class="upload-area"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :limit="1"
        :on-exceed="handleExceed"
      >
        <div class="upload-dragger-content">
          <i class="el-icon-upload upload-icon"></i>
          <div class="upload-text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="upload-tip">
            支持所有文件类型，单个文件不超过 50MB
          </div>
        </div>
      </el-upload>

      <!-- 上传按钮 -->
      <div class="upload-actions">
        <el-button
          type="primary"
          size="large"
          icon="el-icon-upload"
          :loading="uploading"
          :disabled="fileList.length === 0"
          @click="submitUpload"
          v-permission="'file:upload'"
          class="upload-btn"
        >
          {{ uploading ? '正在上传...' : '开始上传' }}
        </el-button>
        <el-button
          size="large"
          icon="el-icon-delete"
          @click="clearFiles"
          :disabled="uploading"
          plain
        >
          清空文件
        </el-button>
      </div>

    </el-card>

    <!-- 上传记录 -->
    <el-card v-if="uploadResults.length > 0" class="result-card" shadow="never">
      <div class="card-title">
        <i class="el-icon-tickets"></i>
        <span>上传记录</span>
        <el-badge :value="uploadResults.length" class="badge" />
      </div>

      <div class="result-list">
        <div
          v-for="(result, index) in uploadResults"
          :key="index"
          :class="['result-item', result.success ? 'success' : 'error']"
        >
          <div class="result-icon">
            <i :class="result.success ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
          </div>
          <div class="result-content">
            <div class="result-header">
              <span class="result-filename">{{ result.fileName }}</span>
              <el-tag
                v-if="result.success && result.replaced"
                size="small"
                type="warning"
                effect="plain"
              >
                已替换
              </el-tag>
            </div>
            <div class="result-info">
              <span class="result-time">
                <i class="el-icon-time"></i>
                {{ result.uploadTime }}
              </span>
              <span v-if="result.success" class="result-id">
                <i class="el-icon-document"></i>
                文件ID: {{ result.fileId }}
                <el-button
                  type="text"
                  size="mini"
                  @click="copyFileId(result.fileId)"
                  icon="el-icon-copy-document"
                  class="copy-btn"
                >
                  复制
                </el-button>
              </span>
              <span v-if="!result.success" class="result-error">
                <i class="el-icon-warning"></i>
                {{ result.error }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'FileUpload',
  data() {
    return {
      uploadForm: {
        customFileId: '',
        replace: false
      },
      fileList: [],
      uploading: false,
      uploadResults: []
    }
  },
  methods: {
    handleFileChange(file, fileList) {
      this.fileList = fileList
    },
    handleExceed() {
      this.$message.warning('当前限制选择 1 个文件，请先删除已选文件后再选择')
    },
    async submitUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先选择文件')
        return
      }

      const file = this.fileList[0]

      // 文件大小验证
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        this.$message.error('上传文件大小不能超过 50MB!')
        return
      }

      this.uploading = true

      // 构建FormData
      const formData = new FormData()
      formData.append('file', file.raw)
      if (this.uploadForm.customFileId) {
        formData.append('customFileId', this.uploadForm.customFileId)
      }
      formData.append('replace', this.uploadForm.replace)

      // 使用this.api方法上传，错误会被拦截器自动处理
      await this.api({
        url: '/file/upload',
        method: 'post',
        data: formData
      })
        .then(response => {
          this.uploading = false

          // 添加成功结果
          this.uploadResults.unshift({
            success: true,
            fileName: response.fileName,
            fileId: response.fileId,
            replaced: response.replaced,
            uploadTime: response.uploadTime
          })

          this.$message.success({
            message: response.replaced ? '文件替换成功！' : '文件上传成功！',
            duration: 3000
          })

          // 清空文件列表
          this.clearFiles()
        })
        .catch(() => {
          this.uploading = false

          // 添加失败结果（错误消息已在拦截器中显示）
          this.uploadResults.unshift({
            success: false,
            fileName: file.name,
            error: '上传失败，请查看错误提示',
            uploadTime: new Date().toLocaleString('zh-CN')
          })
        })
    },
    clearFiles() {
      this.fileList = []
      this.$refs.upload.clearFiles()
    },
    copyFileId(fileId) {
      // 创建临时输入框
      const input = document.createElement('input')
      input.value = fileId
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success('文件ID已复制到剪贴板')
      } catch (err) {
        this.$message.error('复制失败，请手动复制')
      }

      document.body.removeChild(input)
    }
  }
}
</script>

<style scoped lang="scss">
.file-upload-container {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;

    i {
      margin-right: 12px;
      font-size: 28px;
      color: #409EFF;
    }
  }

  .page-description {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.upload-card,
.result-card {
  max-width: 1000px;
  margin: 0 auto 20px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;

  ::v-deep .el-card__body {
    padding: 24px;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
  display: flex;
  align-items: center;

  i {
    margin-right: 8px;
    font-size: 18px;
    color: #409EFF;
  }

  .badge {
    margin-left: auto;
  }
}

.upload-form {
  margin-bottom: 24px;

  .form-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
    display: flex;
    align-items: flex-start;

    i {
      margin-right: 6px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    &.warning {
      color: #E6A23C;

      i {
        color: #E6A23C;
      }
    }
  }
}

.upload-area {
  margin-bottom: 24px;

  ::v-deep .el-upload {
    width: 100%;
  }

  ::v-deep .el-upload-dragger {
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #dcdfe6;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: #409EFF;
      background: linear-gradient(180deg, #f0f7ff 0%, #e6f2ff 100%);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
    }
  }

  .upload-dragger-content {
    text-align: center;
    padding: 20px;

    .upload-icon {
      font-size: 72px;
      color: #c0c4cc;
      margin-bottom: 20px;
      transition: all 0.3s;
    }

    .upload-text {
      color: #606266;
      font-size: 16px;
      margin-bottom: 12px;
      font-weight: 500;

      em {
        color: #409EFF;
        font-style: normal;
        cursor: pointer;
        font-weight: 600;
        text-decoration: underline;
      }
    }

    .upload-tip {
      color: #909399;
      font-size: 13px;
      line-height: 1.6;
    }
  }

  ::v-deep .el-upload-dragger:hover .upload-icon {
    color: #409EFF;
    transform: translateY(-4px);
  }
}

.upload-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;

  .upload-btn {
    min-width: 160px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);

    &:hover {
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
  }

  .el-button {
    min-width: 140px;
    font-weight: 500;
  }
}

.result-list {
  .result-item {
    display: flex;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }

    &.success {
      border-left: 4px solid #67C23A;

      .result-icon i {
        color: #67C23A;
      }
    }

    &.error {
      border-left: 4px solid #F56C6C;

      .result-icon i {
        color: #F56C6C;
      }
    }

    .result-icon {
      margin-right: 16px;
      font-size: 32px;
      line-height: 1;

      i {
        display: block;
      }
    }

    .result-content {
      flex: 1;
      min-width: 0;

      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .result-filename {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .result-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 13px;
        color: #909399;

        span {
          display: flex;
          align-items: center;

          i {
            margin-right: 4px;
          }
        }

        .result-id {
          color: #606266;
          flex: 1;
          min-width: 0;

          .copy-btn {
            padding: 0 4px;
            margin-left: 4px;
          }
        }

        .result-error {
          color: #F56C6C;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
