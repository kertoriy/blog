<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { archiveGroups, articles } from '~/data/mock'
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel rounded-[2rem] p-6">
      <p class="muted text-sm">Archive</p>
      <h1 class="mt-2 text-4xl font-black">归档</h1>
      <p class="muted mt-3">按时间查看文章沉淀。</p>
    </section>

    <section class="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <div class="glass-panel rounded-[2rem] p-6">
        <CalendarDays class="text-primary-strong" :size="26" />
        <div v-for="group in archiveGroups" :key="group.year" class="mt-6">
          <h2 class="text-2xl font-black">{{ group.year }}</h2>
          <div class="mt-3 grid gap-2">
            <div v-for="month in group.months" :key="month.name" class="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
              <span>{{ month.name }}</span>
              <span class="muted">{{ month.count }} 篇</span>
            </div>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <NuxtLink v-for="article in articles" :key="article.id" :to="`/library/${article.slug}`" class="soft-card block rounded-[1.75rem] p-5">
          <p class="muted text-sm">{{ article.date }} · {{ article.category }}</p>
          <h2 class="mt-2 text-xl font-bold">{{ article.title }}</h2>
          <p class="muted mt-2 leading-7">{{ article.summary }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
