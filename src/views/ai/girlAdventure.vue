<template>
  <div class="page-container" :style="{ backgroundImage: `url(${backgroundImageUrl})` }">
    <div class="chat-container">
      <!-- 左侧对话区 -->
      <div class="chat-section">
        <div class="chat-header">
          <h2 class="chat-title">少女历险记</h2>
          <UploadBackgroundButton ref="uploadBgBtn" :aiMenuId="aiMenuId" @background-updated="updateBackgroundImage" />
        </div>

        <div class="chat-body">
          <SimpleBar class="response-scrollbar">
            <div class="response-area" id="response">
              <div v-if="!response" class="empty-state">
                <i class="el-icon-chat-dot-round"></i>
                <p>开始你的冒险故事吧...</p>
              </div>
              <div v-else class="response-content">
                {{ response }}
              </div>
            </div>
          </SimpleBar>

          <!-- 操作按钮 -->
          <div v-if="isResponseComplete" class="action-buttons">
            <el-button size="small" icon="el-icon-document-copy" @click="copyResponse">复制</el-button>
            <el-button size="small" icon="el-icon-delete" @click="clearResponse">清空</el-button>
            <el-button
              size="small"
              icon="el-icon-picture"
              type="primary"
              :disabled="isGeneratingKeywords || isGeneratingImage"
              :loading="isGeneratingKeywords || isGeneratingImage"
              @click="generateImage"
            >
              生成图片
            </el-button>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="question-input">
          <el-input
            v-model="question"
            placeholder="输入你的问题，开始冒险..."
            @keyup.enter.native="askQuestion"
            class="question-input-field"
          >
            <template slot="append">
              <el-button
                icon="el-icon-s-promotion"
                @click="askQuestion"
                :loading="isLoading"
                :disabled="isLoading"
              ></el-button>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 右侧图片区 -->
      <div class="image-section">
        <div class="image-container">
          <!-- 步骤指示 -->
          <div v-if="showSteps" class="steps-overlay">
            <el-steps :active="currentStep" direction="vertical" finish-status="success">
              <el-step title="开始生成" />
              <el-step title="提取关键词" />
              <el-step title="构建参数" />
              <el-step title="生成图片" />
            </el-steps>
          </div>

          <!-- 图片展示 -->
          <div v-if="imageUrl && !showSteps" class="image-wrapper">
            <img :src="imageUrl" alt="生成的图片" class="display-image" />
          </div>

          <!-- 空状态 -->
          <div v-if="!imageUrl && !showSteps && !isGeneratingImage" class="image-empty-state">
            <i class="el-icon-picture-outline"></i>
            <p>图片将在这里显示</p>
          </div>

          <!-- 加载指示 -->
          <div v-if="(isGeneratingKeywords || isGeneratingImage) && !showSteps" class="loading-overlay">
            <i class="el-icon-loading"></i>
            <p>正在生成图片...</p>
          </div>
        </div>
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
/* 页面容器 */
.page-container {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.page-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  pointer-events: none;
}

/* 聊天容器 */
.chat-container {
  max-width: 1400px;
  width: 95%;
  height: 85vh;
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 24px;
  position: relative;
  z-index: 1;
}

/* 左侧对话区 */
.chat-section {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

/* 聊天头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

/* 聊天主体 */
.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.response-scrollbar {
  flex: 1;
  overflow: hidden;
}

/deep/ .response-scrollbar .simplebar-content {
  padding: 24px;
}

.response-area {
  min-height: 100%;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #9ca3af;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 响应内容 */
.response-content {
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-line;
  word-wrap: break-word;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* 输入区 */
.question-input {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
}

.question-input-field {
  font-size: 15px;
}

/deep/ .question-input-field .el-input__inner {
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  padding: 12px 16px;
  font-size: 15px;
  transition: all 0.3s ease;
}

/deep/ .question-input-field .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/deep/ .question-input-field .el-input-group__append {
  background-color: #667eea;
  border: none;
  border-radius: 0 12px 12px 0;
  padding: 0;
}

/deep/ .question-input-field .el-input-group__append .el-button {
  background: transparent;
  border: none;
  color: #fff;
  padding: 12px 20px;
  font-size: 18px;
}

/deep/ .question-input-field .el-input-group__append .el-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 右侧图片区 */
.image-section {
  display: flex;
  flex-direction: column;
}

.image-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 步骤覆盖层 */
.steps-overlay {
  width: 100%;
  padding: 40px;
}

/deep/ .steps-overlay .el-steps {
  padding: 20px;
}

/* 图片包装器 */
.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.display-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.display-image:hover {
  transform: scale(1.02);
}

/* 图片空状态 */
.image-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  height: 100%;
}

.image-empty-state i {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.image-empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 加载覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.loading-overlay i {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
  animation: rotate 1.5s linear infinite;
}

.loading-overlay p {
  font-size: 15px;
  color: #667eea;
  font-weight: 500;
  margin: 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 自定义滚动条 */
/deep/ .simplebar-scrollbar::before {
  background-color: #cbd5e1;
  border-radius: 4px;
}

/deep/ .simplebar-track.simplebar-vertical {
  width: 6px;
  right: 4px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .chat-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 85vh;
  }

  .image-section {
    min-height: 400px;
  }
}
</style>
