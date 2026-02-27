<template>
  <div class="crawler-config-container">
    <!-- 页面标题和操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">
            <i class="el-icon-s-promotion"></i>
            爬虫配置管理
          </h2>
          <p class="page-subtitle">配置和管理网站爬虫任务</p>
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

        <el-table-column label="配置名称" min-width="150">
          <template slot-scope="scope">
            <div class="config-name">
              <i class="el-icon-document"></i>
              {{ scope.row.configName }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="目标URL" min-width="250" show-overflow-tooltip>
          <template slot-scope="scope">
            <div class="url-info">
              <el-tag size="mini" :type="scope.row.requestMethod === 'GET' ? 'success' : 'primary'">
                {{ scope.row.requestMethod }}
              </el-tag>
              <span class="url-text">{{ scope.row.targetUrl }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enabled"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="handleStatusChange(scope.row)">
            </el-switch>
          </template>
        </el-table-column>

        <el-table-column label="描述" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="description-text">{{ scope.row.description || '无' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.createTime || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button
                type="success"
                icon="el-icon-video-play"
                size="mini"
                plain
                @click="executeCrawler(scope.row)"
                :loading="scope.row.executing">
                执行
              </el-button>
              <el-button
                type="primary"
                icon="el-icon-edit"
                size="mini"
                plain
                @click="showEdit(scope.row)">
                编辑
              </el-button>
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                plain
                @click="handleDelete(scope.row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 变量输入对话框 -->
      <el-dialog
        title="填写执行变量"
        :visible.sync="varDialog.visible"
        width="480px"
        :close-on-click-modal="false"
        class="modern-dialog var-dialog">
        <div class="var-dialog-tip">
          <i class="el-icon-info"></i>
          以下变量将替换 URL / 请求体中对应的 <code>{{占位符}}</code>
        </div>
        <el-form label-position="top" class="var-form">
          <el-form-item
            v-for="key in varDialog.keys"
            :key="key"
            :label="key">
            <el-input
              v-model="varDialog.values[key]"
              :placeholder="'请输入 ' + key + ' 的值'"
              clearable>
            </el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="varDialog.visible = false" size="medium">取消</el-button>
          <el-button
            type="success"
            icon="el-icon-video-play"
            size="medium"
            :loading="varDialog.row && varDialog.row.executing"
            @click="doExecuteWithVars">
            确认执行
          </el-button>
        </div>
      </el-dialog>

      <!-- 空状态 -->
      <div v-if="!listLoading && list.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>暂无配置数据</p>
        <el-button type="primary" size="small" @click="showCreate">立即创建</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      :title="textMap[dialogStatus]"
      :visible.sync="dialogFormVisible"
      width="800px"
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
              <el-form-item label="配置名称" prop="configName">
                <el-input
                  v-model="tempConfigForm.configName"
                  placeholder="请输入配置名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="请求方法" prop="requestMethod">
                <el-select v-model="tempConfigForm.requestMethod" style="width: 100%">
                  <el-option label="GET" value="GET"></el-option>
                  <el-option label="POST" value="POST"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="目标URL" prop="targetUrl">
            <el-input
              v-model="tempConfigForm.targetUrl"
              placeholder="请输入完整的URL地址，如: https://example.com/api/data">
            </el-input>
          </el-form-item>

          <el-form-item label="描述信息">
            <el-input
              type="textarea"
              v-model="tempConfigForm.description"
              :rows="2"
              placeholder="请输入描述信息"></el-input>
          </el-form-item>
        </div>

        <!-- 请求配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-setting"></i>
            请求配置
          </div>
          <el-form-item label="请求头 (JSON格式)">
            <el-input
              type="textarea"
              v-model="tempConfigForm.requestHeaders"
              :rows="4"
              placeholder='{"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}'></el-input>
          </el-form-item>

          <el-form-item label="请求体 (POST时使用)" v-if="tempConfigForm.requestMethod === 'POST'">
            <el-input
              type="textarea"
              v-model="tempConfigForm.requestBody"
              :rows="4"
              placeholder='{"key": "value"}'></el-input>
          </el-form-item>
        </div>

        <!-- 处理器配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-magic-stick"></i>
            处理器配置（可选）
          </div>
          <el-form-item label="前置处理器 (JSON格式)">
            <el-input
              type="textarea"
              v-model="tempConfigForm.preProcessor"
              :rows="3"
              placeholder='{"type": "urlBuilder", "params": {...}}'></el-input>
          </el-form-item>

          <el-form-item label="后置处理器 (JSON格式)">
            <el-input
              type="textarea"
              v-model="tempConfigForm.postProcessor"
              :rows="3"
              placeholder='{"type": "jsonExtract", "path": "data.items"}'></el-input>
          </el-form-item>
        </div>

        <!-- 其他配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-time"></i>
            其他配置
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Cron表达式 (定时任务, 可选)">
                <el-input
                  v-model="tempConfigForm.cronExpression"
                  placeholder="如: 0 0 12 * * ? (每天12点执行)"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否启用">
                <el-switch
                  v-model="tempConfigForm.enabled"
                  active-text="启用"
                  inactive-text="禁用">
                </el-switch>
              </el-form-item>
            </el-col>
          </el-row>
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
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      dialogStatus: '',
      submitLoading: false,
      pageNum: 1,
      pageSize: 10,
      total: 0,
      textMap: {
        update: '编辑爬虫配置',
        create: '新增爬虫配置'
      },
      // 变量输入对话框
      varDialog: {
        visible: false,
        keys: [],
        values: {},
        row: null
      },
      tempConfigForm: {
        configName: '',
        targetUrl: '',
        requestMethod: 'GET',
        requestHeaders: '',
        requestBody: '',
        preProcessor: '',
        postProcessor: '',
        cronExpression: '',
        enabled: true,
        description: ''
      },
      formRules: {
        configName: [
          { required: true, message: '请输入配置名称', trigger: 'blur' }
        ],
        targetUrl: [
          { required: true, message: '请输入目标URL', trigger: 'blur' },
          { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
        ],
        requestMethod: [
          { required: true, message: '请选择请求方法', trigger: 'change' }
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
        url: "/crawler/config/list",
        method: "get",
        params: {
          pageNum: this.pageNum,
          pageRow: this.pageSize
        }
      }).then(data => {
        this.list = data.list || [];
        this.total = data.total || 0;
      }).catch(err => {
        this.$message.error(err.message || '获取列表失败');
      }).finally(() => {
        this.listLoading = false;
      });
    },

    showCreate() {
      this.tempConfigForm = {
        configName: '',
        targetUrl: '',
        requestMethod: 'GET',
        requestHeaders: '',
        requestBody: '',
        preProcessor: '',
        postProcessor: '',
        cronExpression: '',
        enabled: true,
        description: ''
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

    createConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          this.api({
            url: "/crawler/config/add",
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
            this.$message.error(err.message || '创建失败');
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
            url: "/crawler/config/update",
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
    },

    handleDelete(row) {
      this.$confirm('确定要删除这个爬虫配置吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.api({
          url: "/crawler/config/delete",
          method: "post",
          data: { pkId: row.pkId }
        }).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功'
          });
          this.getList();
        }).catch(err => {
          this.$message.error(err.message || '删除失败');
        });
      }).catch(() => {});
    },

    // 提取字符串中所有 {{xxx}} 占位符，返回去重后的变量名数组
    extractPlaceholders(str) {
      if (!str) return [];
      const regex = /\{\{(\w+)\}\}/g;
      const keys = new Set();
      let m;
      while ((m = regex.exec(str)) !== null) {
        keys.add(m[1]);
      }
      return Array.from(keys);
    },

    executeCrawler(row) {
      // 扫描 URL 和 requestBody 中的占位符
      const keys = [
        ...this.extractPlaceholders(row.targetUrl),
        ...this.extractPlaceholders(row.requestBody)
      ];
      const uniqueKeys = [...new Set(keys)];

      if (uniqueKeys.length === 0) {
        // 无占位符，直接执行
        this.doExecute(row, {});
      } else {
        // 有占位符，弹出变量填写弹窗
        const initValues = {};
        uniqueKeys.forEach(k => { initValues[k] = ''; });
        this.varDialog = {
          visible: true,
          keys: uniqueKeys,
          values: initValues,
          row
        };
      }
    },

    doExecuteWithVars() {
      this.doExecute(this.varDialog.row, this.varDialog.values);
      this.varDialog.visible = false;
    },

    doExecute(row, variables) {
      this.$set(row, 'executing', true);
      this.api({
        url: "/crawler/execute",
        method: "post",
        data: { configId: row.pkId, variables }
      }).then(() => {
        this.$message({
          type: 'success',
          message: '执行成功！',
          duration: 3000
        });
        this.$router.push('/crawler/record');
      }).catch(err => {
        this.$message.error(err.message || '执行失败');
      }).finally(() => {
        this.$set(row, 'executing', false);
      });
    },

    handleStatusChange(row) {
      this.api({
        url: "/crawler/config/update",
        method: "post",
        data: row
      }).then(() => {
        this.$message.success('状态更新成功');
      }).catch(err => {
        this.$message.error('状态更新失败');
        row.enabled = !row.enabled; // 恢复原状态
      });
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.pageNum = 1;
      this.getList();
    },

    handleCurrentChange(val) {
      this.pageNum = val;
      this.getList();
    }
  }
}
</script>

<style scoped>
.crawler-config-container {
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

.config-name {
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.url-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-info .el-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  line-height: 1;
  padding: 0 5px;
}

.url-text {
  color: #606266;
  font-size: 13px;
}

.description-text {
  color: #606266;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-buttons .el-button {
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 80px;
  color: #c0c4cc;
  margin-bottom: 20px;
  display: block;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 表单样式 */
.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-footer {
  text-align: right;
}

/* 变量输入弹窗 */
.var-dialog-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 20px;
}

.var-dialog-tip code {
  background: #d9ecff;
  color: #337ecc;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.var-form .el-form-item {
  margin-bottom: 16px;
}

.var-form .el-form-item__label {
  font-weight: 600;
  color: #303133;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .action-section {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
