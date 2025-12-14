<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form inline>
        <el-form-item>
          <el-button type="primary" icon="el-icon-plus" v-permission="'menu:add'" @click="showCreate">添加菜单
          </el-button>
          <el-button type="danger" icon="el-icon-delete" v-permission="'menu:remove'"
                     @click="removeMenu(null)">批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="list"
              v-loading="listLoading"
              ref="menuTable"
              class="claude-table"
              highlight-current-row>
      <el-table-column
        type="selection"
        width="55">
      </el-table-column>
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span v-text="getIndex(scope.$index)"> </span>
        </template>
      </el-table-column>
      <el-table-column align="left" label="菜单编码" prop="menuCode" min-width="180"></el-table-column>
      <el-table-column align="left" label="菜单名称" prop="menuName" min-width="150"></el-table-column>
      <el-table-column align="right" label="操作" width="240" fixed="right">
        <template slot-scope="scope">
          <el-button class="action-btn edit-btn" size="mini" @click="showUpdate(scope.$index)"
                     v-permission="'menu:update'">
            <i class="el-icon-edit"></i> 编辑
          </el-button>
          <el-button class="action-btn delete-btn" size="mini"
                     @click="removeMenu(scope.row)" v-permission="'menu:remove'">
            <i class="el-icon-delete"></i> 删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="listQuery.pageNum"
      :page-size="listQuery.pageRow"
      :total="totalCount"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%" :append-to-body="true">
      <el-form class="small-space" :model="tempMenuForm" label-position="left" label-width="100px">
        <el-form-item label="菜单编码" required>
          <el-input type="text" v-model="tempMenuForm.menuCode" :disabled="dialogStatus==='update'"
                    placeholder="例如: userManage">
          </el-input>
        </el-form-item>
        <el-form-item label="菜单名称" required>
          <el-input type="text" v-model="tempMenuForm.menuName" placeholder="例如: 用户管理">
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus==='create'" type="success" @click="createMenu">创 建</el-button>
        <el-button type="primary" v-else @click="updateMenu">修 改</el-button>
      </div>
    </el-dialog>
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
        pageRow: 10//每页条数
      },
      dialogStatus: 'create',
      dialogFormVisible: false,
      textMap: {
        update: '编辑菜单',
        create: '新建菜单'
      },
      tempMenuForm: {
        menuId: '',
        menuCode: '',
        menuName: ''
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      //查询列表
      this.listLoading = true;
      this.api({
        url: "/menu/query",
        method: "get",
        params: this.listQuery
      }).then(data => {
        this.listLoading = false;
        this.list = data.items;
        this.totalCount = data.total;
      }).catch(e => {
        this.listLoading = false;
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
      //查询事件
      this.listQuery.pageNum = 1
      this.getList()
    },
    getIndex($index) {
      //表格序号
      return (this.listQuery.pageNum - 1) * this.listQuery.pageRow + $index + 1
    },
    showCreate() {
      //显示新增对话框
      this.tempMenuForm = {
        menuId: '',
        menuCode: '',
        menuName: ''
      }
      this.dialogStatus = "create"
      this.dialogFormVisible = true
    },
    showUpdate($index) {
      let menu = this.list[$index];
      this.tempMenuForm.menuId = menu.menuId;
      this.tempMenuForm.menuCode = menu.menuCode;
      this.tempMenuForm.menuName = menu.menuName;
      this.dialogStatus = "update"
      this.dialogFormVisible = true
    },
    validate() {
      let m = this.tempMenuForm
      if (m.menuCode.trim().length === 0) {
        this.$message.warning('请填写菜单编码');
        return false;
      }
      if (m.menuName.trim().length === 0) {
        this.$message.warning('请填写菜单名称');
        return false;
      }
      return true
    },
    createMenu() {
      if (!this.validate()) return
      //添加新菜单
      this.api({
        url: "/menu/add",
        method: "post",
        data: this.tempMenuForm
      }).then(() => {
        this.$message.success('添加成功')
        this.getList();
        this.dialogFormVisible = false
      }).catch(() => {
      })
    },
    updateMenu() {
      if (!this.validate()) return
      //修改菜单信息
      this.api({
        url: "/menu/update",
        method: "post",
        data: this.tempMenuForm
      }).then(() => {
        this.$message.success('修改成功')
        this.dialogFormVisible = false
        this.getList();
      })
    },
    removeMenu(row) {
      let _vue = this;
      this.$confirm('确定删除此菜单? 这将同时删除所有关联的用户菜单关系。', '提示', {
        confirmButtonText: '确定',
        showCancelButton: true,
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let data = {};
        if (row) {
          data = {menuId: row.menuId};
        } else {
          const selectedRows = this.$refs.menuTable.selection;
          if (selectedRows.length === 0) {
            this.$message.warning('请选择要删除的菜单');
            return;
          }
          // 批量删除需要逐个调用接口
          const deletePromises = selectedRows.map(item => {
            return _vue.api({
              url: "/menu/remove",
              method: "post",
              data: {menuId: item.menuId}
            });
          });
          Promise.all(deletePromises).then(() => {
            this.$message.success('批量删除成功')
            _vue.getList()
          }).catch(() => {
          });
          return;
        }
        _vue.api({
          url: "/menu/remove",
          method: "post",
          data: data
        }).then(() => {
          this.$message.success('删除成功')
          _vue.getList()
        }).catch(() => {
        })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  }
}
</script>
<style scoped>
/* 使用全局 Claude 主题样式 */
</style>

<style>
.dialog-footer {
  text-align: center !important;
}
</style>
