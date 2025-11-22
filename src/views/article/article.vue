<template>
  <div class="article-list-container">
    <div class="list-header">
      <h2 class="page-title">文章管理</h2>
      <el-button type="primary" icon="el-icon-plus" @click="showCreate">新建文章</el-button>
    </div>

    <el-table
      :data="list"
      v-loading="listLoading"
      @row-dblclick="viewContent"
      class="article-table">
      <el-table-column align="left" prop="title" label="文章标题" min-width="300" show-overflow-tooltip></el-table-column>
      <el-table-column align="left" prop="authorName" label="作者" width="150"></el-table-column>
      <el-table-column align="left" prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column align="left" prop="updateTime" label="修改时间" width="180"></el-table-column>
      <el-table-column align="center" label="操作" width="240" fixed="right">
        <template slot-scope="scope">
          <div class="action-buttons">
            <el-button class="action-btn view-btn" size="mini" @click="openTab(scope.row.pkId, 'view')">
              <i class="el-icon-view"></i>
            </el-button>
            <el-button class="action-btn edit-btn" size="mini" @click="openTab(scope.row.pkId, 'edit')">
              <i class="el-icon-edit"></i>
            </el-button>
            <el-button class="action-btn delete-btn" size="mini" @click="removeArticle(scope.row.pkId)" v-if="hasPermission('article:remove') || scope.row.author === curUserId">
              <i class="el-icon-delete"></i>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>

import {hasPermission} from "@/utils/hasPermission";

export default {
  data() {
    return {
      totalCount: 0, //分页组件--数据总条数
      curUserId: this.$store.state.user.userId,
      list: [],//表格的数据
      listLoading: false,//数据加载等待动画
      listQuery: {
        pageNum: 1,//页码
        pageRow: 50,//每页条数
        name: ''
      },
      dialogStatus: 'create',
      textMap: {
        update: '编辑',
        create: '创建文章'
      },
      tempArticle: {
        id: "",
        content: ""
      }
    }
  },
  created() {
    this.getList();
  },
  activated() {
    // 当页面被激活时重新加载列表（用于从编辑页面返回）
    this.getList();
  },
  methods: {
    hasPermission,
    viewContent(row) {
      this.openTab(row.pkId, 'view');
    },
    getList() {
      //查询列表
      this.listLoading = true;
      this.api({
        url: "/article/list",
        method: "get",
        params: this.listQuery
      }).then(data => {
        this.listLoading = false;
        this.list = data.items
        this.totalCount = data.total;
      }).catch(error => {
        this.listLoading = false;
      });
    },
    showCreate() {
      this.$router.push({ path: '/system/article/edit', query: { mode: 'create' } });
    },
    openTab(articleId, mode) {
      this.$router.push({ path: `/system/article/${mode}`, query: { id: articleId } });
    },
    removeArticle(articleId) {
      this.$confirm('此操作将永久删除该文章, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.api({
          url: "/article/delete",
          method: "post",
          data: {
            articleId: articleId
          }
        }).then(data => {
          this.$message('文章删除成功');
          this.getList();
        }).catch(error => {})
      })
    }
  }
}
</script>

<style scoped>
.article-list-container {
  padding: 24px;
  background-color: #fafafa;
  min-height: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* 表格容器 */
.article-table {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 表格样式优化 */
/deep/ .article-table th {
  background-color: #fafafa !important;
  color: #374151 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 0 !important;
  border-bottom: 2px solid #e5e7eb !important;
}

/deep/ .article-table td {
  padding: 16px 0 !important;
  color: #1f2937 !important;
  font-size: 14px !important;
  border-bottom: 1px solid #f3f4f6 !important;
}

/deep/ .article-table .el-table__row {
  transition: all 0.2s ease;
}

/deep/ .article-table .el-table__row:hover {
  background-color: #f9fafb !important;
  cursor: pointer;
}

/deep/ .article-table .el-table__row:last-child td {
  border-bottom: none !important;
}

/deep/ .article-table::before {
  display: none;
}

/* 操作按钮容器 */
.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* 按钮样式 - 只显示图标 */
.action-btn {
  border-radius: 6px;
  padding: 8px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.action-btn i {
  font-size: 16px;
  margin: 0;
}

.view-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}

.view-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.edit-btn {
  background-color: #eff6ff;
  color: #2563eb;
  border-color: #dbeafe;
}

.edit-btn:hover {
  background-color: #dbeafe;
  color: #1d4ed8;
  border-color: #bfdbfe;
  transform: translateY(-1px);
}

.delete-btn {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.delete-btn:hover {
  background-color: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

/* 新建按钮样式 */
/deep/ .list-header .el-button--primary {
  background-color: #2563eb;
  border-color: #2563eb;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/deep/ .list-header .el-button--primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
}
</style>
