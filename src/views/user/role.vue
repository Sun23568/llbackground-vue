<template>
  <div class="page-container">
    <div class="chat-container">
      <div class="chat-header">
        <h2>deepseek原生</h2>
      </div>
      <div class="chat-body">
        <simplebar style="height: 100%;">
          <div class="response-area" id="response" style="white-space: pre-wrap;" @mouseenter="showCopyButton = true"
               @mouseleave="showCopyButton = false">
            {{ response }}
            <!-- 新增: 复制和清空按钮 -->
            <div v-if="isResponseComplete" class="button-group">
              <el-button-group>
                <el-button type="text" class="copy-button" @click="copyResponse">复制</el-button>
                <el-button type="text" class="clear-button" @click="clearResponse">清空</el-button>
              </el-button-group>
            </div>
          </div>
        </simplebar>
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
      lastQuestion: '' // 新增: 用于存储上一次的问题
    };
  },
  methods: {
    async askQuestion() {
      if (this.isLoading) return; // 如果已经在加载中，不重复请求
      this.response = ''; // 清空之前的回答
      if (this.chatList.length > 5) {
        this.chatList.shift();
      }
      this.chatList.push({
        question: this.question,
        response: ''
      });

      this.isLoading = true; // 设置加载状态

      try {
        const response = await fetch(`/api/ollama/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
          body: JSON.stringify({
            chatList: this.chatList,
            modelName: 'luoli'
          })
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const {value, done: doneReading} = await reader.read();
          done = doneReading;
          if (value) {
            const decodedValue = decoder.decode(value);
            this.response += decodedValue.replaceAll('\\n', '\n');
          }
          this.chatList[this.chatList.length - 1].response = this.response;
          this.isLoading = false; // 取消加载状态
          this.isResponseComplete = true; // 设置回答完成状态
          // 新增: 清空提问框内容
          this.question = '';
          // 新增: 存储上一次的问题
          this.lastQuestion = this.chatList[this.chatList.length - 1].question;
        }
      } catch (error) {
        this.isLoading = false; // 取消加载状态
        this.isResponseComplete = true; // 设置回答完成状态
        // 新增: 清空提问框内容
        this.question = '';
      }
    },
    async askQuestion1() {
      if (this.isLoading) return; // 如果已经在加载中，不重复请求
      this.response = ''; // 清空之前的回答
      if (this.chatList.length > 5) {
        this.chatList.shift();
      }
      this.chatList.push({
        question: this.question,
        response: ''
      });

      this.isLoading = true; // 设置加载状态

      try {
        //添加新角色
        const response = await fetch(
          '/api/ollama/chat', {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            // data: {
            //   chatList: this.chatList,
            //   modelName: 'luoli'
            // }
            body: JSON.stringify({
              model: 'luoli',
              messages: [{
                role: 'user',
                content: '你好'
              }],
              stream: true
            })
          }
        );
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const {value, done: doneReading} = await reader.read();
          done = doneReading;
          if (value) {
            const decodedValue = decoder.decode(value, {stream: !done});
            console.log(decodedValue);
          }
        }
      } catch (error) {
        this.isLoading = false; // 取消加载状态
        this.isResponseComplete = true; // 设置回答完成状态
        // 新增: 清空提问框内容
        this.question = '';
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
    },

    // 新增: 重复提问方法
    repeatQuestion() {
      if (this.lastQuestion) {
        // 将最后一个问题删除
        this.chatList.pop();
        this.question = this.lastQuestion;
        this.askQuestion();
      }
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
  background-image: url('../../assets/banner-background.jpg'); /* 确保路径正确 */
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
  max-width: 800px;
  width: 90%; /* 使用相对单位 */
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto; /* 确保水平居中 */
  height: 80vh; /* 设置固定高度 */
  background-color: rgba(255, 255, 255, 0.5); /* 设置背景颜色为半透明 */
  position: relative; /* 确保子元素的定位相对于 chat-container */
}

.chat-header {
  text-align: center;
  margin-bottom: 5px; /* 修改: 将 margin-bottom 从 10px 改为 5px */
}

.chat-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1; /* 使 chat-body 占据剩余空间 */
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
  max-height: calc(94% - 94px); /* 修改: 减少最大高度，确保底部留出 question-input 的空间 */
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
</style>

