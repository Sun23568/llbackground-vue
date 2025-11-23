<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button type="primary" icon="plus" @click="showCreate">新增配置</el-button>
    </div>
    
    <el-table :data="list" border fit highlight-current-row style="width: 100%;margin-top: 20px;">
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span>{{ scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="菜单名" prop="menuName"></el-table-column>
      <el-table-column align="center" label="菜单代码" prop="menuCode"></el-table-column>
      <el-table-column align="center" label="Ollama模型ID" prop="ollamaModelId"></el-table-column>
      <el-table-column align="center" label="ComfyUI地址" prop="comfyUiUrl"></el-table-column>
      <el-table-column align="center" label="Ollama地址" prop="ollamaUrl"></el-table-column>
      <el-table-column align="center" label="ComfyUI参数文件ID" prop="comfyFileId"></el-table-column>
      <el-table-column align="center" label="上下文大小" prop="contextSize"></el-table-column>
      <el-table-column align="center" label="操作" width="220">
        <template slot-scope="scope">
          <el-button type="primary" icon="edit" @click="showEdit(scope.row)">修改</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="40%" :append-to-body="true">
      <el-form :model="tempConfigForm" label-position="right" label-width="120px">
        <el-form-item label="菜单名" required>
          <el-input v-model="tempConfigForm.menuName" :disabled="dialogStatus==='update'"></el-input>
        </el-form-item>
        <el-form-item label="菜单代码" required>
          <el-input v-model="tempConfigForm.menuCode" :disabled="dialogStatus==='update'"></el-input>
        </el-form-item>
        <el-form-item label="Ollama模型ID">
          <el-input v-model="tempConfigForm.ollamaModelId"></el-input>
        </el-form-item>
        <el-form-item label="ComfyUI地址">
          <el-input v-model="tempConfigForm.comfyUiUrl"></el-input>
        </el-form-item>
        <el-form-item label="Ollama地址">
          <el-input v-model="tempConfigForm.ollamaUrl"></el-input>
        </el-form-item>
        <el-form-item label="ComfyUI参数文件ID">
          <el-input v-model="tempConfigForm.comfyFileId"></el-input>
        </el-form-item>
        <el-form-item label="背景图片">
          <el-input v-model="tempConfigForm.backgroundImage"></el-input>
        </el-form-item>
        <el-form-item label="上下文大小">
          <el-input-number v-model="tempConfigForm.contextSize" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus==='create'" type="primary" @click="createConfig">创 建</el-button>
        <el-button v-else type="primary" @click="updateConfig">修 改</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [], // 配置列表
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '修改配置',
        create: '新增配置'
      },
      tempConfigForm: {
        menuName: '',
        menuCode: '',
        ollamaModelId: '',
        comfyUiUrl: '',
        ollamaUrl: '',
        comfyFileId: '',
        backgroundImage: '',
        contextSize: 1024
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.api({
        url: "/ai/config/list",
        method: "post"
      }).then(data => {
        this.listLoading = false;
        this.list = data.userAccessRespList;
      })
    },
    showCreate() {
      this.tempConfigForm = {
        menuName: '',
        menuCode: '',
        ollamaModelId: '',
        comfyUiUrl: '',
        ollamaUrl: '',
        comfyFileId: '',
        backgroundImage: '',
        contextSize: 1024
      };
      this.dialogStatus = 'create';
      this.dialogFormVisible = true;
    },
    showEdit(row) {
      this.tempConfigForm = { ...row };
      this.dialogStatus = 'update';
      this.dialogFormVisible = true;
    },
    createConfig() {
      this.api({
        url: "/ai/config/add",
        method: "post",
        data: this.tempConfigForm
      }).then(() => {
        this.dialogFormVisible = false;
        this.$message.success('创建成功');
        this.getList();
      }).catch(err => {
        this.$message.error(err.message || '创建失败');
      });
    },
    updateConfig() {
      this.api({
        url: "/ai/config/update",
        method: "post",
        data: this.tempConfigForm
      }).then(() => {
        this.dialogFormVisible = false;
        this.$message.success('修改成功');
        this.getList();
      }).catch(err => {
        this.$message.error(err.message || '修改失败');
      });
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}
</style>