<template>
  <div class="page-container">
    <div class="chat-container">
      <div class="chat-body">
        <SimpleBar style="height: 100%;">
          <div class="response-area" id="response" style="white-space: pre-line;" @mouseenter="showCopyButton = true"
               @mouseleave="showCopyButton = false">
            {{ response }}
            <!-- 新增: 复制和清空按钮 -->
            <div v-if="isResponseComplete" class="button-group">
              <el-button-group>
                <el-button type="text" class="copy-button" @click="copyResponse">复制</el-button>
                <el-button type="text" class="clear-button" @click="clearResponse">清空</el-button>
                <!-- 新增: 生成关键字按钮 -->
                <el-button type="text" :disabled="isGeneratingKeywords || isGeneratingImage"
                           class="generate-keywords-button" @click="generateKeywords">生成图片
                </el-button>
              </el-button-group>
            </div>
          </div>
        </SimpleBar>
      </div>
      <!-- 新增: 图片展示区域 -->
      <div class="image-area">
        <img v-if="imageUrl" :src=imageUrl alt="展示图片" class="display-image"/>
        <!-- 新增: 加载指示器 -->
        <div v-if="isGeneratingKeywords || isGeneratingImage" class="loading-indicator">
          <i class="el-icon-loading"></i>
        </div>
      </div>
      <div class="question-input">
        <el-input
          v-model="question"
          size="medium"
          placeholder="请输入你的问题"
          @keyup.enter.native="askQuestion"
        />
        <el-button
          type="primary"
          @click="askQuestion"
          :loading="isLoading"
          :disabled="isLoading"
        >
          提问
        </el-button>
        <!-- 新增: 重复提问按钮 -->
        <el-button
          type="primary"
          @click="repeatQuestion"
          :loading="isLoading"
          :disabled="isLoading || !lastQuestion"
        >
          重复提问
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import SimpleBar from 'simplebar-vue';
import 'simplebar/dist/simplebar.min.css';

export default {
  components: {
    SimpleBar
  },
  data() {
    return {
      question: '',
      response: '',
      chatList: [],
      isLoading: false,
      showCopyButton: false, // 添加 showCopyButton 状态
      isResponseComplete: false, // 添加 isResponseComplete 状态
      lastQuestion: '', // 新增: 用于存储上一次的问题
      keyWord: '',
      imageUrl: '', // 新增: 用于存储图片的URL
      isGeneratingKeywords: false, // 新增: 标志位，表示是否正在生成关键字
      isGeneratingImage: false // 新增: 标志位，表示是否正在生成图片
    };
  },
  methods: {
    async fetchStream(body, onChunk) {
      const response = await fetch(`/api/ollama/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(body)
      });
      const reader = response.body.getReader();
      let done = false;
      let started = false; // 新增: 标记是否已经开始处理非回车字符

      while (!done) {
        const {value, done: doneReading} = await reader.read();
        done = doneReading;
        // 解码
        let decodedValue = "";
        if (value) {
          decodedValue += new TextDecoder('utf-8').decode(value).replaceAll('\\n', '\n');
        }
        // 找到第一个非回车字符的位置
        if (!started) {
          if ("" !== decodedValue.trim()) {
            started = true;
          }
        }
        if (started) {
          onChunk({decodedValue, done});
        }
      }
    },
    async askQuestion() {
      if (this.isLoading) return; // 如果已经在加载中，不重复请求
      this.isResponseComplete = false;
      this.response = ''; // 清空之前的回答
      if (this.chatList.length > 5) {
        this.chatList.shift();
      }
      this.chatList.push({
        question: this.question,
        response: ''
      });

      this.isLoading = true; // 设置加载状态

      const body = {
        chatList: this.chatList,
        modelName: 'jiejie'
      };

      try {
        await this.fetchStream(body, ({decodedValue, done}) => {
          this.response += decodedValue;
          this.chatList[this.chatList.length - 1].response = this.response;
          if (done) {
            console.log('回答完成:done');
            this.m = false; // 取消加载状态
            this.isResponseComplete = true; // 设置回答完成状态
            // 新增: 清空提问框内容
            this.question = '';
            // 新增: 存储上一次的问题
            this.lastQuestion = this.chatList[this.chatList.length - 1].question;
            this.isResponseComplete = true;
          }
        });
      } catch (error) {
        this.isLoading = false; // 取消加载状态
        this.isResponseComplete = true; // 设置回答完成状态
        // 新增: 清空提问框内容
        this.question = '';
      } finally {
        this.isLoading = false;
        this.isResponseComplete = true;
      }
    },

    copyResponse() {
      navigator.clipboard.writeText(this.response).then(() => {
        this.$message.success('复制成功');
      }).catch(err => {
        this.$message.error('复制失败');
      });
    },

    // 新增: 清空回答框内容的方法
    clearResponse() {
      this.response = '';
      this.imageUrl = ''; // 清空图片URL
    },

    // 新增: 重复提问方法
    repeatQuestion() {
      if (this.lastQuestion) {
        // 将最后一个问题删除
        this.chatList.pop();
        this.question = this.lastQuestion;
        this.askQuestion();
      }
    },

    // 新增: 生成关键字方法
    async generateKeywords() {
      this.isGeneratingKeywords = true; // 设置正在生成关键字
      const body = {
        modelName: 'makeKey',
        chatList: [
          {
            question: this.response,
            response: ''
          }
        ]
      };

      try {
        this.keyWord = '';
        await this.fetchStream(body, ({decodedValue, done}) => {
          this.keyWord += decodedValue;
          if (done) {
            this.generateImage();
          }
        });
      } catch (error) {
        console.error('生成关键字失败', error);
      } finally {
        this.isGeneratingKeywords = false; // 清除正在生成关键字
      }
    },

    async generateImage() {
      this.isGeneratingImage = true; // 设置正在生成图片
      const response = await fetch(`/api/comfy-ui/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({keyWord: this.keyWord})
      });
      const reader = response.body.getReader();
      let done = false;
      let url = '';

      while (!done) {
        const {value, done: doneReading} = await reader.read();
        done = doneReading;
        // 解码
        if (value) {
          url += new TextDecoder('utf-8').decode(value);
        }
      }
      this.imageUrl = url;
      this.isGeneratingImage = false; // 清除正在生成图片
    }
  }
};
</script>

