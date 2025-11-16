<template>
  <div class="page-container" :style="{ backgroundImage: `url(${backgroundImageUrl})` }">
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
                  class="generate-keywords-button" @click="generateImage">生成图片
                </el-button>
              </el-button-group>
            </div>
          </div>
        </SimpleBar>
      </div>
      <!-- 新增: 图片展示区域 -->
      <div class="image-area">
        <div v-if="showSteps" class="steps-container">
          <el-steps :active="currentStep" direction="vertical" finish-status="success" class="vertical-steps">
            <el-step title="开始生成" />
            <el-step title="提取关键词" />
            <el-step title="构建文生图参数" />
            <el-step title="生成图片" />
          </el-steps>
        </div>
        <img v-if="imageUrl" :src=imageUrl alt="展示图片" class="display-image" />
        <!-- 新增: 加载指示器 -->
        <div v-if="isGeneratingKeywords || isGeneratingImage" class="loading-indicator">
          <i class="el-icon-loading"></i>
        </div>
      </div>
      <div class="question-input">
        <el-input v-model="question" size="medium" placeholder="请输入你的问题" @keyup.enter.native="askQuestion" />
        <el-button type="primary" @click="askQuestion" :loading="isLoading" :disabled="isLoading">
          提问
        </el-button>
        <UploadBackgroundButton ref="uploadBgBtn" :aiMenuId="aiMenuId" @background-updated="updateBackgroundImage" />
      </div>
    </div>
  </div>
</template>

<script>
import SimpleBar from 'simplebar-vue';
import UploadBackgroundButton from '@/components/UploadBackgroundButton.vue';
import 'simplebar/dist/simplebar.min.css';

