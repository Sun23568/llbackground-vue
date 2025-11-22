<template>
  <div class="editor-container">
    <div class="editor-header">
      <el-input
        type="text"
        v-model="title"
        placeholder="请输入文章标题"
        class="title-input"
      />
      <div class="header-actions">
        <el-button class="cancel-btn" size="medium" @click="cancel">取消</el-button>
        <el-button class="submit-btn" type="primary" size="medium" @click="submit('0')">保存</el-button>
      </div>
    </div>
    <div class="editor-content">
      <editor ref="editor" :value="content" v-model="content"/>
    </div>
  </div>
</template>
<script>
import Editor from "./Editor";
export default {
  components: {
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
      this.$router.push('/system/article');
    },
    submit(draft) {
      console.log('this.content', this.content);
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
        // 返回文章列表页面
        this.$router.push('/system/article');
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
.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

/* 编辑器顶部区域 */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title-input {
  flex: 1;
  margin-right: 20px;
}

.title-input /deep/ .el-input__inner {
  border: none;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  padding: 8px 0;
  height: auto;
  line-height: 1.4;
}

.title-input /deep/ .el-input__inner::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.title-input /deep/ .el-input__inner:focus {
  border: none;
  box-shadow: none;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.submit-btn {
  background-color: #2563eb;
  border-color: #2563eb;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
}

/* 编辑器内容区域 */
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 编辑器样式优化 */
/deep/ .ql-toolbar.ql-snow {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fafafa;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 5;
}

/deep/ .ql-container.ql-snow {
  border: none;
  min-height: calc(100vh - 200px);
}

/deep/ .ql-editor {
  min-height: calc(100vh - 200px);
  font-size: 16px;
  line-height: 1.75;
  color: #1f2937;
  padding: 32px 48px;
}

/deep/ .ql-editor.ql-blank::before {
  color: #9ca3af;
  font-style: normal;
  left: 48px;
}

/* 编辑器工具栏按钮样式 */
/deep/ .ql-snow .ql-stroke {
  stroke: #6b7280;
}

/deep/ .ql-snow .ql-fill {
  fill: #6b7280;
}

/deep/ .ql-toolbar button:hover .ql-stroke,
/deep/ .ql-toolbar button:hover .ql-fill {
  stroke: #2563eb;
  fill: #2563eb;
}

/deep/ .ql-toolbar button.ql-active .ql-stroke,
/deep/ .ql-toolbar button.ql-active .ql-fill {
  stroke: #2563eb;
  fill: #2563eb;
}

/deep/ .ql-toolbar button:hover {
  background-color: #e5e7eb;
}

/deep/ .ql-toolbar button.ql-active {
  background-color: #dbeafe;
}

/deep/ .ql-editor p,
/deep/ .ql-editor ol,
/deep/ .ql-editor ul {
  margin-bottom: 1em;
}

/deep/ .ql-editor h1 {
  font-size: 28px;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

/deep/ .ql-editor h2 {
  font-size: 24px;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

/deep/ .ql-editor h3 {
  font-size: 20px;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}
</style>
