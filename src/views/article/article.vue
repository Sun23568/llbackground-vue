<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form>
        <el-form-item>
          <el-button type="primary" icon="plus" @click="showCreate" v-permission="'article:add'">添加
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="list" v-loading="listLoading" border fit
              highlight-current-row @row-dblclick="viewContent">
      <el-table-column align="left" prop="title" label="文章标题" style="width: 60px;"></el-table-column>
      <el-table-column align="center" label="管理">
        <template slot-scope="scope">
          <el-button type="primary" icon="edit" @click="openTab(scope.row.id, 'edit')" v-permission="'article:update'">
            修改
          </el-button>
          <el-button type="primary" icon="edit" @click="openTab(scope.row.id, 'view')" v-permission="'article:update'">
            查看
          </el-button>
          <el-button type="primary" icon="edit" @click="removeArticle(scope.row.id)" v-permission="'article:update'">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>

export default {
  data() {
    return {
      totalCount: 0, //分页组件--数据总条数
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
    // 监听来自 edit.vue 的消息
    window.addEventListener('message', this.handleMessage);
  },
  beforeDestroy() {
    // 移除消息监听
    window.removeEventListener('message', this.handleMessage);
  },
  methods: {
    viewContent(row) {
      this.openTab(row.id, 'view');
    },
    getList() {
      //查询列表
      if (!this.hasPerm('article:list')) {
        return
      }
      this.listLoading = true;
      this.api({
        url: "/article/listArticle",
        method: "get",
        params: this.listQuery
      }).then(data => {
        this.listLoading = false;
        this.list = data.list;
        this.totalCount = data.totalCount;
      })
    },

    showCreate() {
      window.open(`/#/article/edit?mode=create`, '_blank');
    },
    openTab(articleId, mode) {
      //打开新的 Tab 页
      window.open(`/#/article/edit?id=${articleId}&mode=${mode}`, '_blank');
    },
    removeArticle(articleId) {
      this.$confirm('此操作将永久删除该文章, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.api({
          url: "/article/deleteArticle",
          method: "post",
          data: {
            articleId: articleId
          }
        }).then(data => {
          this.$message('文章删除成功');
          this.getList();
        })
      })
    },
    handleMessage(event) {
      if (event.data === 'articleSaved') {
        this.$message({
          message: '文章保存成功',
          type: 'success'
        });
        this.getList();
      }
    }
  }
}
</script>
