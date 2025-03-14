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
      <el-table-column align="center" label="管理" width="200">
        <template slot-scope="scope">
          <el-button type="primary" icon="edit" @click="openEditTab(scope.$index)" v-permission="'article:update'">修改</el-button>
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
      dialogFormVisible: false,
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
      console.log(row, 6666666666);
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
    handleSizeChange(val) {
      //改变每页数量
      this.listQuery.pageRow = val
      this.handleFilter();
    },
    handleCurrentChange(val) {
      //改变页码
      this.listQuery.pageNum = val
      this.getList();
    },
    handleFilter() {
      //改变了查询条件,从第一页开始查询
      this.listQuery.pageNum = 1
      this.getList()
    },
    showCreate() {
      //显示新增对话框
      this.tempArticle.content = "";
      this.dialogStatus = "create"
      this.dialogFormVisible = true
    },
    openEditTab($index) {
      //打开新的 Tab 页
      const article = this.list[$index];
      window.open(`/article/edit?id=${article.id}`, '_blank');    },
    handleMessage(event) {
      if (event.data === 'articleSaved') {
        this.$message({
          message: '文章保存成功',
          type: 'success'
        });
      }
    }
  }
}
</script>
