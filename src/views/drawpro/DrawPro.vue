<template>
  <div class="drawpro-page">
    <iframe
      class="drawpro-frame"
      title="drawPro"
      src="/drawpro/index.html"
      allow="clipboard-read; clipboard-write"
    />
  </div>
</template>

<script>
export default {
  name: 'DrawPro',
  created() {
    localStorage.setItem('drawpro.backend.baseUrl', '/api')
  }
}
</script>

<style scoped>
.drawpro-page {
  height: calc(100vh - 84px);
  min-height: 0;
  background: #f5f7fa;
}

.drawpro-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}
</style>
