<template>
  <div class="view-container">
    <div class="article-header">
      <h1 class="article-title">{{ title }}</h1>
    </div>
    <div class="article-content">
      <editor-view ref="editorView" :value="content" class="editor-view"/>
    </div>
  </div>
</template>

<script>
import EditorView from "./EditorView";

export default {
  components: {
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
      this.$router.push('/system/article');
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
.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow-y: auto;
}

/* 文章头部 */
.article-header {
  padding: 48px 48px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.article-title {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin: 0;
  word-wrap: break-word;
}

/* 文章内容 */
.article-content {
  flex: 1;
  padding: 24px 48px 64px;
}

.editor-view {
  font-size: 16px;
  line-height: 1.75;
  color: #374151;
}

/deep/ .ql-container.ql-snow {
  border: none;
}

/deep/ .ql-editor {
  padding: 0;
  font-size: 17px;
  line-height: 1.75;
  color: #374151;
}

/deep/ .ql-editor p {
  margin-bottom: 1.5em;
}

/deep/ .ql-editor h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-top: 2.5em;
  margin-bottom: 1em;
  line-height: 1.2;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #e5e7eb;
}

/deep/ .ql-editor h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-top: 2em;
  margin-bottom: 0.875em;
  line-height: 1.25;
}

/deep/ .ql-editor h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 1.75em;
  margin-bottom: 0.75em;
  line-height: 1.3;
}

/deep/ .ql-editor h4 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

/deep/ .ql-editor ul,
/deep/ .ql-editor ol {
  margin-bottom: 1.5em;
  padding-left: 2em;
}

/deep/ .ql-editor li {
  margin-bottom: 0.5em;
  line-height: 1.75;
}

/deep/ .ql-editor blockquote {
  border-left: 4px solid #2563eb;
  padding: 1em 1.5em;
  margin: 2em 0;
  background-color: #f8fafc;
  color: #475569;
  border-radius: 0 6px 6px 0;
  font-style: normal;
}

/deep/ .ql-editor code {
  background-color: #f1f5f9;
  color: #dc2626;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  border: 1px solid #e2e8f0;
}

/deep/ .ql-editor pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1.5em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 2em 0;
  line-height: 1.6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/deep/ .ql-editor pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border: none;
}

/deep/ .ql-editor a {
  color: #2563eb;
  text-decoration: none;
  border-bottom: 1px solid #93c5fd;
  transition: all 0.2s ease;
}

/deep/ .ql-editor a:hover {
  color: #1d4ed8;
  border-bottom-color: #2563eb;
}

/deep/ .ql-editor strong {
  font-weight: 600;
  color: #1f2937;
}

/deep/ .ql-editor em {
  font-style: italic;
}

/deep/ .ql-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2em 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/deep/ .ql-editor hr {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 3em 0;
}

/deep/ .ql-editor table {
  border-collapse: collapse;
  width: 100%;
  margin: 2em 0;
}

/deep/ .ql-editor table td,
/deep/ .ql-editor table th {
  border: 1px solid #e5e7eb;
  padding: 0.75em 1em;
}

/deep/ .ql-editor table th {
  background-color: #f9fafb;
  font-weight: 600;
  text-align: left;
}

/deep/ .ql-editor table tr:hover {
  background-color: #f9fafb;
}
</style>
