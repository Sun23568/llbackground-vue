<template>
  <div class="crawler-record-container">
    <!-- 页面标题和操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">
            <i class="el-icon-document"></i>
            爬取记录
          </h2>
          <p class="page-subtitle">查看和管理爬虫执行记录</p>
        </div>
        <div class="action-section">
          <el-button
            icon="el-icon-refresh"
            size="medium"
            @click="getList">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 记录列表 -->
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

        <el-table-column label="执行时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.executeTime || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="执行状态" width="120" align="center">
          <template slot-scope="scope">
            <div class="status-info">
              <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                {{ scope.row.status === 'SUCCESS' ? '成功' : '失败' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="耗时" width="120" align="center">
          <template slot-scope="scope">
            <el-tag type="info" size="small">
              {{ formatDuration(scope.row.duration) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="错误信息" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="error-text" v-if="scope.row.errorMessage">{{ scope.row.errorMessage }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary"
              icon="el-icon-view"
              size="mini"
              plain
              @click="showDetail(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!listLoading && list.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>暂无执行记录</p>
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

    <!-- 详情对话框 -->
    <el-dialog
      title="执行记录详情"
      :visible.sync="detailVisible"
      width="800px"
      class="detail-dialog">
      <div class="detail-content" v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="配置名称" :span="2">{{ currentDetail.configName }}</el-descriptions-item>
          <el-descriptions-item label="执行时间">{{ currentDetail.executeTime }}</el-descriptions-item>
          <el-descriptions-item label="执行耗时">{{ formatDuration(currentDetail.duration) }}</el-descriptions-item>
          <el-descriptions-item label="执行状态" :span="2">
            <div class="status-info">
              <el-tag :type="currentDetail.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                {{ currentDetail.status === 'SUCCESS' ? '成功' : '失败' }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2" v-if="currentDetail.errorMessage">
            <div class="error-message">{{ currentDetail.errorMessage }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 结果数据展示 -->
        <div class="result-section" v-if="currentDetail.resultData">
          <div class="section-title">
            <i class="el-icon-s-data"></i>
            爬取结果数据
          </div>
          <el-input
            type="textarea"
            :value="formatResultData(currentDetail.resultData)"
            :rows="15"
            readonly
            class="result-textarea">
          </el-input>
          <div class="result-actions">
            <el-button
              size="small"
              icon="el-icon-document-copy"
              @click="copyResult(currentDetail.resultData)">
              复制结果
            </el-button>
            <el-button
              size="small"
              icon="el-icon-download"
              @click="downloadResult(currentDetail.resultData, currentDetail.configName)">
              下载结果
            </el-button>
          </div>
        </div>
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
      detailVisible: false,
      currentDetail: null,
      pageNum: 1,
      pageSize: 10,
      total: 0
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.listLoading = true;
      this.api({
        url: "/crawler/record/list",
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

    showDetail(row) {
      this.currentDetail = { ...row };
      this.detailVisible = true;
    },

    formatDuration(duration) {
      if (!duration && duration !== 0) return '-';
      if (duration < 1000) {
        return duration + 'ms';
      }
      return (duration / 1000).toFixed(2) + 's';
    },

    formatResultData(data) {
      if (!data) return '';
      try {
        // 尝试格式化JSON
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // 如果不是JSON，直接返回
        return data;
      }
    },

    copyResult(data) {
      if (!data) {
        this.$message.warning('没有可复制的数据');
        return;
      }
      // 创建临时textarea复制内容
      const textarea = document.createElement('textarea');
      textarea.value = this.formatResultData(data);
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('复制成功');
      } catch (err) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },

    downloadResult(data, configName) {
      if (!data) {
        this.$message.warning('没有可下载的数据');
        return;
      }
      const content = this.formatResultData(data);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${configName}_${new Date().getTime()}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.$message.success('下载成功');
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
.crawler-record-container {
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

.status-info {
  display: inline-flex;
  vertical-align: middle;
  line-height: normal;
}

.status-info .el-tag {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 24px;
  line-height: 1 !important;
  padding: 0 8px;
}

.error-text {
  color: #F56C6C;
  font-size: 13px;
}

.empty-text {
  color: #c0c4cc;
  font-size: 13px;
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
  margin: 0;
  font-size: 16px;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 详情对话框 */
.detail-content {
  padding: 10px 0;
}

.error-message {
  color: #F56C6C;
  padding: 8px 12px;
  background: #FEF0F0;
  border-radius: 4px;
  font-size: 13px;
}

.result-section {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-textarea {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.result-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
