<script setup lang="ts">
import {
  BookOpen,
  Boxes,
  Filter,
  Grid2X2,
  LayoutList,
  Lightbulb,
  Maximize2,
  Network,
  NotebookPen,
  Search,
  SlidersHorizontal,
  Star,
  Tags,
  Clock3,
  UserRound,
  Wrench
} from 'lucide-vue-next'
import { articles } from '~/data/mock'

const sidebarItems = [
  { label: '全部内容', icon: BookOpen, active: true },
  { label: '文章', icon: BookOpen },
  { label: '关系', icon: Network },
  { label: '标签', icon: Tags },
  { label: '时间线', icon: Clock3 },
  { label: '专题', icon: Lightbulb },
  { label: '暂存', icon: NotebookPen }
]

const graphClusters = [
  {
    title: '编辑体验',
    count: 'Tiptap / 块结构',
    icon: UserRound,
    position: 'left-[44%] top-[16%]',
    tone: 'text-sky-500 bg-sky-50'
  },
  {
    title: '内容模型',
    count: 'MongoDB / MySQL',
    icon: Boxes,
    position: 'left-[20%] top-[40%]',
    tone: 'text-emerald-500 bg-emerald-50'
  },
  {
    title: '发布流程',
    count: '草稿 / 发布',
    icon: Lightbulb,
    position: 'left-[70%] top-[45%]',
    tone: 'text-amber-500 bg-amber-50'
  },
  {
    title: '资源管理',
    count: 'COS / 链接库',
    icon: Wrench,
    position: 'left-[28%] top-[74%]',
    tone: 'text-indigo-500 bg-indigo-50'
  },
  {
    title: '安全策略',
    count: '鉴权 / 限流',
    icon: Star,
    position: 'left-[67%] top-[80%]',
    tone: 'text-rose-500 bg-rose-50'
  }
]

const satelliteNodes = [
  { label: 'Tiptap', position: 'left-[36%] top-[8%]', color: 'bg-sky-300' },
  { label: '块结构', position: 'left-[58%] top-[8%]', color: 'bg-sky-300' },
  { label: 'MongoDB', position: 'left-[10%] top-[32%]', color: 'bg-emerald-300' },
  { label: 'MySQL', position: 'left-[8%] top-[44%]', color: 'bg-emerald-300' },
  { label: '草稿', position: 'left-[83%] top-[33%]', color: 'bg-orange-300' },
  { label: '发布', position: 'left-[88%] top-[43%]', color: 'bg-orange-300' },
  { label: 'COS', position: 'left-[17%] top-[68%]', color: 'bg-indigo-300' },
  { label: '链接库', position: 'left-[16%] top-[82%]', color: 'bg-indigo-300' },
  { label: '鉴权', position: 'left-[82%] top-[72%]', color: 'bg-rose-300' },
  { label: '限流', position: 'left-[75%] top-[90%]', color: 'bg-rose-300' }
]

const articleCards = [
  {
    title: '前后台一体博客的页面边界',
    desc: '整理前台阅读态和后台编辑态的差异，避免后台变成另一套管理平台。',
    meta: '2026-05-18 · 草稿',
    tags: ['产品设计', '后台'],
    tone: '#4f8df7'
  },
  {
    title: '文章内容为什么放在 MongoDB',
    desc: '文章元信息和正文分开保存，正文使用编辑器 JSON，后续更容易扩展自定义语法。',
    meta: '2026-05-15 · 已发布',
    tags: ['MongoDB', 'Tiptap'],
    tone: '#8b72dc'
  },
  {
    title: '单用户后台的鉴权方案',
    desc: '管理员密码通过环境变量注入，服务端会话、HttpOnly Cookie 和 Redis 限流共同防护。',
    meta: '2026-05-12 · 已发布',
    tags: ['安全', 'Nuxt'],
    tone: '#e68a79'
  },
  {
    title: '文库页的图文阅读方式',
    desc: '文库不是普通列表，需要支持图文表达、快速导览和文章关系浏览。',
    meta: '2026-05-10 · 已发布',
    tags: ['文库', '阅读体验'],
    tone: '#48b7b2'
  }
]
</script>

