<template>
  <div>
    <div class="editor" ref="editor" :style="styles"></div>
  </div>
</template>
<script>
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/agate.css';

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
import 'quill/dist/quill.bubble.css';

// 图片粘贴用
const Delta = Quill.import('delta');
// 图片预览
import Viewer from 'viewerjs';
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
  name: "Editor",
  props: {
    /* 编辑器的内容 */
    value: {
      type: String,
      default: "",
    },
    /* 高度 */
    height: {
      type: Number,
      default: 600,
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
          toolbar: {
            container: [
              ["wordBox", "bold", "italic", "underline", "strike"],
              ["blockquote", "code-block"],
              [{header: 1}, {header: 2}],
              [{list: "ordered"}, {list: "bullet"}],
              [{script: "sub"}, {script: "super"}],
              [{indent: "-1"}, {indent: "+1"}],
              [{direction: "rtl"}],
              [{'size': ['12px', '14px', '16px', '20px', '24px', '32px']}],
              [{header: [1, 2, 3, 4, 5, 6, false]}],
              [{color: []}, {background: []}],
              [{'font': ['SimSun', 'SimHei', 'Microsoft-YaHei', 'KaiTi', 'FangSong', 'Arial']}],
              [{align: []}],
              ["clean"],
              ["link", "image"],
            ],
            handlers: {
              //实现首行缩进的功能
              wordBox: function (val) {
                const quill = this.quill;
                const range = quill.getSelection();
                if (!range) return;

                quill.formatText(
                  range.index,
                  range.length,
                  {'text-indent': '2em'},
                  Quill.sources.USER
                );
              }
            }
          }
        },
        placeholder: "请输入内容",
      },
      // 图标显示对应的文字提示
      titleConfig: [
        {Choice: '.ql-wordBox', title: '首行缩进'},
        {Choice: '.ql-insertMetric', title: '跳转配置'},
        {Choice: '.ql-bold', title: '加粗'},
        {Choice: '.ql-italic', title: '斜体'},
        {Choice: '.ql-underline', title: '下划线'},
        {Choice: '.ql-header', title: '段落格式'},
        {Choice: '.ql-strike', title: '删除线'},
        {Choice: '.ql-blockquote', title: '块引用'},
        {Choice: '.ql-code', title: '插入代码'},
        {Choice: '.ql-code-block', title: '插入代码段'},
        {Choice: '.ql-font', title: '字体'},
        {Choice: '.ql-size', title: '字体大小'},
        {Choice: '.ql-list[value="ordered"]', title: '编号列表'},
        {Choice: '.ql-list[value="bullet"]', title: '项目列表'},
        {Choice: '.ql-direction', title: '文本方向'},
        {Choice: '.ql-header[value="1"]', title: 'h1'},
        {Choice: '.ql-header[value="2"]', title: 'h2'},
        {Choice: '.ql-align', title: '对齐方式'},
        {Choice: '.ql-color', title: '字体颜色'},
        {Choice: '.ql-background', title: '背景颜色'},
        {Choice: '.ql-image', title: '图像'},
        {Choice: '.ql-video', title: '视频'},
        {Choice: '.ql-link', title: '添加链接'},
        {Choice: '.ql-formula', title: '插入公式'},
        {Choice: '.ql-clean', title: '清除字体格式'},
        {Choice: '.ql-script[value="sub"]', title: '下标'},
        {Choice: '.ql-script[value="super"]', title: '上标'},
        {Choice: '.ql-indent[value="-1"]', title: '向左缩进'},
        {Choice: '.ql-indent[value="+1"]', title: '向右缩进'},
        {Choice: '.ql-header .ql-picker-label', title: '标题大小'},
        {Choice: '.ql-align .ql-picker-item:first-child', title: '居左对齐'},
        {Choice: '.ql-align .ql-picker-item[data-value="center"]', title: '居中对齐'},
        {Choice: '.ql-align .ql-picker-item[data-value="right"]', title: '居右对齐'},
        {Choice: '.ql-align .ql-picker-item[data-value="justify"]', title: '两端对齐'},
      ],
      getImageBasePath: '/file/image'
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
            // 处理 pre 标签前的换行
            delta = this.removeNewlineBeforePre(delta);
            this.quill.setContents(delta);
            // 清除历史记录，防止通过 Ctrl+Z 撤销初始内容
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
      const editor = this.$refs.editor;
      this.quill = new Quill(editor, this.options);

      this.quill.on("text-change", (delta, oldDelta, source) => {
        let html = this.$refs.editor.children[0].innerHTML;
        console.log('html', html)
        this.currentValue = html;
        const text = this.quill.getText();
        const quill = this.quill;
        this.$emit("input", html);
        this.$emit("on-change", {html, text, quill});
      });
      this.quill.on("selection-change", (range, oldRange, source) => {
        this.$emit("on-selection-change", range, oldRange, source);
      });
      this.quill.on("editor-change", (eventName, ...args) => {
        this.$emit("on-editor-change", eventName, ...args);
      });
      // 首行缩进的图标
      document.querySelector('.ql-wordBox').innerHTML = '<i class="el-icon-s-unfold"/>'
      // 鼠标悬浮在图标上显示对应的标题
      this.titleConfig.forEach(item => {
        const tip = document.querySelector(item.Choice)
        if (tip) {
          tip.setAttribute('title', item.title)
        }
      });
      // 处理图片预览
      this.previewImg(editor)
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
    previewImg(editor) {
      // 修改图片点击事件，触发 Viewer.js
      editor.addEventListener('dblclick', (e) => {
        this.viewer = new Viewer(e.target, {
          inline: false,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true,
          transition: true,
          fullscreen: true,
          keyboard: true,
          toolbar: {
            zoomIn: 4,
            zoomOut: 4,
            reset: 4,
            play: {
              show: 4,
              size: 'large',
            },
            rotateLeft: 4,
            rotateRight: 4,
            flipHorizontal: 4,
            flipVertical: 4,
          }
        });
        if (e.target.tagName === 'IMG') {
          e.preventDefault();
          this.viewer.show();
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
::v-deep {
  .ql-picker.ql-font .ql-picker-label[data-value=SimSun]::before, .ql-picker.ql-font .ql-picker-item[data-value=SimSun]::before {
    content: "宋体";
    font-family: "SimSun" !important;
  }

  .ql-picker.ql-font .ql-picker-label[data-value=SimHei]::before, .ql-picker.ql-font .ql-picker-item[data-value=SimHei]::before {
    content: "黑体";
    font-family: "SimHei";
  }

  .ql-picker.ql-font .ql-picker-label[data-value=Microsoft-YaHei]::before, .ql-picker.ql-font .ql-picker-item[data-value=Microsoft-YaHei]::before {
    content: "微软雅黑";
    font-family: "Microsoft YaHei";
  }

  .ql-picker.ql-font .ql-picker-label[data-value=KaiTi]::before, .ql-picker.ql-font .ql-picker-item[data-value=KaiTi]::before {
    content: "楷体";
    font-family: "KaiTi" !important;
  }

  .ql-picker.ql-font .ql-picker-label[data-value=FangSong]::before, .ql-picker.ql-font .ql-picker-item[data-value=FangSong]::before {
    content: "仿宋";
    font-family: "FangSong";
  }

  .ql-picker.ql-header .ql-picker-label[data-value='1']::before, .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
    content: '一级标题';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='2']::before, .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
    content: '二级标题';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='3']::before, .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
    content: '三级标题';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='4']::before, .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
    content: '四级标题';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='5']::before, .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
    content: '五级标题';
  }

  .ql-picker.ql-header .ql-picker-label[data-value='6']::before, .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
    content: '六级标题';
  }

  .ql-picker.ql-header .ql-picker-label::before, .ql-picker.ql-header .ql-picker-item::before {
    content: '标准';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='12px']::before, .ql-picker.ql-size .ql-picker-item[data-value='12px']::before {
    content: '12px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='14px']::before, .ql-picker.ql-size .ql-picker-item[data-value='14px']::before {
    content: '14px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='16px']::before, .ql-picker.ql-size .ql-picker-item[data-value='16px']::before {
    content: '16px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='20px']::before, .ql-picker.ql-size .ql-picker-item[data-value='20px']::before {
    content: '20px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='24px']::before, .ql-picker.ql-size .ql-picker-item[data-value='24px']::before {
    content: '24px';
  }

  .ql-picker.ql-size .ql-picker-label[data-value='32px']::before, .ql-picker.ql-size .ql-picker-item[data-value='32px']::before {
    content: '32px';
  }

  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value='32px']::before, .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='32px']::before {
    content: '32px';
  }

  .ql-snow .ql-editor pre.ql-syntax {
    background-color: #333;
  }
}
</style>