<style scoped>
body, html {
  height: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-container {
  /* background-image: url('/banner-background.jpg');  确保路径正确 */
  background-size: cover; /* 背景图片覆盖整个屏幕 */
  background-position: center; /* 背景图片居中 */
  background-repeat: no-repeat; /* 防止背景图片重复 */
  height: 100vh; /* 设置容器高度为视口高度 */
  width: 100%; /* 确保容器宽度为视口宽度 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-container {
  max-width: 1000px; /* 增加最大宽度以适应图片区域 */
  width: 90%; /* 使用相对单位 */
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row; /* 修改: 改为水平布局 */
  gap: 20px;
  margin: 0 auto; /* 确保水平居中 */
  height: 75vh; /* 修改: 设置固定高度为75vh */
  background-color: rgba(255, 255, 255, 0.5); /* 设置背景颜色为半透明 */
  position: relative; /* 确保子元素的定位相对于 chat-container */
}

.chat-body {
  flex: 0 0 67%; /* 修改: 设置宽度为67% */
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%; /* 确保 chat-body 占据 chat-container 的高度 */
  position: relative; /* 确保子元素的定位相对于 chat-body */
}

.response-area {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  overflow-y: auto; /* 添加滚动条 */
  flex: 1; /* 使 response-area 占据剩余空间 */
  max-height: calc(94% - 21px); /* 修改: 减少最大高度，确保底部留出 question-input 的空间 */
  min-height: calc(94% - 21px); /* 修改: 减少最大高度，确保底部留出 question-input 的空间 */
  position: absolute; /* 绝对定位 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 60px; /* 确保底部留出 question-input 的空间 */
  background-color: rgba(255, 255, 255, 0.5); /* 设置背景颜色为半透明 */
  position: relative; /* 绝对定位 */
}

.button-group {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.copy-button, .clear-button {
  margin-left: 5px; /* 添加间距 */
}

.copy-button:hover, .clear-button:hover {
}

.response-area:hover .copy-button,
.response-area:hover .clear-button {
  display: inline-block; /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.copy-button {
  background-color: transparent; /* 保持透明背景 */
  color: #409EFF; /* 保持文字颜色 */
  border: none; /* 保持无边框 */
  font-size: 14px; /* 保持字体大小 */
  cursor: pointer; /* 保持鼠标指针 */
  transition: color 0.3s ease; /* 保持过渡效果 */
}

.copy-button:hover {
  color: #66B1FF; /* 修改: 鼠标悬停时的文字颜色 */
}

.clear-button {
  background-color: transparent; /* 保持透明背景 */
  color: #409EFF; /* 保持文字颜色 */
  border: none; /* 保持无边框 */
  font-size: 14px; /* 保持字体大小 */
  cursor: pointer; /* 保持鼠标指针 */
  transition: color 0.3s ease; /* 保持过渡效果 */
}

.clear-button:hover {
  color: #66B1FF; /* 修改: 鼠标悬停时的文字颜色 */
}

.question-input {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.5); /* 设置背景颜色为半透明 */
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  position: absolute; /* 绝对定位 */
  bottom: 0; /* 固定在底部 */
  left: 0;
  right: 0;
  z-index: 1; /* 确保在最上层 */
  margin-bottom: 20px; /* 修改: 增加底部外边距 */
}

.el-input {
  flex: 1;
}

/* 自定义滚动条样式 */
.response-area::-webkit-scrollbar {
  width: 8px; /* 滚动条宽度 */
}

.response-area::-webkit-scrollbar-thumb {
  background-color: #888; /* 滚动条颜色 */
  border-radius: 4px; /* 圆角 */
}

.response-area::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* 鼠标悬停时的颜色 */
}

.response-area::-webkit-scrollbar-track {
  background-color: #f1f1f1; /* 轨道颜色 */
}

.copy-button {
  display: none;
  background-color: #409EFF; /* 还原默认背景色 */
  color: #FFFFFF; /* 还原默认文字颜色 */
  border: none; /* 还原默认边框 */
  border-radius: 4px; /* 还原默认圆角 */
  padding: 5px 10px; /* 还原默认内边距 */
  transition: background-color 0.3s ease; /* 还原默认过渡效果 */
  font-size: 14px; /* 还原默认字体大小 */
}

.response-area:hover .copy-button {
  display: inline-block; /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.copy-button:hover {
  background-color: #66B1FF; /* 还原默认鼠标悬停时的背景色 */
}

.clear-button {
  display: none;
  background-color: #409EFF; /* 还原默认背景色 */
  color: #FFFFFF; /* 还原默认文字颜色 */
  border: none; /* 还原默认边框 */
  border-radius: 4px; /* 还原默认圆角 */
  padding: 5px 10px; /* 还原默认内边距 */
  transition: background-color 0.3s ease; /* 还原默认过渡效果 */
  font-size: 14px; /* 还原默认字体大小 */
}

.response-area:hover .clear-button {
  display: inline-block; /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.clear-button:hover {
  background-color: #66B1FF; /* 还原默认鼠标悬停时的背景色 */
}

.generate-keywords-button {
  display: none;
  background-color: #409EFF; /* 还原默认背景色 */
  color: #FFFFFF; /* 还原默认文字颜色 */
  border: none; /* 还原默认边框 */
  border-radius: 4px; /* 还原默认圆角 */
  padding: 5px 10px; /* 还原默认内边距 */
  transition: background-color 0.3s ease; /* 还原默认过渡效果 */
  font-size: 14px; /* 还原默认字体大小 */
}

.response-area:hover .generate-keywords-button {
  display: inline-block; /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.generate-keywords-button:hover {
  background-color: #66B1FF; /* 还原默认鼠标悬停时的背景色 */
}

.generate-keywords-button[disabled] {
  background-color: #cccccc; /* 禁用时的背景色 */
  cursor: not-allowed; /* 禁用时的鼠标指针 */
}

.image-area {
  flex: 0 0 33%; /* 修改: 设置宽度为33% */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  max-height: calc(94% - 21px); /* 修改: 减少最大高度，确保底部留出 question-input 的空间 */
  min-height: calc(94% - 21px); /* 修改: 减少最大高度，确保底部留出 question-input 的空间 */
  position: absolute; /* 绝对定位 */
  top: 0;
  right: 0;
  bottom: 60px; /* 确保底部留出 question-input 的空间 */
  background-color: rgba(255, 255, 255, 0.5); /* 设置背景颜色为半透明 */
  position: relative; /* 绝对定位 */
}

.display-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

/* 新增: 加载指示器样式 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #409EFF;
}
</style>
