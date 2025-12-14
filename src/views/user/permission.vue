<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form inline>
        <el-form-item label="权限类型">
          <el-select v-model="listQuery.permType" placeholder="全部" clearable @change="handleFilter"
                     style="width: 150px">
            <el-option
              v-for="item in permissionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-plus" v-permission="'perm:add'" @click="showCreate">添加权限
          </el-button>
          <el-button type="danger" icon="el-icon-delete" v-permission="'perm:remove'"
                     @click="removePermission(null)">批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="list"
              v-loading="listLoading"
              ref="permTable"
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
      <el-table-column align="left" label="权限编码" prop="permCode" min-width="180"></el-table-column>
      <el-table-column align="left" label="权限名称" prop="permName" min-width="150"></el-table-column>
      <el-table-column align="left" label="权限类型" prop="permType" width="150">
        <template slot-scope="scope">
          <el-tag :type="getPermTypeColor(scope.row.permType)">{{ scope.row.permType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="right" label="操作" width="240" fixed="right">
        <template slot-scope="scope">
          <el-button class="action-btn edit-btn" size="mini" @click="showUpdate(scope.$index)"
                     v-permission="'perm:update'">
            <i class="el-icon-edit"></i> 编辑
          </el-button>
          <el-button class="action-btn delete-btn" size="mini"
                     @click="removePermission(scope.row)" v-permission="'perm:remove'">
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
      <el-form class="small-space" :model="tempPermForm" label-position="left" label-width="100px">
        <el-form-item label="权限编码" required>
          <el-input type="text" v-model="tempPermForm.permCode" :disabled="dialogStatus==='update'"
                    placeholder="请输入权限编码">
          </el-input>
        </el-form-item>
        <el-form-item label="权限名称" required>
          <el-input type="text" v-model="tempPermForm.permName" placeholder="例如: 添加用户">
          </el-input>
        </el-form-item>
        <el-form-item label="权限类型" required>
          <el-select
            v-model="tempPermForm.permType"
            placeholder="请选择权限类型"
            filterable
            allow-create
            style="width: 100%">
            <el-option
              v-for="item in permissionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus==='create'" type="success" @click="createPermission">创 建</el-button>
        <el-button type="primary" v-else @click="updatePermission">修 改</el-button>
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
        pageRow: 10,//每页条数
        permType: '' // 权限类型过滤
      },
      dialogStatus: 'create',
      dialogFormVisible: false,
      textMap: {
        update: '编辑权限',
        create: '新建权限'
      },
      tempPermForm: {
        permId: '',
        permCode: '',
        permName: '',
        permType: ''
      },
      permissionTypeOptions: []
    }
  },
  created() {
    this.getList();
    this.getPermissionTypes();
  },
  methods: {
    getList() {
      //查询列表
      this.listLoading = true;
      this.api({
        url: "/permission/query",
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
    getPermissionTypes() {
      // 获取权限类型选项
      this.api({
        url: "/permission/types",
        method: "get"
      }).then(data => {
        // data 直接是字符串数组: ["用户", "文章", "权限", ...]
        if (data && data.length > 0) {
          this.permissionTypeOptions = data.map(type => ({
            label: type,
            value: type
          }));
        }
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
    getPermTypeColor(type) {
      // 根据权限类型返回不同颜色
      const colorMap = {
        '用户': 'success',
        '文章': 'primary',
        '权限': 'warning',
        '菜单': 'info',
        'AI': 'danger',
        '文件': ''
      };
      return colorMap[type] || '';
    },
    showCreate() {
      //显示新增对话框
      this.tempPermForm = {
        permId: '',
        permCode: '',
        permName: '',
        permType: ''
      }
      this.dialogStatus = "create"
      this.dialogFormVisible = true
    },
    showUpdate($index) {
      let perm = this.list[$index];
      this.tempPermForm.permId = perm.permId;
      this.tempPermForm.permCode = perm.permCode;
      this.tempPermForm.permName = perm.permName;
      this.tempPermForm.permType = perm.permType;
      this.dialogStatus = "update"
      this.dialogFormVisible = true
    },
    validate() {
      let p = this.tempPermForm
      if (p.permCode.trim().length === 0) {
        this.$message.warning('请填写权限编码');
        return false;
      }
      if (p.permName.trim().length === 0) {
        this.$message.warning('请填写权限名称');
        return false;
      }
      if (p.permType.trim().length === 0) {
        this.$message.warning('请选择权限类型');
        return false;
      }
      return true
    },
    createPermission() {
      if (!this.validate()) return
      //添加新权限
      this.api({
        url: "/permission/add",
        method: "post",
        data: this.tempPermForm
      }).then(() => {
        this.$message.success('添加成功')
        this.getList();
        this.dialogFormVisible = false
      }).catch(() => {
      })
    },
    updatePermission() {
      if (!this.validate()) return
      //修改权限信息
      this.api({
        url: "/permission/update",
        method: "post",
        data: this.tempPermForm
      }).then(() => {
        this.$message.success('修改成功')
        this.dialogFormVisible = false
        this.getList();
      })
    },
    removePermission(row) {
      let _vue = this;
      this.$confirm('确定删除此权限?', '提示', {
        confirmButtonText: '确定',
        showCancelButton: true,
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let data = {};
        if (row) {
          data = {permId: row.permId};
        } else {
          const selectedRows = this.$refs.permTable.selection;
          if (selectedRows.length === 0) {
            this.$message.warning('请选择要删除的权限');
            return;
          }
          // 批量删除需要逐个调用接口
          const deletePromises = selectedRows.map(item => {
            return _vue.api({
              url: "/permission/remove",
              method: "post",
              data: {permId: item.permId}
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
          url: "/permission/remove",
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
