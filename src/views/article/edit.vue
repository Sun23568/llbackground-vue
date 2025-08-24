<template>
  <div class="editor-container">
    <navbar></navbar>
    <div class="navbar-spacing"></div> <!-- 添加间距 -->
    <div class="form-container"> <!-- 新增容器 -->
      <el-form label-position="left">
        <div>
          <el-form-item label="标题:" class="form-item-class">
            <el-input type="text" id="title" v-model="title" placeholder="请输入文章标题" class="full-width-input"/>
          </el-form-item>
          <hr class="separator"/>
          <quill-editor v-model="content" :options="editOption" @ready="onEditorReady"/>
        </div>
      </el-form>
    </div> <!-- 新增容器结束 -->
    <div class="floating-bar"> <!-- 新增悬浮栏 -->
      <span>字数: {{ wordCount }}</span>
      <el-button type="text" @click="cancel">取消</el-button>
      <el-button type="primary" @click="submit('0')">提交</el-button>
    </div>
  </div>
</template>
<script>
import Quill from 'quill'
import {quillEditor} from 'vue-quill-editor'
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.bubble.css'
import Navbar from '@/views/layout/components/Navbar';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import ImageUploader from 'quill-image-uploader'

Quill.register('modules/imageUploader', ImageUploader);

export default {
  components: {
    Navbar,
    quillEditor
  },
  data() {
    return {
      title: '',
      content: '',
      wordCount: 0,
      quillInstance: null,
      loadingImg: '/loading-img.svg',
      loadingError: '/loading-error.svg',
      autoSaveInterval: 5000, // 自动保存间隔时间（毫秒）
      autoSaveTimer: null, // 定时器引用
      editOption: {
        modules: {
          keyboard: {
            bindings: {
              tab: {
                key: 'Tab',
                handle: function () {
                  console.log('Tab key pressed2')
                }
              },
            },
          },
          toolbar: {
            container: [
              ['bold', 'italic', 'underline'],
              ['code-block', 'blockquote'],
              [{'list': 'ordered'}, {'list': 'bullet'}],
              ['link', 'image']
            ],
            handlers: {
              image: function () {
                // 创建一个文件输入元素
                const input = document.createElement('input');
                input.type = 'file';
                // 设置 accept 属性，只接受 PNG 格式文件
                input.accept = 'image/png, image/jpeg';
              }
            }
          },
          syntax: {
            highlight: text => {
              // 创建临时容器存放高亮后的代码
              const tempDiv = document.createElement('div');
              const codeNode = document.createElement('code');

              // 将原始文本作为文本节点添加
              codeNode.textContent = text;

              // 执行高亮
              hljs.highlightElement(codeNode);

              // 将高亮后的代码放入容器
              tempDiv.appendChild(codeNode);

              // 仅返回原始文本内容，避免样式污染
              return tempDiv.innerHTML;
            }
          }
        },
        placeholder: '在这里编辑内容。。。',
        theme: 'snow'

      }
    }
  },
  mounted() {
    this.keywordHandler();
    const articleId = this.$route.query.id ?? '';
    this.getArticle(articleId);
  },
  methods: {
    // 在编辑器准备好后，获取 Quill 实例
    onEditorReady(quill) {
      this.quillInstance = quill; // 保存 quill 实例
      const toolbar = quill.getModule('toolbar');
      toolbar.addHandler('image', this.handleImageUpload); // 替换默认的图片上传行为
    },
    // 图片上传处理函数
    handleImageUpload() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/webp';
      input.click();

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            // 上传图片axios
            const response = await this.uploadImg(file);
            this.insertImageToEditor(response);
          } catch (error) {
            console.error('图片上传失败', error);
          }
        }
      };
    },
    async uploadImg(img) {
      const formData = new FormData();
      formData.append('file', img);
      try {
        const res = await this.api({
          url: '/article/uploadFile',
          method: 'post',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          data: formData
        });
        return res;
      } catch (err) {
        console.error('Upload error:', err);
        throw err; // 抛出错误，以便调用者可以处理
      }
    },
    // 将上传的图片插入编辑器
    insertImageToEditor(imageUrl) {
      if (this.quillInstance) {
        const range = this.quillInstance.getSelection();
        this.quillInstance.insertEmbed(range.index, 'image', imageUrl, 'user');
        // 获取当前富文本内容
        const content = this.quillInstance.getText();
      }
    },
    keywordHandler() {
      // 阻止默认tab热键
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
        }
      });
    },
    onTextChange() {
      // 统计字数
      this.wordCount = this.$refs.myQuillEditor.quill.getText().trim().length;
    },
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
        debugger;
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

.title-display {
  font-size: 56px;
  font-weight: bold;
  display: block;
  margin-bottom: 20px;
}

/deep/ .ql-editor img {
  max-width: 100%;
  height: auto;
  cursor: pointer; /* 添加鼠标指针样式 */
}

/deep/ .ql-editor img.expanded {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.5);
}

/deep/ .ql-editor a {
  color: #1890ff;
  text-decoration: underline;
}

/deep/ blockquote {
  margin: 0;
  padding: 0;
  display: block;
  white-space: break-spaces;
}

/deep/ ol {
  margin: 0;
  padding: 0;
  display: block;
  white-space: break-spaces;
}

/deep/ ul {
  margin: 0;
  padding: 0;
  display: block;
  white-space: break-spaces;
}

/deep/ .ql-editor p {
  margin: 0;
  padding: 0;
  display: block;
  white-space: break-spaces;
}

/deep/ .ql-editor {
  white-space: normal;
}

.ql-image-loading {
  position: relative;
  /* background: url('/loading-img.svg') center no-repeat; */
}

.ql-image-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-top-color: #409EFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
