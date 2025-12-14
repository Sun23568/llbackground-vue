/**
 * AI 对话页面公共 Mixin
 *
 * 使用方法：
 * 1. 在组件中引入：import aiChatMixin from '@/mixins/aiChatMixin'
 * 2. 在 export default 中添加：mixins: [aiChatMixin]
 * 3. 在 data() 中提供 aiMenuId: 你的菜单code
 *
 * 必须提供的配置：
 * - aiMenuId: AI菜单的code（例如：'girlAdventure'）
 *
 * 可选覆盖的配置：
 * - contextSize: 上下文大小（默认从后端获取）
 * - initialCharacterState: 初始角色状态（默认从后端获取）
 */

export default {
  data() {
    return {
      // 基础配置
      ollamaModelId: '',
      contextSize: 5,
      backgroundImageUrl: '',
      initialCharacterState: null,

      // 对话相关
      question: '',
      response: '',
      chatList: [],
      isLoading: false,
      isResponseComplete: false,
      lastQuestion: '',

      // 图片生成相关
      keyWord: '',
      imageUrl: '',
      isGeneratingKeywords: false,
      isGeneratingImage: false,
      showSteps: false,
      currentStep: 0,
      showImageSection: false,

      // 关键词管理
      keywordMap: {},
      previousKeywordMap: {},

      // 控制器
      abortController: null,
      scrollUpdateTimer: null,

      // 步骤配置
      steps: [
        { title: '开始生成', description: '准备生成图片' },
        { title: '提取关键词', description: 'AI分析内容关键信息' },
        { title: '构建参数', description: '配置生成参数' },
        { title: '生成图片', description: 'ComfyUI绘制中' }
      ]
    };
  },

  mounted() {
    // 检查必须的配置
    if (!this.aiMenuId) {
      console.error('aiChatMixin: aiMenuId is required!');
      this.$message.error('页面配置错误：缺少 aiMenuId');
      return;
    }

    // 加载背景图和配置
    this.fetchBackground();

    // 初始化滚动条
    this.$nextTick(() => {
      this.updateScrollbar();
    });
  },

  methods: {
    /**
     * 获取背景图和AI配置
     */
    async fetchBackground() {
      try {
        const response = await this.api({
          url: '/ai/config/background-image?aiMenuCode=' + this.aiMenuId,
          method: 'get'
        });
        this.backgroundImageUrl = response.backgroundImage;
        this.contextSize = response.contextSize;
        this.initialCharacterState = response.initialCharacterState || null;
        this.ollamaModelId = response.ollamaModelId || 'luoli';
      } catch (error) {
        console.error('加载背景图片失败', error);
      }
    },

    /**
     * 发送问题
     */
    async askQuestion() {
      if (this.isLoading) return;
      if (!this.question.trim()) {
        this.$message.warning('请输入问题后再发送');
        return;
      }

      this.isResponseComplete = false;
      const oldResponse = this.response;
      const currentQuestion = this.question;
      this.response = '';

      if (this.chatList.length > this.contextSize) {
        this.chatList.shift();
      }

      this.isLoading = true;
      this.abortController = new AbortController();

      // 构建上下文
      let contextList = [...this.chatList];
      if (contextList.length === 0 && this.initialCharacterState) {
        contextList.push('系统提示：当前角色的初始状态如下：\n' + this.initialCharacterState);
        contextList.push('好的，我会记住这个角色的初始状态，并在对话中保持一致。');
      }

      const body = {
        message: currentQuestion,
        context: contextList,
        model: this.ollamaModelId,
        aiMenuCode: this.aiMenuId
      };

      let isSuccess = false;

      try {
        await this.fetchStream(
          body,
          (decodedValue) => {
            this.response += decodedValue;
            this.throttledUpdateScrollbar();
          },
          () => {
            // 检测业务异常
            const isBusinessError = this.response.includes('【对话模型异常') ||
              this.response.includes('请联系孙老六') ||
              this.response.includes('业务异常') ||
              this.response.includes('系统错误');

            if (isBusinessError) {
              this.response = oldResponse;
              this.question = currentQuestion;
              this.isLoading = false;
              this.isResponseComplete = oldResponse !== '';
              this.$message.error('对话生成失败，请重试');
              return;
            }

            isSuccess = true;
            this.chatList.push(currentQuestion);
            this.chatList.push(this.response);

            this.isLoading = false;
            this.isResponseComplete = true;
            this.question = '';
            this.lastQuestion = this.chatList[this.chatList.length - 1].question;

            this.$nextTick(() => {
              this.updateScrollbar();
            });
          },
          this.abortController.signal
        );
      } catch (error) {
        this.response = oldResponse;
        this.question = currentQuestion;

        if (error.name === 'AbortError') {
          this.$message.info('已取消对话生成');
        } else {
          this.$message.error('对话生成失败，请重试');
        }
        this.isLoading = false;
        this.isResponseComplete = oldResponse !== '';
      } finally {
        this.abortController = null;
      }
    },

    /**
     * 流式获取数据
     */
    async fetchStream(body, onDataReceived, onComplete, signal = null) {
      try {
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/stream+json;charset=utf-8'
          },
          body: JSON.stringify(body)
        };

        if (signal) {
          fetchOptions.signal = signal;
        }

        const response = await fetch('/api/ai/chat', fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            if (onComplete) {
              onComplete();
            }
            break;
          }

          const decodedValue = decoder.decode(value, { stream: true });
          if (onDataReceived) {
            onDataReceived(decodedValue);
          }
        }
      } catch (error) {
        throw error;
      }
    },

    /**
     * 复制回答内容
     */
    copyResponse() {
      navigator.clipboard.writeText(this.response).then(() => {
        this.$message.success('复制成功');
      }).catch(err => {
        this.$message.error('复制失败');
      });
    },

    /**
     * 清空对话
     */
    clearResponse() {
      this.response = '';
      this.imageUrl = '';
      this.keyWord = '';
      this.keywordMap = {};
      this.previousKeywordMap = {};
      this.isResponseComplete = false;
      this.$nextTick(() => {
        this.updateScrollbar();
      });
    },

    /**
     * 撤销上次对话
     */
    undoLastConversation() {
      if (this.chatList.length >= 2) {
        // Remove last AI response and user question
        this.chatList.pop(); // AI response
        this.chatList.pop(); // User question

        if (this.chatList.length > 0) {
          this.response = this.chatList[this.chatList.length - 1];
        } else {
          this.response = '';
        }

        this.isResponseComplete = this.chatList.length > 0;
        this.$message.success('已撤销上次对话');
      } else {
        this.$message.info('没有可以撤销的对话');
      }
    },

    /**
     * 生成图片（生成关键词 + 图片）
     */
    async generateImage() {
      this.imageUrl = '';
      this.showImageSection = true;

      this.showSteps = true;
      this.currentStep = 0;

      this.isGeneratingKeywords = true;
      this.currentStep = 1;
      this.abortController = new AbortController();

      // 保存上一次的关键词
      if (Object.keys(this.keywordMap).length > 0) {
        this.previousKeywordMap = { ...this.keywordMap };
      }

      // 构建上下文
      const context = [];
      if (Object.keys(this.keywordMap).length > 0) {
        const currentKeywords = Object.entries(this.keywordMap)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        context.push('当前角色状态关键词：\n' + currentKeywords);
        context.push('好的，我会根据新对话更新相应的关键词。');
      } else if (this.initialCharacterState) {
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
        this.keywordMap = {};
        await this.fetchStream(body, (decodedValue) => {
          this.keyWord += decodedValue;
        }, () => {
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

    /**
     * 文字转图片
     */
    async textToImage() {
      this.isGeneratingImage = true;
      try {
        const finalKeywords = Object.values(this.keywordMap).join(', ');

        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
          body: JSON.stringify({ keyWord: finalKeywords, aiMenuCode: this.aiMenuId })
        };

        if (this.abortController) {
          fetchOptions.signal = this.abortController.signal;
        }

        const response = await fetch(`/api/ai/generate-image`, fetchOptions);

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

    /**
     * 下载图片
     */
    async downloadImage() {
      if (!this.imageUrl) {
        this.$message.warning('没有可下载的图片');
        return;
      }

      let loading = null;
      try {
        loading = this.$loading({
          lock: true,
          text: '正在准备下载...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const timestamp = new Date().getTime();
              link.download = `AI生成图片_${timestamp}.png`;
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
            this.fallbackDownload(loading);
          }
        };

        img.onerror = () => {
          console.error('图片加载失败');
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

    /**
     * 下载失败时的备用方案
     */
    fallbackDownload(loading) {
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

    /**
     * 关闭图片区域
     */
    closeImageSection() {
      this.showImageSection = false;
    },

    /**
     * 打开图片区域
     */
    openImageSection() {
      this.showImageSection = true;
    },

    /**
     * 重新生成关键词
     */
    async regenerateKeyword() {
      this.imageUrl = '';
      this.keyWord = '';
      this.keywordMap = {};

      this.showSteps = true;
      this.currentStep = 0;

      this.isGeneratingKeywords = true;
      this.currentStep = 1;
      this.abortController = new AbortController();

      // 使用上一次的关键词作为基础
      const context = [];
      if (Object.keys(this.previousKeywordMap).length > 0) {
        const previousKeywords = Object.entries(this.previousKeywordMap)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        context.push('当前角色状态关键词：\n' + previousKeywords);
        context.push('好的，我会根据新对话更新相应的关键词。');
      } else if (this.initialCharacterState) {
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

    /**
     * 从关键词生成图片
     */
    async generateImageFromKeyword() {
      this.imageUrl = '';

      this.showSteps = true;
      this.currentStep = 2;
      this.abortController = new AbortController();

      await this.textToImage();
    },

    /**
     * 解析并更新关键词
     */
    parseAndUpdateKeywords(text) {
      this.keywordMap['默认'] = text.trim();
    },

    /**
     * 重置生成状态
     */
    resetGenerationState() {
      this.isGeneratingKeywords = false;
      this.isGeneratingImage = false;
      this.showSteps = false;
      this.currentStep = 0;
      if (this.abortController) {
        this.abortController = null;
      }
    },

    /**
     * 取消生成
     */
    cancelGeneration() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.resetGenerationState();
    },

    /**
     * 节流更新滚动条
     */
    throttledUpdateScrollbar() {
      if (this.scrollUpdateTimer) {
        clearTimeout(this.scrollUpdateTimer);
      }
      this.scrollUpdateTimer = setTimeout(() => {
        this.updateScrollbar();
      }, 100);
    },

    /**
     * 更新滚动条
     */
    updateScrollbar() {
      this.$nextTick(() => {
        if (this.$refs.responseScrollbar) {
          let scrollbarInstance = null;

          if (this.$refs.responseScrollbar.simpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.simpleBar;
          } else if (this.$refs.responseScrollbar.$el && this.$refs.responseScrollbar.$el.SimpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.$el.SimpleBar;
          } else if (this.$refs.responseScrollbar.SimpleBar) {
            scrollbarInstance = this.$refs.responseScrollbar.SimpleBar;
          }

          if (scrollbarInstance) {
            scrollbarInstance.recalculate();
            const scrollElement = scrollbarInstance.getScrollElement();
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          } else {
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
