<template>
  <div class="login-container">
    <!-- 背景装饰圆形 -->
    <div class="background-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">欢迎回来</h2>
        <p class="login-subtitle">登录您的账户</p>
      </div>

      <el-form
        autoComplete="on"
        :model="loginForm"
        :rules="loginRules"
        ref="loginForm"
        class="login-form"
      >
        <el-form-item prop="userId">
          <div class="input-wrapper">
            <span class="input-icon">
              <svg-icon icon-class="user"/>
            </span>
            <el-input
              v-model="loginForm.userId"
              autoComplete="on"
              placeholder="请输入账号"
              class="custom-input"
            />
          </div>
        </el-form-item>

        <el-form-item prop="password">
          <div class="input-wrapper">
            <span class="input-icon">
              <svg-icon icon-class="password"></svg-icon>
            </span>
            <el-input
              type="password"
              @keyup.enter.native="handleLogin"
              v-model="loginForm.password"
              autoComplete="on"
              placeholder="请输入密码"
              class="custom-input"
            ></el-input>
          </div>
        </el-form-item>

        <el-form-item class="submit-item">
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click.native.prevent="handleLogin"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部装饰 -->
      <div class="login-footer">
        <p class="footer-text">孙老六的后花园</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'login',
  data() {
    return {
      loginForm: {
        userId: '',
        password: ''
      },
      loginRules: {
        userId: [{required: true, trigger: 'blur', message: "请输入账号"}],
        password: [{required: true, trigger: 'blur', message: "请输入密码"}]
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          // 登录前确保已获取服务器公钥
          this.$store.dispatch('Login', this.loginForm).then(data => {
            this.loading = false
            this.$router.push({path: '/'})
          }).catch(() => {
            this.loading = false
          })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  // 背景装饰圆形
  .background-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 1;

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      animation: float 20s infinite ease-in-out;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 300px;
      height: 300px;
      bottom: -80px;
      right: -80px;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 250px;
      height: 250px;
      top: 50%;
      right: 10%;
      animation-delay: 10s;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }

  // 登录卡片
  .login-card {
    position: relative;
    z-index: 10;
    width: 440px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 48px 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  // 登录头部
  .login-header {
    text-align: center;
    margin-bottom: 40px;

    .login-title {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .login-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
  }

  // 表单样式
  .login-form {
    .el-form-item {
      margin-bottom: 24px;
      border: none;
      background: transparent;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #f1f5f9;
      border: 2px solid transparent;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      &:hover {
        background: #e2e8f0;
      }

      &:focus-within {
        background: #ffffff;
        border-color: #06b6d4;
        box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1);
      }

      .input-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        color: #94a3b8;
        font-size: 20px;
        transition: color 0.3s;
      }

      &:focus-within .input-icon {
        color: #06b6d4;
      }
    }

    .custom-input {
      flex: 1;

      ::v-deep .el-input__inner {
        background: transparent;
        border: none;
        height: 50px;
        line-height: 50px;
        padding: 0 16px 0 0;
        color: #1e293b;
        font-size: 15px;

        &::placeholder {
          color: #94a3b8;
        }

        &:focus {
          background: transparent;
        }
      }
    }

    .submit-item {
      margin-bottom: 0;
      margin-top: 32px;
    }

    .login-button {
      width: 100%;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
      }

      &:active {
        transform: translateY(0);
      }

      &.is-loading {
        background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
      }
    }
  }

  // 底部
  .login-footer {
    margin-top: 32px;
    text-align: center;

    .footer-text {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      font-weight: 500;
    }
  }

  // 自动填充样式覆盖
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px #f1f5f9 inset !important;
    -webkit-text-fill-color: #1e293b !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .login-card {
      width: 90%;
      max-width: 400px;
      padding: 36px 28px;
    }

    .background-shapes .shape {
      display: none;
    }
  }
}

// Element UI 表单项样式覆盖（非 scoped）
</style>

<style lang="scss">
.login-container {
  .el-form-item__error {
    color: #ef4444;
    font-size: 12px;
    padding-top: 4px;
    padding-left: 4px;
  }

  .el-form-item.is-error {
    .input-wrapper {
      border-color: #ef4444 !important;
      background: #fef2f2;

      &:focus-within {
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
      }

      .input-icon {
        color: #ef4444;
      }
    }
  }

  .el-button.is-loading {
    pointer-events: none;
  }
}
</style>
