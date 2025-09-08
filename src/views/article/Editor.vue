<template>
  <div>
    <div class="editor" ref="editor" :style="styles"></div>
  </div>
</template>
<script>
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 确保导入了样式

import javascript from 'highlight.js/lib/languages/javascript';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('java', java);
hljs.registerLanguage('python', python);

// !!! 关键步骤：在导入 Quill 之前，将 hljs 挂载到全局 window 对象上
window.hljs = hljs; // [!code ++]

// 现在再导入 Quill 和相关模块
import Quill from 'quill';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

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
            hljs: hljs
          },
          toolbar: {
            container: [
              ["wordBox", "bold", "italic", "underline", "strike"], //加粗，斜体，下划线，删除线
              ["blockquote", "code-block"], //引用，代码块
              [{header: 1}, {header: 2}], // 标题，键值对的形式；1、2表示字体大小
              [{list: "ordered"}, {list: "bullet"}], //列表
              [{script: "sub"}, {script: "super"}], // 上下标
              [{indent: "-1"}, {indent: "+1"}], // 缩进
              [{direction: "rtl"}], // 文本方向
              [{'size': ['12px', '14px', '16px', '20px', '24px', '32px']}], // 字体大小
              [{header: [1, 2, 3, 4, 5, 6, false]}], //几级标题
              [{color: []}, {background: []}], // 字体颜色，字体背景颜色
              [{'font': ['SimSun', 'SimHei', 'Microsoft-YaHei', 'KaiTi', 'FangSong', 'Arial']}], //字体
              [{align: []}], //对齐方式
              ["clean"], //清除字体样式
              ["link", "image"], //上传图片、上传视频
            ],
            handlers: {
              //实现首行缩进的功能
              wordBox: function (val) {
                const quill = this.quill;
                const range = quill.getSelection();
                if (!range) return;

                // 👇 用 Quill 的 formatText  API 给选中段落加缩进样式
                quill.formatText(
                  range.index,
                  range.length,
                  { 'text-indent': '2em' },
                  Quill.sources.USER
                );
              },
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
      ]
    }
  },
  computed: {
    styles() {
      // 设置宽高
      let style = {width: '1200px'};
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
            this.quill.clipboard.dangerouslyPasteHTML(this.currentValue);
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
      // 初始化
      const editor = this.$refs.editor;
      this.quill = new Quill(editor, this.options);
      this.quill.clipboard.dangerouslyPasteHTML(this.currentValue);
      this.quill.on("text-change", (delta, oldDelta, source) => {
        let html = this.$refs.editor.children[0].innerHTML;
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
    },
  },
};
</script>

<style lang="less" scoped>
@import 'highlight.js/styles/atom-one-dark.css';

::v-deep {
  .ql-toolbar {
    /* 要与styles()方法中的width保持一致 */
    width: 1200px;
  }

  /*设置字体和字体大小*/

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
}
</style>
