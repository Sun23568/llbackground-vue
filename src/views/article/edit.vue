<head>
<!-- 引入 highlight.js 库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
<!-- 引入 highlight.js 样式 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
</head>
<template>
  <div class="editor-container">
    <navbar></navbar>
    <div class="navbar-spacing"></div> <!-- 添加间距 -->
    <div class="form-container"> <!-- 新增容器 -->
      <el-form label-position="left">
        <div v-if="!viewMode">
          <el-form-item label="标题:" class="form-item-class" v-if="!viewMode">
            <el-input type="text" id="title" v-model="title" placeholder="请输入文章标题" class="full-width-input"/>
          </el-form-item>
          <hr class="separator"/>
          <quill-editor ref="myQuillEditor" v-model="content" :options="editorOption" @change="onTextChange"/>
        </div>
        <div v-if="viewMode">
          <span class="title-display">{{ title }}</span>
          <hr class="separator"/>
          <div class="ql-editor" v-html="highlightCode(content)"></div>
        </div>
      </el-form>
    </div> <!-- 新增容器结束 -->
    <div class="floating-bar" v-if="!viewMode"> <!-- 新增悬浮栏 -->
      <span>字数: {{ wordCount }}</span>
      <el-button type="text" @click="cancel">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </div>
  </div>
</template>

<script>
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';
import {Navbar} from '@/views/layout/components';
import hljs from 'highlight.js';
import 'highlight.js/styles/monokai-sublime.css'; // 引入语法高亮样式
import {quillEditor, Quill} from 'vue-quill-editor'
import {container, ImageExtend, QuillWatch} from 'quill-image-extend-module'

Quill.register('modules/ImageExtend', ImageExtend)

