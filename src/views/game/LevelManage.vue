<template>
  <div class="game-level-page">
    <div class="toolbar">
      <div class="toolbar-title">
        <h2>游戏关卡管理</h2>
        <span>维护沙画消除 App 联网关卡</span>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" icon="el-icon-plus" v-permission="'game:level:save'" @click="openCreate">
          新增关卡
        </el-button>
        <el-button icon="el-icon-refresh" @click="getList">刷新</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="listLoading" class="level-table" border highlight-current-row>
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">{{ getIndex(scope.$index) }}</template>
      </el-table-column>
      <el-table-column align="center" label="关卡编号" prop="levelNo" width="120"></el-table-column>
      <el-table-column align="left" label="关卡名称" prop="levelName" min-width="180"></el-table-column>
      <el-table-column align="center" label="发布状态" width="120">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'">
            {{ scope.row.enabled ? '已发布' : '未发布' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="排序" prop="sortNo" width="100"></el-table-column>
      <el-table-column align="left" label="更新时间" prop="updateTime" width="180"></el-table-column>
      <el-table-column align="center" label="操作" width="300" fixed="right">
        <template slot-scope="scope">
          <div class="table-actions">
            <el-button size="mini" icon="el-icon-view" @click="openDetail(scope.row)" v-permission="'game:level:detail'">
              详情
            </el-button>
            <el-button size="mini" type="primary" icon="el-icon-edit" @click="openEdit(scope.row)" v-permission="'game:level:save'">
              编辑
            </el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete" @click="removeLevel(scope.row)" v-permission="'game:level:remove'">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="listQuery.pageNum"
      :page-size="listQuery.pageRow"
      :total="totalCount"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>

    <el-dialog
      class="level-edit-dialog"
      :visible.sync="dialogVisible"
      width="900px"
      top="5vh"
      :close-on-click-modal="false">
      <div slot="title" class="level-dialog-title">
        <div>
          <span class="level-dialog-heading">{{ dialogTitle }}</span>
          <span class="level-dialog-subtitle">维护联网关卡配置</span>
        </div>
        <el-tag size="mini" :type="dialogStatus === 'create' ? 'success' : 'warning'">
          {{ dialogStatus === 'create' ? '新增' : '编辑' }}
        </el-tag>
      </div>

      <el-form :model="form" ref="formRef" label-position="top" class="level-form">
        <div class="form-section basic-section">
          <div class="section-title">基础信息</div>
          <el-row :gutter="14">
            <el-col :xs="24" :sm="8">
              <el-form-item label="关卡编号" required>
                <el-input-number v-model="form.levelNo" :min="1" :step="1" controls-position="right"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="10">
              <el-form-item label="关卡名称" required>
                <el-input v-model="form.levelName" maxlength="100" show-word-limit></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="6">
              <el-form-item label="发布状态">
                <div class="switch-box">
                  <el-switch v-model="form.enabled" active-text="发布" inactive-text="下架"></el-switch>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="14">
            <el-col :xs="24" :sm="8">
              <el-form-item label="排序">
                <el-input-number v-model="form.sortNo" :min="0" :step="1" controls-position="right"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section json-section">
          <div class="section-bar">
            <div>
              <div class="section-title">关卡 JSON</div>
              <div class="section-note">必须包含 rows 或 grainRows</div>
            </div>
            <div class="json-tools">
              <el-upload action="" accept=".json,application/json" :show-file-list="false" :http-request="readJsonFile">
                <el-button size="small" icon="el-icon-upload2">导入 JSON</el-button>
              </el-upload>
              <el-button size="small" icon="el-icon-document" @click="formatJson">格式化</el-button>
            </div>
          </div>
          <el-form-item required class="json-form-item">
            <el-input
              type="textarea"
              v-model="form.levelData"
              :rows="18"
              placeholder="粘贴关卡 JSON，必须包含 rows 或 grainRows"
              spellcheck="false"
              class="json-input">
            </el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer level-dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-check" :loading="saving" @click="saveLevel">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="关卡详情" :visible.sync="detailVisible" width="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="关卡编号">{{ detail.levelNo }}</el-descriptions-item>
        <el-descriptions-item label="关卡名称">{{ detail.levelName }}</el-descriptions-item>
        <el-descriptions-item label="发布状态">{{ detail.enabled ? '已发布' : '未发布' }}</el-descriptions-item>
        <el-descriptions-item label="排序">{{ detail.sortNo }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <pre v-if="detail" class="json-preview">{{ prettyJson(detail.levelData) }}</pre>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LevelManage',
  data() {
    return {
      list: [],
      totalCount: 0,
      listLoading: false,
      saving: false,
      dialogVisible: false,
      detailVisible: false,
      dialogStatus: 'create',
      detail: null,
      listQuery: {
        pageNum: 1,
        pageRow: 10
      },
      form: this.emptyForm()
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogStatus === 'create' ? '新增关卡' : '编辑关卡'
    }
  },
  created() {
    this.getList()
  },
  methods: {
    emptyForm() {
      return {
        pkId: '',
        levelNo: 1,
        levelName: '',
        levelData: '',
        enabled: true,
        sortNo: 0
      }
    },
    getList() {
      this.listLoading = true
      this.api({
        url: '/game/level/list',
        method: 'get',
        params: this.listQuery
      }).then(data => {
        this.list = data.list || []
        this.totalCount = data.total || 0
      }).catch(() => {
        this.list = []
        this.totalCount = 0
      }).finally(() => {
        this.listLoading = false
      })
    },
    handleSizeChange(val) {
      this.listQuery.pageRow = val
      this.listQuery.pageNum = 1
      this.getList()
    },
    handleCurrentChange(val) {
      this.listQuery.pageNum = val
      this.getList()
    },
    getIndex(index) {
      return (this.listQuery.pageNum - 1) * this.listQuery.pageRow + index + 1
    },
    openCreate() {
      this.dialogStatus = 'create'
      this.form = this.emptyForm()
      this.dialogVisible = true
    },
    openEdit(row) {
      this.api({
        url: '/game/level/detail',
        method: 'post',
        data: { pkId: row.pkId }
      }).then(data => {
        this.dialogStatus = 'update'
        this.form = Object.assign(this.emptyForm(), data)
        this.dialogVisible = true
      }).catch(() => {})
    },
    openDetail(row) {
      this.api({
        url: '/game/level/detail',
        method: 'post',
        data: { pkId: row.pkId }
      }).then(data => {
        this.detail = data
        this.detailVisible = true
      }).catch(() => {})
    },
    saveLevel() {
      if (!this.validateForm()) return
      this.saving = true
      this.api({
        url: '/game/level/save',
        method: 'post',
        data: this.form
      }).then(() => {
        this.$message.success('保存成功')
        this.dialogVisible = false
        this.getList()
      }).catch(() => {
      }).finally(() => {
        this.saving = false
      })
    },
    removeLevel(row) {
      this.$confirm('确定删除关卡 "' + row.levelName + '" 吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.api({
          url: '/game/level/delete',
          method: 'post',
          data: { pkId: row.pkId }
        }).then(() => {
          this.$message.success('删除成功')
          this.getList()
        }).catch(() => {})
      }).catch(() => {})
    },
    validateForm() {
      if (!this.form.levelNo) {
        this.$message.warning('请填写关卡编号')
        return false
      }
      if (!this.form.levelName || !this.form.levelName.trim()) {
        this.$message.warning('请填写关卡名称')
        return false
      }
      if (!this.form.levelData || !this.form.levelData.trim()) {
        this.$message.warning('请填写关卡 JSON')
        return false
      }
      const json = this.parseLevelJson(this.form.levelData)
      if (!json) return false
      if (!Object.prototype.hasOwnProperty.call(json, 'rows') && !Object.prototype.hasOwnProperty.call(json, 'grainRows')) {
        this.$message.warning('关卡 JSON 必须包含 rows 或 grainRows')
        return false
      }
      return true
    },
    parseLevelJson(text) {
      try {
        return JSON.parse(text)
      } catch (e) {
        this.$message.warning('关卡 JSON 格式不正确')
        return null
      }
    },
    readJsonFile(param) {
      const file = param.file
      if (!file.name.toLowerCase().endsWith('.json')) {
        this.$message.warning('只能导入 .json 文件')
        return
      }
      const reader = new FileReader()
      reader.onload = event => {
        this.form.levelData = event.target.result
        const json = this.parseLevelJson(this.form.levelData)
        if (json) {
          this.form.levelData = JSON.stringify(json, null, 2)
          if (!this.form.levelName && json.name) {
            this.form.levelName = json.name
          }
        }
      }
      reader.readAsText(file, 'UTF-8')
    },
    formatJson() {
      const json = this.parseLevelJson(this.form.levelData)
      if (json) {
        this.form.levelData = JSON.stringify(json, null, 2)
      }
    },
    prettyJson(text) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2)
      } catch (e) {
        return text
      }
    }
  }
}
</script>

