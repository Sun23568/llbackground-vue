<template>
  <el-upload action="" :auto-upload="false" :show-file-list="false" :on-change="handleUpload"
    accept="image/jpeg,image/png" v-permission="'ai:config:background-image:upload'">
    <el-button type="primary">背景图片</el-button>
  </el-upload>
</template>

<script>
export default {
  name: 'UploadBackgroundButton',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    aiMenuId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
    };
  },
  methods: {
    async handleUpload(file) {
      const isJPG = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }

      const formData = new FormData();
      formData.append('file', file.raw);
      formData.append('aiMenuCode', this.aiMenuId);
      await this.api({
        url: '/ai/config/background-image/upload',
        method: 'post',
        data: formData,
      })
        .then(response => {
          this.$message.success('上传成功!');
          this.$emit('background-updated', response);
          return true;
        })
        .catch(() => {
          this.$message.error('上传失败');
          return false;
        });
    },
    async fetchAndSetBackground() {
      console.log('fetchAndSetBackground');
      await this.api({
        url: '/ai/config/background-image?aiMenuCode=' + this.aiMenuId,
        method: 'get',
      })
        .then(response => {
          this.$emit('background-updated', response);
          return true;
        })
        .catch(() => { });
    }
  }
};
</script>