export default {
  components: {
    quillEditor,
    Navbar
  },
  data() {
    return {
      title: '',
      content: '',
      wordCount: 0,
      editorOption: {
        formats: {
          link: {
            color: '#1890ff',
            underline: true
          }
        },
        modules: {
          toolbar: {
            container: container,  // container为工具栏，此次引入了全部工具栏，也可自行配置
            handlers: {
              'image': function () {
                // 创建一个文件输入元素
                const input = document.createElement('input');
                input.type = 'file';
                // 设置 accept 属性，只接受 PNG 格式文件
                input.accept = 'image/*';
                input.addEventListener('change', (event) => {
                  const file = event.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const range = this.quill.getSelection();
                    this.quill.insertEmbed(range.index, 'image', '/uploading-img.svg', 'user');
                    this.quill.setSelection(range.index + 1);
                    // 假设这里使用 axios 进行文件上传，你可以根据实际情况修改
                    import('axios').then((axios) => {
                      axios.post('/api/article/uploadFile', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data'
                        }
                      }).then((response) => {
                        const imageUrl = response.data.info; // 假设响应中的 info 字段是图片的 URL
                        const range = this.quill.getSelection();
                        // 用实际图片替换默认图片
                        const index = this.quill.getSelection().index - 1;
                        this.quill.deleteText(index, 1);
                        this.quill.insertEmbed(range.index, 'image', imageUrl, 'user');
                        this.quill.setSelection(range.index + 1);
                      }).catch((error) => {
                        console.error('图片上传失败:', error);
                      });
                    });
                  }
                });
                input.click();
              }
            }
          },
          syntax: {
            highlight: text => {
              return hljs.highlightAuto(text).value; // 这里就是代码高亮需要配置的地方
            }
          },
          ImageExtend: {
            loading: true,
            name: 'file',
            action: '/api/article/uploadFile',
            response: (res) => {
              return res.info;
            },
            accept: 'image/png' // 新增属性，限制只接受 PNG 格式文件
          }
        },
        placeholder: '在这里编辑内容。。。',
        theme: 'snow'
      },
      viewMode: true,
      loadingImg: '/loading-img.svg',
      loadingError: '/loading-error.svg'
    }
  },
  mounted() {
    const articleId = this.$route.query.id;
    this.viewMode = this.$route.query.mode !== 'edit' && articleId;
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
        this.title = data.title;
        this.content = data.content;
        this.$nextTick(() => {
          this.addImageClickListeners();
        });
      });
    }
  }
  ,
  methods: {
    onTextChange() { // 新增方法，统计字数
      this.wordCount = this.$refs.myQuillEditor.quill.getText().trim().length;
    }
    ,
    cancel() { // 新增方法，取消按钮功能
      // 关闭当前tab页的逻辑，这里假设使用的是浏览器的关闭标签页功能
      window.close();
    }
    ,
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
    ,
    highlightCode(html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const codeBlocks = tempDiv.querySelectorAll('pre');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block);
      });
      const blockquotes = tempDiv.querySelectorAll('blockquote');
      blockquotes.forEach((blockquote) => {
        // 你可以在这里添加针对 blockquote 的样式处理
        blockquote.style.borderLeft = '4px solid #ccc';
        blockquote.style.paddingLeft = '15px';
        blockquote.style.backgroundColor = '#f9f9f9';
      });
      return tempDiv.innerHTML;
    }
    ,
    addImageClickListeners() {
      const images = this.$el.querySelectorAll('.ql-editor img');
      images.forEach(img => {
        img.addEventListener('dblclick', this.toggleImageSize);
        const originalSrc = img.src;
        img.src = this.loadingImg;
        img.setAttribute('data-original-src', originalSrc);
        const loadHandler = () => {
          img.src = originalSrc;
        };
        img.addEventListener('load', loadHandler);

        const errorHandler = () => {
          // 处理图片加载失败的情况，这里可以显示默认的错误图片
          img.src = this.loadingError;
          // 移除 load 事件监听器，避免无限循环
          img.removeEventListener('load', loadHandler);
        };
        img.addEventListener('error', errorHandler);
      });
    }
    ,
    toggleImageSize(event) {
      event.preventDefault(); // 阻止默认行为
      const img = event.target;
      // 创建一个新的图片元素用于放大显示
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.zIndex = '1000';
      container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      document.body.appendChild(container);
      const containerInner = document.createElement('div');
      containerInner.style.width = '100%';
      containerInner.style.height = '100%';
      containerInner.style.zIndex = '1001';
      containerInner.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      containerInner.style.position = 'relative';
      container.appendChild(containerInner);

      const expandedImg = document.createElement('img');
      expandedImg.src = img.src;
      // expandedImg.classList.add('expanded');
      expandedImg.style.position = 'absolute';
      expandedImg.style.top = '50%';
      expandedImg.style.left = '50%';
      expandedImg.style.transform = 'translate(-50%, -50%)';
      expandedImg.style.zIndex = '1001';
      expandedImg.style.maxWidth = '90%';
      expandedImg.style.maxHeight = '90%';
      expandedImg.style.boxShadow = '0 2px 12px 0 rgba(0, 0, 0, 0.5)';
      containerInner.appendChild(expandedImg);

      let scale = 1;
      const zoomFactor = 0.1;

      const handleWheel = (event) => {
        event.preventDefault();
        if (event.deltaY < 0) {
          scale += zoomFactor;
        } else {
          scale -= zoomFactor;
        }
        expandedImg.style.transform = `translate(-50%, -50%) scale(${scale})`;
      };

      expandedImg.addEventListener('wheel', handleWheel);

      containerInner.onmousedown = e => {
        const offsetX = e.offsetX;
        const offsetY = e.offsetY;
        containerInner.onmousemove = e => {
          expandedImg.style.left = `${e.clientX - offsetX + expandedImg.offsetWidth / 2}px`;
          expandedImg.style.top = `${e.clientY - offsetY + expandedImg.offsetHeight / 2}px`;
        };
        containerInner.onmouseup = () => {
          containerInner.onmousemove = null;
          containerInner.onmouseup = null;
        };
      }

      // 点击放大后的图片关闭
      expandedImg.addEventListener('click', () => {
        document.body.removeChild(container);
        document.body.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove');
        document.removeEventListener('mouseup');
      });
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
</style>
