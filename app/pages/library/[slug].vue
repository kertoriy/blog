<script setup lang="ts">
import { ArrowLeft, Network } from 'lucide-vue-next'
import { articles } from '~/data/mock'

const route = useRoute()
const article = computed(() => articles.find((item) => item.slug === route.params.slug) ?? articles[0])
</script>

<template>
  <article class="mx-auto max-w-4xl">
    <NuxtLink to="/library" class="muted mb-6 inline-flex items-center gap-2 text-sm">
      <ArrowLeft :size="16" />
      返回文库
    </NuxtLink>
    <div class="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div class="min-h-64 rounded-[1.5rem]" :style="{ background: article.cover }" />
      <p class="muted mt-6 text-sm">{{ article.category }} · {{ article.date }} · {{ article.readTime }}</p>
      <h1 class="mt-3 text-4xl font-black leading-tight sm:text-5xl">{{ article.title }}</h1>
      <p class="muted mt-5 text-lg leading-9">{{ article.summary }}</p>
      <ArticleReader class="mt-8" :article="article" />
      <NuxtLink to="/graph" class="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-semibold">
        查看知识关系
        <Network :size="16" />
      </NuxtLink>
    </div>
  </article>
</template>
