<script setup lang="ts">
import type { Component } from 'vue'
import {
  Archive,
  ArrowRight,
  BookOpen,
  Code2,
  Compass,
  FileCode2,
  FolderKanban,
  Hash,
  Hexagon,
  Layers,
  Sparkles,
  Tag,
  Workflow
} from 'lucide-vue-next'
import { articles, siteArticleStats } from '~/utils/articles'
import '~/assets/css/home-honeycomb.css'

interface HexCell {
  id: string
  ambient?: boolean
  label: string
  meta: string
  to: string | { path: string, query?: Record<string, string> }
  icon: Component
  isHub?: boolean
}

const HEX_PATH = 'M 51.34 9 Q 60 4 68.66 9 L 107.64 31.5 Q 116.3 36.5 116.3 46.5 L 116.3 91.5 Q 116.3 101.5 107.64 106.5 L 68.66 129 Q 60 134 51.34 129 L 12.36 106.5 Q 3.7 101.5 3.7 91.5 L 3.7 46.5 Q 3.7 36.5 12.36 31.5 Z'

const iconMap: Record<string, Component> = {
  Markdown: FileCode2,
  Nuxt: Code2,
  'Vue Flow': Layers,
  知识库: BookOpen,
  博客系统: Layers,
  工作流: Workflow,
  知识图谱: Compass,
  产品设计: Sparkles,
  工程实践: FolderKanban,
  可视化: Compass
}

function makeAmbientCells(prefix: string, count: number): HexCell[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `ambient-${prefix}-${idx}`,
    ambient: true,
    label: '',
    meta: '',
    to: '/library',
    icon: Hexagon
  }))
}

// 7 行 12 - 13 - 12 - 13 - 12 - 13 - 12 满屏蜂巢阵列（87 格无缝咬合）
const honeycombRows = computed<HexCell[][]>(() => {
  const tagCounts = new Map<string, number>()
  for (const article of articles) {
    for (const tag of article.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const tagCells: HexCell[] = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      id: `tag-${name}`,
      label: name,
      meta: `${count} 篇`,
      to: { path: '/library', query: { q: name } },
      icon: iconMap[name] ?? Hash
    }))

  const categoryCells: HexCell[] = siteArticleStats.categories.map(cat => ({
    id: `cat-${cat.name}`,
    label: cat.name,
    meta: `分类 · ${cat.count}`,
    to: { path: '/library', query: { q: cat.name } },
    icon: iconMap[cat.name] ?? Tag
  }))

  const extraCells: HexCell[] = [
    {
      id: 'topic-archive',
      label: '时间归档',
      meta: '按月索引',
      to: '/archive',
      icon: Archive
    },
    {
      id: 'topic-sites',
      label: '常用网站',
      meta: '效率导航',
      to: '/sites',
      icon: Compass
    }
  ]

  const surrounding = [...tagCells, ...categoryCells, ...extraCells].slice(0, 12)

  const hubCell: HexCell = {
    id: 'hub-center',
    label: '标签蜂巢',
    meta: `${siteArticleStats.totalTags} 标签`,
    to: '/library',
    icon: Hexagon,
    isHub: true
  }

  // 四周环境六边形铺满整屏并由外向内渐隐浮现，正中央 4 - 5 - 4 共 13 格为可交互真实标签
  const row0 = makeAmbientCells('r0', 12)
  const row1 = makeAmbientCells('r1', 13)
  const row2 = [...makeAmbientCells('r2l', 4), ...surrounding.slice(0, 4), ...makeAmbientCells('r2r', 4)]
  const row3 = [
    ...makeAmbientCells('r3l', 4),
    ...surrounding.slice(4, 6),
    hubCell,
    ...surrounding.slice(6, 8),
    ...makeAmbientCells('r3r', 4)
  ]
  const row4 = [...makeAmbientCells('r4l', 4), ...surrounding.slice(8, 12), ...makeAmbientCells('r4r', 4)]
  const row5 = makeAmbientCells('r5', 13)
  const row6 = makeAmbientCells('r6', 12)

  return [row0, row1, row2, row3, row4, row5, row6]
})
</script>

<template>
  <section id="tag-honeycomb" class="blog-honeycomb-section" aria-labelledby="blog-honeycomb-title">
    <div class="blog-honeycomb-bar">
      <h2 id="blog-honeycomb-title" class="blog-pill-label">
        <i aria-hidden="true" />
        标签蜂巢
      </h2>
      <NuxtLink to="/library" class="blog-text-link">
        全部标签
        <ArrowRight :size="14" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- 全域满铺蜂巢矩阵：四周环境六边形由外向内渐隐浮现，中央 13 枚为真实可交互核心 -->
    <div class="blog-honeycomb-stage">
      <span class="blog-honeycomb-aura" aria-hidden="true" />

      <div class="blog-honeycomb-hive" role="list" aria-label="六边形蜂窝标签索引">
        <div
          v-for="(row, rowIdx) in honeycombRows"
          :key="rowIdx"
          class="blog-honeycomb-row"
        >
          <template v-for="cell in row" :key="cell.id">
            <!-- 外围渐隐环境六边形 -->
            <div
              v-if="cell.ambient"
              class="blog-hex-cell is-ambient"
              aria-hidden="true"
            >
              <svg class="blog-hex-svg" viewBox="0 0 120 138">
                <path :d="HEX_PATH" class="blog-hex-outer" />
                <path
                  :d="HEX_PATH"
                  class="blog-hex-inner"
                  transform="translate(60 69) scale(0.915) translate(-60 -69)"
                />
              </svg>
            </div>

            <!-- 中央核心可交互六边形标签 -->
            <NuxtLink
              v-else
              :to="cell.to"
              role="listitem"
              class="blog-hex-cell"
              :class="{ 'is-hub': cell.isHub }"
            >
              <svg class="blog-hex-svg" viewBox="0 0 120 138" aria-hidden="true">
                <path :d="HEX_PATH" class="blog-hex-outer" />
                <path
                  :d="HEX_PATH"
                  class="blog-hex-inner"
                  transform="translate(60 69) scale(0.915) translate(-60 -69)"
                />
              </svg>

              <span class="blog-hex-body">
                <span class="blog-hex-icon" aria-hidden="true">
                  <component :is="cell.icon" :size="13.5" :stroke-width="1.8" />
                </span>
                <span class="blog-hex-name">{{ cell.label }}</span>
                <span class="blog-hex-meta">{{ cell.meta }}</span>
              </span>
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
