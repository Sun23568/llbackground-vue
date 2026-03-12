<template>
  <div class="dashboard-container">
    <!-- 全景 Banner 欢迎区 -->
    <div class="hero-banner" :style="picUrl ? { backgroundImage: 'url(' + picUrl + ')' } : {}">
      <!-- 暗色渐变遮罩 -->
      <div class="hero-overlay" v-if="picUrl"></div>
      
      <div class="hero-content">
        <!-- 左侧欢迎信息 -->
        <div class="welcome-text" :class="{'glass-text': picUrl}">
          <h1 class="welcome-title">孙老六的后花园 🌿</h1>
          <p class="welcome-date">{{ today }}</p>
        </div>
        
        <!-- 右侧壁纸配置或信息面板 -->
        <div class="hero-pic-info">
          <!-- 数据展示状态 -->
          <div v-if="picUrl" class="pic-info-glass">
             <div class="pic-header">
                <h3>🖼️ 探索今日视界</h3>
                <el-button type="text" size="mini" @click="clearPicConfigId" class="glass-btn">更换配置</el-button>
             </div>
             <p class="pic-desc">{{ picData['📌 照片背后的故事'] || picData['📌 图片分辨率'] || '高清视觉盛宴，享受此刻宁静' }}</p>
             <p class="pic-time" v-if="picExecuteTime">更新时间：{{ picExecuteTime }}</p>
          </div>

          <!-- 加载状态 -->
          <div v-else-if="loadingPic" class="pic-empty-state">
             <i class="el-icon-loading" style="font-size:32px;"></i>
          </div>

          <!-- 未配置状态 -->
          <div v-else-if="!picConfigId" class="pic-empty-state">
            <div class="pic-empty-content">
              <i class="el-icon-picture-outline"></i>
              <span>开启沉浸式画廊体验</span>
              <div class="config-input-row" style="margin-top: 15px;">
                <el-input
                  v-model="inputPicConfigId"
                  placeholder="粘贴壁纸提取爬虫 ID"
                  size="small"
                  clearable
                />
                <el-button type="primary" size="small" @click="savePicConfigId">确定</el-button>
              </div>
            </div>
          </div>

          <!-- 找不到图片 -->
          <div v-else class="pic-empty-state error-state">
            <div class="pic-empty-content">
              <i class="el-icon-warning-outline"></i>
              <span>没有获取到图片链接</span>
              <el-button type="text" size="mini" @click="clearPicConfigId" style="margin-top:10px;">更换爬虫配置</el-button>
            </div>
          </div>
        </div>
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


      <!-- 微博热搜卡片 -->
      <div class="weibo-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="wb-logo"><i class="el-icon-odometer"></i></div>
            <div>
              <div class="card-title">微博实时热搜</div>
              <div class="card-subtitle">关注全网新鲜事</div>
            </div>
          </div>
          <span class="difficulty-badge" style="background:#fff0f0; color:#e02433;">HOT</span>
        </div>

        <!-- 加载中 -->
        <div v-if="loadingWeibo" class="lc-state">
          <i class="el-icon-loading"></i>
          <span>加载中...</span>
        </div>

        <!-- 未配置 -->
        <div v-else-if="!weiboConfigId" class="lc-state lc-empty">
          <i class="el-icon-info"></i>
          <span>请输入爬虫配置 ID 以展示热搜</span>
          <div class="config-input-row">
            <el-input
              v-model="inputWeiboConfigId"
              placeholder="粘贴热搜爬虫配置 ID"
              size="small"
              clearable
              style="width: 280px"
            />
            <el-button type="primary" size="small" @click="saveWeiboConfigId">确认</el-button>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="weiboList.length === 0" class="lc-state lc-empty">
          <i class="el-icon-document-delete"></i>
          <span>暂无执行记录，请先执行一次爬虫</span>
          <el-button type="text" size="mini" @click="clearWeiboConfigId">更换配置 ID</el-button>
        </div>

        <!-- 热搜列表内容 -->
        <div v-else class="wb-content">
          <ul class="wb-list">
            <li v-for="(item, index) in weiboList" :key="index" class="wb-list-item">
               <span class="wb-rank" :class="{'top-3': index < 3}">{{ index + 1 }}</span>
               <a :href="item.link" target="_blank" class="wb-title-link">{{ item.title }}</a>
            </li>
          </ul>
          <div class="card-footer">
            <span class="update-time" v-if="weiboExecuteTime">更新于 {{ weiboExecuteTime }}</span>
            <el-button type="text" size="mini" @click="clearWeiboConfigId" class="change-btn">更换配置</el-button>
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
      question: {},
      
      picConfigId: '',
      inputPicConfigId: '',
      loadingPic: false,
      picExecuteTime: '',
      picData: {},
      
      weiboConfigId: '',
      inputWeiboConfigId: '',
      loadingWeibo: false,
      weiboExecuteTime: '',
      weiboData: {}
    }
  },
  created() {
    this.today = this.formatDate(new Date())
    // 从数据库一次性加载所有配置
    this.loadSettingsFromDB()
  },
  computed: {
    lcLink() {
      const slug = this.question['链接slug'] || this.question['链接']
      if (!slug) return null
      return slug.startsWith('http') ? slug : `https://leetcode.cn/problems/${slug}/`
    },
    picUrl() {
      // 1. 先尝试直接匹配预设的几个可能的名字
      let urlRaw = this.picData['🖼️ 今日纯享极美壁纸'] || this.picData['🖼️ 今日纯享绝美壁纸'] || this.picData['🖼️ 今日必应壁纸'] || this.picData['🖼️ 今日天文影像'] || this.picData['🖼️ 治愈系随机配图'];
      
      // 2. 如果没匹配到，遍历整个对象寻找可能的图片链接片段
      if (!urlRaw) {
         for (const key in this.picData) {
            const val = this.picData[key] ? String(this.picData[key]) : '';
            // 判断是否长得像包含链接的样子 (http...)
            if (val.includes('http')) {
               urlRaw = val;
               break;
            }
         }
      }
      
      if (!urlRaw) return '';
      
      // 3. 尝试从 markdown [xxx](url) 或 ![xxx](url) 中提取纯 url
      const match = urlRaw.match(/\]\((.*?)\)/);
      return match ? match[1] : urlRaw;
    },
    weiboList() {
      // 将爬虫保存的含有超链接 Markdown 语法的值处理成数组
      if (!this.weiboData || Object.keys(this.weiboData).length === 0) return []
      const list = []
      for (const [key, value] of Object.entries(this.weiboData)) {
         let title = value
         let link = ''
         const match = String(value).match(/\[(.*?)\]\((.*?)\)/)
         if (match) {
            title = match[1]
            link = match[2]
         }
         list.push({ rank: key, title, link })
      }
      return list
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
      this.saveSetting('dashboard.lc_crawler_config_id', this.configId)
      this.fetchLatest()
    },

    clearConfigId() {
      this.configId = ''
      this.inputConfigId = ''
      this.question = {}
      this.executeTime = ''
      this.saveSetting('dashboard.lc_crawler_config_id', '')
    },
    
    savePicConfigId() {
      if (!this.inputPicConfigId.trim()) return
      this.picConfigId = this.inputPicConfigId.trim()
      this.saveSetting('dashboard.pic_crawler_config_id', this.picConfigId)
      this.fetchLatestPic()
    },

    clearPicConfigId() {
      this.picConfigId = ''
      this.inputPicConfigId = ''
      this.picData = {}
      this.picExecuteTime = ''
      this.saveSetting('dashboard.pic_crawler_config_id', '')
    },
    
    saveWeiboConfigId() {
      if (!this.inputWeiboConfigId.trim()) return
      this.weiboConfigId = this.inputWeiboConfigId.trim()
      this.saveSetting('dashboard.weibo_crawler_config_id', this.weiboConfigId)
      this.fetchLatestWeibo()
    },

    clearWeiboConfigId() {
      this.weiboConfigId = ''
      this.inputWeiboConfigId = ''
      this.weiboData = {}
      this.weiboExecuteTime = ''
      this.saveSetting('dashboard.weibo_crawler_config_id', '')
    },

    // 从数据库加载所有配置
    loadSettingsFromDB() {
      this.api({ url: '/setting/all', method: 'get' }).then(settings => {
        if (!settings) return
        const lc    = settings['dashboard.lc_crawler_config_id'] || ''
        const pic   = settings['dashboard.pic_crawler_config_id'] || ''
        const weibo = settings['dashboard.weibo_crawler_config_id'] || ''
        
        if (lc) { this.configId = lc; this.fetchLatest() }
        if (pic) { this.picConfigId = pic; this.fetchLatestPic() }
        if (weibo) { this.weiboConfigId = weibo; this.fetchLatestWeibo() }
      }).catch(() => {})
    },

    // 保存单个配置到数据库
    saveSetting(key, value) {
      this.api({
        url: '/setting/save',
        method: 'post',
        data: { cfgKey: key, cfgValue: value }
      }).catch(() => {})
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
    
    fetchLatestPic() {
      this.loadingPic = true
      this.api({
        url: '/crawler/record/latest',
        method: 'get',
        params: { configId: this.picConfigId }
      }).then(data => {
        if (!data || !data.resultData) {
          this.picData = {}
          return
        }
        try {
          this.picData = JSON.parse(data.resultData)
        } catch {
          this.picData = {}
        }
        this.picExecuteTime = data.executeTime
          ? data.executeTime.replace('T', ' ').substring(0, 16)
          : ''
      }).catch(() => {
        this.picData = {}
      }).finally(() => {
        this.loadingPic = false
      })
    },
    
    fetchLatestWeibo() {
      this.loadingWeibo = true
      this.api({
        url: '/crawler/record/latest',
        method: 'get',
        params: { configId: this.weiboConfigId }
      }).then(data => {
        if (!data || !data.resultData) {
          this.weiboData = {}
          return
        }
        try {
          this.weiboData = JSON.parse(data.resultData)
        } catch {
          this.weiboData = {}
        }
        this.weiboExecuteTime = data.executeTime
          ? data.executeTime.replace('T', ' ').substring(0, 16)
          : ''
      }).catch(() => {
        this.weiboData = {}
      }).finally(() => {
        this.loadingWeibo = false
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
  align-self: start;
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

/* 全景英雄横幅 */
.hero-banner {
  position: relative;
  width: 100%;
  height: 420px;
  background-color: #e4e7ed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 16px;
  margin-bottom: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.welcome-text.glass-text {
  text-shadow: 0 2px 12px rgba(0,0,0,0.5);
}
.welcome-text.glass-text .welcome-title {
  color: #ffffff;
}
.welcome-text.glass-text .welcome-date {
  color: rgba(255,255,255,0.9);
}

.hero-pic-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 340px;
  max-width: 420px;
}

.pic-info-glass {
  background: rgba(40,40,40,0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transform: translateY(12px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
}

.hero-banner:hover .pic-info-glass {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.hero-banner:hover .pic-info-glass:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
}

.pic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pic-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.glass-btn {
  color: rgba(255,255,255,0.7) !important;
  padding: 0 !important;
}
.glass-btn:hover {
  color: rgba(255,255,255,1) !important;
}

.pic-desc {
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  margin: 0 0 16px 0;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.pic-time {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.pic-empty-state {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.pic-empty-state.error-state {
  background: rgba(255, 240, 240, 0.85);
}

.pic-empty-content {
  text-align: center;
  color: #606266;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pic-empty-content i {
  font-size: 36px;
  color: #909399;
}

/* 微博热搜卡片 */
.weibo-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
  align-self: start;
}

.weibo-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.13);
}

.wb-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff4d4f, #e02433);
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wb-content {
  padding: 8px 20px 16px;
}

.wb-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.wb-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.wb-list-item:last-child {
  border-bottom: none;
}

.wb-rank {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #f0f2f5;
  color: #909399;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wb-rank.top-3 {
  background: linear-gradient(135deg, #ff4d4f, #e02433);
  color: #fff;
}

.wb-title-link {
  color: #303133;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s;
}

.wb-title-link:hover {
  color: #e02433;
}
</style>