export default {
  components: {
    SimpleBar,
    UploadBackgroundButton
  },
  data() {
    return {
      aiMenuId: 'girlAdventure',
      contextSize: 5,
      backgroundImageUrl: '',
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
      isGeneratingImage: false, // 新增: 标志位，表示是否正在生成图片
      showSteps: false,     // 控制步骤条显示
      currentStep: 0        // 当前步骤
    };
  },
  mounted() {
    // 加载背景图
    this.$nextTick(() => {
      if (this.$refs.uploadBgBtn) {
        this.$refs.uploadBgBtn.fetchAndSetBackground();
      }
    });
  },
  methods: {
    async updateBackgroundImage(data) {
      this.backgroundImageUrl = data.backgroundFileId;
      this.contextSize = data.contextSize;
    },
    async askQuestion() {
      if (this.isLoading) return; // 如果已经在加载中，不重复请求
      this.isResponseComplete = false;
      this.response = ''; // 清空之前的回答
      if (this.chatList.length > this.contextSize) {
        this.chatList.shift();
      }

      this.isLoading = true; // 设置加载状态

      const body = {
        message: this.question,
        context: this.chatList,
        model: 'luoli'
      };

      try {
        await this.fetchStream(
          body,
          (decodedValue) => {
            this.response += decodedValue;
          },
          () => {
            this.chatList.push(this.question);
            this.chatList.push(this.response);

            // 请求完成后的处理
            this.isLoading = false;
            this.isResponseComplete = true;
            this.question = ''; // 清空提问框内容
            this.lastQuestion = this.chatList[this.chatList.length - 1].question; // 存储上一次的问题
          }
        );
      } catch (error) {
        this.isLoading = false;
        this.isResponseComplete = true;
        this.question = ''; // 清空提问框内容
      }
    },
    async fetchStream(body, onDataReceived, onComplete) {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/stream+json;charset=utf-8'
          },
          body: JSON.stringify(body)
        });

        // 获取响应体的可读流
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        // 读取流数据
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // 执行完成时的逻辑
            if (onComplete) {
              onComplete();
            }
            break;
          }

          // 解码并处理数据 - 执行传入的处理逻辑
          const decodedValue = decoder.decode(value, { stream: true });
          if (onDataReceived) {
            onDataReceived(decodedValue);
          }
        }
      } catch (error) {
        throw error;
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

    async generateImage() {
      this.imageUrl = '';

      this.showSteps = true;
      this.currentStep = 0;

      this.isGeneratingKeywords = true;
      this.currentStep = 1;

      const body = {
        model: 'makeKey',
        message: this.response
      };

      try {
        this.keyWord = '';
        await this.fetchStream(body, (decodedValue) => {
          this.keyWord += decodedValue;
        }, () => {
          this.currentStep = 2;
          this.textToImage();
        });
      } catch (error) {
        this.currentStep = 0;
      } finally {
        this.isGeneratingKeywords = false;
      }
    },

    async textToImage() {
      this.isGeneratingImage = true;
      const response = await fetch(`/api/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({ keyWord: this.keyWord, modelName: this.aiMenuId })
      });
      const reader = response.body.getReader();
      let done = false;
      let url = '';
      let buildParamEnd = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        // 解码
        if (value) {
          if (!buildParamEnd) {
            this.currentStep = 3;
            buildParamEnd = true;
          } else {
            const decodedValue = new TextDecoder().decode(value);
            url = decodedValue;
          }
        }
      }
      this.imageUrl = url;
      this.isGeneratingImage = false;
      this.currentStep = 4;
      this.showSteps = false;
    }
  }
};
</script>

<style scoped>
body,
html {
  height: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-container {
  background-size: cover;
  /* 背景图片覆盖整个屏幕 */
  background-position: center;
  /* 背景图片居中 */
  background-repeat: no-repeat;
  /* 防止背景图片重复 */
  height: 100vh;
  /* 设置容器高度为视口高度 */
  width: 100%;
  /* 确保容器宽度为视口宽度 */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.chat-container {
  max-width: 1000px;
  /* 增加最大宽度以适应图片区域 */
  width: 90%;
  /* 使用相对单位 */
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin: 0 auto;
  height: 75vh;
  background-color: rgba(255, 255, 255, 0.85);
  position: relative;
}

.chat-body {
  flex: 0 0 67%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  position: relative;
}

.response-area {
  background-color: #ebeef5;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  overflow-y: auto;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.5);
  margin-bottom: 60px;
}

.button-group {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.copy-button,
.clear-button {
  margin-left: 5px;
}

.copy-button:hover,
.clear-button:hover {}

.response-area:hover .copy-button,
.response-area:hover .clear-button {
  display: inline-block;
}

.copy-button {
  background-color: transparent;
  color: #409EFF;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.copy-button:hover {
  color: #66B1FF;
}

.clear-button {
  background-color: transparent;
  color: #409EFF;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.clear-button:hover {
  color: #66B1FF;
}

.question-input {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.el-input {
  flex: 1;
}

.response-area::-webkit-scrollbar {
  width: 8px;
}

.response-area::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 4px;
}

.response-area::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

.response-area::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

.copy-button {
  display: none;
  background-color: #409EFF;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  transition: background-color 0.3s ease;
  font-size: 14px;
}

.response-area:hover .copy-button {
  display: inline-block;
}

.copy-button:hover {
  background-color: #66B1FF;
}

.clear-button {
  display: none;
  background-color: #409EFF;
  /* 还原默认背景色 */
  color: #FFFFFF;
  /* 还原默认文字颜色 */
  border: none;
  /* 还原默认边框 */
  border-radius: 4px;
  /* 还原默认圆角 */
  padding: 5px 10px;
  /* 还原默认内边距 */
  transition: background-color 0.3s ease;
  /* 还原默认过渡效果 */
  font-size: 14px;
  /* 还原默认字体大小 */
}

.response-area:hover .clear-button {
  display: inline-block;
  /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.clear-button:hover {
  background-color: #66B1FF;
  /* 还原默认鼠标悬停时的背景色 */
}

.generate-keywords-button {
  display: none;
  background-color: #409EFF;
  /* 还原默认背景色 */
  color: #FFFFFF;
  /* 还原默认文字颜色 */
  border: none;
  /* 还原默认边框 */
  border-radius: 4px;
  /* 还原默认圆角 */
  padding: 5px 10px;
  /* 还原默认内边距 */
  transition: background-color 0.3s ease;
  /* 还原默认过渡效果 */
  font-size: 14px;
  /* 还原默认字体大小 */
}

.response-area:hover .generate-keywords-button {
  display: inline-block;
  /* 修改: 使用 inline-block 使按钮排列在一行 */
}

.generate-keywords-button:hover {
  background-color: #66B1FF;
  /* 还原默认鼠标悬停时的背景色 */
}

.generate-keywords-button[disabled] {
  background-color: #cccccc;
  /* 禁用时的背景色 */
  cursor: not-allowed;
  /* 禁用时的鼠标指针 */
}

.image-area {
  flex: 0 0 33%;
  /* 修改: 设置宽度为33% */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  max-height: calc(94% - 21px);
  min-height: calc(94% - 60px);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 60px;
  background-color: rgba(255, 255, 255, 0.5);
  position: relative;
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

.steps-container {
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  margin-bottom: 10px;
}
</style>
