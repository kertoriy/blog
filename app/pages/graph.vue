<script setup lang="ts">
import { Network } from 'lucide-vue-next'

const KnowledgeGraph = defineAsyncComponent(() => import('~/components/KnowledgeGraph.vue'))
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel rounded-[2rem] p-6">
      <Network class="text-primary-strong" :size="28" />
      <h1 class="mt-4 text-4xl font-black">知识关系图</h1>
      <p class="muted mt-3 max-w-2xl leading-7">前台公开展示只读关系图，后台在同一视觉语言里维护节点和关系。</p>
    </section>

    <section class="glass-panel h-[560px] overflow-hidden rounded-[2rem] p-2">
      <KnowledgeGraph />
    </section>
  </div>
</template>
