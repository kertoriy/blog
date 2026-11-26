<script setup lang="ts">
import type { Component } from 'vue'
import { BookOpen, Code2, Compass, FileText } from 'lucide-vue-next'
import { articles, type BlogArticle } from '~/utils/articles'
import '~/assets/css/blog-archive.css'

useSeoMeta({
  title: '归档 · kertoriy 的研发空间',
  description: '按年份时间线快速浏览全部 Markdown 文章。'
})

const categoryIcons: Record<string, Component> = {
  工程实践: Code2,
  产品设计: BookOpen,
  可视化: Compass
}

function getCategoryIcon(category: string): Component {
  return categoryIcons[category] ?? FileText
}

function formatYearWords(words: number): string {
  if (words >= 10000) {
    return `${(words / 10000).toFixed(2)} 万字`
  }
  return `${words.toLocaleString()} 字`
}

const yearGroups = computed(() => {
  const map = new Map<string, BlogArticle[]>()
  for (const article of articles) {
    const year = article.date.slice(0, 4) || '未知'
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(article)
  }

  return Array.from(map.entries()).map(([year, items]) => {
    const totalWords = items.reduce((sum, item) => sum + item.wordCount, 0)
    return {
      year,
      items,
      wordsText: formatYearWords(totalWords)
    }
  })
})
</script>

<template>
  <div class="archive-page">
    <section
      v-for="group in yearGroups"
      :key="group.year"
      class="archive-year-group"
      :aria-label="`${group.year} 年文章归档`"
    >
      <div class="archive-year-bar">
        <h2 class="archive-year-pill">
          <i aria-hidden="true" />
          {{ group.year }} 年
        </h2>
        <span class="archive-year-stats">{{ group.wordsText }} · {{ group.items.length }} 篇</span>
      </div>

      <ul class="archive-list">
        <li v-for="article in group.items" :key="article.id">
          <NuxtLink :to="`/library/${article.slug}`" class="archive-row">
            <!-- 左侧独立日期 div -->
            <div class="archive-date-box">
              <time :datetime="article.date">{{ article.date }}</time>
            </div>

            <!-- 右侧独立内容 div -->
            <div class="archive-content-box">
              <div class="archive-row-main">
                <span class="archive-row-icon" :title="article.category" aria-hidden="true">
                  <component :is="getCategoryIcon(article.category)" :size="13.5" :stroke-width="1.8" />
                </span>
                <span class="archive-row-title">{{ article.title }}</span>
              </div>

              <div class="archive-row-tags">
                <span class="archive-row-hash" aria-hidden="true">#</span>
                <span>{{ article.tags.slice(0, 3).join(' ') }}</span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
