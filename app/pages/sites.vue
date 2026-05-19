<script setup lang="ts">
import { Brush, Code2, Globe2, MessageSquare, Network, PenLine, Send, Settings2, Type } from 'lucide-vue-next'
import { siteLinks } from '~/data/mock'

const siteIconMap = {
  code2: Code2,
  network: Network,
  'pen-line': PenLine,
  globe: Globe2,
  brush: Brush,
  type: Type
} as const
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel rounded-[2rem] p-6">
      <p class="muted text-sm">Resources</p>
      <h1 class="mt-2 text-4xl font-black">常用网站</h1>
      <p class="muted mt-3 max-w-2xl leading-7">整理高频使用的工具、资源和链接。后台会配置交流群、联系方式和资源分组。</p>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <a v-for="item in siteLinks" :key="item.title" :href="item.url" target="_blank" rel="noreferrer" class="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
        <div class="flex items-start justify-between gap-4">
          <span class="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary-strong">
            <component :is="siteIconMap[item.icon as keyof typeof siteIconMap]" :size="22" />
          </span>
          <span class="rounded-full bg-white/70 px-3 py-1 text-xs muted">{{ item.category }}</span>
        </div>
        <h2 class="mt-5 text-xl font-bold">{{ item.title }}</h2>
        <p class="muted mt-2 leading-7">{{ item.desc }}</p>
      </a>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="glass-panel rounded-[1.75rem] p-5">
        <MessageSquare class="text-primary-strong" :size="24" />
        <h2 class="mt-4 font-bold">交流群</h2>
        <p class="muted mt-2 text-sm leading-6">后台可配置群号、二维码、展示状态和说明文字。</p>
      </div>
      <div class="glass-panel rounded-[1.75rem] p-5">
        <Send class="text-primary-strong" :size="24" />
        <h2 class="mt-4 font-bold">联系方式</h2>
        <p class="muted mt-2 text-sm leading-6">支持邮箱、社交主页、即时通讯等公开联系方式。</p>
      </div>
      <div class="glass-panel rounded-[1.75rem] p-5">
        <Settings2 class="text-primary-strong" :size="24" />
        <h2 class="mt-4 font-bold">后台配置</h2>
        <p class="muted mt-2 text-sm leading-6">资源分类、排序、图标和描述都从后台维护。</p>
      </div>
    </section>
  </div>
</template>
