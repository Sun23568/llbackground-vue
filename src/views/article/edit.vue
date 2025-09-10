<template>
  <div class="editor-container">
    <navbar></navbar>
    <div class="navbar-spacing"></div>
    <div class="form-container">
      <el-form label-position="left">
        <div>
          <el-form-item label="标题:" class="form-item-class">
            <el-input type="text" id="title" v-model="title" placeholder="请输入文章标题" class="full-width-input"/>
          </el-form-item>
          <hr class="separator"/>
          <editor ref="editor" :value="content" v-model="content"/>
        </div>
      </el-form>
    </div>
    <div class="floating-bar">
      <el-button type="text" @click="cancel">取消</el-button>
      <el-button type="primary" @click="submit('0')">提交</el-button>
    </div>
  </div>
</template>
<script>
import Navbar from '@/views/layout/components/Navbar';
import Editor from "./Editor";
export default {
  components: {
    Navbar,
    Editor
  },
  data() {
    return {
      title: '',
      content: '',
    }
  },
  mounted() {
    const articleId = this.$route.query.id ?? '';
    this.getArticle(articleId);
  },
  methods: {
    cancel() {
      window.close();
    },
    submit(draft) {
      this.api({
        url: '/article/update',
        method: 'post',
        data: {
          articleId: this.$route.query.id,
          title: this.title,
          content: this.content,
          draft: draft,
          publicFlag: '0'
        }
      }).then(data => {
        this.$message({
          message: '保存成功',
          type: 'success'
        });
        // 关闭当前tab页的逻辑
        // window.close();
        // 发送消息到 article.vue
        window.opener.postMessage('articleSaved', '*');
      }).catch(error => {
      })
    },
    getArticle(articleId) {
      if (articleId) {
        this.api({
          url: '/article/query/content',
          method: 'post',
          data: {
            articleId: articleId,
            draft: '0'
          }
        }).then(data => {
          this.title = data.title;
          this.content = data.content;
        }).catch(error => {
        })
      }
    }
  }
}
</script>

<style scoped>
/deep/ .el-form-item__content {
  width: 100% !important;
}

/deep/ .el-form-item__label {
  width: 46px;
}

.editor-container .ql-container::after {
  content: none;
}

.editor-container .ql-container.ql-snow {
  border: none;
}

.separator {
  border: none;
  border-top: 1px solid #ccc;
  margin: 20px 0;
}

.el-form-item {
  display: flex;
  align-items: center;
}

.full-width-input .el-input__inner {
  width: 100%;
}

/* 确保标签文本水平显示 */
.el-form-item__label {
  writing-mode: horizontal-tb !important;
  display: inline-block;
}

.navbar-spacing {
  height: 20px; /* 设置间距高度 */
}

.form-container { /* 新增样式 */
  width: 80%;
  margin: 0 auto;
}

.floating-bar { /* 修改悬浮栏样式 */
  position: relative; /* 改为相对定位 */
  bottom: auto; /* 移除固定定位的底部位置 */
  left: auto; /* 移除固定定位的左侧位置 */
  transform: none; /* 移除 transform 属性 */
  background-color: #fff;
  padding: 10px 20px; /* 增加padding以拉长 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center; /* 居中内容 */
  width: 80%; /* 设置宽度以拉长 */
  margin-top: 20px; /* 添加顶部间距 */
}

.floating-bar span {
  margin-right: 20px;
}
</style>
