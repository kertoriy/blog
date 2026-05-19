<script setup lang="ts">
import { MessageCircleMore, Route, Timer } from 'lucide-vue-next'

defineProps<{
  article: {
    title: string
    summary: string
    category: string
    readTime: string
    tags: string[]
  }
}>()

const reactions = [
  { label: '写的比我牛', count: 128 },
  { label: '这是互联网你不如我', count: 36 },
  { label: '还得练', count: 72 }
]
</script>

<template>
  <div class="sticky top-28">
    <div class="flex items-center gap-2 text-sm muted">
      <Timer :size="16" />
      {{ article.category }} · {{ article.readTime }}
    </div>
    <h2 class="mt-3 text-3xl font-black leading-tight">{{ article.title }}</h2>
    <p class="muted mt-4 leading-8">{{ article.summary }}</p>

    <div class="mt-6 rounded-3xl bg-white/60 p-5">
      <h3 class="flex items-center gap-2 font-bold">
        <Route :size="18" />
        快速导览
      </h3>
      <ol class="muted mt-4 space-y-3 text-sm">
        <li>01. 为什么要做知识庭院</li>
        <li>02. 文章如何形成关系</li>
        <li>03. 前台阅读与后台编辑</li>
      </ol>
    </div>

    <div class="mt-6 space-y-4 leading-8">
      <p>这是一段阅读区预览。后续会由 Tiptap 文档 JSON 渲染成真正的文章正文，后台模式下在同一套视觉里直接编辑。</p>
      <p class="muted">阅读区会保留目录、标签、关系入口和轻互动反馈，不引入评论区。</p>
    </div>

    <div class="mt-6">
      <h3 class="mb-3 flex items-center gap-2 font-bold">
        <MessageCircleMore :size="18" />
        轻互动
      </h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="item in reactions" :key="item.label" class="rounded-full border border-border bg-white/65 px-3 py-2 text-sm">
          {{ item.label }} · {{ item.count }}
        </button>
      </div>
    </div>
  </div>
</template>
