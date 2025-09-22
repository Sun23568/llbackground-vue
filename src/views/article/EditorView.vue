<template>
  <div class="editor-view-wrapper">
    <div class="viewer" ref="viewer" :style="styles"></div>
  </div>
</template>

<script>
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/agate.css';
const Delta = Quill.import('delta');
window.hljs = hljs;

hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.registerLanguage('java', require('highlight.js/lib/languages/java'));
hljs.registerLanguage('python', require('highlight.js/lib/languages/python'));
hljs.registerLanguage('vbscript-html', require('highlight.js/lib/languages/vbscript-html'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('css', require('highlight.js/lib/languages/css'));

import Quill from 'quill';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'viewerjs/dist/viewer.css';

// 注册字体大小格式
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['12px', '14px', '16px', '20px', '24px', '32px'];
Quill.register(Size, true);

// 注册字体格式
const Font = Quill.import('attributors/style/font');
Font.whitelist = ['SimSun', 'SimHei', 'Microsoft-YaHei', 'KaiTi', 'FangSong', 'Arial'];
Quill.register(Font, true);

export default {
  name: "Viewer",
  props: {
    /* 展示器的内容 */
    value: {
      type: String,
      default: "",
    },
    /* 高度 */
    height: {
      type: Number,
      default: null,
    },
    /* 最小高度 */
    minHeight: {
      type: Number,
      default: 400,
    },
  },
  data() {
    return {
      quill: null,
      currentValue: "",
      options: {
        theme: "snow",
        bounds: document.body,
        debug: "warn",
        modules: {
          syntax: {
            highlight: text => hljs.highlightAuto(text).value
          },
          toolbar: false  // 禁用工具栏
        },
        readOnly: true,  // 设置为只读模式
        placeholder: "",
      },
    }
  },
  computed: {
    styles() {
      // 设置宽高
      let style = {};
      if (this.minHeight) {
        style.minHeight = `${this.minHeight}px`;
      }
      if (this.height) {
        style.height = `${this.height}px`;
      } else {
        // 如果没有指定高度，则使用auto以支持内容滚动
        style.height = 'auto';
      }
      return style;
    },
  },
  watch: {
    value: {
      handler(val) {
        if (val !== this.currentValue) {
          this.currentValue = (val === null || val === '<p><br></p>') ? "" : val;
          if (this.quill) {
            const html = this.currentValue;
            const div = document.createElement('div');
            div.innerHTML = html;
            const preElements = div.querySelectorAll('pre.ql-syntax');
            preElements.forEach((pre) => {
              pre.textContent = pre.textContent;
            });
            let correctedHtml = div.innerHTML;
            correctedHtml = correctedHtml.replace(/<p>\t/g, '<p>&nbsp;&nbsp;&nbsp;&nbsp;');
            let delta = this.quill.clipboard.convert(correctedHtml);
            delta = this.removeNewlineBeforePre(delta);
            this.quill.setContents(delta);
            // 清除历史记录
            this.quill.history.clear();
          }
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {
    this.quill = null;
  },
  methods: {
    init() {
      const viewer = this.$refs.viewer;
      this.quill = new Quill(viewer, this.options);

      // 禁用编辑功能
      this.quill.disable();

      this.quill.on("text-change", (delta, oldDelta, source) => {
        let html = this.$refs.viewer.children[0].innerHTML;
        this.currentValue = html;
        const text = this.quill.getText();
        const quill = this.quill;
        this.$emit("input", html);
        this.$emit("on-change", {html, text, quill});
      });
    },
    removeNewlineBeforePre(delta) {
      const ops = [...delta.ops];

      for (let i = 0; i < ops.length - 1; i++) {
        const currentOp = ops[i];
        const nextOp = ops[i + 1];

        // 检查当前操作是否以换行符结尾
        if (currentOp.insert && typeof currentOp.insert === 'string' && (currentOp.insert.endsWith('\n') && !currentOp.attributes)) {
          // 检查下一个操作是否是插入 pre 格式的文本
          if (nextOp.attributes && (nextOp.attributes['code-block'] || nextOp.attributes['blockquote'])) {
            // 如果当前操作只有换行符，则移除整个操作
            if (currentOp.insert === '\n') {
              ops.splice(i, 1);
              i--; // 调整索引
            }
            // 如果当前操作包含内容和换行符，则只移除换行符
            else if (currentOp.insert.length > 1) {
              currentOp.insert = currentOp.insert.slice(0, -1);
            }
          }
        }
      }
      return new Delta(ops);
    },
  }
};
</script>

<style lang="less" scoped>
.editor-view-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.viewer {
  position: relative;

  ::v-deep .ql-toolbar {
    display: none; /* 隐藏工具栏 */
  }

  ::v-deep .ql-editor {
    padding: 20px;
    overflow: visible; /* 允许内容溢出 */
    height: auto;
  }

  ::v-deep .ql-container {
    border: none;
    height: auto;
    overflow: visible; /* 允许容器溢出 */
  }

  ::v-deep .ql-editor:focus {
    outline: none;
    border: none;
  }

  ::v-deep .ql-picker.ql-font .ql-picker-label[data-value=SimSun]::before,
  ::v-deep .ql-picker.ql-font .ql-picker-item[data-value=SimSun]::before {
    content: "宋体";
    font-family: "SimSun" !important;
  }

  ::v-deep .ql-picker.ql-font .ql-picker-label[data-value=SimHei]::before,
  ::v-deep .ql-picker.ql-font .ql-picker-item[data-value=SimHei]::before {
    content: "黑体";
    font-family: "SimHei";
  }

  ::v-deep .ql-picker.ql-font .ql-picker-label[data-value=Microsoft-YaHei]::before,
  ::v-deep .ql-picker.ql-font .ql-picker-item[data-value=Microsoft-YaHei]::before {
    content: "微软雅黑";
    font-family: "Microsoft YaHei";
  }

  ::v-deep .ql-picker.ql-font .ql-picker-label[data-value=KaiTi]::before,
  ::v-deep .ql-picker.ql-font .ql-picker-item[data-value=KaiTi]::before {
    content: "楷体";
    font-family: "KaiTi" !important;
  }

  ::v-deep .ql-picker.ql-font .ql-picker-label[data-value=FangSong]::before,
  ::v-deep .ql-picker.ql-font .ql-picker-item[data-value=FangSong]::before {
    content: "仿宋";
    font-family: "FangSong";
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
    content: '一级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
    content: '二级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
    content: '三级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
    content: '四级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
    content: '五级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
    content: '六级标题';
  }

  ::v-deep .ql-picker.ql-header .ql-picker-label::before,
  ::v-deep .ql-picker.ql-header .ql-picker-item::before {
    content: '标准';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='12px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='12px']::before {
    content: '12px';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='14px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='14px']::before {
    content: '14px';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='16px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='16px']::before {
    content: '16px';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='20px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='20px']::before {
    content: '20px';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='24px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='24px']::before {
    content: '24px';
  }

  ::v-deep .ql-picker.ql-size .ql-picker-label[data-value='32px']::before,
  ::v-deep .ql-picker.ql-size .ql-picker-item[data-value='32px']::before {
    content: '32px';
  }

  ::v-deep .ql-snow .ql-picker.ql-size .ql-picker-label[data-value='32px']::before,
  ::v-deep .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='32px']::before {
    content: '32px';
  }

  ::v-deep .ql-snow .ql-editor pre.ql-syntax {
    background-color: #333;
    color: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow: auto;
  }
}
</style>