<style scoped>
.game-level-page {
  padding: 20px;
  min-height: calc(100vh - 50px);
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.toolbar-title h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.toolbar-title span {
  color: #909399;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.level-table {
  width: 100%;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 32px;
  white-space: nowrap;
}

.table-actions .el-button + .el-button {
  margin-left: 0;
}

.table-actions .el-button {
  flex: 0 0 auto;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.level-edit-dialog >>> .el-dialog {
  border-radius: 8px;
  overflow: hidden;
  background: #f6f8fb;
}

.level-edit-dialog >>> .el-dialog__header {
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.level-edit-dialog >>> .el-dialog__headerbtn {
  top: 22px;
  right: 22px;
}

.level-edit-dialog >>> .el-dialog__body {
  padding: 18px 20px 4px;
}

.level-edit-dialog >>> .el-dialog__footer {
  padding: 0;
  background: #fff;
}

.level-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 14px 54px 14px 22px;
  box-sizing: border-box;
}

.level-dialog-heading {
  display: block;
  line-height: 24px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.level-dialog-subtitle {
  display: block;
  margin-top: 3px;
  line-height: 18px;
  color: #6b7280;
  font-size: 12px;
}

.level-form {
  max-height: calc(90vh - 160px);
  overflow: auto;
  padding-right: 2px;
}

.form-section {
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.section-title {
  margin-bottom: 12px;
  line-height: 20px;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.section-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.section-bar .section-title {
  margin-bottom: 2px;
}

.section-note {
  color: #6b7280;
  font-size: 12px;
}

.level-form >>> .el-form-item {
  margin-bottom: 14px;
}

.level-form >>> .el-form-item__label {
  padding-bottom: 6px;
  line-height: 18px;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
}

.level-form >>> .el-input-number {
  width: 100%;
}

.level-form >>> .el-input__inner {
  border-color: #d8dee8;
  border-radius: 6px;
}

.level-form >>> .el-input__inner:focus,
.json-input >>> .el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.switch-box {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: #fbfdff;
}

.json-section {
  padding-bottom: 12px;
}

.json-tools {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.json-form-item {
  margin-bottom: 0 !important;
}

.json-form-item >>> .el-form-item__content {
  line-height: 1;
}

.json-input >>> .el-textarea__inner {
  min-height: 360px !important;
  padding: 14px 16px;
  border-color: #243044;
  border-radius: 8px;
  background: #172033;
  color: #e5edf6;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.55;
  resize: vertical;
}

.json-input >>> .el-textarea__inner::placeholder {
  color: #8fa1b7;
}

.level-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 18px rgba(31, 41, 55, 0.04);
}

.level-dialog-footer .el-button + .el-button {
  margin-left: 0;
}

.json-preview {
  margin: 16px 0 0;
  padding: 14px;
  max-height: 420px;
  overflow: auto;
  background: #1f2933;
  color: #e4e7eb;
  border-radius: 6px;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

@media screen and (max-width: 768px) {
  .toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    margin-top: 12px;
    width: 100%;
  }

  .toolbar-actions .el-button {
    flex: 1;
  }

  .table-actions {
    flex-wrap: wrap;
    gap: 6px;
    white-space: normal;
  }

  .level-edit-dialog >>> .el-dialog {
    width: calc(100% - 24px) !important;
  }

  .level-dialog-title {
    min-height: 60px;
    padding-left: 16px;
  }

  .level-edit-dialog >>> .el-dialog__body {
    padding: 12px;
  }

  .form-section {
    padding: 12px;
  }

  .section-bar {
    display: block;
  }

  .json-tools {
    margin-top: 10px;
  }

  .json-input >>> .el-textarea__inner {
    min-height: 300px !important;
  }
}
</style>
