<script setup lang="ts">
import {
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Heart,
  Info
} from 'lucide-vue-next'
import { siteConfig } from '~/utils/content'
import type { BlogArticle } from '~/utils/articles'
import '~/assets/css/article-reader.css'

const props = defineProps<{
  article: BlogArticle
  prevArticle?: BlogArticle | null
  nextArticle?: BlogArticle | null
}>()

const baseURL = useRuntimeConfig().app.baseURL
const heroPortrait = `${baseURL}${siteConfig.heroImage.replace(/^\//, '')}`
const logoSrc = `${baseURL}logo.svg`

const FEEDBACK_STORAGE_KEY = 'ker-blog-article-feedback-v1'

interface ArticleFeedbackRecord {
  liked?: boolean
  reported?: boolean
}

const downloaded = ref(false)
const isLiked = ref(false)
const isReported = ref(false)
const feedbackHint = ref('')

let downloadTimer: ReturnType<typeof setTimeout> | undefined
let hintTimer: ReturnType<typeof setTimeout> | undefined

function readFeedbackMap(): Record<string, ArticleFeedbackRecord> {
  if (!import.meta.client) return {}
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
    return raw ? JSON.parse(raw) as Record<string, ArticleFeedbackRecord> : {}
  }
  catch {
    return {}
  }
}

function writeFeedbackRecord(slug: string, patch: ArticleFeedbackRecord) {
  if (!import.meta.client) return
  try {
    const map = readFeedbackMap()
    map[slug] = { ...map[slug], ...patch }
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(map))
  }
  catch {
    // 忽略隐私模式存储限制
  }
}

function syncFeedbackState(slug: string) {
  const record = readFeedbackMap()[slug]
  isLiked.value = Boolean(record?.liked)
  isReported.value = Boolean(record?.reported)
  downloaded.value = false
  feedbackHint.value = ''
}

function showHint(text: string) {
  feedbackHint.value = text
  clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    feedbackHint.value = ''
  }, 2000)
}

function downloadArticle() {
  if (!import.meta.client) return
  const current = props.article
  const metaParts = [
    `发布日期：${current.date}`,
    `分类：${current.category}`,
    current.tags.length ? `标签：${current.tags.join(' / ')}` : '',
    `作者：${siteConfig.brand}`
  ].filter(Boolean)

  const markdownContent = [
    `# ${current.title}`,
    '',
    `> ${metaParts.join(' · ')}`,
    '',
    current.summary ? `${current.summary}\n\n---\n` : '',
    current.body.trim(),
    ''
  ].join('\n')

  const safeTitle = current.title.replace(/[\\/:*?"<>|]/g, '-').trim() || current.slug
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeTitle}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)

  downloaded.value = true
  showHint('已导出 Markdown')
  clearTimeout(downloadTimer)
  downloadTimer = setTimeout(() => {
    downloaded.value = false
  }, 1800)
}

function toggleLike() {
  isLiked.value = !isLiked.value
  writeFeedbackRecord(props.article.slug, { liked: isLiked.value })
  showHint(isLiked.value ? '感谢喜欢' : '已取消喜欢')
}

function toggleReport() {
  isReported.value = !isReported.value
  writeFeedbackRecord(props.article.slug, { reported: isReported.value })
  showHint(isReported.value ? '已记录报错反馈' : '已撤销报错')
}

onMounted(() => {
  syncFeedbackState(props.article.slug)
})

watch(() => props.article.slug, (slug) => {
  syncFeedbackState(slug)
})

onBeforeUnmount(() => {
  clearTimeout(downloadTimer)
  clearTimeout(hintTimer)
})
</script>

