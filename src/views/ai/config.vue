<template>
  <div class="ai-config-container">
    <!-- 页面标题和操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">
            <i class="el-icon-setting"></i>
            AI 配置管理
          </h2>
          <p class="page-subtitle">管理 AI 菜单的模型配置和参数设置</p>
        </div>
        <div class="action-section">
          <el-button
            type="primary"
            icon="el-icon-plus"
            size="medium"
            @click="showCreate">
            新增配置
          </el-button>
          <el-button
            icon="el-icon-refresh"
            size="medium"
            @click="getList">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 配置列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="list"
        v-loading="listLoading"
        stripe
        style="width: 100%"
        :header-cell-style="{background: '#f5f7fa', color: '#606266'}"
        class="modern-table">
        <el-table-column type="index" label="序号" width="70" align="center"></el-table-column>

        <el-table-column label="菜单信息" min-width="180">
          <template slot-scope="scope">
            <div class="menu-info">
              <div class="menu-name">
                <i class="el-icon-menu"></i>
                {{ scope.row.menuName }}
              </div>
              <div class="menu-code">{{ scope.row.menuCode }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="模型配置" min-width="200">
          <template slot-scope="scope">
            <div class="config-info">
              <el-tag v-if="scope.row.ollamaModelId" size="small" type="info">
                <i class="el-icon-cpu"></i> {{ scope.row.ollamaModelId }}
              </el-tag>
              <span v-else class="empty-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务地址" min-width="250" show-overflow-tooltip>
          <template slot-scope="scope">
            <div class="service-info">
              <div v-if="scope.row.ollamaUrl" class="service-item">
                <el-tag size="mini" effect="plain">Ollama</el-tag>
                <span class="url-text">{{ scope.row.ollamaUrl }}</span>
              </div>
              <div v-if="scope.row.comfyUiUrl" class="service-item">
                <el-tag size="mini" type="success" effect="plain">ComfyUI</el-tag>
                <span class="url-text">{{ scope.row.comfyUiUrl }}</span>
              </div>
              <span v-if="!scope.row.ollamaUrl && !scope.row.comfyUiUrl" class="empty-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="上下文" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small" type="warning">{{ scope.row.contextSize }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button
                type="primary"
                icon="el-icon-edit"
                size="mini"
                plain
                @click="showEdit(scope.row)">
                编辑
              </el-button>
              <el-button
                type="info"
                icon="el-icon-view"
                size="mini"
                plain
                @click="showDetail(scope.row)">
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!listLoading && list.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>暂无配置数据</p>
        <el-button type="primary" size="small" @click="showCreate">立即创建</el-button>
      </div>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      :title="textMap[dialogStatus]"
      :visible.sync="dialogFormVisible"
      width="650px"
      :close-on-click-modal="false"
      class="modern-dialog">
      <el-form
        :model="tempConfigForm"
        :rules="formRules"
        ref="configForm"
        label-position="top"
        class="config-form">

        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-tickets"></i>
            基础信息
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="菜单名称" prop="menuName">
                <el-input
                  v-model="tempConfigForm.menuName"
                  :disabled="dialogStatus==='update'"
                  placeholder="请输入菜单名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单代码" prop="menuCode">
                <el-input
                  v-model="tempConfigForm.menuCode"
                  :disabled="dialogStatus==='update'"
                  placeholder="请输入菜单代码"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 模型配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-cpu"></i>
            模型配置
          </div>
          <el-form-item label="Ollama 模型 ID">
            <el-input
              v-model="tempConfigForm.ollamaModelId"
              placeholder="如: llama2, mistral 等"></el-input>
          </el-form-item>
          <el-form-item label="上下文大小">
            <el-input-number
              v-model="tempConfigForm.contextSize"
              :min="1"
              :max="32768"
              :step="512"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </div>

        <!-- 服务地址 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-link"></i>
            服务地址
          </div>
          <el-form-item label="Ollama 服务地址">
            <el-input
              v-model="tempConfigForm.ollamaUrl"
              placeholder="如: http://localhost:11434"></el-input>
          </el-form-item>
          <el-form-item label="ComfyUI 服务地址">
            <el-input
              v-model="tempConfigForm.comfyUiUrl"
              placeholder="如: http://localhost:8188"></el-input>
          </el-form-item>
        </div>

        <!-- 其他配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-more"></i>
            其他配置
          </div>
          <el-form-item label="ComfyUI 参数文件 ID">
            <el-input
              v-model="tempConfigForm.comfyFileId"
              placeholder="请输入参数文件ID"></el-input>
          </el-form-item>
          <el-form-item label="背景图片">
            <el-input
              v-model="tempConfigForm.backgroundImage"
              placeholder="请输入背景图片URL或路径"></el-input>
          </el-form-item>
        </div>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false" size="medium">取消</el-button>
        <el-button
          v-if="dialogStatus==='create'"
          type="primary"
          @click="createConfig"
          size="medium"
          :loading="submitLoading">
          创建
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="updateConfig"
          size="medium"
          :loading="submitLoading">
          保存
        </el-button>
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="配置详情"
      :visible.sync="detailVisible"
      width="600px"
      class="detail-dialog">
      <div class="detail-content" v-if="currentDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="菜单名称">{{ currentDetail.menuName }}</el-descriptions-item>
          <el-descriptions-item label="菜单代码">{{ currentDetail.menuCode }}</el-descriptions-item>
          <el-descriptions-item label="Ollama模型ID">
            {{ currentDetail.ollamaModelId || '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="上下文大小">{{ currentDetail.contextSize }}</el-descriptions-item>
          <el-descriptions-item label="Ollama地址">
            {{ currentDetail.ollamaUrl || '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="ComfyUI地址">
            {{ currentDetail.comfyUiUrl || '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="ComfyUI文件ID">
            {{ currentDetail.comfyFileId || '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="背景图片">
            {{ currentDetail.backgroundImage || '未配置' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      detailVisible: false,
      dialogStatus: '',
      submitLoading: false,
      currentDetail: null,
      textMap: {
        update: '编辑配置',
        create: '新增配置'
      },
      tempConfigForm: {
        menuName: '',
        menuCode: '',
        ollamaModelId: '',
        comfyUiUrl: '',
        ollamaUrl: '',
        comfyFileId: '',
        backgroundImage: '',
        contextSize: 1024
      },
      formRules: {
        menuName: [
          { required: true, message: '请输入菜单名称', trigger: 'blur' }
        ],
        menuCode: [
          { required: true, message: '请输入菜单代码', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.listLoading = true;
      this.api({
        url: "/ai/config/list",
        method: "post"
      }).then(data => {
        this.list = data.userAccessRespList || [];
      }).catch(err => {
        this.$message.error(err.message || '获取列表失败');
      }).finally(() => {
        this.listLoading = false;
      });
    },

    showCreate() {
      this.tempConfigForm = {
        menuName: '',
        menuCode: '',
        ollamaModelId: '',
        comfyUiUrl: '',
        ollamaUrl: '',
        comfyFileId: '',
        backgroundImage: '',
        contextSize: 1024
      };
      this.dialogStatus = 'create';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        if (this.$refs.configForm) {
          this.$refs.configForm.clearValidate();
        }
      });
    },

    showEdit(row) {
      this.tempConfigForm = { ...row };
      this.dialogStatus = 'update';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        if (this.$refs.configForm) {
          this.$refs.configForm.clearValidate();
        }
      });
    },

    showDetail(row) {
      this.currentDetail = { ...row };
      this.detailVisible = true;
    },

    createConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          this.api({
            url: "/ai/config/add",
            method: "post",
            data: this.tempConfigForm
          }).then(() => {
            this.dialogFormVisible = false;
            this.$message({
              type: 'success',
              message: '创建成功'
            });
            this.getList();
          }).catch(err => {
          }).finally(() => {
            this.submitLoading = false;
          });
        }
      });
    },

    updateConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          this.api({
            url: "/ai/config/update",
            method: "post",
            data: this.tempConfigForm
          }).then(() => {
            this.dialogFormVisible = false;
            this.$message({
              type: 'success',
              message: '修改成功'
            });
            this.getList();
          }).catch(err => {
            this.$message.error(err.message || '修改失败');
          }).finally(() => {
            this.submitLoading = false;
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.ai-config-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

/* 头部卡片 */
.header-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section .page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section .page-subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.action-section {
  display: flex;
  gap: 10px;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
}

.modern-table {
  font-size: 14px;
}

.modern-table >>> .el-table__header th {
  font-weight: 600;
}

/* 菜单信息 */
.menu-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-name {
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

/* 配置信息 */
.config-info {
  display: flex;
  align-items: center;
}

.empty-text {
  color: #c0c4cc;
  font-size: 13px;
}

/* 服务信息 */
.service-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-text {
  font-size: 12px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #909399;
}

.empty-state i {
  font-size: 80px;
  color: #dcdfe6;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

/* 对话框样式 */
.modern-dialog >>> .el-dialog__header {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.modern-dialog >>> .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
}

.modern-dialog >>> .el-dialog__body {
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
}

/* 表单样式 */
.config-form {
  margin-top: 20px;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: #409eff;
}

.config-form >>> .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.config-form >>> .el-input__inner,
.config-form >>> .el-textarea__inner {
  border-radius: 4px;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 详情对话框 */
.detail-dialog >>> .el-descriptions__label {
  font-weight: 500;
  color: #606266;
  width: 150px;
}

.detail-dialog >>> .el-descriptions__content {
  color: #303133;
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-config-container {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-section {
    width: 100%;
  }

  .action-section button {
    flex: 1;
  }
}
</style>