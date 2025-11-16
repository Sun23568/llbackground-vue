<template>
  <div class="view-container">
    <navbar></navbar>
    <div class="navbar-spacing"></div>
    <div class="form-container">
      <el-form label-position="left">
        <div>
          <el-input type="text" id="title" v-model="title" class="full-width-input no-border-input" readonly/>
          <hr class="separator"/>
          <editor-view ref="editorView" :value="content" class="editor-view"/>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import Navbar from '@/views/layout/components/Navbar';
import EditorView from "./EditorView";

export default {
  components: {
    Navbar,
    EditorView
  },
  data() {
    return {
      title: '',
      content: '',
    }
  },
  mounted() {
    console.log('viewer mounted');
    const articleId = this.$route.query.id ?? '';
    this.getArticle(articleId);
  },
  methods: {
    close() {
      window.close();
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

.view-container .ql-container::after {
  content: none;
}

.view-container .ql-container.ql-snow {
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

/deep/ .no-border-input .el-input__inner {
  border: none;
  border-radius: 0;
  padding-left: 0;
  font-size: 18px;
  font-weight: bold;
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
  overflow: auto;
  flex: 1;
}

.editor-view {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