<template>
  <div class="article-body-shell">
    <!-- 纯净居中的 Markdown 渲染正文 -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="md-prose" v-html="article.html" />

    <!-- 文末一体化三段式作者与上下篇导览卡片 -->
    <footer class="article-footer-panel">
      <section class="article-end-card" aria-label="文章作者与上下篇导览">
        <!-- 左侧：本文作者信息与下载 / 喜欢 / 报错轻互动 -->
        <div class="article-end-author">
          <p class="article-end-label">本文作者 · {{ siteConfig.brand }}</p>
          <p class="article-end-bio">
            记录前端工程、界面设计与长期知识沉淀。希望这里的每一篇文字，都能为你带来一点清晰的启发与参考。
          </p>
          <div class="article-end-actions">
            <button
              type="button"
              class="article-end-more"
              :class="{ 'is-done': downloaded }"
              :title="downloaded ? '已开始下载 Markdown 文件' : '下载本文 Markdown 文件'"
              aria-label="下载本文 Markdown 文件"
              @click="downloadArticle"
            >
              <Check v-if="downloaded" :size="13" :stroke-width="2" aria-hidden="true" />
              <Download v-else :size="13" :stroke-width="2" aria-hidden="true" />
              <span>{{ downloaded ? '已下载' : '下载文章' }}</span>
            </button>

            <button
              type="button"
              class="article-end-icon"
              :class="{ 'is-liked': isLiked }"
              :aria-pressed="isLiked"
              :title="isLiked ? '已喜欢 · 点击取消' : '喜欢这篇文章'"
              :aria-label="isLiked ? '取消喜欢' : '喜欢这篇文章'"
              @click="toggleLike"
            >
              <Heart
                :size="14"
                :stroke-width="1.8"
                :fill="isLiked ? 'currentColor' : 'none'"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              class="article-end-icon"
              :class="{ 'is-reported': isReported }"
              :aria-pressed="isReported"
              :title="isReported ? '已记录报错 · 点击撤销' : '文章内容报错'"
              :aria-label="isReported ? '撤销报错反馈' : '反馈文章内容错误'"
              @click="toggleReport"
            >
              <Bug :size="14" :stroke-width="1.8" aria-hidden="true" />
            </button>

            <span v-if="feedbackHint" class="article-end-feedback" aria-live="polite">
              {{ feedbackHint }}
            </span>
          </div>
        </div>

        <!-- 中间：替换为刻晴圆形立绘徽章 + 右下角 Kr 印记 -->
        <div class="article-end-medallion" aria-hidden="true">
          <div class="article-end-avatar-ring">
            <img :src="heroPortrait" :alt="siteConfig.brand" class="article-end-avatar" loading="lazy">
          </div>
          <img :src="logoSrc" alt="" class="article-end-seal" width="24" height="24">
        </div>

        <!-- 右侧：本文附加信息 + 堆叠全圆角上下篇胶囊 -->
        <div class="article-end-nav">
          <p class="article-end-label article-end-label-right">本文附加信息</p>

          <div class="article-end-facts">
            <span class="article-end-fact">
              <span class="article-fact-icon is-copyright" aria-hidden="true">
                <Info :size="12.5" :stroke-width="2" />
              </span>
              <span>原创沉淀</span>
            </span>
            <span class="article-end-fact">
              <span class="article-fact-icon is-timeless" aria-hidden="true">
                <Clock3 :size="12.5" :stroke-width="2" />
              </span>
              <span>长期有效</span>
            </span>
          </div>

          <nav class="article-end-links" aria-label="上一篇与下一篇文章">
            <NuxtLink
              v-if="prevArticle"
              :to="`/library/${prevArticle.slug}`"
              class="article-end-pill"
              :title="`上一篇：${prevArticle.title}`"
            >
              <ChevronLeft :size="14" class="shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="article-end-pill-tag">上一篇</span>
              <span class="article-end-pill-title">{{ prevArticle.title }}</span>
            </NuxtLink>
            <div
              v-else
              class="article-end-pill is-muted"
              aria-disabled="true"
            >
              <ChevronLeft :size="14" class="shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="article-end-pill-tag">上一篇</span>
              <span class="article-end-pill-title">已是最新一篇</span>
            </div>

            <NuxtLink
              v-if="nextArticle"
              :to="`/library/${nextArticle.slug}`"
              class="article-end-pill"
              :title="`下一篇：${nextArticle.title}`"
            >
              <ChevronRight :size="14" class="shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="article-end-pill-tag">下一篇</span>
              <span class="article-end-pill-title">{{ nextArticle.title }}</span>
            </NuxtLink>
            <div
              v-else
              class="article-end-pill is-muted"
              aria-disabled="true"
            >
              <ChevronRight :size="14" class="shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="article-end-pill-tag">下一篇</span>
              <span class="article-end-pill-title">已读至最早一篇</span>
            </div>
          </nav>
        </div>
      </section>
    </footer>
  </div>
</template>
