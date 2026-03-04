<template>
  <div class="crawler-config-container">
    <!-- 页面标题和操作栏 -->
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">
            <i class="el-icon-s-promotion"></i>
            爬虫配置管理
          </h2>
          <p class="page-subtitle">配置和管理网站爬虫任务</p>
        </div>
        <div class="action-section">
          <el-button
            type="primary"
            icon="el-icon-plus"
            size="medium"
            @click="showCreate">
            新增配置
          </el-button>
          <el-button
            icon="el-icon-refresh"
            size="medium"
            @click="getList">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 配置列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="list"
        v-loading="listLoading"
        stripe
        style="width: 100%"
        :header-cell-style="{background: '#f5f7fa', color: '#606266'}"
        class="modern-table">
        <el-table-column type="index" label="序号" width="70" align="center"></el-table-column>

        <el-table-column label="配置名称" min-width="150">
          <template slot-scope="scope">
            <div class="config-name">
              <i class="el-icon-document"></i>
              {{ scope.row.configName }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="目标URL" min-width="250" show-overflow-tooltip>
          <template slot-scope="scope">
            <div class="url-info">
              <el-tag size="mini" :type="scope.row.requestMethod === 'GET' ? 'success' : 'primary'">
                {{ scope.row.requestMethod }}
              </el-tag>
              <span class="url-text">{{ scope.row.targetUrl }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enabled"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="handleStatusChange(scope.row)">
            </el-switch>
          </template>
        </el-table-column>

        <el-table-column label="描述" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="description-text">{{ scope.row.description || '无' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.createTime || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button
                type="success"
                icon="el-icon-video-play"
                size="mini"
                plain
                @click="executeCrawler(scope.row)"
                :loading="scope.row.executing">
                执行
              </el-button>
              <el-button
                type="primary"
                icon="el-icon-edit"
                size="mini"
                plain
                @click="showEdit(scope.row)">
                编辑
              </el-button>
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                plain
                @click="handleDelete(scope.row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 变量输入对话框 -->
      <el-dialog
        title="填写执行变量"
        :visible.sync="varDialog.visible"
        width="480px"
        :close-on-click-modal="false"
        class="modern-dialog var-dialog">
        <div class="var-dialog-tip">
          <i class="el-icon-info"></i>
          以下变量将替换 URL / 请求体中对应的 <code>{{占位符}}</code>
        </div>
        <el-form label-position="top" class="var-form">
          <el-form-item
            v-for="key in varDialog.keys"
            :key="key"
            :label="key">
            <el-input
              v-model="varDialog.values[key]"
              :placeholder="'请输入 ' + key + ' 的值'"
              clearable>
            </el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="varDialog.visible = false" size="medium">取消</el-button>
          <el-button
            type="success"
            icon="el-icon-video-play"
            size="medium"
            :loading="varDialog.row && varDialog.row.executing"
            @click="doExecuteWithVars">
            确认执行
          </el-button>
        </div>
      </el-dialog>

      <!-- 空状态 -->
      <div v-if="!listLoading && list.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>暂无配置数据</p>
        <el-button type="primary" size="small" @click="showCreate">立即创建</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      :title="textMap[dialogStatus]"
      :visible.sync="dialogFormVisible"
      width="800px"
      :close-on-click-modal="false"
      class="modern-dialog">
      <el-form
        :model="tempConfigForm"
        :rules="formRules"
        ref="configForm"
        label-position="top"
        class="config-form">

        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-tickets"></i>
            基础信息
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="配置名称" prop="configName">
                <el-input
                  v-model="tempConfigForm.configName"
                  placeholder="请输入配置名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="请求方法" prop="requestMethod">
                <el-select v-model="tempConfigForm.requestMethod" style="width: 100%">
                  <el-option label="GET" value="GET"></el-option>
                  <el-option label="POST" value="POST"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="目标URL" prop="targetUrl">
            <el-input
              v-model="tempConfigForm.targetUrl"
              placeholder="请输入完整的URL地址，如: https://example.com/api/data">
            </el-input>
          </el-form-item>

          <el-form-item label="描述信息">
            <el-input
              type="textarea"
              v-model="tempConfigForm.description"
              :rows="2"
              placeholder="请输入描述信息"></el-input>
          </el-form-item>
        </div>

        <!-- 请求配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-setting"></i>
            请求配置
          </div>
          <el-form-item label="请求头 (JSON格式)">
            <el-input
              type="textarea"
              v-model="tempConfigForm.requestHeaders"
              :rows="4"
              placeholder='{"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}'></el-input>
          </el-form-item>

          <el-form-item label="请求体 (POST时使用)" v-if="tempConfigForm.requestMethod === 'POST'">
            <el-input
              type="textarea"
              v-model="tempConfigForm.requestBody"
              :rows="4"
              placeholder='{"key": "value"}'></el-input>
          </el-form-item>
        </div>

        <!-- 处理器配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-magic-stick"></i>
            处理器配置（可选）
          </div>
          <el-form-item label="前置处理器 (JSON格式)">
            <el-input
              type="textarea"
              v-model="tempConfigForm.preProcessor"
              :rows="3"
              placeholder='{"type": "urlBuilder", "params": {...}}'></el-input>
          </el-form-item>

          <el-form-item label="后置处理器">
            <!-- 类型选择 -->
            <el-select
              v-model="postProcessorType"
              placeholder="请选择后置处理器类型"
              style="width:280px;margin-bottom:12px"
              @change="onPostProcessorTypeChange">
              <el-option label="不使用" value="none"></el-option>
              <el-option label="JSON 字段提取" value="jsonExtract"></el-option>
              <el-option label="发送邮件通知（原始数据）" value="sendEmail"></el-option>
              <el-option label="提取字段 → 发邮件" value="extractAndEmail"></el-option>
              <el-option label="手动输入 JSON" value="manual"></el-option>
            </el-select>

            <!-- 链式模式：提取字段 + 发邮件 -->
            <div v-if="postProcessorType === 'extractAndEmail'" class="email-processor-box">
              <div class="chain-tip">
                <i class="el-icon-connection"></i>
                执行顺序：<strong>HTTP爬取</strong> → <strong>JSON字段提取</strong> → <strong>发送邮件</strong>
              </div>
              <div class="chain-section">
                <div class="chain-section-title"><i class="el-icon-document"></i> 第①步：提取字段</div>
                <div v-for="(field, idx) in extractFields" :key="idx" class="extract-field-row">
                  <el-input v-model="field.alias" placeholder="别名（如：题名）" size="small" style="width:130px" @input="syncChainedPostProcessor"></el-input>
                  <span class="field-arrow">→</span>
                  <el-input v-model="field.path" placeholder="JSON路径（如：data.todayRecord[0].question.translatedTitle）" size="small" style="flex:1" @input="syncChainedPostProcessor"></el-input>
                  <el-button type="danger" icon="el-icon-delete" size="mini" circle plain @click="removeExtractField(idx)"></el-button>
                </div>
                <el-button type="primary" icon="el-icon-plus" size="mini" plain style="margin-top:6px" @click="addExtractField">添加字段</el-button>
              </div>
              <div class="chain-section">
                <div class="chain-section-title"><i class="el-icon-message"></i> 第②步：发送邮件</div>
                <el-form-item label="邮件主题" style="margin-bottom:10px">
                  <el-input v-model="emailSubject" placeholder="爬虫执行结果通知" @input="syncChainedPostProcessor"></el-input>
                </el-form-item>
                <el-form-item label="收件人邮箱" style="margin-bottom:0">
                  <div class="recipient-input-wrap">
                    <el-tag v-for="email in emailRecipients" :key="email" closable size="small" type="info" @close="removeRecipient(email)" style="margin:0 6px 6px 0">{{ email }}</el-tag>
                    <el-input v-model="emailInput" size="small" placeholder="输入邮箱后按 Enter 添加" style="width:240px" @keyup.enter.native="addRecipientAndSync" @blur="addRecipientAndSync">
                      <el-button slot="append" icon="el-icon-plus" @click="addRecipientAndSync">添加</el-button>
                    </el-input>
                  </div>
                </el-form-item>

                <!-- 发送条件 -->
                <div class="condition-block">
                  <div class="condition-header">
                    <el-switch v-model="emailCondition.enabled" @change="syncChainedPostProcessor"></el-switch>
                    <span class="condition-label">满足条件才发送</span>
                    <span class="condition-hint" v-if="!emailCondition.enabled">（当前：无条件发送）</span>
                    <template v-if="emailCondition.enabled && emailCondition.rules.length > 1">
                      <el-radio-group v-model="emailCondition.logic" size="mini" style="margin-left:12px" @change="syncChainedPostProcessor">
                        <el-radio-button label="AND">且（AND）</el-radio-button>
                        <el-radio-button label="OR">或（OR）</el-radio-button>
                      </el-radio-group>
                    </template>
                  </div>
                  <template v-if="emailCondition.enabled">
                    <div v-for="(rule, idx) in emailCondition.rules" :key="idx" class="condition-rule-row">
                      <span class="condition-connector" v-if="idx > 0">{{ emailCondition.logic === 'OR' ? '或' : '且' }}</span>
                      <span class="condition-label-text" v-else>当</span>
                      <el-input v-model="rule.field" size="small" placeholder="字段（如：难度）" style="width:140px" @input="syncChainedPostProcessor"></el-input>
                      <el-select v-model="rule.operator" size="small" style="width:110px;margin:0 6px" @change="syncChainedPostProcessor">
                        <el-option label="等于" value="eq"></el-option>
                        <el-option label="不等于" value="neq"></el-option>
                        <el-option label="包含" value="contains"></el-option>
                        <el-option label="大于" value="gt"></el-option>
                        <el-option label="小于" value="lt"></el-option>
                        <el-option label="不为空" value="notEmpty"></el-option>
                        <el-option label="为空" value="isEmpty"></el-option>
                      </el-select>
                      <el-input v-if="rule.operator !== 'notEmpty' && rule.operator !== 'isEmpty'" v-model="rule.value" size="small" placeholder="比较值" style="width:130px" @input="syncChainedPostProcessor"></el-input>
                      <el-button v-if="emailCondition.rules.length > 1" type="danger" icon="el-icon-delete" size="mini" circle plain style="margin-left:4px" @click="removeConditionRule(idx, 'chained')"></el-button>
                    </div>
                    <el-button type="warning" icon="el-icon-plus" size="mini" plain style="margin-top:8px" @click="addConditionRule('chained')">添加条件</el-button>
                  </template>
                </div>
              </div>
              <div class="json-preview" v-if="tempConfigForm.postProcessor">
                <span class="json-preview-label">JSON 预览：</span>
                <code>{{ tempConfigForm.postProcessor }}</code>
              </div>
            </div>

            <!-- 仅发邮件（原始数据）-->
            <div v-if="postProcessorType === 'sendEmail'" class="email-processor-box">
              <el-form-item label="邮件主题" style="margin-bottom:12px">
                <el-input v-model="emailSubject" placeholder="爬虫执行结果通知" @input="syncEmailPostProcessor"></el-input>
              </el-form-item>
              <el-form-item label="收件人邮箱" style="margin-bottom:0">
                <div class="recipient-input-wrap">
                  <el-tag v-for="email in emailRecipients" :key="email" closable size="small" type="info" @close="removeRecipient(email)" style="margin:0 6px 6px 0">{{ email }}</el-tag>
                  <el-input v-model="emailInput" size="small" placeholder="输入邮箱后按 Enter 添加" style="width:240px" @keyup.enter.native="addRecipient" @blur="addRecipient">
                    <el-button slot="append" icon="el-icon-plus" @click="addRecipient">添加</el-button>
                  </el-input>
                </div>
              </el-form-item>

              <!-- 发送条件 -->
              <div class="condition-block">
                <div class="condition-header">
                  <el-switch v-model="emailCondition.enabled" @change="syncEmailPostProcessor"></el-switch>
                  <span class="condition-label">满足条件才发送</span>
                  <span class="condition-hint" v-if="!emailCondition.enabled">（当前：无条件发送）</span>
                  <template v-if="emailCondition.enabled && emailCondition.rules.length > 1">
                    <el-radio-group v-model="emailCondition.logic" size="mini" style="margin-left:12px" @change="syncEmailPostProcessor">
                      <el-radio-button label="AND">且（AND）</el-radio-button>
                      <el-radio-button label="OR">或（OR）</el-radio-button>
                    </el-radio-group>
                  </template>
                </div>
                <template v-if="emailCondition.enabled">
                  <div v-for="(rule, idx) in emailCondition.rules" :key="idx" class="condition-rule-row">
                    <span class="condition-connector" v-if="idx > 0">{{ emailCondition.logic === 'OR' ? '或' : '且' }}</span>
                    <span class="condition-label-text" v-else>当</span>
                    <el-input v-model="rule.field" size="small" placeholder="JSON字段路径（如：data.status）" style="width:180px" @input="syncEmailPostProcessor"></el-input>
                    <el-select v-model="rule.operator" size="small" style="width:110px;margin:0 6px" @change="syncEmailPostProcessor">
                      <el-option label="等于" value="eq"></el-option>
                      <el-option label="不等于" value="neq"></el-option>
                      <el-option label="包含" value="contains"></el-option>
                      <el-option label="大于" value="gt"></el-option>
                      <el-option label="小于" value="lt"></el-option>
                      <el-option label="不为空" value="notEmpty"></el-option>
                      <el-option label="为空" value="isEmpty"></el-option>
                    </el-select>
                    <el-input v-if="rule.operator !== 'notEmpty' && rule.operator !== 'isEmpty'" v-model="rule.value" size="small" placeholder="比较值" style="width:130px" @input="syncEmailPostProcessor"></el-input>
                    <el-button v-if="emailCondition.rules.length > 1" type="danger" icon="el-icon-delete" size="mini" circle plain style="margin-left:4px" @click="removeConditionRule(idx, 'email')"></el-button>
                  </div>
                  <el-button type="warning" icon="el-icon-plus" size="mini" plain style="margin-top:8px" @click="addConditionRule('email')">添加条件</el-button>
                </template>
              </div>
              <div class="json-preview" v-if="tempConfigForm.postProcessor">
                <span class="json-preview-label">JSON 预览：</span>
                <code>{{ tempConfigForm.postProcessor }}</code>
              </div>
            </div>

            <!-- jsonExtract 或 手动输入 -->
            <el-input
              v-if="postProcessorType !== 'sendEmail' && postProcessorType !== 'none' && postProcessorType !== 'extractAndEmail'"
              type="textarea"
              v-model="tempConfigForm.postProcessor"
              :rows="4"
              :placeholder="getPostProcessorPlaceholder()">
            </el-input>
          </el-form-item>
        </div>

        <!-- 其他配置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-time"></i>
            其他配置
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Cron表达式 (定时任务, 可选)">
                <el-input
                  v-model="tempConfigForm.cronExpression"
                  placeholder="如: 0 0 12 * * ? (每天12点执行)"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否启用">
                <el-switch
                  v-model="tempConfigForm.enabled"
                  active-text="启用"
                  inactive-text="禁用">
                </el-switch>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false" size="medium">取消</el-button>
        <el-button
          v-if="dialogStatus==='create'"
          type="primary"
          @click="createConfig"
          size="medium"
          :loading="submitLoading">
          创建
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="updateConfig"
          size="medium"
          :loading="submitLoading">
          保存
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      dialogStatus: '',
      submitLoading: false,
      pageNum: 1,
      pageSize: 10,
      total: 0,
      textMap: {
        update: '编辑爬虫配置',
        create: '新增爬虫配置'
      },
      // 变量输入对话框
      varDialog: {
        visible: false,
        keys: [],
        values: {},
        row: null
      },
      // 后置处理器可视化字段
      postProcessorType: 'none',
      emailSubject: '',
      emailRecipients: [],
      emailInput: '',
      extractFields: [],  // [{alias, path}]
      emailCondition: { enabled: false, logic: 'AND', rules: [{ field: '', operator: 'eq', value: '' }] },
      tempConfigForm: {
        configName: '',
        targetUrl: '',
        requestMethod: 'GET',
        requestHeaders: '',
        requestBody: '',
        preProcessor: '',
        postProcessor: '',
        cronExpression: '',
        enabled: true,
        description: ''
      },
      formRules: {
        configName: [
          { required: true, message: '请输入配置名称', trigger: 'blur' }
        ],
        targetUrl: [
          { required: true, message: '请输入目标URL', trigger: 'blur' },
          { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
        ],
        requestMethod: [
          { required: true, message: '请选择请求方法', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.listLoading = true;
      this.api({
        url: "/crawler/config/list",
        method: "get",
        params: {
          pageNum: this.pageNum,
          pageRow: this.pageSize
        }
      }).then(data => {
        this.list = data.list || [];
        this.total = data.total || 0;
      }).catch(err => {
        this.$message.error(err.message || '获取列表失败');
      }).finally(() => {
        this.listLoading = false;
      });
    },

    showCreate() {
      this.tempConfigForm = {
        configName: '',
        targetUrl: '',
        requestMethod: 'GET',
        requestHeaders: '',
        requestBody: '',
        preProcessor: '',
        postProcessor: '',
        cronExpression: '',
        enabled: true,
        description: ''
      };
      this.postProcessorType = 'none';
      this.emailSubject = '';
      this.emailRecipients = [];
      this.emailInput = '';
      this.extractFields = [];
      this.emailCondition = { enabled: false, logic: 'AND', rules: [{ field: '', operator: 'eq', value: '' }] };
      this.dialogStatus = 'create';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        if (this.$refs.configForm) {
          this.$refs.configForm.clearValidate();
        }
      });
    },

    showEdit(row) {
      this.tempConfigForm = { ...row };
      // 反序列化后置处理器
      this.parsePostProcessor(row.postProcessor);
      this.dialogStatus = 'update';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        if (this.$refs.configForm) {
          this.$refs.configForm.clearValidate();
        }
      });
    },

    createConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          this.api({
            url: "/crawler/config/add",
            method: "post",
            data: this.tempConfigForm
          }).then(() => {
            this.dialogFormVisible = false;
            this.$message({
              type: 'success',
              message: '创建成功'
            });
            this.getList();
          }).catch(err => {
            this.$message.error(err.message || '创建失败');
          }).finally(() => {
            this.submitLoading = false;
          });
        }
      });
    },

    updateConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          this.api({
            url: "/crawler/config/update",
            method: "post",
            data: this.tempConfigForm
          }).then(() => {
            this.dialogFormVisible = false;
            this.$message({
              type: 'success',
              message: '修改成功'
            });
            this.getList();
          }).catch(err => {
            this.$message.error(err.message || '修改失败');
          }).finally(() => {
            this.submitLoading = false;
          });
        }
      });
    },

    handleDelete(row) {
      this.$confirm('确定要删除这个爬虫配置吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.api({
          url: "/crawler/config/delete",
          method: "post",
          data: { pkId: row.pkId }
        }).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功'
          });
          this.getList();
        }).catch(err => {
          this.$message.error(err.message || '删除失败');
        });
      }).catch(() => {});
    },

    // 提取字符串中所有 {{xxx}} 占位符，返回去重后的变量名数组
    extractPlaceholders(str) {
      if (!str) return [];
      const regex = /\{\{(\w+)\}\}/g;
      const keys = new Set();
      let m;
      while ((m = regex.exec(str)) !== null) {
        keys.add(m[1]);
      }
      return Array.from(keys);
    },

    executeCrawler(row) {
      // 扫描 URL 和 requestBody 中的占位符
      const keys = [
        ...this.extractPlaceholders(row.targetUrl),
        ...this.extractPlaceholders(row.requestBody)
      ];
      const uniqueKeys = [...new Set(keys)];

      if (uniqueKeys.length === 0) {
        // 无占位符，直接执行
        this.doExecute(row, {});
      } else {
        // 有占位符，弹出变量填写弹窗
        const initValues = {};
        uniqueKeys.forEach(k => { initValues[k] = ''; });
        this.varDialog = {
          visible: true,
          keys: uniqueKeys,
          values: initValues,
          row
        };
      }
    },

    doExecuteWithVars() {
      this.doExecute(this.varDialog.row, this.varDialog.values);
      this.varDialog.visible = false;
    },

    doExecute(row, variables) {
      this.$set(row, 'executing', true);
      this.api({
        url: "/crawler/execute",
        method: "post",
        data: { configId: row.pkId, variables }
      }).then(() => {
        this.$message({
          type: 'success',
          message: '执行成功！',
          duration: 3000
        });
        this.$router.push('/crawler/record');
      }).catch(err => {
        this.$message.error(err.message || '执行失败');
      }).finally(() => {
        this.$set(row, 'executing', false);
      });
    },

    handleStatusChange(row) {
      this.api({
        url: "/crawler/config/update",
        method: "post",
        data: row
      }).then(() => {
        this.$message.success('状态更新成功');
      }).catch(err => {
        this.$message.error('状态更新失败');
        row.enabled = !row.enabled; // 恢复原状态
      });
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.pageNum = 1;
      this.getList();
    },

    handleCurrentChange(val) {
      this.pageNum = val;
      this.getList();
    },

    // ====== 后置处理器可视化 ======
    onPostProcessorTypeChange(type) {
      if (type === 'none') {
        this.tempConfigForm.postProcessor = '';
      } else if (type === 'sendEmail') {
        this.syncEmailPostProcessor();
      }
    },

    addRecipient() {
      const val = (this.emailInput || '').trim();
      if (!val) return;
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(val)) {
        this.$message.warning('请输入合法的邮箱地址');
        return;
      }
      if (this.emailRecipients.includes(val)) {
        this.$message.warning('该邮箱已添加');
        return;
      }
      this.emailRecipients.push(val);
      this.emailInput = '';
      this.syncEmailPostProcessor();
    },

    removeRecipient(email) {
      this.emailRecipients = this.emailRecipients.filter(e => e !== email);
      this.syncEmailPostProcessor();
    },

    syncEmailPostProcessor() {
      const config = {
        type: 'sendEmail',
        subject: this.emailSubject || '爬虫执行结果通知',
        recipients: this.emailRecipients
      };
      if (this.emailCondition.enabled && this.emailCondition.rules && this.emailCondition.rules.some(r => r.field)) {
        config.condition = {
          logic: this.emailCondition.logic || 'AND',
          rules: this.emailCondition.rules.filter(r => r.field).map(r => ({
            field: r.field,
            operator: r.operator || 'eq',
            value: r.value
          }))
        };
      }
      this.tempConfigForm.postProcessor = JSON.stringify(config);
    },

    parsePostProcessor(json) {
      this.emailSubject = '';
      this.emailRecipients = [];
      this.emailInput = '';
      this.extractFields = [];
      if (!json || !json.trim()) {
        this.postProcessorType = 'none';
        return;
      }
      try {
        const trimmed = json.trim();
        if (trimmed.startsWith('[')) {
          // 数组形式：链式执行
          const arr = JSON.parse(trimmed);
          const extractStep = arr.find(s => s.type === 'jsonExtract');
          const emailStep = arr.find(s => s.type === 'sendEmail');
          if (extractStep && emailStep) {
            this.postProcessorType = 'extractAndEmail';
            this.emailSubject = emailStep.subject || '';
            this.emailRecipients = Array.isArray(emailStep.recipients) ? emailStep.recipients : [];
            if (extractStep.fields) {
              this.extractFields = Object.entries(extractStep.fields).map(([alias, path]) => ({ alias, path }));
            }
            if (emailStep.condition) {
              const cond = emailStep.condition;
              if (cond.rules && Array.isArray(cond.rules)) {
                this.emailCondition = { enabled: true, logic: cond.logic || 'AND', rules: cond.rules };
              } else if (cond.field) {
                this.emailCondition = { enabled: true, logic: 'AND', rules: [{ field: cond.field, operator: cond.operator || 'eq', value: cond.value || '' }] };
              }
            }
          } else {
            this.postProcessorType = 'manual';
          }
        } else {
          const obj = JSON.parse(trimmed);
          if (obj.type === 'sendEmail') {
            this.postProcessorType = 'sendEmail';
            this.emailSubject = obj.subject || '';
            this.emailRecipients = Array.isArray(obj.recipients) ? obj.recipients : [];
            if (obj.condition) {
              const cond = obj.condition;
              if (cond.rules && Array.isArray(cond.rules)) {
                this.emailCondition = { enabled: true, logic: cond.logic || 'AND', rules: cond.rules };
              } else if (cond.field) {
                this.emailCondition = { enabled: true, logic: 'AND', rules: [{ field: cond.field, operator: cond.operator || 'eq', value: cond.value || '' }] };
              }
            }
          } else if (obj.type === 'jsonExtract') {
            this.postProcessorType = 'jsonExtract';
          } else {
            this.postProcessorType = 'manual';
          }
        }
      } catch (e) {
        this.postProcessorType = 'manual';
      }
    },

    // 链式模式：添加提取字段
    addExtractField() {
      this.extractFields.push({ alias: '', path: '' });
    },

    removeExtractField(idx) {
      this.extractFields.splice(idx, 1);
      this.syncChainedPostProcessor();
    },

    // 链式模式：同步序列化成 JSON 数组
    syncChainedPostProcessor() {
      const fields = {};
      this.extractFields.forEach(f => {
        if (f.alias && f.path) fields[f.alias] = f.path;
      });
      const emailStep = {
        type: 'sendEmail',
        subject: this.emailSubject || '爬虫执行结果通知',
        recipients: this.emailRecipients
      };
      if (this.emailCondition.enabled && this.emailCondition.rules && this.emailCondition.rules.some(r => r.field)) {
        emailStep.condition = {
          logic: this.emailCondition.logic || 'AND',
          rules: this.emailCondition.rules.filter(r => r.field).map(r => ({
            field: r.field,
            operator: r.operator || 'eq',
            value: r.value
          }))
        };
      }
      const config = [
        { type: 'jsonExtract', fields },
        emailStep
      ];
      this.tempConfigForm.postProcessor = JSON.stringify(config);
    },

    // 链式模式中的添加收件人（添加同时刷新 JSON）
    addRecipientAndSync() {
      const val = (this.emailInput || '').trim();
      if (!val) return;
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(val)) {
        this.$message.warning('请输入合法的邮箱地址');
        return;
      }
      if (this.emailRecipients.includes(val)) {
        this.$message.warning('该邮箱已添加');
        return;
      }
      this.emailRecipients.push(val);
      this.emailInput = '';
      this.syncChainedPostProcessor();
    },

    getPostProcessorPlaceholder() {
      if (this.postProcessorType === 'jsonExtract') {
        return '{"type":"jsonExtract","fields":{"\u65e5\u671f":"data.todayRecord[0].date","\u9898\u53f7":"data.todayRecord[0].question.questionFrontendId"}}';
      }
      return '{"type":"..."}';
    },

    // 添加一条条件规则
    addConditionRule(mode) {
      this.emailCondition.rules.push({ field: '', operator: 'eq', value: '' });
      if (mode === 'chained') this.syncChainedPostProcessor();
      else this.syncEmailPostProcessor();
    },

    // 删除一条条件规则
    removeConditionRule(idx, mode) {
      this.emailCondition.rules.splice(idx, 1);
      if (mode === 'chained') this.syncChainedPostProcessor();
      else this.syncEmailPostProcessor();
    }
  }
}
</script>

