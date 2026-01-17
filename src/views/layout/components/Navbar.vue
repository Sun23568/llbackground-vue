<template>
  <el-menu class="navbar" mode="horizontal">
    <!-- 移动端汉堡菜单 -->
    <mobile-menu v-if="isMobile" class="hamburger-container" :is-active="sidebar.opened" />
    <!-- 桌面端汉堡菜单 -->
    <hamburger v-else class="hamburger-container" :toggleClick="toggleSideBar" :isActive="sidebar.opened"></hamburger>
    <breadcrumb></breadcrumb>
    <el-dropdown class="avatar-container" trigger="click">
      <div class="avatar-wrapper">
        <span class="user-name">{{ $store.state.user.userName }}</span>
        <img class="user-avatar" :src="img_avatar">
        <i class="el-icon-caret-bottom"></i>
      </div>
      <el-dropdown-menu class="user-dropdown" slot="dropdown">
        <router-link class="inlineBlock" to="/">
          <el-dropdown-item>
            首页
          </el-dropdown-item>
        </router-link>
        <el-dropdown-item divided>
          <span @click="modifyInfo" style="display:block;">修改信息</span>
        </el-dropdown-item>
        <el-dropdown-item divided>
          <span @click="logout" style="display:block;">登出</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>

    <el-dialog title="修改信息" :visible.sync="dialogVisible" :width="isMobile ? '90%' : '30%'" :append-to-body="true">
      <el-form ref="passwordForm" :model="modifyInfoForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="modifyInfoForm.userName"></el-input>
        </el-form-item>
        <el-form-item label="旧密码">
          <el-input v-model="modifyInfoForm.oldPassword" type="password" show-password
                    placeholder="不填写代表不修改密码" autocomplete="new-password"></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="modifyInfoForm.newPassword" type="password" autocomplete="new-password"
                    @input="validConfirmPassword" placeholder="不填写代表不修改密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码" :error="confirmPasswordError ? '两次输入密码不一致' : ''">
          <el-input v-model="modifyInfoForm.confirmPassword" type="password" autocomplete="new-password"
                    @input="validConfirmPassword" placeholder="不填写代表不修改密码" show-password>
          </el-input>
        </el-form-item>
        <el-form-item label="头像" required>
          <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/jpeg,image/png">
            <img v-if="modifyInfoForm.avatar" :src="modifyInfoForm.avatar" class="avatar"/>
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
          <div class="avatar-tip">支持JPG/PNG格式，大小不超过2MB</div>
        </el-form-item>
      </el-form>
      <span slot="footer">
    <el-button @click="dialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="submitModify">确 定</el-button>
  </span>
    </el-dialog>
  </el-menu>
</template>

<script>
// 修改此处，采用解构赋值导入 mapGetters
import {mapGetters} from 'vuex';
import Breadcrumb from '@/components/Breadcrumb';
import Hamburger from '@/components/Hamburger';
import MobileMenu from '@/components/MobileMenu';
import {sm3} from "sm-crypto";
import responsiveMixin from '@/mixins/responsiveMixin';

export default {
  data() {
    return {
      confirmPasswordError: false, // 新增错误状态
      img_avatar: '',
      dialogVisible: false,
      modifyInfoForm: {
        userName: this.$store.state.user.userName,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        avatar: ''
      },
    };
  },
  components: {
    Breadcrumb,
    Hamburger,
    MobileMenu
  },
  mixins: [responsiveMixin],
  mounted() {
    this.getAvatar();
  },
  computed: {
    ...mapGetters([
      'sidebar',
    ])
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('ToggleSideBar');
    },
    logout() {
      this.$store.dispatch('LogOut').then(() => {
        location.reload(); // 为了重新实例化vue-router对象 避免bug
      });
    },
    modifyInfo() {
      this.dialogVisible = true;
    },
    submitModify() {
      if (!this.validate()) return;
      // 调用修改密码接口
      this.api({
        url: "/user/update/cur",
        method: "post",
        data: {
          userName: this.modifyInfoForm.userName,
          oldPassword: this.modifyInfoForm.oldPassword ? sm3(this.modifyInfoForm.oldPassword) : '',
          newPassword: this.modifyInfoForm.newPassword ? sm3(this.modifyInfoForm.newPassword) : '',
          confirmPassword: this.modifyInfoForm.confirmPassword ? sm3(this.modifyInfoForm.confirmPassword) : '',
          avatar: this.modifyInfoForm.avatar
        }
      }).then(() => {
        this.$message.success('密码修改成功');
        this.dialogVisible = false;
        this.$refs.passwordForm.resetFields(); // 重置表单
      }).catch(error => {
        this.$message.error('密码修改失败');
      });
    },
    validConfirmPassword() {
      this.confirmPasswordError =
        this.modifyInfoForm.newPassword !== this.modifyInfoForm.confirmPassword
    },
    validate() {
      let u = this.modifyInfoForm
      // 密码必须包含数字、字母、特殊字符
      if (u.newPassword !== '') {
        if (u.oldPassword === '') {
          this.$message.warning('请填写旧密码');
          return false;
        }
        if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,./]).{8,20}$/.test(u.newPassword)) {
          this.$message.warning('密码必须包含数字、字母、特殊字符且大于8位');
          return false;
        }
      }
      if (u.newPassword !== u.confirmPassword) {
        return false;
      }
      return true
    },
    handleFileChange(file) {
      const isJPG = file.raw.type === 'image/jpeg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }
      const rawFile = file.raw;
      const reader = new FileReader();

      reader.onload = (e) => {
        this.$set(this.modifyInfoForm, 'avatar', e.target.result);
      };
      reader.readAsDataURL(rawFile);
      return true;
    },
    getAvatar() {
      const avatarId = this.$store.state.user.avatar;
      this.api({
        url: "/sa/avatar?avatarId=" + avatarId,
        method: "get"
      }).then(data => {
        this.img_avatar = data;
      }).catch(error => {
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.navbar {
  height: 60px;
  line-height: 60px;
  border-radius: 0px !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1000; // 确保导航栏在侧边栏之上
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
  overflow: hidden; // 防止内容溢出

  .hamburger-container {
    line-height: 60px;
    height: 60px;
    float: left;
    padding: 0 15px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.025);
    }
  }

  .screenfull {
    position: absolute;
    right: 90px;
    top: 16px;
    color: red;
  }

  .avatar-container {
    height: 60px;
    display: inline-block;
    position: absolute;
    right: 35px;
    top: 0;

    .avatar-wrapper {
      cursor: pointer;
      position: relative;
      padding: 10px 12px;
      border-radius: 20px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      height: 60px;
      box-sizing: border-box;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid #06b6d4;
        box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);
        transition: all 0.3s;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35);
        }
      }

      .el-icon-caret-bottom {
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        color: #64748b;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 20px 0;
    background-color: #ffffff !important; // 确保对话框内容区域为白色
  }

  .el-form-item__content {
    margin-right: 20px;
  }
  .user-name {
    margin-right: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      color: #06b6d4;
    }
  }
}
</style>
