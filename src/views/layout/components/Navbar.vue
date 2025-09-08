<template>
  <el-menu class="navbar" mode="horizontal">
    <hamburger class="hamburger-container" :toggleClick="toggleSideBar" :isActive="sidebar.opened"></hamburger>
    <breadcrumb></breadcrumb>
    <el-dropdown class="avatar-container" trigger="click">
      <div class="avatar-wrapper">
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

    <el-dialog title="修改信息" :visible.sync="dialogVisible" width="30%">
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
import {sm3} from "sm-crypto";

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
    Hamburger
  },
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
          confirmPassword: this.modifyInfoForm.confirmPassword ? sm3(this.modifyInfoForm.confirmPassword): '',
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
  height: 50px;
  line-height: 50px;
  border-radius: 0px !important;

  .hamburger-container {
    line-height: 58px;
    height: 50px;
    float: left;
    padding: 0 10px;
  }

  .screenfull {
    position: absolute;
    right: 90px;
    top: 16px;
    color: red;
  }

  .avatar-container {
    height: 50px;
    display: inline-block;
    position: absolute;
    right: 35px;

    .avatar-wrapper {
      cursor: pointer;
      margin-top: 5px;
      position: relative;

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }

      .el-icon-caret-bottom {
        position: absolute;
        right: -20px;
        top: 25px;
        font-size: 12px;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 20px 0;
  }

  .el-form-item__content {
    margin-right: 20px;
  }
}
</style>
