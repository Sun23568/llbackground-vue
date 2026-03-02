<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎区 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1 class="welcome-title">孙老六的后花园 🌿</h1>
        <p class="welcome-date">{{ today }}</p>
      </div>
    </div>

    <!-- LeetCode 每日一题卡片 -->
    <div class="cards-grid">
      <div class="leetcode-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="lc-logo">LC</div>
            <div>
              <div class="card-title">LeetCode 每日一题</div>
              <div class="card-subtitle">{{ question.日期 || '—' }}</div>
            </div>
          </div>
          <span
            v-if="question.难度"
            class="difficulty-badge"
            :class="difficultyClass(question.难度)">
            {{ difficultyLabel(question.难度) }}
          </span>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="lc-state">
          <i class="el-icon-loading"></i>
          <span>加载中...</span>
        </div>

        <!-- 未配置 -->
        <div v-else-if="!configId" class="lc-state lc-empty">
          <i class="el-icon-info"></i>
          <span>请输入爬虫配置 ID 以展示每日一题</span>
          <div class="config-input-row">
            <el-input
              v-model="inputConfigId"
              placeholder="粘贴爬虫配置 ID"
              size="small"
              clearable
              style="width: 280px"
            />
            <el-button type="primary" size="small" @click="saveConfigId">确认</el-button>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="!question.题号" class="lc-state lc-empty">
          <i class="el-icon-document-delete"></i>
          <span>暂无执行记录，请先执行一次爬虫</span>
          <el-button type="text" size="mini" @click="clearConfigId">更换配置 ID</el-button>
        </div>

        <!-- 题目内容 -->
        <div v-else class="lc-content">
          <div class="question-number"># {{ question.题号 }}</div>
          <div class="question-title">{{ question.中文标题 }}</div>
          <div class="question-meta" v-if="question.英文标题">{{ question.英文标题 }}</div>
          <a
            v-if="lcLink"
            :href="lcLink"
            target="_blank"
            class="question-link">
            <i class="el-icon-link"></i> 前往答题
          </a>
          <div class="card-footer">
            <span class="update-time" v-if="executeTime">更新于 {{ executeTime }}</span>
            <el-button type="text" size="mini" @click="clearConfigId" class="change-btn">更换配置</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'dashboard',
  data() {
    return {
      today: '',
      configId: '',
      inputConfigId: '',
      loading: false,
      executeTime: '',
      question: {}
    }
  },
  created() {
    this.today = this.formatDate(new Date())
    this.configId = localStorage.getItem('lc_crawler_config_id') || ''
    if (this.configId) {
      this.fetchLatest()
    }
  },
  computed: {
    lcLink() {
      const slug = this.question['链接slug'] || this.question['链接']
      if (!slug) return null
      // 如果已经是完整 URL 直接返回；否则拼接 leetcode.cn
      return slug.startsWith('http') ? slug : `https://leetcode.cn/problems/${slug}/`
    }
  },
  methods: {
    formatDate(d) {
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日  ${days[d.getDay()]}`
    },

    saveConfigId() {
      if (!this.inputConfigId.trim()) return
      this.configId = this.inputConfigId.trim()
      localStorage.setItem('lc_crawler_config_id', this.configId)
      this.fetchLatest()
    },

    clearConfigId() {
      this.configId = ''
      this.inputConfigId = ''
      this.question = {}
      this.executeTime = ''
      localStorage.removeItem('lc_crawler_config_id')
    },

    fetchLatest() {
      this.loading = true
      this.api({
        url: '/crawler/record/latest',
        method: 'get',
        params: { configId: this.configId }
      }).then(data => {
        if (!data || !data.resultData) {
          this.question = {}
          return
        }
        try {
          this.question = JSON.parse(data.resultData)
        } catch {
          this.question = {}
        }
        this.executeTime = data.executeTime
          ? data.executeTime.replace('T', ' ').substring(0, 16)
          : ''
      }).catch(() => {
        this.question = {}
      }).finally(() => {
        this.loading = false
      })
    },

    difficultyClass(d) {
      const map = { Easy: 'easy', Simple: 'easy', Medium: 'medium', Hard: 'hard', '简单': 'easy', '中等': 'medium', '困难': 'hard' }
      return map[d] || 'medium'
    },

    difficultyLabel(d) {
      const map = { Easy: '简单', Simple: '简单', Medium: '中等', Hard: '困难' }
      return map[d] || d
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 32px 28px;
  min-height: calc(100vh - 84px);
  background: #f0f2f5;
}

/* 欢迎区 */
.welcome-section {
  margin-bottom: 28px;
}
.welcome-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}
.welcome-date {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* 卡片网格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 480px));
  gap: 20px;
}

/* LeetCode 卡片 */
.leetcode-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.leetcode-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.13);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f2f5;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lc-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffa116, #ff6b00);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.card-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 难度徽章 */
.difficulty-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.difficulty-badge.easy   { background: #e6f9f0; color: #17a34a; }
.difficulty-badge.medium { background: #fff7e6; color: #d97706; }
.difficulty-badge.hard   { background: #fff0f0; color: #dc2626; }

/* 状态区 */
.lc-state {
  padding: 36px 20px;
  text-align: center;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.lc-state i {
  font-size: 36px;
  color: #c0c4cc;
}

.config-input-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* 题目内容 */
.lc-content {
  padding: 18px 20px 16px;
}

.question-number {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.question-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.4;
  margin-bottom: 4px;
}

.question-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 14px;
}

.question-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
  padding: 5px 12px;
  border-radius: 6px;
  background: #ecf5ff;
  transition: background 0.15s;
}
.question-link:hover {
  background: #d9ecff;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

.update-time {
  font-size: 12px;
  color: #c0c4cc;
}

.change-btn {
  font-size: 12px;
  padding: 0;
  color: #c0c4cc;
}
.change-btn:hover {
  color: #909399;
}
</style>
