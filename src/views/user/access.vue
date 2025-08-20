<template>
  <div class="app-container">
    <el-button type="primary" @click="addPermVisible = true" v-permission="'access:addPerm'">新增权限</el-button>
    <el-button type="primary" @click="addMenuVisible = true" v-permission="'access:addMenu'">新增菜单</el-button>

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

    <!-- 修改权限弹窗 -->
    <el-dialog title="修改用户权限" :visible.sync="updateUserAccessVisible" @close="updateUserAccessClose">
      <el-form
        class="small-space"
        :model="updateUserAccessForm"
        label-position="left"
        label-width="100px"
        style='width: 600px; margin-left:50px;'
      >
        <el-form-item label="用户">
          <template>
            <span>{{ this.updateUserAccessForm.userId }}({{ this.updateUserAccessForm.userName }})</span>
          </template>
        </el-form-item>

        <el-form-item label="菜单" required>
          <el-checkbox-group v-model="updateUserAccessForm.menuIds">
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
                <el-checkbox-group v-model="updateUserAccessForm.permissions">
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

      <div slot="footer" class="dialog-footer" v-loading="updateAccessButtonLoading">
        <el-button @click="updateUserAccessVisible = false">取 消</el-button>
        <el-button type="primary" @click="updateUserPermission">修 改</el-button>
      </div>
    </el-dialog>

    <!-- 新增权限弹窗 -->
    <el-dialog title="新增权限" :visible.sync="addPermVisible" @close="addPermClose">
      <el-form
        ref="addPermForm"
        class="small-space"
        :rules="permRules"
        :model="addPermForm"
        label-position="left"
        label-width="100px"
        style='width: 600px; margin-left:50px;'
      >
        <el-form-item label="权限编码" prop="permCode" required>
          <el-input v-model="addPermForm.permCode" placeholder="请输入权限编码" class="full-width-input"/>
        </el-form-item>

        <el-form-item label="权限名称" prop="permName" required>
          <el-input v-model="addPermForm.permName" placeholder="请输入权限名称" class="full-width-input"/>
        </el-form-item>

        <el-form-item label="权限类型" prop="permType" required>
          <el-select
            v-model="addPermForm.permType"
            placeholder="请选择权限类型"
            filterable
            allow-create>
            <el-option
              v-for="item in permissionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer" v-loading="addPermButtonLoading">
        <el-button @click="addPermVisible = false">取 消</el-button>
        <el-button type="primary" @click="addPermission">提 交</el-button>
      </div>
    </el-dialog>

    <!-- 新增菜单弹窗 -->
    <el-dialog title="新增菜单" :visible.sync="addMenuVisible" @close="addMenuClose">
      <el-form
        ref="addMenuForm"
        class="small-space"
        :rules="menuRules"
        :model="addMenuForm"
        label-position="left"
        label-width="100px"
        style='width: 600px; margin-left:50px;'
      >
        <el-form-item label="菜单编码" prop="menuCode" required>
          <el-input v-model="addMenuForm.menuCode" placeholder="请输入菜单编码" class="full-width-input"/>
        </el-form-item>

        <el-form-item label="菜单名称" prop="menuName" required>
          <el-input v-model="addMenuForm.menuName" placeholder="请输入菜单名称" class="full-width-input"/>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer" v-loading="addMenuButtonLoading">
        <el-button @click="addMenuVisible = false">取 消</el-button>
        <el-button type="primary" @click="addMenu">提 交</el-button>
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
      updateUserAccessVisible: false,
      addPermVisible: false,
      addMenuVisible: false,
      permissionTypeOptions: [],
      updateAccessButtonLoading: false, // 控制按钮遮罩
      addPermButtonLoading: false,
      addMenuButtonLoading: false,
      addPermForm: {
        permCode: '',
        permName: '',
        permType: ''
      },
      addMenuForm: {
        menuCode: '',
        menuName: ''
      },
      updateUserAccessForm: {
        menuIds: [],
        permissions: [],
      },
      adminName: '管理员',
      permRules: {
        permCode: [
          {required: true, message: '请输入权限编码', trigger: 'blur'}
        ],
        permName: [
          {required: true, message: '请输入权限名称', trigger: 'blur'}
        ],
        permType: [
          {required: true, message: '请选择权限类型', trigger: 'change'}
        ]
      },
      menuRules: {
        menuCode: [
          {required: true, message: '请输入菜单编码', trigger: 'blur'}
        ],
        menuName: [
          {required: true, message: '请输入菜单名称', trigger: 'blur'}
        ]
      },
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
        this.permissionTypeOptions = this.allPermission.map(perm => ({
          label: perm.type,
          value: perm.type
        }));
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
      this.updateUserAccessForm = {
        ...this.list[$index],
        menuIds: this.list[$index].menus.map(menu => menu.menuId),
        permissions: this.list[$index].permTypes.flatMap(permType =>
          permType.perms.map(item => item.permId)
        )
      };
      this.updateUserAccessVisible = true
    },

    updateUserPermission() {
      if (!this.checkPermMenuNum()) {
        return;
      }
      this.updateAccessButtonLoading = true;
      // 修改角色
      this.api({
        url: "/access/update-user",
        method: "post",
        data: this.updateUserAccessForm
      }).then(() => {
        this.getList();
        this.$message.success("更新成功");
      }).catch(() => {
      }).finally(() => {
        // 确保无论成功/失败都关闭加载状态
        this.updateAccessButtonLoading = false;
        this.updateUserAccessVisible = false;
      });
    },

    checkPermMenuNum() {
      // 校验至少有一种权限
      if (this.updateUserAccessForm.permissions.length === 0) {
        this.$message.error("请至少选择一种权限");
        return false;
      }

      if (this.updateUserAccessForm.menuIds.length === 0) {
        this.$message.error("请至少选择一种菜单");
        return false;
      }

      return true;
    },

    isPermNone(permType) {
      // 判断本级菜单内的权限是否一个都没选
      let perms = this.permTypeMap[permType];
      let result = true;

      for (let j = 0; j < perms.length; j++) {
        if (this.updateUserAccessForm.permissions.indexOf(perms[j].permId) > -1) {
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
        if (this.updateUserAccessForm.permissions.indexOf(perms[j].permId) < 0) {
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
        this.addUnique(perms[j].permId, this.updateUserAccessForm.permissions)
      }
    },

    noPerm(permType) {
      // 全部取消选中
      let perms = this.permTypeMap[permType];

      for (let j = 0; j < perms.length; j++) {
        let idIndex = this.updateUserAccessForm.permissions.indexOf(perms[j].permId);
        if (idIndex > -1) {
          this.updateUserAccessForm.permissions.splice(idIndex, 1);
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

      if (this.updateUserAccessForm.permissions.indexOf(permId) > -1) {
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
          this.addUnique(perm.id, this.updateUserAccessForm.permissions)
        }
      }
    },
    addPermClose() {
      this.addPermForm = {
        permCode: '',
        permName: '',
        permType: ''
      };
      // 清空valid
      this.$refs.addPermForm.clearValidate();
    },
    addMenuClose() {
      this.addMenuForm = {
        menuCode: '',
        menuName: '',
      };
      // 清空valid
      this.$refs.addMenuForm.clearValidate();
    },
    updateUserAccessClose() {
      this.updateUserAccessForm = {
        menuIds: [],
        permissions: []
      }
    },
    addPermission() {
      var addPermForm = this.addPermForm;
      this.$refs.addPermForm.validate(valid => {
        if (valid) {
          this.addPermButtonLoading = true;
          // 修改角色
          this.api({
            url: "/access/add-perm",
            method: "post",
            data: addPermForm
          }).then(() => {
            this.getAllPermisson();
            this.$message.success("新增成功");
          }).catch(() => {
          }).finally(() => {
            // 确保无论成功/失败都关闭加载状态
            this.addPermVisible = false;
            this.addPermButtonLoading = false;
          });
        } else {
          return false;
        }
      });
    },
    addMenu() {
      var addMenuForm = this.addMenuForm;
      this.$refs.addMenuForm.validate(valid => {
        if (valid) {
          this.addMenuButtonLoading = true;
          // 修改角色
          this.api({
            url: "/access/add-menu",
            method: "post",
            data: addMenuForm
          }).then(() => {
            this.getAllPermisson();
            this.$message.success("新增成功");
          }).catch(() => {
          }).finally(() => {
            // 确保无论成功/失败都关闭加载状态
            this.addMenuVisible = false;
            this.addMenuButtonLoading = false;
          });
        } else {
          return false;
        }
      });
    },
  }
}
</script>

<style scoped>
.requiredPerm {
  color: #ff0e13;
}
</style>
