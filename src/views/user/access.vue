<template>
  <div class="app-container">
    <el-table
      :data="list"
      v-loading="listLoading"
      border
      fit
      highlight-current-row
    >
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span v-text="getIndex(scope.$index)"></span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="用户" prop="user" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.userName }}({{ scope.row.userId }})</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="菜单" width="420">
        <template slot-scope="scope">
          <el-tag
            v-for="menu in scope.row.menus"
            :key="menu.menuId"
            v-text="menu.menuName"
            style="margin-right: 3px;"
            type="primary"
          ></el-tag>
        </template>
      </el-table-column>

      <el-table-column align="center" label="权限" width="420">
        <template slot-scope="scope">
          <div>
            <div v-for="permType in scope.row.permTypes" style="text-align: left">
              <span style="width: 100px;display: inline-block;text-align: right">
                {{ permType.type }}：
              </span>
              <el-tag
                v-for="perm in permType.perms"
                :key="perm.permId"
                v-text="perm.permName"
                style="margin-right: 3px;"
                type="primary"
              ></el-tag>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="center" label="管理">
        <template slot-scope="scope">
          <el-button
            type="primary"
            icon="edit"
            @click="updateAccess(scope.$index)"
            v-permission="'access:update'"
          >
            修改
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        class="small-space"
        :model="tmpUser"
        label-position="left"
        label-width="100px"
        style='width: 600px; margin-left:50px;'
      >
        <el-form-item label="用户">
          <template>
            <span>{{ this.tmpUser.userId }}({{ this.tmpUser.userName }})</span>
          </template>
        </el-form-item>

        <el-form-item label="菜单" required>
          <el-checkbox-group v-model="tmpUser.menuIds">
            <el-checkbox
              v-for="menu in allMenu"
              :label="menu.menuId"
              :key="menu.menuId"
            >
              <span>{{ menu.menuName }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="权限" required>
          <div v-for="(permType, _index) in allPermission" :key="permType.type">
            <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
              <span style="width: 100px; flex-shrink: 0;">
                <el-button
                  :type="isPermNone(permType.type) ? '' : (isPermAll(permType.type) ? 'success' : 'primary')"
                  size="mini"
                  style="width:80px;"
                  @click="checkAll(permType.type)"
                >
                  {{ permType.type }}
                </el-button>
              </span>
              <div style="flex: 1; margin-left: 20px;">
                <el-checkbox-group v-model="tmpUser.permissions">
                  <el-checkbox
                    v-for="perm in permType.perms"
                    :label="perm.permId"
                    @change="checkRequired(perm, _index)"
                    :key="perm.permId"
                    style="margin-right: 15px; white-space: nowrap;"
                  >
                    <span>{{ perm.permName }}</span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus==='create'" type="success" @click="createRole">创 建</el-button>
        <el-button type="primary" v-else @click="updateUserPermission">修 改</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [], // 表格的数据
      allPermission: [],
      permTypeMap: [],
      allMenu: [],
      listLoading: false, // 数据加载等待动画
      dialogStatus: 'create',
      dialogFormVisible: false,
      textMap: {
        update: '编辑',
        create: '新建角色'
      },
      tmpUser: {
        menuIds: [],
        permissions: [],
      },
      adminName: '管理员'
    }
  },

  created() {
    this.getList();
    this.getAllPermisson();
  },

  methods: {
    getAllPermisson() {
      // 查询所有权限
      this.api({
        url: "/access/all-access",
        method: "get"
      }).then(data => {
        this.allMenu = data.menus;
        this.allPermission = data.permTypes;
        // 修改为对象结构，而不是数组
        this.permTypeMap = data.permTypes.reduce((acc, permType) => {
          acc[permType.type] = permType.perms;
          return acc;
        }, {});
      })
    },

    getList() {
      // 查询列表
      this.listLoading = true;
      this.api({
        url: "/access/list",
        method: "get"
      }).then(data => {
        this.listLoading = false;
        this.list = data.userAccessRespList;
      })
    },

    getIndex($index) {
      // 表格序号
      return $index + 1
    },

    updateAccess($index) {
      this.tmpUser = {
        ...this.list[$index],
        menuIds: this.list[$index].menus.map(menu => menu.menuId),
        permissions: this.list[$index].permTypes.flatMap(permType =>
          permType.perms.map(item => item.permId)
        ),
      };
      this.dialogStatus = "update"
      this.dialogFormVisible = true
    },

    showUpdate($index) {
      let role = this.list[$index];
      this.tmpUser.roleName = role.roleName;
      this.tmpUser.roleId = role.roleId;
      this.tmpUser.permissions = [];

      for (let i = 0; i < role.menus.length; i++) {
        let perm = role.menus[i].permissions;
        for (let j = 0; j < perm.length; j++) {
          this.tmpUser.permissions.push(perm[j].permissionId);
        }
      }

      this.dialogStatus = "update"
      this.dialogFormVisible = true
    },

    createRole() {
      if (!this.checkRoleNameUnique()) {
        return;
      }

      if (!this.checkPermMenuNum()) {
        return;
      }

      // 添加新角色
      this.api({
        url: "/user/addRole",
        method: "post",
        data: this.tmpUser
      }).then(() => {
        this.getList();
        this.dialogFormVisible = false
      })
    },

    updateUserPermission() {
      if (!this.checkPermMenuNum()) {
        return;
      }

      // 修改角色
      this.api({
        url: "/access/update-user",
        method: "post",
        data: this.tmpUser
      }).then(() => {
        this.getList();
        this.$message.success("更新成功");
        this.dialogFormVisible = false
      })
    },

    checkPermMenuNum() {
      // 校验至少有一种权限
      if (this.tmpUser.permissions.length === 0) {
        this.$message.error("请至少选择一种权限");
        return false;
      }

      if (this.tmpUser.menuIds.length === 0) {
        this.$message.error("请至少选择一种菜单");
        return false;
      }

      return true;
    },

    removeRole($index) {
      let _vue = this;
      let role = _vue.list[$index];

      _vue.api({
        url: "/user/deleteRole",
        method: "post",
        data: {
          roleId: role.roleId
        }
      }).then(() => {
        _vue.list.splice($index, 1);
      }).catch(e => {
        // 错误处理
      })
    },

    isPermNone(permType) {
      // 判断本级菜单内的权限是否一个都没选
      let perms = this.permTypeMap[permType];
      let result = true;

      for (let j = 0; j < perms.length; j++) {
        if (this.tmpUser.permissions.indexOf(perms[j].permId) > -1) {
          result = false;
          break;
        }
      }

      return result;
    },

    isPermAll(permType) {
      // 判断本级菜单内的权限是否全选了
      let perms = this.permTypeMap[permType];
      let result = true;

      for (let j = 0; j < perms.length; j++) {
        if (this.tmpUser.permissions.indexOf(perms[j].permId) < 0) {
          result = false;
          break;
        }
      }

      return result;
    },

    checkAll(permType) {
      // 点击菜单   相当于全选按钮
      let v = this;

      if (v.isPermAll(permType)) {
        // 如果已经全选了,则全部取消
        v.noPerm(permType);
      } else {
        // 如果尚未全选,则全选
        v.allPerm(permType);
      }
    },

    allPerm(permType) {
      // 全部选中
      let perms = this.permTypeMap[permType];

      for (let j = 0; j < perms.length; j++) {
        this.addUnique(perms[j].permId, this.tmpUser.permissions)
      }
    },

    noPerm(permType) {
      // 全部取消选中
      let perms = this.permTypeMap[permType];

      for (let j = 0; j < perms.length; j++) {
        let idIndex = this.tmpUser.permissions.indexOf(perms[j].permId);
        if (idIndex > -1) {
          this.tmpUser.permissions.splice(idIndex, 1);
        }
      }
    },

    addUnique(val, arr) {
      // 数组内防重复地添加元素
      let _index = arr.indexOf(val);
      if (_index < 0) {
        arr.push(val);
      }
    },

    checkRequired(_perm, _index) {
      // 本方法会在勾选状态改变之后触发
      let permId = _perm.id;

      if (this.tmpUser.permissions.indexOf(permId) > -1) {
        // 选中事件
        // 如果之前未勾选本权限,现在勾选完之后,tempRole里就会包含本id
        // 那么就要将必选的权限勾上
        this.makeReuqiredPermissionChecked(_index);
      } else {
        // 取消选中事件
        if (_perm.requiredPerm === 1) {
          // 如果是必勾权限,就把本菜单的权限全部移出
          // (其实也可以提示用户本权限是菜单里的必选,请先取消勾选另外几个权限,交互太麻烦,此处就直接全部取消选中了)
          this.noPerm(_index);
        }
      }
    },

    makeReuqiredPermissionChecked(_index) {
      // 将本菜单必选的权限勾上
      let menu = this.allPermission[_index].permissions;

      for (let j = 0; j < menu.length; j++) {
        let perm = menu[j];
        if (perm.requiredPerm === 1) {
          // 找到本菜单的必选权限,将其勾上
          this.addUnique(perm.id, this.tmpUser.permissions)
        }
      }
    }
  }
}
</script>

<style scoped>
.requiredPerm {
  color: #ff0e13;
}
</style>
