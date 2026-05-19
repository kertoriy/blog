<script setup lang="ts">
import { ImagePlus, Network, Save, ShieldCheck } from 'lucide-vue-next'

const AdminEditor = defineAsyncComponent(() => import('~/components/AdminEditor.vue'))
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel rounded-[2rem] p-6">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="muted flex items-center gap-2 text-sm">
            <ShieldCheck :size="16" />
            可编辑模式
          </p>
          <h1 class="mt-2 text-4xl font-black">像前台一样写文章</h1>
          <p class="muted mt-3 max-w-2xl leading-7">后台不会做成传统管理台，先保留编辑、图片、关系维护这些博客里真正会用到的能力。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="flex items-center gap-2 rounded-full border border-border bg-white/65 px-4 py-2 text-sm font-semibold">
            <ImagePlus :size="16" />
            上传图片
          </button>
          <button class="theme-gradient flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white">
            <Save :size="16" />
            保存草稿
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1fr_0.42fr]">
      <AdminEditor />

      <aside class="space-y-4">
        <div class="soft-card rounded-[1.75rem] p-5">
          <Network class="text-primary-strong" :size="24" />
          <h2 class="mt-4 font-bold">关系维护</h2>
          <p class="muted mt-2 text-sm leading-6">维护前置知识、引用文章、延伸阅读和系列关系。</p>
        </div>
        <div class="soft-card rounded-[1.75rem] p-5">
          <ShieldCheck class="text-primary-strong" :size="24" />
          <h2 class="mt-4 font-bold">安全状态</h2>
          <p class="muted mt-2 text-sm leading-6">登录态、会话、限流、审计日志会集中放在这里。</p>
        </div>
      </aside>
    </section>
  </div>
</template>
