<template>
  <div class="page-container ai-chat-page" :style="{ backgroundImage: `url(${customBackgroundImage || backgroundImageUrl})` }">
    <div class="chat-container" :class="{ 'show-image-section': showImageSection }">
      <!-- 左侧对话区 -->
      <div class="chat-section">
        <div class="chat-header">
          <h2 class="chat-title">{{ pageTitle }}</h2>
          <!-- 插槽：允许自定义头部右侧内容 -->
          <slot name="header-right"></slot>
        </div>

        <div class="chat-body">
          <SimpleBar class="response-scrollbar" ref="responseScrollbar" data-simplebar-auto-hide="false">
            <div class="response-area" id="response">
              <!-- 空状态 -->
              <div v-if="messages.length === 0 && !isLoading" class="empty-state">
                <slot name="empty-state">
                  <i class="el-icon-chat-dot-round"></i>
                  <p>{{ emptyText }}</p>
                </slot>
              </div>

              <!-- 消息列表（RPG风格） -->
              <div v-else class="message-list">
                <div
                  v-for="(message, index) in messages"
                  :key="index"
                  class="message-item">

                  <!-- 头像 -->
                  <div class="message-avatar">
                    <img
                      v-if="message.role === 'user'"
                      :src="userAvatar || '/static/img/user-avatar.png'"
                      alt="用户头像"
                      class="avatar-img">
                    <img
                      v-else
                      :src="aiAvatar || customBackgroundImage || '/static/img/ai-avatar.png'"
                      alt="AI头像"
                      class="avatar-img">
                  </div>

                  <!-- 消息内容 -->
                  <div class="message-wrapper">
                    <!-- 角色名称 -->
                    <div class="message-header">
                      <span class="sender-name">{{ message.role === 'user' ? userName : aiName }}</span>
                      <!-- AI正在输入提示 -->
                      <span v-if="message.role === 'ai' && message.isStreaming" class="typing-indicator">
                        正在输入
                        <span class="typing-dots">
                          <span class="dot"></span>
                          <span class="dot"></span>
                          <span class="dot"></span>
                        </span>
                      </span>
                    </div>

                    <!-- 消息文本 -->
                    <div class="message-content">
                      {{ message.content }}
                      <!-- 流式输入中的光标 -->
                      <span v-if="message.isStreaming" class="streaming-cursor">▋</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SimpleBar>

          <!-- 操作按钮 -->
          <div v-if="isResponseComplete" class="action-buttons">
            <slot name="action-buttons" :actions="actionHandlers">
              <el-button size="small" icon="el-icon-document-copy" @click="copyResponse">
                {{ copyButtonText }}
              </el-button>
              <el-button size="small" icon="el-icon-delete" @click="clearResponse">
                {{ clearButtonText }}
              </el-button>
              <el-button size="small" icon="el-icon-refresh-left" @click="undoLastConversation">
                {{ undoButtonText }}
              </el-button>
              <el-button
                v-if="enableImageGeneration"
                size="small"
                icon="el-icon-picture"
                type="primary"
                :disabled="isLoading || isGeneratingKeywords || isGeneratingImage"
                :loading="isGeneratingKeywords || isGeneratingImage"
                @click="generateImage">
                {{ generateImageButtonText }}
              </el-button>
              <el-button
                v-if="enableImageGeneration && (imageUrl || isGeneratingKeywords || isGeneratingImage) && !showImageSection"
                size="small"
                icon="el-icon-picture-outline"
                type="success"
                @click="openImageSection">
                {{ (isGeneratingKeywords || isGeneratingImage) ? viewProgressText : viewImageText }}
              </el-button>
            </slot>
          </div>

          <!-- 对话生成时的取消按钮 -->
          <div v-if="isLoading && !isResponseComplete" class="action-buttons">
            <el-button
              size="small"
              type="danger"
              icon="el-icon-close"
              @click="cancelGeneration">
              {{ cancelButtonText }}
            </el-button>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="question-input">
          <slot name="input-area" :question="question" :askQuestion="askQuestion">
            <el-input
              v-model="question"
              :placeholder="inputPlaceholder"
              @keyup.enter.native="askQuestion"
              class="question-input-field">
              <template slot="append">
                <el-button
                  icon="el-icon-s-promotion"
                  @click="askQuestion"
                  :loading="isLoading"
                  :disabled="isLoading || !question.trim()">
                </el-button>
              </template>
            </el-input>
          </slot>
          <div class="conversation-undo-hint">
            {{ conversationUndoHintText }}
          </div>
        </div>
      </div>

      <!-- 右侧图片区 -->
      <div v-if="enableImageGeneration && showImageSection" class="image-section">
        <!-- 关键词展示区 -->
        <div v-if="keyWord" class="keyword-display">
          <div class="keyword-header">
            <div class="keyword-label">{{ keywordLabelText }}</div>
            <div class="keyword-actions">
              <el-button
                v-if="!isGeneratingKeywords && !isGeneratingImage"
                size="mini"
                icon="el-icon-picture"
                class="generate-image-btn"
                @click="generateImageFromKeyword"
                :title="generateFromKeywordTitle">
                {{ generateImageButtonText }}
              </el-button>
              <el-button
                v-if="!isGeneratingKeywords"
                size="mini"
                icon="el-icon-refresh"
                circle
                class="regenerate-btn"
                @click="regenerateKeyword"
                :title="regenerateKeywordTitle">
              </el-button>
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
                }">
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
                @click="cancelGeneration">
                {{ cancelGenerationText }}
              </el-button>
            </div>
          </div>

          <!-- 图片展示 -->
          <div v-if="imageUrl && !showSteps" class="image-wrapper">
            <slot name="image-display" :imageUrl="imageUrl">
              <img :src="imageUrl" alt="生成的图片" class="display-image" />
              <div class="image-actions">
                <el-button
                  type="primary"
                  icon="el-icon-download"
                  size="small"
                  @click="downloadImage">
                  {{ downloadImageText }}
                </el-button>
                <div v-if="imageUrl" class="image-undo-hint">{{ imageUndoHintText }}</div>
              </div>
            </slot>
          </div>

          <!-- 空状态 -->
          <div v-if="!imageUrl && !showSteps && !isGeneratingImage" class="image-empty-state">
            <slot name="image-empty-state">
              <i class="el-icon-picture-outline"></i>
              <p>{{ imageEmptyText }}</p>
            </slot>
          </div>

          <!-- 加载指示 -->
          <div v-if="(isGeneratingKeywords || isGeneratingImage) && !showSteps" class="loading-overlay">
            <i class="el-icon-loading"></i>
            <p>{{ generatingImageText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SimpleBar from 'simplebar-vue';
import 'simplebar/dist/simplebar.min.css';
import aiChatMixin from '@/mixins/aiChatMixin';

export default {
  name: 'AiChatContainer',
  components: {
    SimpleBar
  },
  mixins: [aiChatMixin],

  props: {
    // ============ 必填配置 ============
    pageTitle: {
      type: String,
      required: true
    },
    // 角色卡ID（必填）
    characterCardId: {
      type: String,
      required: true
    },
    // 是否启用图片生成功能
    enableImageGeneration: {
      type: Boolean,
      default: true
    },
    // 自定义背景图片URL（优先级高于从后端获取的背景图）
    customBackgroundImage: {
      type: String,
      default: ''
    },
    // ollama模型ID
    ollamaModelId: {
      type: String,
      default: ''
    },

    // ============ 头像和名称配置 ============
    // 用户头像URL（从当前登录用户获取）
    userAvatar: {
      type: String,
      default: ''
    },
    // AI头像URL（从角色卡配置获取）
    aiAvatar: {
      type: String,
      default: ''
    },
    // 用户名称（从角色卡的userName字段获取）
    userName: {
      type: String,
      default: 'UserName'
    },
    // AI名称（从角色卡的cardName字段获取）
    aiName: {
      type: String,
      default: 'charName'
    },

    // ============ 文案配置 ============
    emptyText: {
      type: String,
      default: '开始你的冒险故事吧...'
    },
    loadingText: {
      type: String,
      default: 'AI正在思考中...'
    },
    inputPlaceholder: {
      type: String,
      default: '输入你的问题，开始冒险...'
    },
    copyButtonText: {
      type: String,
      default: '复制'
    },
    clearButtonText: {
      type: String,
      default: '清空'
    },
    undoButtonText: {
      type: String,
      default: '撤销'
    },
    generateImageButtonText: {
      type: String,
      default: '生成图片'
    },
    cancelButtonText: {
      type: String,
      default: '取消对话'
    },
    viewProgressText: {
      type: String,
      default: '查看生成进度'
    },
    viewImageText: {
      type: String,
      default: '查看图片'
    },
    keywordLabelText: {
      type: String,
      default: '生成关键词'
    },
    generateFromKeywordTitle: {
      type: String,
      default: '根据关键词生成图片'
    },
    regenerateKeywordTitle: {
      type: String,
      default: '重新生成关键词'
    },
    cancelGenerationText: {
      type: String,
      default: '取消生成'
    },
    downloadImageText: {
      type: String,
      default: '下载图片'
    },
    imageEmptyText: {
      type: String,
      default: '图片将在这里显示'
    },
    generatingImageText: {
      type: String,
      default: '正在生成图片...'
    },
    imageUndoHintText: {
      type: String,
      default: '图片不理想？点击“撤销”可以修改描述，再次生成。'
    },
    conversationUndoHintText: {
      type: String,
      default: '不满意当前对话？点击“撤销”可以修改问题，再次提问。'
    }
  },

  computed: {
    actionHandlers() {
      return {
        copy: this.copyResponse,
        clear: this.clearResponse,
        undo: this.undoLastConversation,
        generateImage: this.generateImage,
        cancel: this.cancelGeneration
      };
    }
  }
};
</script>

<style scoped>
@import '@/styles/aiChatCommon.css';

.image-undo-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.conversation-undo-hint {
  font-size: 12px;
  color: #409EFF;
  margin-top: 8px;
  text-align: center;
}
</style>
