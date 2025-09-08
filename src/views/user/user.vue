<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form>
        <el-form-item>
          <el-button type="primary" icon="plus" v-permission="'user:add'" @click="showCreate">添加
          </el-button>
          <el-button type="primary" icon="plus" v-permission="'user:remove'" @click="removeUser(null)">删除
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="list"
              v-loading="listLoading"
              ref="userTable"
              border
              fit
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
      <el-table-column align="center" label="用户ID" prop="userId" style="width: 20px;"></el-table-column>
      <el-table-column align="center" label="用户名" prop="userName" style="width: 20px;"></el-table-column>
      <el-table-column align="center" label="创建时间" prop="createTime" width="170"></el-table-column>
      <el-table-column align="center" label="最近修改时间" prop="updateTime" width="170"></el-table-column>
      <el-table-column align="center" label="管理" width="220">
        <template slot-scope="scope">
          <el-button type="primary" icon="edit" @click="showUpdate(scope.$index)" v-permission="'user:update'">修改
          </el-button>
          <el-button type="danger" icon="delete" v-if="scope.row.userId!==userId "
                     @click="removeUser(scope.row)" v-permission="'user:remove'">删除
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
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%">
      <el-form class="small-space" :model="tempUserForm" label-position="left" label-width="80px">
        <el-form-item label="用户ID" required>
          <el-input type="text" v-model="tempUserForm.userId">
          </el-input>
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input type="text" v-model="tempUserForm.userName" autocomplete="new-password">
          </el-input>
        </el-form-item>
        <el-form-item label="密码" v-if="dialogStatus==='create'" required>
          <el-input type="password" v-model="tempUserForm.password" autocomplete="new-password"
                    @input="validConfirmPassword"/>
        </el-form-item>
        <el-form-item label="新密码" v-else>
          <el-input type="password" v-model="tempUserForm.password" placeholder="不填则表示不修改"
                    autocomplete="new-password" @input="validConfirmPassword"/>
        </el-form-item>
        <el-form-item label="密码确认" :error="confirmPasswordError ? '两次输入密码不一致' : ''">
          <el-input type="password" v-model="tempUserForm.confirmPassword" autocomplete="new-password"
                    @input="validConfirmPassword">
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus==='create'" type="success" @click="createUser">创 建</el-button>
        <el-button type="primary" v-else @click="updateUser">修 改</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import {sm3} from "sm-crypto";

export default {
  data() {
    return {
      confirmPasswordError: false, // 新增错误状态
      totalCount: 0, //分页组件--数据总条数
      list: [],//表格的数据
      listLoading: false,//数据加载等待动画
      listQuery: {
        pageNum: 1,//页码
        pageRow: 10,//每页条数
      },
      dialogStatus: 'create',
      dialogFormVisible: false,
      textMap: {
        update: '编辑',
        create: '新建用户'
      },
      tempUserForm: {
        userName: '',
        password: '',
        userId: '',
        confirmPassword: '',
      }
    }
  },
  created() {
    this.getList();
  },
  computed: {
    ...mapGetters([
      'userId'
    ])
  },
  methods: {
    getList() {
      //查询列表
      this.listLoading = true;
      this.api({
        url: "/user/list",
        method: "post",
        params: this.listQuery
      }).then(data => {
        this.listLoading = false;
        this.list = data.items;
        this.totalCount = data.total;
      }).catch(e => {
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
      this.tempUserForm = {
        userName: '',
        password: '',
        userId: '',
        confirmPassword: ''
      }
      this.dialogStatus = "create"
      this.dialogFormVisible = true
      this.confirmPasswordError = false;
    },
    showUpdate($index) {
      let user = this.list[$index];
      this.tempUserForm.userName = user.userName;
      this.tempUserForm.userId = user.userId;
      this.tempUserForm.deleteStatus = '1';
      this.tempUserForm.password = '';
      this.dialogStatus = "update"
      this.dialogFormVisible = true
    },
    validate(isCreate) {
      let u = this.tempUserForm
      if (u.userId.trim().length === 0) {
        this.$message.warning('请填写用户ID');
        return false;
      }
      if (isCreate && u.userName.trim().length === 0) {
        this.$message.warning('请填写用户名');
        return false;
      }
      if (isCreate && u.password.length === 0) {
        this.$message.warning('请填写密码');
        return false;
      }
      // 密码必须包含数字、字母、特殊字符
      if (isCreate && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,./]).{8,20}$/.test(u.password)) {
        this.$message.warning('密码必须包含数字、字母、特殊字符且大于8位');
        return false;
      }
      if (u.password !== u.confirmPassword) {
        return false;
      }
      return true
    },
    createUser() {
      if (!this.validate(true)) return
      const tmp = {
        ...this.tempUserForm,
        password: sm3(this.tempUserForm.password),
        confirmPassword: sm3(this.tempUserForm.confirmPassword)
      }
      //添加新用户
      this.api({
        url: "/user/add",
        method: "post",
        data: tmp
      }).then(() => {
        this.$message.success('添加成功')
        this.getList();
        this.dialogFormVisible = false
      }).catch(() => {
      })
    },
    updateUser() {
      if (!this.validate(false)) return
      //修改用户信息
      const tmp = {
        ...this.tempUserForm,
        password: sm3(this.tempUserForm.password),
        confirmPassword: sm3(this.tempUserForm.confirmPassword)
      }
      let _vue = this;
      this.api({
        url: "/user/update",
        method: "post",
        data: tmp
      }).then(() => {
        this.$message.success('修改成功')
        this.dialogFormVisible = false
        _vue.getList();

      })
    },
    removeUser(row) {
      let _vue = this;
      this.$confirm('确定删除此用户?', '提示', {
        confirmButtonText: '确定',
        showCancelButton: true,
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let data = {};
        console.log(row, 'row')
        if (row) {
          data = {userIds: [row.pkId]};
        } else {
          const selectedRows = this.$refs.userTable.selection;
          data = {userIds: selectedRows.map(item => item.pkId)};
        }
        _vue.api({
          url: "/user/remove",
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
    },
    validConfirmPassword() {
      this.confirmPasswordError =
        this.tempUserForm.password !== this.tempUserForm.confirmPassword
    },
  }
}
</script>
<style>
.dialog-footer {
  text-align: center !important;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
