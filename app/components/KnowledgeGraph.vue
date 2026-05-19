<script setup lang="ts">
import '~/assets/css/vue-flow.css'

const nodes = shallowRef<typeof import('~/data/mock').graphNodes | null>(null)
const edges = shallowRef<typeof import('~/data/mock').graphEdges | null>(null)
const VueFlow = shallowRef<typeof import('@vue-flow/core').VueFlow | null>(null)

onMounted(async () => {
  const [{ VueFlow: Flow }, mock] = await Promise.all([
    import('@vue-flow/core'),
    import('~/data/mock')
  ])

  VueFlow.value = Flow
  nodes.value = mock.graphNodes
  edges.value = mock.graphEdges
})
</script>

<template>
  <component
    :is="VueFlow"
    v-if="VueFlow && nodes && edges"
    class="h-full w-full"
    :nodes="nodes"
    :edges="edges"
    fit-view-on-init
  />
  <div v-else class="grid h-full place-items-center muted">知识关系图加载中</div>
</template>
