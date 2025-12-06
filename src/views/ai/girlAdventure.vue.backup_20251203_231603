<template>
  <div class="page-container" :style="{ backgroundImage: `url(${backgroundImageUrl})` }">
    <div class="chat-container" :class="{ 'show-image-section': showImageSection }">
      <!-- 左侧对话区 -->
      <div class="chat-section">
        <div class="chat-header">
          <h2 class="chat-title">少女历险记</h2>
        </div>

        <div class="chat-body">
          <SimpleBar class="response-scrollbar" ref="responseScrollbar" data-simplebar-auto-hide="false">
            <div class="response-area" id="response">
              <div v-if="!response && !isLoading" class="empty-state">
                <i class="el-icon-chat-dot-round"></i>
                <p>开始你的冒险故事吧...</p>
              </div>
              <div v-else-if="isLoading && !response" class="loading-state">
                <div class="loading-animation">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                <p>AI正在思考中...</p>
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
              :disabled="isLoading || isGeneratingKeywords || isGeneratingImage"
              :loading="isGeneratingKeywords || isGeneratingImage"
              @click="generateImage"
            >
              生成图片
            </el-button>
          </div>

          <!-- 对话生成时的取消按钮 -->
          <div v-if="isLoading && !isResponseComplete" class="action-buttons">
            <el-button
              size="small"
              type="danger"
              icon="el-icon-close"
              @click="cancelGeneration"
            >
              取消对话
            </el-button>
          </div>

          <!-- 打开图片按钮 - 独立显示，不受 isResponseComplete 限制 -->
          <div v-if="(imageUrl || isGeneratingKeywords || isGeneratingImage) && !showImageSection" class="open-image-button">
            <el-button
              size="small"
              icon="el-icon-picture-outline"
              type="success"
              @click="openImageSection"
            >
              {{ (isGeneratingKeywords || isGeneratingImage) ? '查看生成进度' : '查看图片' }}
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
                :disabled="isLoading || !question.trim()"
              ></el-button>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 右侧图片区 -->
      <div v-if="showImageSection" class="image-section">
        <!-- 关键词展示区 -->
        <div v-if="keyWord" class="keyword-display">
          <div class="keyword-header">
            <div class="keyword-label">生成关键词</div>
            <div class="keyword-actions">
              <el-button
                v-if="!isGeneratingKeywords && !isGeneratingImage"
                size="mini"
                icon="el-icon-picture"
                class="generate-image-btn"
                @click="generateImageFromKeyword"
                title="根据关键词生成图片"
              >生成图片</el-button>
              <el-button
                v-if="!isGeneratingKeywords"
                size="mini"
                icon="el-icon-refresh"
                circle
                class="regenerate-btn"
                @click="regenerateKeyword"
                title="重新生成关键词"
              ></el-button>
            </div>
          </div>
          <div class="keyword-content">{{ keyWord }}</div>
        </div>

        <div class="image-container">
          <!-- 关闭按钮 -->
          <div class="close-image-section" @click="closeImageSection">
            <i class="el-icon-close"></i>
          </div>
          <!-- 步骤指示 -->
          <div v-if="showSteps" class="steps-overlay">
            <div class="modern-steps">
              <div
                v-for="(step, index) in steps"
                :key="index"
                class="step-item"
                :class="{
                  'step-active': currentStep === index,
                  'step-completed': currentStep > index,
                  'step-waiting': currentStep < index
                }"
              >
                <div class="step-icon-wrapper">
                  <div class="step-icon">
                    <i v-if="currentStep > index" class="el-icon-check"></i>
                    <i v-else-if="currentStep === index" class="el-icon-loading"></i>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div v-if="index < steps.length - 1" class="step-line"></div>
                </div>
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-description">{{ step.description }}</div>
                </div>
              </div>
            </div>
            <!-- 取消按钮 -->
            <div class="cancel-generation-wrapper">
              <el-button
                type="danger"
                size="small"
                icon="el-icon-close"
                @click="cancelGeneration"
              >
                取消生成
              </el-button>
            </div>
          </div>

          <!-- 图片展示 -->
          <div v-if="imageUrl && !showSteps" class="image-wrapper">
            <img :src="imageUrl" alt="生成的图片" class="display-image" />
            <!-- 图片操作按钮 -->
            <div class="image-actions">
              <el-button
                type="primary"
                icon="el-icon-download"
                size="small"
                @click="downloadImage"
              >
                下载图片
              </el-button>
            </div>
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
import 'simplebar/dist/simplebar.min.css';

