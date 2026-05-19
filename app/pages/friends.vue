<script setup lang="ts">
import { ExternalLink, HeartHandshake } from 'lucide-vue-next'
import { friends } from '~/data/mock'
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel rounded-[2rem] p-6">
      <HeartHandshake class="text-primary-strong" :size="28" />
      <h1 class="mt-4 text-4xl font-black">友链</h1>
      <p class="muted mt-3 max-w-2xl leading-7">展示朋友、同类博客和推荐站点。后续后台可维护展示状态和排序。</p>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <a v-for="friend in friends" :key="friend.name" :href="friend.url" class="soft-card rounded-[1.75rem] p-5">
        <div class="size-16 rounded-3xl bg-gradient-to-br" :class="friend.tone" />
        <h2 class="mt-5 flex items-center gap-2 text-xl font-bold">
          {{ friend.name }}
          <ExternalLink :size="16" />
        </h2>
        <p class="muted mt-2 leading-7">{{ friend.desc }}</p>
      </a>
    </section>
  </div>
</template>