<style scoped>
.crawler-config-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

/* 头部卡片 */
.header-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section .page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section .page-subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.action-section {
  display: flex;
  gap: 10px;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
}

.modern-table {
  font-size: 14px;
}

.config-name {
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.url-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-info .el-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  line-height: 1;
  padding: 0 5px;
}

.url-text {
  color: #606266;
  font-size: 13px;
}

.description-text {
  color: #606266;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-buttons .el-button {
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 80px;
  color: #c0c4cc;
  margin-bottom: 20px;
  display: block;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 表单样式 */
.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 邮件后置处理器 */
.email-processor-box {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 6px;
  padding: 16px;
  margin-top: 4px;
}

.email-processor-box .el-form-item {
  margin-bottom: 12px;
}

.recipient-input-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  padding: 6px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 38px;
}

.json-preview {
  margin-top: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1px dashed #c0c4cc;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.json-preview-label {
  color: #909399;
  margin-right: 6px;
}

.json-preview code {
  color: #409EFF;
  font-family: monospace;
}

/* 链式后置处理器 */
.chain-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  margin-bottom: 12px;
}

.chain-section {
  border: 1px solid #e1f3d8;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
}

.chain-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #67C23A;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.extract-field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.field-arrow {
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
}

/* 多条件规则行 */
.condition-rule-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.condition-connector {
  font-size: 13px;
  font-weight: 600;
  color: #E6A23C;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

/* 发送条件区域 */
.condition-block {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
}

.condition-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.condition-label {
  font-size: 13px;
  font-weight: 600;
  color: #E6A23C;
}

.condition-hint {
  font-size: 12px;
  color: #909399;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.condition-label-text {
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}

.dialog-footer {
  text-align: right;
}

/* 变量输入弹窗 */
.var-dialog-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 20px;
}

.var-dialog-tip code {
  background: #d9ecff;
  color: #337ecc;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.var-form .el-form-item {
  margin-bottom: 16px;
}

.var-form .el-form-item__label {
  font-weight: 600;
  color: #303133;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .action-section {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
