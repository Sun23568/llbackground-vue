<template>
  <div class="access-container">
    <div class="page-header">
      <h2 class="page-title">授权管理</h2>
    </div>

    <el-table
      :data="list"
      v-loading="listLoading"
      class="access-table"
      highlight-current-row
    >
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span v-text="getIndex(scope.$index)"></span>
        </template>
      </el-table-column>

      <el-table-column align="left" label="用户" prop="user" min-width="160">
        <template slot-scope="scope">
          <div class="user-info">
            <span class="user-name">{{ scope.row.userName }}</span>
            <span class="user-id">({{ scope.row.userId }})</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="菜单" min-width="280">
        <template slot-scope="scope">
          <div class="tags-container">
            <el-tag
              v-for="menu in scope.row.menus"
              :key="menu.menuId"
              v-text="menu.menuName"
              class="tag-item"
              type="primary"
            ></el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="权限" min-width="280">
        <template slot-scope="scope">
          <div class="permissions-summary">
            <el-popover
              v-for="permType in scope.row.permTypes"
              :key="permType.type"
              placement="top"
              width="350"
              trigger="hover"
            >
              <div class="perm-detail-container">
                <div class="perm-detail-title">{{ permType.type }}</div>
                <div class="perm-detail-tags">
                  <el-tag
                    v-for="perm in permType.perms"
                    :key="perm.permId"
                    v-text="perm.permName"
                    size="small"
                    type="success"
                    class="perm-detail-tag"
                  ></el-tag>
                </div>
              </div>
              <el-tag
                slot="reference"
                class="perm-summary-tag"
                type="info"
              >
                {{ permType.type }} ({{ permType.perms.length }})
              </el-tag>
            </el-popover>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            class="action-btn edit-btn"
            size="mini"
            @click="updateAccess(scope.$index)"
            v-permission="'access:update'"
          >
            <i class="el-icon-edit"></i> 修改
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 修改权限弹窗 -->
    <el-dialog
      title="修改用户权限"
      :visible.sync="updateUserAccessVisible"
      @close="updateUserAccessClose"
      :append-to-body="true"
      width="900px"
      top="5vh"
      class="access-dialog"
    >
      <div class="dialog-content">
        <!-- 用户信息 -->
        <div class="user-info-section">
          <div class="info-label">用户</div>
          <div class="info-value">
            <span class="user-display-name">{{ this.updateUserAccessForm.userName }}</span>
            <span class="user-display-id">({{ this.updateUserAccessForm.userId }})</span>
          </div>
        </div>

        <!-- 菜单选择 -->
        <div class="menu-section">
          <div class="section-header">
            <span class="section-title">菜单权限</span>
            <span class="section-count">已选 {{ updateUserAccessForm.menuIds.length }}/{{ allMenu.length }}</span>
          </div>
          <div class="menu-checkbox-group">
            <el-checkbox-group v-model="updateUserAccessForm.menuIds">
              <el-checkbox
                v-for="menu in allMenu"
                :label="menu.menuId"
                :key="menu.menuId"
                class="menu-checkbox-item"
              >
                {{ menu.menuName }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 权限选择 -->
        <div class="perm-section">
          <div class="section-header">
            <span class="section-title">功能权限</span>
          </div>
          <el-collapse v-model="activePermTypes" accordion>
            <el-collapse-item
              v-for="(permType, _index) in allPermission"
              :key="permType.type"
              :name="permType.type"
            >
              <template slot="title">
                <div class="collapse-title">
                  <span class="perm-type-name">{{ permType.type }}</span>
                  <div class="collapse-title-actions" @click.stop>
                    <el-tag
                      size="small"
                      :type="isPermNone(permType.type) ? 'info' : 'success'"
                    >
                      {{ getPermCount(permType.type) }}/{{ permType.perms.length }}
                    </el-tag>
                    <el-button
                      :type="isPermNone(permType.type) ? '' : (isPermAll(permType.type) ? 'success' : 'primary')"
                      size="mini"
                      @click="checkAll(permType.type)"
                    >
                      {{ isPermAll(permType.type) ? '取消全选' : '全选' }}
                    </el-button>
                  </div>
                </div>
              </template>
              <el-checkbox-group v-model="updateUserAccessForm.permissions" class="perm-checkbox-group">
                <div
                  v-for="perm in permType.perms"
                  :key="perm.permId"
                  class="perm-checkbox-card"
                  :class="{ 'is-checked': updateUserAccessForm.permissions.includes(perm.permId) }"
                >
                  <el-checkbox
                    :label="perm.permId"
                    @change="checkRequired(perm, _index)"
                    class="perm-checkbox-item"
                  >
                    <span class="perm-checkbox-text">{{ perm.permName }}</span>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <div slot="footer" class="dialog-footer" v-loading="updateAccessButtonLoading">
        <el-button @click="updateUserAccessVisible = false">取 消</el-button>
        <el-button type="primary" @click="updateUserPermission">修 改</el-button>
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
      updateAccessButtonLoading: false, // 控制按钮遮罩
      activePermTypes: [], // 当前展开的权限类型折叠面板
      updateUserAccessForm: {
        menuIds: [],
        permissions: [],
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

    getPermCount(permType) {
      // 获取已选权限数量
      let perms = this.permTypeMap[permType];
      let count = 0;

      for (let j = 0; j < perms.length; j++) {
        if (this.updateUserAccessForm.permissions.indexOf(perms[j].permId) > -1) {
          count++;
        }
      }

      return count;
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
    updateUserAccessClose() {
      this.updateUserAccessForm = {
        menuIds: [],
        permissions: []
      }
    },
  }
}
</script>

<style scoped>
.access-container {
  padding: 24px;
  background-color: #fafafa;
  min-height: 100%;
}

/* 页面头部 */
.page-header {
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

/* 表格样式 */
.access-table {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/deep/ .access-table::before {
  display: none;
}

/deep/ .access-table th {
  background-color: #fafafa !important;
  color: #374151 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 0 !important;
  border-bottom: 2px solid #e5e7eb !important;
}

/deep/ .access-table td {
  padding: 16px 0 !important;
  color: #1f2937 !important;
  font-size: 14px !important;
  border-bottom: 1px solid #f3f4f6 !important;
}

/deep/ .access-table .el-table__row {
  transition: all 0.2s ease;
}

/deep/ .access-table .el-table__row:hover {
  background-color: #f9fafb !important;
}

/deep/ .access-table .el-table__row:last-child td {
  border-bottom: none !important;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.user-id {
  color: #6b7280;
  font-size: 13px;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  margin: 0 !important;
}

/* 权限摘要 */
.permissions-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-summary-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.perm-summary-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Popover 内权限详情 */
.perm-detail-container {
  padding: 4px 0;
}

.perm-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.perm-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.perm-detail-tag {
  margin: 0 !important;
}

/* 操作按钮 */
.action-btn {
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.action-btn i {
  margin-right: 4px;
  font-size: 13px;
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

.requiredPerm {
  color: #ff0e13;
}

/* 弹窗样式 */
.access-dialog .dialog-content {
  padding: 0 12px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 用户信息区域 */
.user-info-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 28px;
  border: 1px solid #e5e7eb;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
  min-width: 60px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-display-name {
  font-weight: 600;
  color: #111827;
  font-size: 15px;
}

.user-display-id {
  color: #6b7280;
  font-size: 14px;
}

/* 区块样式 */
.menu-section,
.perm-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e5e7eb;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.section-count {
  font-size: 13px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 菜单复选框组 */
.menu-checkbox-group {
  background-color: #f9fafb;
  padding: 20px 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.menu-checkbox-item {
  margin: 0 !important;
  min-width: 150px;
  flex: 0 0 auto;
}

/deep/ .menu-checkbox-item .el-checkbox__label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* 折叠面板样式 */
/deep/ .el-collapse {
  border: none;
}

/deep/ .el-collapse-item {
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

/deep/ .el-collapse-item__header {
  background-color: #f9fafb;
  border: none;
  padding: 14px 20px;
  font-weight: 500;
  color: #111827;
  height: auto;
  line-height: 1.5;
  font-size: 14px;
}

/deep/ .el-collapse-item__header:hover {
  background-color: #f3f4f6;
}

/deep/ .el-collapse-item__wrap {
  border: none;
  background-color: #fff;
}

/deep/ .el-collapse-item__content {
  padding: 20px 24px 24px;
}

.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 12px;
}

.perm-type-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.collapse-title-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 权限复选框组 */
.perm-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* 权限卡片 */
.perm-checkbox-card {
  background-color: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.perm-checkbox-card:hover {
  border-color: #bfdbfe;
  background-color: #f8fafc;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.08);
}

.perm-checkbox-card.is-checked {
  background-color: #eff6ff;
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.perm-checkbox-card.is-checked:hover {
  background-color: #dbeafe;
  border-color: #1d4ed8;
}

.perm-checkbox-item {
  margin: 0 !important;
  width: 100%;
}

/deep/ .perm-checkbox-item .el-checkbox__input {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

/deep/ .perm-checkbox-item .el-checkbox__label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  padding-left: 0;
  padding-right: 32px;
  width: 100%;
}

.perm-checkbox-card.is-checked /deep/ .el-checkbox__label {
  color: #1d4ed8;
  font-weight: 600;
}

.perm-checkbox-text {
  display: block;
  line-height: 1.4;
}
</style>