<template>
  <div class="grid min-h-[calc(100vh-8rem)] gap-6 xl:grid-cols-[11.5rem_1.05fr_1.1fr]">
    <aside class="hidden rounded-[1.6rem] border border-border bg-white/72 p-4 shadow-sm xl:block">
      <nav class="space-y-2">
        <button
          v-for="item in sidebarItems"
          :key="item.label"
          class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition"
          :class="item.active ? 'bg-primary/10 text-primary-strong' : 'muted hover:bg-slate-50'"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </button>
      </nav>

      <div class="mt-24 rounded-2xl border border-border bg-white/72 p-4">
        <div class="flex items-center gap-3">
          <span class="icon-tile"><NotebookPen :size="20" /></span>
          <p class="text-sm font-black">选题暂存</p>
        </div>
        <p class="muted mt-4 text-xs leading-6">还没整理进专题的笔记，会先挂在这里。</p>
        <button class="mt-4 w-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary-strong">查看记录</button>
      </div>
    </aside>

    <section class="dashboard-card min-h-[48rem] overflow-hidden p-6">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="flex items-center gap-3 text-2xl font-black">
            文章关系
          </h1>
          <p class="muted mt-2 text-sm font-semibold">用图辅助导览，不替代文章目录</p>
        </div>
        <div class="flex gap-3">
          <button class="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold">
            <Network :size="16" class="mr-2 inline" />
            重新排布
          </button>
          <button class="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold">
            <Filter :size="16" class="mr-2 inline" />
            筛选
          </button>
          <button class="grid size-10 place-items-center rounded-xl border border-border bg-white">
            <Maximize2 :size="17" />
          </button>
        </div>
      </div>

      <div class="relative h-[42rem] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_center,rgba(117,111,238,.12),transparent_18rem)]">
        <svg class="absolute inset-0 h-full w-full" viewBox="0 0 760 700">
          <g fill="none" stroke="#d8e2f1" stroke-dasharray="6 7" stroke-width="2">
            <path d="M380 350 C360 230 330 170 260 110" />
            <path d="M380 350 C250 330 210 300 150 260" />
            <path d="M380 350 C500 310 540 280 610 255" />
            <path d="M380 350 C310 455 260 510 220 590" />
            <path d="M380 350 C500 470 520 555 590 620" />
          </g>
        </svg>

        <div class="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white shadow-[0_24px_60px_rgba(91,91,222,.28)]">
          <Network :size="44" />
        </div>
        <div class="absolute left-1/2 top-[58%] -translate-x-1/2 text-center">
          <p class="text-2xl font-black">博客系统</p>
          <p class="muted mt-1 text-sm font-bold">规划中的内容结构</p>
        </div>

        <div
          v-for="cluster in graphClusters"
          :key="cluster.title"
          class="absolute -translate-x-1/2 -translate-y-1/2 text-center"
          :class="cluster.position"
        >
          <div class="mx-auto grid size-20 place-items-center rounded-full shadow-lg" :class="cluster.tone">
            <component :is="cluster.icon" :size="32" />
          </div>
          <p class="mt-3 text-lg font-black">{{ cluster.title }}</p>
          <p class="muted text-sm">{{ cluster.count }}</p>
        </div>

        <div
          v-for="node in satelliteNodes"
          :key="node.label"
          class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold shadow-sm"
          :class="node.position"
        >
          <span class="size-2 rounded-full" :class="node.color" />
          {{ node.label }}
        </div>
      </div>
    </section>

    <section class="dashboard-card p-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-2xl font-black">文章列表</h2>
          <p class="muted mt-2 text-sm font-bold">当前展示 4 篇样稿</p>
        </div>
        <div class="flex gap-2">
          <button class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-strong">
            <LayoutList :size="19" />
          </button>
          <button class="grid size-10 place-items-center rounded-xl border border-border bg-white">
            <Grid2X2 :size="18" />
          </button>
          <button class="grid size-10 place-items-center rounded-xl border border-border bg-white">
            <SlidersHorizontal :size="18" />
          </button>
        </div>
      </div>

      <div class="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button class="shrink-0 rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary-strong">默认排序</button>
        <button class="shrink-0 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold muted">最新发布</button>
        <button class="shrink-0 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold muted">草稿优先</button>
        <button class="shrink-0 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold muted">关联强度</button>
      </div>

      <div class="soft-card mb-6 flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search class="muted" :size="18" />
        <input class="w-full bg-transparent text-sm font-semibold outline-none" placeholder="搜索文章、标签、分类..." />
      </div>

      <div class="space-y-5">
        <NuxtLink
          v-for="card in articleCards"
          :key="card.title"
          to="/library/knowledge-garden"
          class="group block rounded-[1.45rem] border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5"
        >
          <div class="grid gap-5 sm:grid-cols-[5.6rem_1fr]">
            <div class="article-thumb min-h-24" :style="{ '--tone': card.tone }" />
            <div>
            <h3 class="text-2xl font-black leading-tight">{{ card.title }}</h3>
            <p class="muted mt-3 line-clamp-2 leading-7">{{ card.desc }}</p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span v-for="tag in card.tags" :key="tag" class="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-strong">{{ tag }}</span>
            </div>
            <p class="muted mt-5 text-sm font-semibold">{{ card.meta }}</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
