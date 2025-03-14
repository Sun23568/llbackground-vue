<template>
  <div class="editor-container">
    <navbar></navbar>
    <div class="navbar-spacing"></div> <!-- 添加间距 -->
    <div class="form-container"> <!-- 新增容器 -->
      <el-form label-position="left">
        <el-form-item label="标题:" class="form-item-class">
          <el-input type="text" id="title" v-model="title" placeholder="请输入文章标题" class="full-width-input"/>
        </el-form-item>
        <hr class="separator"/>
        <quill-editor ref="myQuillEditor" v-model="content" :options="editorOption" @change="onTextChange"/>
      </el-form>
    </div> <!-- 新增容器结束 -->
    <div class="floating-bar"> <!-- 新增悬浮栏 -->
      <span>字数: {{ wordCount }}</span>
      <el-button type="text" @click="cancel">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </div>
  </div>
</template>

<script>
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

import {quillEditor} from 'vue-quill-editor'
import {Navbar} from '@/views/layout/components'

export default {
  components: {
    quillEditor,
    Navbar
  },
  data() {
    return {
      title: '', // 添加标题数据属性
      content: '',
      wordCount: 0, // 新增字数统计
      editorOption: {
        // 富文本编辑器配置
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{'header': 1}, {'header': 2}],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'script': 'sub'}, {'script': 'super'}],
            [{'indent': '-1'}, {'indent': '+1'}],
            [{'direction': 'rtl'}],
            [{'size': ['small', false, 'large', 'huge']}],
            [{'header': [1, 2, 3, 4, 5, 6, false]}],
            [{'color': []}, {'background': []}],
            [{'font': []}],
            [{'align': []}],
            ['clean'],
            ['link', 'image', 'video']
          ]
        },
        placeholder: '在这里编辑内容。。。',
        theme: 'snow'  // or 'bubble'
      }
    }
  },
  mounted() {
    // 获取 URL 参数 id
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    // 获取文章信息
    if (articleId) {
      this.api({
        url: '/article/getArticleById',
        method: 'get',
        params: {
          articleId: articleId,
          craft: '0'
        }
      }).then(data => {
        this.title = data.TITLE;
        this.content = data.CONTENT;
      });
    }
  },
  methods: {
    onTextChange() { // 新增方法，统计字数
      this.wordCount = this.$refs.myQuillEditor.quill.getText().trim().length;
    },
    cancel() { // 新增方法，取消按钮功能
      // 关闭当前tab页的逻辑，这里假设使用的是浏览器的关闭标签页功能
      window.close();
    },
    submit() {
      this.api({
        url: '/article/updateArticle',
        method: 'post',
        data: {
          articleId: this.$route.query.id,
          title: this.title,
          content: this.content,
          craft: '0'
        }
      }).then(data => {
        this.$message({
          message: '保存成功',
          type: 'success'
        });
        // 关闭当前tab页的逻辑
        window.close();
        // 发送消息到 article.vue
        window.opener.postMessage('articleSaved', '*');
      })
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

.floating-bar { /* 新增悬浮栏样式 */
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  padding: 10px 20px; /* 增加padding以拉长 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center; /* 居中内容 */
  width: 80%; /* 设置宽度以拉长 */
}

.floating-bar span {
  margin-right: 20px;
}
</style>
