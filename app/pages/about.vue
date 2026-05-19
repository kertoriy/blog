<script setup lang="ts">
import { Code2, Feather, Palette, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
    <section class="glass-panel rounded-[2rem] p-6 sm:p-8">
      <Feather class="text-primary-strong" :size="30" />
      <h1 class="mt-5 text-4xl font-black leading-tight sm:text-5xl">关于 Ker Edit Blog</h1>
      <p class="muted mt-5 text-lg leading-9">
        这是一个前后台一体的个人博客知识库系统。目标不是做传统管理平台，而是让公开阅读、在线编辑、知识关系和轻互动保持同一套舒服的视觉体验。
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div class="rounded-3xl bg-white/60 p-4">
          <Palette class="text-primary-strong" :size="22" />
          <p class="mt-3 font-bold">双主题</p>
        </div>
        <div class="rounded-3xl bg-white/60 p-4">
          <Code2 class="text-primary-strong" :size="22" />
          <p class="mt-3 font-bold">Nuxt + Tiptap</p>
        </div>
        <div class="rounded-3xl bg-white/60 p-4">
          <ShieldCheck class="text-primary-strong" :size="22" />
          <p class="mt-3 font-bold">分层加固</p>
        </div>
      </div>
    </section>
    <aside class="soft-card rounded-[2rem] p-6">
      <h2 class="text-2xl font-bold">建设方向</h2>
      <div class="mt-5 space-y-4">
        <p class="rounded-3xl bg-white/60 p-4">把文章做成可以持续生长的知识系列。</p>
        <p class="rounded-3xl bg-white/60 p-4">让后台保持前台同等级颜值，而不是视觉降级。</p>
        <p class="rounded-3xl bg-white/60 p-4">通过 Vue Flow 展示文章之间的引用和延伸关系。</p>
      </div>
    </aside>
  </div>
</template>
