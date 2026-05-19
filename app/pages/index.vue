<script setup lang="ts">
import {
  ArrowRight,
  BookOpen,
  Database,
  FileText,
  Folder,
  Image,
  Link2,
  PenLine,
  ShieldCheck,
  Tags,
  Timer
} from 'lucide-vue-next'
import { articles } from '~/data/mock'

const siteStats = [
  { label: '文章样稿', value: '3', icon: BookOpen },
  { label: '草稿入口', value: '1', icon: PenLine },
  { label: '栏目', value: '6', icon: Folder },
  { label: '标签样稿', value: '8', icon: Tags },
  { label: '链接样稿', value: '6', icon: Link2 },
  { label: '数据源规划', value: '3', icon: Database }
]

const buildNotes = [
  { title: '编辑器', text: 'Tiptap 已作为内核接入，后续文章正文会以 JSON 结构保存。' },
  { title: '图片', text: '上传目标确定为腾讯云 COS，页面先预留入口和展示位置。' },
  { title: '安全', text: '后台只保留单用户入口，密码从环境变量注入，服务端做限流。' }
]

const maintainLogs = [
  { date: '05-18', text: '首页改成博客门面，不再使用演示型流量图。' },
  { date: '05-17', text: '接入 Tiptap、Vue Flow、lucide 图标和双主题变量。' },
  { date: '05-17', text: '确定 MySQL、MongoDB、Redis 的职责边界。' }
]

const nextTasks = [
  '把文章正文保存成 Tiptap JSON，并拆出发布态和草稿态。',
  '补后台登录页，密码使用环境变量注入的哈希值。',
  '接腾讯云 COS，图片上传后只在文章里保存资源地址。'
]
</script>

<template>
  <div class="space-y-7">
    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="dashboard-card p-7">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="muted text-sm font-semibold">Ker Edit Blog</p>
            <h1 class="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">能写文章，也能整理关系的个人博客</h1>
            <p class="muted mt-4 max-w-3xl leading-8">
              前台负责阅读，后台不另起一套管理平台，而是在同样的页面气质里增加编辑、发布、图片和文章关系维护。
            </p>
          </div>
          <NuxtLink to="/library" class="inline-flex w-fit items-center gap-2 rounded-full bg-primary-strong px-5 py-3 text-sm font-black text-white">
            进入文库
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div v-for="note in buildNotes" :key="note.title" class="rounded-2xl border border-border bg-white/70 p-5">
            <p class="text-sm font-black text-primary-strong">{{ note.title }}</p>
            <p class="muted mt-3 text-sm leading-7">{{ note.text }}</p>
          </div>
        </div>
      </div>

      <div class="ad-panel dashboard-card p-7">
        <div class="flex items-center gap-3">
          <span class="icon-tile"><Image :size="21" /></span>
          <div>
            <p class="text-lg font-black">公告 / 广告屏</p>
            <p class="muted mt-1 text-sm">后台可配置图片、标题、链接和有效期</p>
          </div>
        </div>
        <div class="mt-8 rounded-2xl border border-dashed border-border bg-white/58 p-6">
          <p class="text-2xl font-black leading-tight">这里先放站点建设记录</p>
          <p class="muted mt-4 leading-7">等 COS 上传和后台配置完成后，这块可以替换成真实活动图、个人项目入口或者赞助展示。</p>
        </div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div class="dashboard-card p-6">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="flex items-center gap-3 text-lg font-black">
            <span class="icon-tile"><FileText :size="21" /></span>
            站点摘要
          </h2>
          <span class="text-sm font-bold text-primary-strong">当前样稿</span>
        </div>
        <div class="grid gap-5 sm:grid-cols-3">
          <div v-for="item in siteStats" :key="item.label" class="flex items-center gap-4">
            <span class="icon-tile">
              <component :is="item.icon" :size="21" />
            </span>
            <span>
              <span class="muted block text-sm font-semibold">{{ item.label }}</span>
              <span class="mt-1 block text-2xl font-black">{{ item.value }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="dashboard-card p-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-black">维护记录</h2>
          <ShieldCheck class="text-primary-strong" :size="22" />
        </div>
        <div class="space-y-4">
          <div v-for="log in maintainLogs" :key="log.text" class="grid grid-cols-[4rem_1fr] gap-4 rounded-2xl bg-slate-50/70 p-4">
            <span class="font-black text-primary-strong">{{ log.date }}</span>
            <p class="muted text-sm leading-6">{{ log.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <div class="dashboard-card p-7">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-black">下一步</h2>
          <Timer class="text-primary-strong" :size="22" />
        </div>
        <div class="space-y-3">
          <div v-for="task in nextTasks" :key="task" class="flex gap-3 rounded-2xl bg-slate-50/70 p-4">
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary-strong" />
            <p class="muted text-sm leading-6">{{ task }}</p>
          </div>
        </div>
      </div>

      <section class="dashboard-card p-7">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-black">最近文章</h2>
          <NuxtLink to="/library" class="flex items-center gap-1 text-sm font-bold text-primary-strong">
            更多文章
            <ArrowRight :size="15" />
          </NuxtLink>
        </div>
        <div class="grid gap-4 lg:grid-cols-3">
          <NuxtLink v-for="article in articles" :key="article.id" :to="`/library/${article.slug}`" class="article-tile group">
            <div class="article-thumb" :style="{ '--tone': article.tone }" />
            <div class="mt-4 flex items-center justify-between text-sm">
              <span class="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary-strong">{{ article.category }}</span>
              <span class="muted">{{ article.date }}</span>
            </div>
            <h3 class="mt-3 text-lg font-black leading-tight">{{ article.title }}</h3>
            <p class="muted mt-3 line-clamp-2 text-sm leading-6">{{ article.summary }}</p>
          </NuxtLink>
        </div>
      </section>
    </section>
  </div>
</template>