export default {
  components: {
    SimpleBar
  },
  data() {
    return {
      aiMenuId: 'girlAdventure',
      contextSize: 5,
      backgroundImageUrl: '',
      initialCharacterState: null, // 初始人物状态配置
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
      currentStep: 0,       // 当前步骤
      showImageSection: false, // 控制右侧图片区域显示
      scrollUpdateTimer: null, // 滚动更新定时器
      keywordMap: {}, // 新增: 存储结构化的关键词对象
      previousKeywordMap: {}, // 新增: 存储上一次成功生成的关键词（用于重新生成时的基础）
      abortController: null, // 用于取消请求
      steps: [
        { title: '开始生成', description: '准备生成图片' },
        { title: '提取关键词', description: 'AI分析内容关键信息' },
        { title: '构建参数', description: '配置生成参数' },
        { title: '生成图片', description: 'ComfyUI绘制中' }
      ]
    };
  },
  mounted() {
    // 加载背景图
    this.fetchBackground();

    // 初始化滚动条
    this.$nextTick(() => {
      this.updateScrollbar();
    });
  },
  methods: {
    async fetchBackground() {
      try {
        const response = await this.api({
          url: '/ai/config/background-image?aiMenuCode=' + this.aiMenuId,
          method: 'get'
        });
        this.backgroundImageUrl = response.backgroundImage;
        this.contextSize = response.contextSize;
        // 加载初始人物状态配置（纯文本）
        this.initialCharacterState = response.initialCharacterState || null;
      } catch (error) {
        console.error('加载背景图片失败', error);
      }
    },
    async askQuestion() {
      if (this.isLoading) return; // 如果已经在加载中，不重复请求
      if (!this.question.trim()) {
        this.$message.warning('请输入问题后再发送');
        return;
      }
      this.isResponseComplete = false;
      // 不立即清空，等待新内容加载
      const oldResponse = this.response; // 保存旧内容
      const currentQuestion = this.question; // 保存当前问题，以便错误时恢复
      this.response = ''; // 准备接收新内容

      if (this.chatList.length > this.contextSize) {
        this.chatList.shift();
      }

      this.isLoading = true; // 设置加载状态
      this.abortController = new AbortController(); // 创建取消控制器

      // 构建上下文：如果是第一次对话且有初始人物状态，添加到上下文中
      let contextList = [...this.chatList];
      if (contextList.length === 0 && this.initialCharacterState) {
        // 第一次对话，添加初始人物状态作为系统提示
        contextList.push('系统提示：当前角色的初始状态如下：\n' + this.initialCharacterState);
        contextList.push('好的，我会记住这个角色的初始状态，并在对话中保持一致。');
      }

      const body = {
        message: currentQuestion,
        context: contextList,
        model: 'luoli',
        aiMenuCode: this.aiMenuId
      };

      let isSuccess = false; // 标记请求是否成功完成

      try {
        await this.fetchStream(
          body,
          (decodedValue) => {
            this.response += decodedValue;
            // 每次更新内容后，更新滚动条并滚动到底部（节流）
            this.throttledUpdateScrollbar();
          },
          () => {
            // 检测是否包含业务异常标记
            const isBusinessError = this.response.includes('【对话模型异常') ||
                                   this.response.includes('请联系孙老六') ||
                                   this.response.includes('业务异常') ||
                                   this.response.includes('系统错误');

            if (isBusinessError) {
              // 如果是业务异常，不添加到chatList，恢复状态
              this.response = oldResponse; // 恢复之前的回答内容
              this.question = currentQuestion; // 恢复问题，让用户可以重新发送
              this.isLoading = false;
              this.isResponseComplete = oldResponse !== ''; // 如果之前有内容，保持完成状态
              this.$message.error('对话生成失败，请重试');
              return;
            }

            // 只有在成功完成且没有业务异常时才添加到chatList
            isSuccess = true;
            this.chatList.push(currentQuestion);
            this.chatList.push(this.response);

            // 请求完成后的处理
            this.isLoading = false;
            this.isResponseComplete = true;
            this.question = ''; // 清空提问框内容
            this.lastQuestion = this.chatList[this.chatList.length - 1].question; // 存储上一次的问题

            // 最后确保滚动条更新到最终状态
            this.$nextTick(() => {
              this.updateScrollbar();
            });
          },
          this.abortController.signal
        );
      } catch (error) {
        // 发生错误时，清空错误的response，恢复问题框，允许用户重新发送
        this.response = oldResponse; // 恢复之前的回答内容
        this.question = currentQuestion; // 恢复问题，让用户可以重新发送

        if (error.name === 'AbortError') {
          this.$message.info('已取消对话生成');
        } else {
          this.$message.error('对话生成失败，请重试');
        }
        this.isLoading = false;
        this.isResponseComplete = oldResponse !== ''; // 如果之前有内容，保持完成状态
      } finally {
        this.abortController = null;
      }
    },
    async fetchStream(body, onDataReceived, onComplete, signal = null) {
      try {
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/stream+json;charset=utf-8'
          },
          body: JSON.stringify(body)
        };

        // 如果提供了 signal，添加到 fetch 选项中
        if (signal) {
          fetchOptions.signal = signal;
        }

        const response = await fetch('/api/ai/chat', fetchOptions);

        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
      this.keyWord = ''; // 清空关键词
      this.keywordMap = {}; // 清空关键词Map
      this.previousKeywordMap = {}; // 清空上一次的关键词Map
      this.isResponseComplete = false;
      // 更新滚动条
      this.$nextTick(() => {
        this.updateScrollbar();
      });
    },

    async generateImage() {
      this.imageUrl = '';
      this.showImageSection = true; // 显示右侧图片区域

      this.showSteps = true;
      this.currentStep = 0;

      this.isGeneratingKeywords = true;
      this.currentStep = 1;
      this.abortController = new AbortController(); // 创建取消控制器

      // 在生成新关键词之前，保存当前的关键词作为"上一次的关键词"
      if (Object.keys(this.keywordMap).length > 0) {
        this.previousKeywordMap = { ...this.keywordMap };
      }

      // 构建上下文：如果之前已经有关键词，将其作为上下文传递
      const context = [];
      if (Object.keys(this.keywordMap).length > 0) {
        // 将现有的关键词Map转换为文本
        const currentKeywords = Object.entries(this.keywordMap)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        context.push('当前角色状态关键词：\n' + currentKeywords);
        context.push('好的，我会根据新对话更新相应的关键词。');
      } else if (this.initialCharacterState) {
        // 首次生成：使用初始人物状态配置（纯文本）
        context.push('初始角色状态关键词：\n' + this.initialCharacterState);
        context.push('好的，我会基于这个初始状态生成关键词。');
      }

      const body = {
        model: 'makeKey',
        message: this.response,
        context: context,
        aiMenuCode: this.aiMenuId
      };

      try {
        this.keyWord = '';
        this.keywordMap = {}; // 清空旧的关键词Map，确保完全使用新关键词
        await this.fetchStream(body, (decodedValue) => {
          this.keyWord += decodedValue;
        }, () => {
          // 解析并更新keywordMap
          this.parseAndUpdateKeywords(this.keyWord);

          this.currentStep = 2;
          this.textToImage();
        }, this.abortController.signal);
      } catch (error) {
        if (error.name === 'AbortError') {
          this.$message.info('已取消图片生成');
        } else {
          this.$message.error('关键词生成失败，请重试');
        }
        this.resetGenerationState();
      } finally {
        this.isGeneratingKeywords = false;
      }
    },

    async textToImage() {
      this.isGeneratingImage = true;
      try {
        // 将keywordMap转换为最终的关键词字符串
        const finalKeywords = Object.values(this.keywordMap).join(', ');

        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
          body: JSON.stringify({ keyWord: finalKeywords, aiMenuCode: this.aiMenuId })
        };

        // 添加 abort signal
        if (this.abortController) {
          fetchOptions.signal = this.abortController.signal;
        }

        const response = await fetch(`/api/ai/generate-image`, fetchOptions);

        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        let done = false;
        let url = '';
        let buildParamEnd = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          // 解码
          if (value) {
            const decodedValue = new TextDecoder().decode(value);

            if (!buildParamEnd) {
              this.currentStep = 3;
              buildParamEnd = true;
            } else {
              url = decodedValue;
            }
          }
        }
        this.imageUrl = url;
        this.currentStep = 4;
        this.showSteps = false;
      } catch (error) {
        if (error.name === 'AbortError') {
          this.$message.info('已取消图片生成');
        } else {
          this.$message.error('图片生成失败，请重试');
        }
        this.resetGenerationState();
      } finally {
        this.isGeneratingImage = false;
        this.abortController = null;
      }
    },

    async downloadImage() {
      if (!this.imageUrl) {
        this.$message.warning('没有可下载的图片');
        return;
      }

      let loading = null;
      try {
        // 显示加载提示
        loading = this.$loading({
          lock: true,
          text: '正在准备下载...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        // 尝试使用canvas方式下载（解决CORS问题）
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 尝试匿名跨域

        img.onload = () => {
          try {
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // 转换为blob并下载
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const timestamp = new Date().getTime();
              link.download = `少女历险记_${timestamp}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);

              if (loading) {
                loading.close();
              }
              this.$message.success('图片下载成功！');
            }, 'image/png');
          } catch (canvasError) {
            console.error('Canvas下载失败', canvasError);
            // Canvas方式失败，使用新窗口打开的方式
            this.fallbackDownload(loading);
          }
        };

        img.onerror = () => {
          console.error('图片加载失败');
          // 图片加载失败，使用新窗口打开的方式
          this.fallbackDownload(loading);
        };

        img.src = this.imageUrl;

      } catch (error) {
        console.error('下载图片失败', error);
        if (loading) {
          loading.close();
        }
        this.$message.error('下载图片失败，请重试');
      }
    },

    fallbackDownload(loading) {
      // 备选方案：在新窗口打开图片
      window.open(this.imageUrl, '_blank');

      if (loading) {
        loading.close();
      }

      this.$message({
        message: '已在新窗口打开图片，请右键保存图片',
        type: 'info',
        duration: 4000
      });
    },

    closeImageSection() {
      // 关闭图片区域
      this.showImageSection = false;
    },

    openImageSection() {
      // 打开图片区域
      this.showImageSection = true;
    },

    async regenerateKeyword() {
      // 清空图片和关键词
      this.imageUrl = '';
      this.keyWord = '';
      this.keywordMap = {}; // 清空关键词Map

      // 显示步骤条并重置状态
      this.showSteps = true;
      this.currentStep = 0;

      this.isGeneratingKeywords = true;
      this.currentStep = 1;
      this.abortController = new AbortController(); // 创建取消控制器

      // 构建上下文：使用previousKeywordMap作为基础（上一次对话的关键词）
      const context = [];
      if (Object.keys(this.previousKeywordMap).length > 0) {
        // 使用上一次成功生成的关键词作为基础状态
        const previousKeywords = Object.entries(this.previousKeywordMap)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        context.push('当前角色状态关键词：\n' + previousKeywords);
        context.push('好的，我会根据新对话更新相应的关键词。');
      } else if (this.initialCharacterState) {
        // 如果还没有生成过关键词，使用初始人物状态配置
        context.push('初始角色状态关键词：\n' + this.initialCharacterState);
        context.push('好的，我会基于这个初始状态生成关键词。');
      }

      const body = {
        model: 'makeKey',
        message: this.response,
        context: context,
        aiMenuCode: this.aiMenuId
      };

      try {
        await this.fetchStream(body, (decodedValue) => {
          this.keyWord += decodedValue;
        }, () => {
          // 解析新的关键词
          this.parseAndUpdateKeywords(this.keyWord);
          this.currentStep = 2;
          this.showSteps = false;
          this.$message.success('关键词重新生成成功');
        }, this.abortController.signal);
      } catch (error) {
        if (error.name === 'AbortError') {
          this.$message.info('已取消关键词生成');
        } else {
          this.$message.error('关键词生成失败，请重试');
        }
        this.resetGenerationState();
      } finally {
        this.isGeneratingKeywords = false;
        this.abortController = null;
      }
    },

    async generateImageFromKeyword() {
      // 清空之前的图片
      this.imageUrl = '';

      // 显示步骤条
      this.showSteps = true;
      this.currentStep = 2;
      this.abortController = new AbortController(); // 创建取消控制器

      // 直接调用文字转图片方法
      await this.textToImage();
    },

    parseAndUpdateKeywords(text) {
      // 解析AI返回的结构化关键词文本，格式如：
      // 衣服: red dress
      // 裤子: green pants
      // 发型: long black hair
      const lines = text.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // 尝试匹配 "key: value" 或 "key：value" 格式
          const match = trimmedLine.match(/^([^:：]+)[：:](.+)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key && value) {
              // 更新或添加关键词
              this.keywordMap[key] = value;
            }
          }
        }
      });

      // 如果解析失败（没有找到结构化格式），直接使用原文本
      if (Object.keys(this.keywordMap).length === 0 && text.trim()) {
        this.keywordMap['默认'] = text.trim();
      }
    },

    // 重置生成状态
    resetGenerationState() {
      this.isGeneratingKeywords = false;
      this.isGeneratingImage = false;
      this.showSteps = false;
      this.currentStep = 0;
      if (this.abortController) {
        this.abortController = null;
      }
    },

    // 取消生成
    cancelGeneration() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.resetGenerationState();
    },

    throttledUpdateScrollbar() {
      // 节流更新滚动条，避免过于频繁的更新
      if (this.scrollUpdateTimer) {
        clearTimeout(this.scrollUpdateTimer);
      }
      this.scrollUpdateTimer = setTimeout(() => {
        this.updateScrollbar();
      }, 100); // 每100ms最多更新一次
    },

    updateScrollbar() {
      // 更新SimpleBar滚动条并滚动到底部
      this.$nextTick(() => {
        if (this.$refs.responseScrollbar) {
          // 尝试多种方式访问SimpleBar实例
          let scrollbarInstance = null;

          // 方式1: 通过 simpleBar 属性
          if (this.$refs.responseScrollbar.simpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.simpleBar;
          }
          // 方式2: 通过 $el.SimpleBar
          else if (this.$refs.responseScrollbar.$el && this.$refs.responseScrollbar.$el.SimpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.$el.SimpleBar;
          }
          // 方式3: 直接是SimpleBar实例
          else if (this.$refs.responseScrollbar.SimpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.SimpleBar;
          }

          if (scrollbarInstance) {
            // 重新计算滚动条
            scrollbarInstance.recalculate();
            // 滚动到底部
            const scrollElement = scrollbarInstance.getScrollElement();
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          } else {
            // 备选方案：直接操作DOM
            const contentEl = document.querySelector('.response-scrollbar .simplebar-content-wrapper');
            if (contentEl) {
              contentEl.scrollTop = contentEl.scrollHeight;
            }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
/* 全局字体优化 */
* {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
               'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
               'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'WenQuanYi Micro Hei',
               sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

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
  grid-template-columns: 1fr;
  gap: 24px;
  position: relative;
  z-index: 1;
  transition: all 0.4s ease;
}

.chat-container.show-image-section {
  grid-template-columns: 1fr 450px;
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
  height: 100%;
  min-height: 0;
}

/* 聊天头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.chat-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.chat-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-20px, 20px);
  }
}

/* 聊天主体 */
.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.response-scrollbar {
  flex: 1;
  max-height: 100%;
  height: 100%;
  min-height: 0;
}

/deep/ .response-scrollbar .simplebar-wrapper {
  height: 100%;
}

/deep/ .response-scrollbar .simplebar-height-auto-observer-wrapper {
  height: 100%;
}

/deep/ .response-scrollbar .simplebar-mask {
  height: 100%;
}

/deep/ .response-scrollbar .simplebar-offset {
  height: 100%;
}

/deep/ .response-scrollbar .simplebar-content-wrapper {
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/deep/ .response-scrollbar .simplebar-content {
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.response-area {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  letter-spacing: 0.5px;
  font-weight: 400;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #667eea;
}

.loading-animation {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.loading-animation .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-animation .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-animation .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-state p {
  font-size: 16px;
  margin: 0;
  letter-spacing: 0.5px;
  font-weight: 500;
  animation: fadeInOut 1.5s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 响应内容 */
.response-content {
  font-size: 16px;
  line-height: 2;
  color: #2c3e50;
  white-space: pre-line;
  word-wrap: break-word;
  word-break: break-word;
  letter-spacing: 0.5px;
  font-weight: 400;
  padding: 4px 0;
  text-align: justify;
  flex: 1;
  overflow-wrap: break-word;
}

/* 优化中文字符显示 */
.response-content::first-line {
  line-height: 2.2;
}

/* 段落间距 */
.response-content p {
  margin: 12px 0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
  animation: slideInUp 0.4s ease-out;
}

/* 打开图片按钮 - 独立容器样式 */
.open-image-button {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
  animation: slideInUp 0.4s ease-out;
}

.action-buttons .el-button,
.open-image-button .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-buttons .el-button:hover,
.open-image-button .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.action-buttons .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.action-buttons .el-button--primary:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.open-image-button .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
}

.open-image-button .el-button--success:hover {
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
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
  border-radius: 12px 0 0 12px;
  border: 2px solid #e5e7eb;
  border-right: none;
  padding: 12px 16px;
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

/deep/ .question-input-field .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  position: relative;
  z-index: 1;
}

/deep/ .question-input-field .el-input-group__append {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #667eea;
  border-left: none;
  border-radius: 0 12px 12px 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  margin-left: -1px;
}

/deep/ .question-input-field .el-input-group__append::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

/deep/ .question-input-field .el-input-group__append:hover::before {
  left: 100%;
}

/deep/ .question-input-field .el-input-group__append .el-button {
  background: transparent;
  border: none;
  color: #fff;
  padding: 12px 24px;
  font-size: 20px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

/deep/ .question-input-field .el-input-group__append .el-button:hover {
  transform: scale(1.05);
}

/deep/ .question-input-field .el-input-group__append .el-button.is-loading {
  animation: buttonLoading 1s ease-in-out infinite;
}

/* 发送按钮加载动画 */
@keyframes buttonLoading {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

/* 发送按钮图标动画 */
/deep/ .question-input-field .el-input-group__append .el-button:not(.is-loading):active {
  animation: sendPulse 0.3s ease;
}

@keyframes sendPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

/* 右侧图片区 */
.image-section {
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.4s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

/* 关闭按钮 - 位于容器内部右上角 */
.close-image-section {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.close-image-section:hover {
  background: #ffffff;
  transform: rotate(90deg) scale(1.15);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.close-image-section i {
  font-size: 18px;
  color: #6b7280;
  transition: color 0.3s ease;
  font-weight: bold;
}

.close-image-section:hover i {
  color: #ef4444;
}

/* 步骤覆盖层 */
.steps-overlay {
  width: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

/* 现代化步骤条 */
.modern-steps {
  width: 100%;
  max-width: 400px;
}

.step-item {
  display: flex;
  gap: 20px;
  position: relative;
  padding-bottom: 32px;
}

.step-item:last-child {
  padding-bottom: 0;
}

.step-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

/* 等待状态 */
.step-waiting .step-icon {
  background: #f3f4f6;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

/* 激活状态 */
.step-active .step-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 完成状态 */
.step-completed .step-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  transform: scale(1.05);
}

.step-line {
  width: 2px;
  height: 32px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.step-waiting .step-line {
  background: #e5e7eb;
}

.step-active .step-line,
.step-completed .step-line {
  background: linear-gradient(180deg, #667eea 0%, #10b981 100%);
}

.step-content {
  flex: 1;
  padding-top: 8px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.step-waiting .step-title {
  color: #9ca3af;
}

.step-active .step-title {
  color: #667eea;
  font-weight: 700;
}

.step-completed .step-title {
  color: #10b981;
}

.step-description {
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.step-waiting .step-description {
  color: #d1d5db;
}

.step-active .step-description {
  color: #6b7280;
}

.step-completed .step-description {
  color: #9ca3af;
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6), 0 0 0 8px rgba(102, 126, 234, 0.1);
  }
}

/* 取消生成按钮容器 */
.cancel-generation-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.cancel-generation-wrapper .el-button {
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.cancel-generation-wrapper .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

.cancel-generation-wrapper .el-button:active {
  transform: translateY(0);
}

/* 关键词展示区 */
.keyword-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  animation: slideInDown 0.5s ease-out;
}

.keyword-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.keyword-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.keyword-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.generate-image-btn {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #ffffff;
  transition: all 0.3s ease;
  font-size: 12px;
  padding: 8px 12px;
  height: auto;
}

.generate-image-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.generate-image-btn:active {
  transform: translateY(0);
}

.regenerate-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  transition: all 0.3s ease;
  padding: 8px;
}

.regenerate-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: rotate(180deg);
}

.regenerate-btn:active {
  transform: rotate(180deg) scale(0.95);
}

.keyword-content {
  font-size: 15px;
  line-height: 1.8;
  color: #ffffff;
  word-wrap: break-word;
  word-break: break-word;
  letter-spacing: 0.4px;
  font-weight: 400;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 关键词滚动条样式 */
.keyword-content::-webkit-scrollbar {
  width: 6px;
}

.keyword-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.keyword-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.keyword-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}

/* 图片包装器 */
.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.display-image {
  max-width: 100%;
  max-height: calc(100% - 60px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  animation: fadeIn 0.5s ease-out;
}

.display-image:hover {
  transform: scale(1.02);
}

/* 图片操作按钮 */
.image-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  animation: fadeInUp 0.6s ease-out;
}

.image-actions .el-button {
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.image-actions .el-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.image-actions .el-button:hover::before {
  width: 300px;
  height: 300px;
}

.image-actions .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.image-actions .el-button:active {
  transform: translateY(-1px);
}

.image-actions .el-button i {
  margin-right: 6px;
  font-size: 16px;
}

/* 动画效果 */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  letter-spacing: 0.5px;
  font-weight: 400;
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
  font-size: 16px;
  color: #667eea;
  letter-spacing: 0.5px;
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
/deep/ .response-scrollbar .simplebar-scrollbar::before {
  background-color: #667eea;
  border-radius: 4px;
  opacity: 0.8;
}

/deep/ .response-scrollbar .simplebar-scrollbar.simplebar-visible::before {
  opacity: 1;
}

/deep/ .response-scrollbar .simplebar-track {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

/deep/ .response-scrollbar .simplebar-track.simplebar-vertical {
  width: 8px;
  right: 2px;
  top: 2px;
  bottom: 2px;
}

/deep/ .response-scrollbar .simplebar-scrollbar {
  right: 0;
  width: 8px;
}

/* 确保滚动条始终显示 */
/deep/ .response-scrollbar .simplebar-track.simplebar-vertical {
  opacity: 1 !important;
  visibility: visible !important;
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
