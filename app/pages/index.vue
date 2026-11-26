<script setup lang="ts">
import type { Component } from 'vue'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Eye,
  Feather,
  FileText,
  Layers,
  Tag,
  Type,
  Users,
  Zap
} from 'lucide-vue-next'
import pkg from '../../package.json'
import { friends, notes, siteConfig } from '~/utils/content'
import { articles, siteArticleStats } from '~/utils/articles'
import '~/assets/css/blog-home.css'

const HomeStatsCharts = defineAsyncComponent(() => import('~/components/HomeStatsCharts.vue'))

useSeoMeta({
  title: siteConfig.name,
  description: '以本地 Markdown 驱动的静态个人博客系统，收录前端工程实践、界面设计笔记与长期知识沉淀。'
})

const baseURL = useRuntimeConfig().app.baseURL
const { uptime, views, visitors, ready } = useSiteMetrics()
const { getArticleReads } = useContentMetrics()

const latestArticles = articles.slice(0, 3)
const heroPortrait = `${baseURL}${siteConfig.heroImage.replace(/^\//, '')}`
const launchDateText = siteConfig.launchedAt.slice(0, 10)

// 碎碎念与友链实时统计
const noteTotalCount = notes.length
const noteActiveTagCount = new Set(notes.map(item => item.tag)).size
const noteTotalWords = notes.reduce((sum, item) => sum + item.content.replace(/\s+/g, '').length, 0)
const latestNoteDate = notes[0]?.date ?? '—'

const friendTotalCount = friends.length
const friendGroupCount = new Set(friends.map(item => item.group)).size

const siteTotalWords = siteArticleStats.totalWords + noteTotalWords
const latestUpdateDate = [siteArticleStats.latestDate, latestNoteDate]
  .filter(date => date && date !== '—')
  .sort((a, b) => b.localeCompare(a))[0] ?? '—'

function formatPkgVersion(raw?: string) {
  if (!raw) return 'latest'
  const cleaned = raw.replace(/^[\^~>=<]+/, '').trim()
  return cleaned ? `v${cleaned}` : 'latest'
}

interface SiteStackItem {
  name: string
  version: string
  role: string
  logo?: string
  icon?: Component
}

const siteStackItems: SiteStackItem[] = [
  { name: 'Nuxt', version: formatPkgVersion(pkg.dependencies?.nuxt), role: '全栈应用框架', logo: 'sites/nuxt.svg' },
  { name: 'Vue', version: formatPkgVersion(pkg.dependencies?.vue), role: '组合式视图层', logo: 'sites/vue.svg' },
  { name: 'TypeScript', version: 'Strict', role: '全链路类型安全', logo: 'sites/typescript.svg' },
  { name: 'Tailwind CSS', version: formatPkgVersion(pkg.devDependencies?.tailwindcss), role: '原子化样式引擎', logo: 'sites/tailwind.svg' },
  { name: 'Vite', version: 'v7.3.3', role: '极速构建与热更新', logo: 'sites/vite.svg' },
  { name: 'Nitro', version: 'v2.13.4', role: '静态预渲染引擎', icon: Zap },
  { name: 'Chart.js', version: formatPkgVersion(pkg.dependencies?.['chart.js']), role: '站点数据可视化', logo: 'sites/chartjs.svg' },
  { name: 'Lucide Vue', version: formatPkgVersion(pkg.dependencies?.['lucide-vue-next']), role: '轻量化矢量图标', logo: 'sites/lucide.svg' }
]

const vueRouterVersion = formatPkgVersion(pkg.dependencies?.['vue-router'])

function resolveAsset(path: string) {
  return /^https?:\/\//.test(path) ? path : `${baseURL}${path.replace(/^\//, '')}`
}

