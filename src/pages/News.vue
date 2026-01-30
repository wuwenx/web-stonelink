<template>
  <div class="news-page">
    <el-card class="header-card" shadow="hover">
      <div class="card-header">
        <h1 class="page-title">
          快讯
        </h1>
      </div>
    </el-card>

    <el-card class="list-card" shadow="hover">
      <div v-loading="loading" class="news-list">
        <template v-if="items.length">
          <article
            v-for="item in items"
            :key="item.id"
            class="news-item"
            @click="goDetail(item.id)"
          >
            <div class="news-item-header">
              <span class="news-source">{{ item.source_name || '快讯' }}</span>
              <span class="news-time">{{ formatTime(item.published_at || item.created_at) }}</span>
            </div>
            <h3 class="news-title">
              {{ item.title }}
            </h3>
            <p v-if="item.summary" class="news-summary">
              {{ item.summary }}
            </p>
          </article>

          <div class="load-more-wrap">
            <span
              v-if="hasMore"
              class="load-more-link"
              :class="{ 'is-loading': loadingMore }"
              @click="loadMore"
            >
              <el-icon v-if="loadingMore" class="is-loading"><Loading /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>{{ loadingMore ? '加载中...' : '加载更多' }}</span>
            </span>
            <p v-else-if="items.length > 0" class="no-more">
              没有更多了
            </p>
          </div>
        </template>
        <div v-else-if="!loading" class="empty">
          暂无快讯
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default { name: 'News' };
</script>
<script setup>
import { ArrowDown, Loading } from '@element-plus/icons-vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getNewsList } from '../services/newsApi';

const router = useRouter();
const pageSize = 20;
const items = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const loadingMore = ref(false);

const hasMore = computed(() => items.value.length < total.value);

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

async function fetchList(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    page.value = 1;
    items.value = [];
  }
  try {
    const res = await getNewsList({
      page: page.value,
      page_size: pageSize,
      lang: 'zh',
    });
    if (isLoadMore) {
      items.value = items.value.concat(res.items || []);
    } else {
      items.value = res.items || [];
    }
    total.value = res.total ?? 0;
    page.value = res.page ?? page.value;
  } catch (e) {
    if (!isLoadMore) items.value = [];
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  page.value += 1;
  fetchList(true);
}

function goDetail(id) {
  router.push({ name: 'NewsDetail', params: { id } });
}

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
.news-page {
  padding: 32px 40px;
  max-width: 900px;
  margin: 0 auto;
}

.header-card,
.list-card {
  margin-bottom: 24px;
  background: rgba(26, 31, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 16px !important;
}

.header-card:hover,
.list-card:hover {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 212, 255, 0.1) !important;
  padding: 16px 24px !important;
}

:deep(.el-card__body) {
  padding: 20px 24px !important;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.news-list {
  min-height: 200px;
}

.news-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
  cursor: pointer;
  transition: background 0.2s;
}

.news-item:hover {
  background: rgba(0, 212, 255, 0.04);
}

.news-item:last-of-type {
  border-bottom: none;
}

.news-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.news-source {
  font-size: 12px;
  color: #00d4ff;
  font-weight: 500;
}

.news-time {
  font-size: 12px;
  color: #718096;
}

.news-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #e4e8f0;
  line-height: 1.5;
}

.news-summary {
  margin: 0;
  font-size: 14px;
  color: #a0aec0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.load-more-wrap {
  padding: 24px 0 8px;
  text-align: center;
}

.load-more-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00d4ff;
  font-size: 14px;
  cursor: pointer;
}

.load-more-link:hover:not(.is-loading) {
  text-decoration: underline;
}

.load-more-link.is-loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.no-more {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

.empty {
  padding: 48px;
  text-align: center;
  color: #718096;
  font-size: 14px;
}

@media (max-width: 768px) {
  .news-page {
    padding: 16px;
  }
}
</style>
