/**
 * AI 对话页面公共 Mixin
 *
 * 使用方法：
 * 1. 在组件中引入：import aiChatMixin from '@/mixins/aiChatMixin'
 * 2. 在 export default 中添加：mixins: [aiChatMixin]
 * 3. 在 props 中提供 characterCardId: 角色卡ID
 *
 * 必须由父组件提供（通过props）：
 * - characterCardId: 角色卡ID（用于对话和保存历史记录）
 *
 * 可选覆盖的配置：
 * - contextSize: 上下文大小（默认10）
 */

export default {
  data() {
    return {
      contextSize: 10,
      backgroundImageUrl: '',

      // 对话相关
      question: '',
      response: '', // 保留用于向后兼容（图片生成功能使用）
      messages: [], // 新增：气泡消息列表 { role: 'user'/'ai', content: '', timestamp: Date, isStreaming: false }
      chatList: [], // 保留用于上下文传递
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
  computed: {
    actualOllamaModelId() {
      // 如果组件有传入 ollamaModelId，则使用它；否则使用默认值 'luoli'
      return this.ollamaModelId || 'luoli';
    }
  },

  mounted() {
    // 初始化滚动条
    this.$nextTick(() => {
      this.updateScrollbar();
    });
  },

  methods: {
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
      const currentQuestion = this.question;

      // 1. 立即添加用户消息到气泡列表
      const userMessage = {
        role: 'user',
        content: currentQuestion,
        timestamp: new Date()
      };
      this.messages.push(userMessage);

      // 立即滚动到用户消息
      this.$nextTick(() => {
        this.updateScrollbar();
      });

      // 2. 创建一个空的AI消息（用于流式更新）
      const aiMessage = {
        role: 'ai',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      this.messages.push(aiMessage);

      // 再次滚动到AI消息位置
      this.$nextTick(() => {
        this.updateScrollbar();
      });

      // 清空输入框
      this.question = '';

      // 更新 chatList（用于上下文）
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
        characterCardId: this.characterCardId,
        model: this.actualOllamaModelId
      };

      let isSuccess = false;

      try {
        await this.fetchStream(
          body,
          (decodedValue) => {
            // 流式更新AI消息内容
            aiMessage.content += decodedValue;
            this.response += decodedValue; // 保留用于图片生成
            this.throttledUpdateScrollbar();
          },
          () => {
            // 检测业务异常
            const isBusinessError = aiMessage.content.includes('【对话模型异常') ||
              aiMessage.content.includes('请联系孙老六') ||
              aiMessage.content.includes('业务异常') ||
              aiMessage.content.includes('系统错误');

            if (isBusinessError) {
              // 失败：删除刚添加的两条消息
              this.messages.pop(); // 删除AI消息
              this.messages.pop(); // 删除用户消息
              this.response = '';
              this.question = currentQuestion;
              this.isLoading = false;
              this.isResponseComplete = this.messages.length > 0;
              this.$message.error('对话生成失败，请重试');
              return;
            }

            // 成功：标记AI消息流式完成
            aiMessage.isStreaming = false;
            isSuccess = true;

            // 更新 chatList
            this.chatList.push(currentQuestion);
            this.chatList.push(aiMessage.content);

            this.isLoading = false;
            this.isResponseComplete = true;

            this.$nextTick(() => {
              this.updateScrollbar();
            });
          },
          this.abortController.signal
        );
      } catch (error) {
        // 失败：删除刚添加的两条消息
        this.messages.pop(); // 删除AI消息
        this.messages.pop(); // 删除用户消息
        this.response = '';
        this.question = currentQuestion;

        if (error.name === 'AbortError') {
          this.$message.info('已取消对话生成');
        } else {
          this.$message.error('对话生成失败，请重试');
        }
        this.isLoading = false;
        this.isResponseComplete = this.messages.length > 0;
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
     * 兼容 HTTP 和 HTTPS 环境的双重降级策略
     */
    copyResponse() {
      // 查找最后一条AI消息
      const lastAiMessage = [...this.messages].reverse().find(msg => msg.role === 'ai');
      const text = lastAiMessage ? lastAiMessage.content : '';

      // 策略 1：尝试使用现代 Clipboard API（仅 HTTPS）
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            this.$message.success('复制成功');
          })
          .catch(err => {
            console.warn('Clipboard API 失败，使用降级方案', err);
            this.fallbackCopy(text);
          });
      } else {
        // 策略 2：降级到传统的 execCommand 方法（兼容 HTTP）
        this.fallbackCopy(text);
      }
    },

    /**
     * 降级复制方案 - 使用传统 execCommand
     * 兼容 HTTP 环境和旧版浏览器
     */
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0';

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message.success('复制成功');
        } else {
          this.$message.error('复制失败，请手动复制');
        }
      } catch (err) {
        console.error('复制失败', err);
        this.$message.error('复制失败，请手动复制');
      } finally {
        document.body.removeChild(textarea);
      }
    },

    /**
     * 清空对话
     */
    clearResponse() {
      this.$confirm('确定要清空所有对话记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.messages = [];
        this.chatList = [];
        this.response = '';
        this.imageUrl = '';
        this.keyWord = '';
        this.keywordMap = {};
        this.previousKeywordMap = {};
        this.isResponseComplete = false;
        this.$message.success('已清空所有对话');
        this.$nextTick(() => {
          this.updateScrollbar();
        });
      }).catch(() => {
        // 取消操作
      });
    },

    /**
     * 撤销上次对话
     */
    undoLastConversation() {
      if (this.messages.length >= 2) {
        // 删除最后两条消息（AI回复 + 用户问题）
        this.messages.pop(); // AI消息
        this.messages.pop(); // 用户消息

        // 同步更新 chatList
        if (this.chatList.length >= 2) {
          this.chatList.pop();
          this.chatList.pop();
        }

        // 更新 response（用于图片生成）
        const lastAiMessage = [...this.messages].reverse().find(msg => msg.role === 'ai');
        this.response = lastAiMessage ? lastAiMessage.content : '';

        this.isResponseComplete = this.messages.length > 0;
        this.$message.success('已撤销上次对话');

        this.$nextTick(() => {
          this.updateScrollbar();
        });
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
        context: context
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
          body: JSON.stringify({ keyWord: finalKeywords, characterCardId: this.characterCardId })
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
        characterCardId: this.characterCardId
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
      }, 50); // 减少节流时间从100ms到50ms，更流畅
    },

    /**
     * 更新滚动条（滚动到底部）
     */
    updateScrollbar(smooth = false) {
      this.$nextTick(() => {
        // 多次尝试以确保滚动成功
        const scrollToBottom = () => {
          if (this.$refs.responseScrollbar) {
            let scrollbarInstance = null;

            // 尝试多种方式获取 SimpleBar 实例
            if (this.$refs.responseScrollbar.simpleBar) {
              scrollbarInstance = this.$refs.responseScrollbar.simpleBar;
            } else if (this.$refs.responseScrollbar.$el && this.$refs.responseScrollbar.$el.SimpleBar) {
              scrollbarInstance = this.$refs.responseScrollbar.$el.SimpleBar;
            } else if (this.$refs.responseScrollbar.SimpleBar) {
              scrollbarInstance = this.$refs.responseScrollbar.SimpleBar;
            }

            if (scrollbarInstance) {
              // 重新计算滚动条
              scrollbarInstance.recalculate();
              const scrollElement = scrollbarInstance.getScrollElement();
              if (scrollElement) {
                // 滚动到底部
                if (smooth) {
                  scrollElement.scrollTo({
                    top: scrollElement.scrollHeight,
                    behavior: 'smooth'
                  });
                } else {
                  scrollElement.scrollTop = scrollElement.scrollHeight;
                }
              }
            } else {
              // 备用方案：直接查找滚动元素
              const contentEl = document.querySelector('.response-scrollbar .simplebar-content-wrapper');
              if (contentEl) {
                if (smooth) {
                  contentEl.scrollTo({
                    top: contentEl.scrollHeight,
                    behavior: 'smooth'
                  });
                } else {
                  contentEl.scrollTop = contentEl.scrollHeight;
                }
              }
            }
          }
        };

        // 立即执行一次
        scrollToBottom();

        // 100ms后再执行一次，确保DOM完全渲染
        setTimeout(scrollToBottom, 100);
      });
    }
  }
};