function resolveCover(cover: string) {
  if (!cover) return `${baseURL}blog-desk.webp`
  return /^https?:\/\//.test(cover) ? cover : `${baseURL}${cover.replace(/^\//, '')}`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}
</script>

<template>
  <div class="blog-home">
    <!-- 1. 首屏：全幅占满整屏，刻晴透明通道 PNG 满高贴底叠加于氛围背景之上，前景内容自然叠层 -->
    <section class="blog-welcome" aria-labelledby="blog-welcome-title">
      <!-- 背景层：柔和紫晕氛围 + 极淡大字水印（凸显 PNG 透明通道叠层层次） -->
      <div class="blog-welcome-backdrop" aria-hidden="true">
        <span class="blog-welcome-aura" />
        <span class="blog-welcome-watermark">KERTORIY</span>
      </div>

      <!-- 立绘层：透明通道 PNG 满屏贴底铺展，可直接与前后景自然叠加 -->
      <div class="blog-welcome-stage" aria-hidden="true">
        <img
          :src="heroPortrait"
          alt="刻晴透明立绘"
          class="blog-welcome-character"
          fetchpriority="high"
        >
      </div>

      <!-- 前景文字层（中上部留白展示博客系统主视觉） -->
      <div class="blog-welcome-inner">
        <div class="blog-welcome-copy">
          <p class="blog-eyebrow">
            <span class="blog-eyebrow-dot" aria-hidden="true" />
            Nuxt 4 · Markdown 博客系统
          </p>
          <h1 id="blog-welcome-title">{{ siteConfig.name }}</h1>
          <p class="blog-welcome-description">
            以本地 Markdown 驱动的静态个人博客系统，收录前端工程实践、界面设计笔记与长期知识沉淀。
          </p>
        </div>
      </div>

      <!-- 底部操作与状态栏（双行沉底：上排主操作按钮，下排站点运行状态） -->
      <div class="blog-welcome-dock">
        <div class="blog-welcome-actions">
          <a href="#site-stats" class="ui-btn-primary">
            <Activity :size="14.5" aria-hidden="true" />
            站点统计
            <ArrowDown :size="13" aria-hidden="true" />
          </a>
          <a href="#recent-articles" class="ui-btn blog-welcome-btn-glass">
            <BookOpen :size="14" aria-hidden="true" />
            最近文章
          </a>
        </div>

        <div class="blog-live-badge" aria-label="站点运行状态">
          <span class="blog-live-pulse" aria-hidden="true" />
          <span>已稳定运行</span>
          <strong v-if="ready">
            {{ uptime.days }} 天 {{ pad2(uptime.hours) }}:{{ pad2(uptime.minutes) }}:{{ pad2(uptime.seconds) }}
          </strong>
          <strong v-else>计算中…</strong>
        </div>
      </div>
    </section>

    <!-- 2. 站点统计看板：独立一屏，标题吸顶 -->
    <section id="site-stats" class="blog-stats-section" aria-labelledby="blog-stats-title">
      <div class="blog-section-bar">
        <h2 id="blog-stats-title" class="blog-pill-label">
          <i aria-hidden="true" />
          站点统计
        </h2>
        <span class="blog-pill-meta">
          <CalendarDays :size="12" aria-hidden="true" />
          最近更新 {{ latestUpdateDate }}
        </span>
      </div>

      <div class="blog-stats-grid">
        <div class="blog-stat-card">
          <div class="blog-stat-top">
            <span>访问统计</span>
            <span class="blog-stat-icon"><Eye :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ views.toLocaleString() }}<span class="blog-stat-unit">次</span>
          </p>
          <p class="blog-stat-sub">累计访客 {{ visitors.toLocaleString() }} 人</p>
        </div>

        <div class="blog-stat-card">
          <div class="blog-stat-top">
            <span>字数统计</span>
            <span class="blog-stat-icon"><Type :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ siteTotalWords.toLocaleString() }}<span class="blog-stat-unit">字</span>
          </p>
          <p class="blog-stat-sub">文库篇均 {{ siteArticleStats.avgWords.toLocaleString() }} 字 · 碎碎念 {{ noteTotalWords.toLocaleString() }} 字</p>
        </div>

        <div class="blog-stat-card">
          <div class="blog-stat-top">
            <span>运行时间</span>
            <span class="blog-stat-icon"><Activity :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ ready ? uptime.days : '—' }}<span class="blog-stat-unit">天</span>
          </p>
          <p class="blog-stat-sub">
            {{ ready ? `${pad2(uptime.hours)} 时 ${pad2(uptime.minutes)} 分 ${pad2(uptime.seconds)} 秒` : `始于 ${launchDateText}` }}
          </p>
        </div>

        <NuxtLink to="/library" class="blog-stat-card is-link">
          <div class="blog-stat-top">
            <span>文库统计</span>
            <span class="blog-stat-icon"><FileText :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ siteArticleStats.totalArticles }}<span class="blog-stat-unit">篇</span>
          </p>
          <p class="blog-stat-sub blog-stat-sub-link">
            <span>覆盖 {{ siteArticleStats.totalCategories }} 个分类 · {{ siteArticleStats.totalTags }} 个标签</span>
            <ArrowUpRight :size="13" class="blog-stat-arrow" aria-hidden="true" />
          </p>
        </NuxtLink>

        <NuxtLink to="/notes" class="blog-stat-card is-link">
          <div class="blog-stat-top">
            <span>碎碎念统计</span>
            <span class="blog-stat-icon"><Feather :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ noteTotalCount }}<span class="blog-stat-unit">条</span>
          </p>
          <p class="blog-stat-sub blog-stat-sub-link">
            <span>覆盖 {{ noteActiveTagCount }} 类标签 · 最近 {{ latestNoteDate }}</span>
            <ArrowUpRight :size="13" class="blog-stat-arrow" aria-hidden="true" />
          </p>
        </NuxtLink>

        <NuxtLink to="/friends" class="blog-stat-card is-link">
          <div class="blog-stat-top">
            <span>友链统计</span>
            <span class="blog-stat-icon"><Users :size="14" aria-hidden="true" /></span>
          </div>
          <p class="blog-stat-value">
            {{ friendTotalCount }}<span class="blog-stat-unit">位</span>
          </p>
          <p class="blog-stat-sub blog-stat-sub-link">
            <span>已收录 {{ friendGroupCount }} 个友链分组</span>
            <ArrowUpRight :size="13" class="blog-stat-arrow" aria-hidden="true" />
          </p>
        </NuxtLink>
      </div>

      <!-- Chart.js 数据可视化三图（近七日访问趋势 + 碎碎念分布图 + 文库/友链/字数分布） -->
      <ClientOnly>
        <HomeStatsCharts />
        <template #fallback>
          <div class="blog-stats-detail">
            <div class="blog-stats-panel">
              <div class="blog-chart-box grid place-items-center text-xs text-ink-muted">图表加载中…</div>
            </div>
            <div class="blog-stats-panel">
              <div class="blog-chart-box grid place-items-center text-xs text-ink-muted">图表加载中…</div>
            </div>
            <div class="blog-stats-panel">
              <div class="blog-chart-box grid place-items-center text-xs text-ink-muted">图表加载中…</div>
            </div>
          </div>
        </template>
      </ClientOnly>
    </section>

    <!-- 3. 最近文章（左右独立吸顶胶囊 + 配图卡片网格） -->
    <section id="recent-articles" class="blog-recent" aria-labelledby="blog-recent-title">
      <div class="blog-recent-heading">
        <h2 id="blog-recent-title" class="blog-recent-title">
          <i aria-hidden="true" />
          最近文章
        </h2>
        <NuxtLink to="/library" class="blog-text-link">
          全部文章
          <ArrowRight :size="14" aria-hidden="true" />
        </NuxtLink>
      </div>

      <ul class="blog-article-grid">
        <li v-for="article in latestArticles" :key="article.id">
          <NuxtLink :to="`/library/${article.slug}`" class="blog-article-card">
            <div class="blog-article-cover-wrap">
              <div class="blog-article-cover">
                <img :src="resolveCover(article.cover)" :alt="article.title" loading="lazy">
              </div>
            </div>

            <div class="article-tag-pill">
              <Tag :size="11.5" aria-hidden="true" />
              <span class="blog-article-tag-list">
                <span>{{ article.category }}</span>
                <template v-for="tag in article.tags.slice(0, 2)" :key="tag">
                  <span class="blog-article-tag-sep" aria-hidden="true">·</span>
                  <span>{{ tag }}</span>
                </template>
              </span>
            </div>

            <div class="blog-article-body">
              <h3>{{ article.title }}</h3>
              <p class="blog-article-summary">{{ article.summary }}</p>

              <div class="blog-article-footer-wrap">
                <div class="blog-article-footer">
                  <span class="blog-article-meta-group">
                    <span class="blog-article-meta">
                      <Clock3 :size="12" aria-hidden="true" />
                      <span>{{ article.readTime }}</span>
                    </span>
                    <span class="blog-article-meta" :title="`累计阅读 ${getArticleReads(article.slug).toLocaleString()} 次`">
                      <Eye :size="12" aria-hidden="true" />
                      <span>{{ getArticleReads(article.slug).toLocaleString() }} 阅读</span>
                    </span>
                  </span>
                  <span class="blog-article-meta">
                    <CalendarDays :size="12" aria-hidden="true" />
                    <time :datetime="article.date">{{ article.date }}</time>
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 4. 本站技术栈与版本 -->
    <section id="site-stack" class="blog-stack-section" aria-labelledby="blog-stack-title">
      <div class="blog-section-bar">
        <h2 id="blog-stack-title" class="blog-pill-label">
          <i aria-hidden="true" />
          本站技术栈与版本
        </h2>
        <span class="blog-pill-meta">
          <Layers :size="12" aria-hidden="true" />
          {{ siteConfig.name }} · {{ formatPkgVersion(pkg.dependencies?.nuxt) }}
        </span>
      </div>

      <ul class="blog-stack-grid">
        <li v-for="item in siteStackItems" :key="item.name" class="blog-stack-item">
          <span class="blog-stack-icon" aria-hidden="true">
            <img v-if="item.logo" :src="resolveAsset(item.logo)" :alt="item.name" loading="lazy">
            <component :is="item.icon" v-else :size="18" :stroke-width="1.8" class="text-accent-ink" />
          </span>
          <div class="blog-stack-info">
            <div class="blog-stack-head">
              <span class="blog-stack-name">{{ item.name }}</span>
              <span class="blog-stack-version">{{ item.version }}</span>
            </div>
            <span class="blog-stack-role">{{ item.role }}</span>
          </div>
        </li>
      </ul>

      <div class="blog-stack-colophon">
        <span>本地 Markdown / JSON 文件驱动 · 静态预渲染架构</span>
        <span class="blog-stack-colophon-meta">Vue Router {{ vueRouterVersion }} · pnpm</span>
      </div>
    </section>
  </div>
</template>
