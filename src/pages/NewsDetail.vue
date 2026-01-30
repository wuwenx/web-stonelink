<template>
  <div class="news-detail-page">
    <div class="back-wrap top">
      <span class="back-link" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回快讯列表</span>
      </span>
    </div>
    <el-card v-loading="loading" class="detail-card" shadow="hover">
      <template v-if="detail">
        <div class="detail-header">
          <span class="source">{{ detail.source_name || '快讯' }}</span>
          <span class="time">{{ formatTime(detail.published_at || detail.created_at) }}</span>
        </div>
        <h1 class="detail-title">
          {{ detail.title }}
        </h1>
        <p v-if="detail.summary" class="detail-summary">
          {{ detail.summary }}
        </p>
        <div v-if="detail.content" class="detail-content">
          {{ detail.content }}
        </div>
        <a
          v-if="detail.url"
          :href="detail.url"
          target="_blank"
          rel="noopener noreferrer"
          class="detail-link"
        >
          阅读原文
        </a>
      </template>
      <div v-else-if="!loading && error" class="error-wrap">
        <p class="error-text">{{ error }}</p>
        <el-button type="primary" @click="fetchDetail">
          重试
        </el-button>
      </div>
      <div v-else-if="!loading" class="empty">
        暂无内容
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNewsDetail } from '../services/newsApi';

const route = useRoute();
const router = useRouter();

const detail = ref(null);
const loading = ref(false);
const error = ref(null);

const id = computed(() => route.params.id);

function formatTime(str) {
  if (!str) return '--';
  try {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return str;
  }
}

async function fetchDetail() {
  if (!id.value) return;
  loading.value = true;
  error.value = null;
  detail.value = null;
  try {
    detail.value = await getNewsDetail(id.value, { lang: 'zh' });
  } catch (e) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: 'News' });
}

watch(id, () => fetchDetail(), { immediate: false });
onMounted(() => fetchDetail());
</script>

<style scoped>
.news-detail-page {
  padding: 32px 40px;
  max-width: 800px;
  margin: 0 auto;
}

.detail-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.detail-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:deep(.el-card__body) {
  padding: 24px 32px !important;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.source {
  font-size: 13px;
  color: #00d4ff;
  font-weight: 500;
}

.time {
  font-size: 13px;
  color: #718096;
}

.detail-title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #e4e8f0;
  line-height: 1.4;
}

.detail-summary {
  margin: 0 0 20px;
  font-size: 15px;
  color: #a0aec0;
  line-height: 1.7;
}

.detail-content {
  margin: 0 0 24px;
  font-size: 15px;
  color: #cbd5e0;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-link {
  display: inline-block;
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
  margin-top: 8px;
}

.detail-link:hover {
  text-decoration: underline;
}

.back-wrap {
  padding: 8px 0;
}

.back-wrap.top {
  padding: 0 0 16px;
  margin-bottom: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00d4ff;
  font-size: 14px;
  cursor: pointer;
}

.back-link:hover {
  text-decoration: underline;
}

.error-wrap,
.empty {
  padding: 48px;
  text-align: center;
  color: #718096;
}

.error-text {
  margin: 0 0 16px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .news-detail-page {
    padding: 16px;
  }

  :deep(.el-card__body) {
    padding: 16px 20px !important;
  }

  .detail-title {
    font-size: 18px;
  }
}
</style>
