<script setup lang="ts">
import type { Component } from 'vue'
import {
  BookOpen,
  Check,
  Code2,
  Compass,
  FileCode2,
  FolderKanban,
  Hash,
  Hexagon,
  Layers,
  RotateCcw,
  Sparkles,
  Tag,
  Workflow,
  X
} from 'lucide-vue-next'
import { articles, siteArticleStats } from '~/utils/articles'
import '~/assets/css/library-honeycomb.css'

const props = defineProps<{
  activeCategory: string
  selectedTags: string[]
  activeSort: 'latest' | 'title'
  hasActiveFilter: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-tag', tag: string): void
  (e: 'toggle-category', category: string): void
  (e: 'update:sort', sort: 'latest' | 'title'): void
  (e: 'reset'): void
  (e: 'close'): void
}>()

interface FilterHexCell {
  id: string
  kind: 'ambient' | 'tag' | 'category' | 'hub'
  label: string
  meta: string
  value: string
  icon: Component
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

// 5 行 13 - 12 - 13 - 12 - 13 交错蜂巢，中央 (2, 6) 为核心主控六边形
const ROW_LENGTHS = [13, 12, 13, 12, 13] as const

// 由中心向外逐圈对称扩展的槽位顺序
const RING_SLOTS: ReadonlyArray<readonly [number, number]> = [
  // Ring 1：紧邻中心主控的 6 个直接邻格
  [1, 5], [1, 6], [2, 5], [2, 7], [3, 5], [3, 6],
  // Ring 2：外扩对称 6 格
  [1, 4], [1, 7], [2, 4], [2, 8], [3, 4], [3, 7],
  // Ring 3：更多标签时继续对称外扩
  [1, 3], [1, 8], [2, 3], [2, 9], [3, 3], [3, 8]
]

const selectedCount = computed(() =>
  props.selectedTags.length + (props.activeCategory !== '全部内容' ? 1 : 0)
)

const honeycombRows = computed<FilterHexCell[][]>(() => {
  const tagCounts = new Map<string, number>()
  for (const article of articles) {
    for (const tag of article.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const tagCells: FilterHexCell[] = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([name, count]) => ({
      id: `tag-${name}`,
      kind: 'tag',
      label: name,
      meta: `${count} 篇`,
      value: name,
      icon: iconMap[name] ?? Hash
    }))

  const categoryCells: FilterHexCell[] = siteArticleStats.categories.map(cat => ({
    id: `cat-${cat.name}`,
    kind: 'category',
    label: cat.name,
    meta: `分类 · ${cat.count}`,
    value: cat.name,
    icon: iconMap[cat.name] ?? Tag
  }))

  const interactiveCells = [...tagCells, ...categoryCells].slice(0, RING_SLOTS.length)

  const grid: FilterHexCell[][] = ROW_LENGTHS.map((len, rowIdx) =>
    Array.from({ length: len }, (_, colIdx) => ({
      id: `ambient-${rowIdx}-${colIdx}`,
      kind: 'ambient',
      label: '',
      meta: '',
      value: '',
      icon: Hexagon
    }))
  )

  // 中央主控六边形：未选时展示统计，已选时点击可一键清空筛选
  grid[2]![6] = {
    id: 'hub-center',
    kind: 'hub',
    label: selectedCount.value > 0 ? '清空筛选' : '标签蜂巢',
    meta: selectedCount.value > 0 ? `已选 ${selectedCount.value} 项` : `${siteArticleStats.totalTags} 标签`,
    value: '__hub__',
    icon: selectedCount.value > 0 ? RotateCcw : Hexagon
  }

  interactiveCells.forEach((cell, idx) => {
    const slot = RING_SLOTS[idx]
    if (!slot) return
    const [r, c] = slot
    if (grid[r] && grid[r]![c]) {
      grid[r]![c] = cell
    }
  })

  return grid
})

function isCellSelected(cell: FilterHexCell): boolean {
  if (cell.kind === 'tag') return props.selectedTags.includes(cell.value)
  if (cell.kind === 'category') return props.activeCategory === cell.value
  return false
}

function handleCellClick(cell: FilterHexCell) {
  if (cell.kind === 'tag') {
    emit('toggle-tag', cell.value)
  }
  else if (cell.kind === 'category') {
    emit('toggle-category', cell.value)
  }
  else if (cell.kind === 'hub' && selectedCount.value > 0) {
    emit('reset')
  }
}
</script>

<template>
  <section class="library-honeycomb-panel" aria-label="标签蜂巢筛选">
    <!-- 顶部轻控栏：说明 + 排序切换 + 重置 + 收起 -->
    <div class="library-honeycomb-head">
      <div class="library-honeycomb-title-wrap">
        <span class="library-honeycomb-pill">
          <i aria-hidden="true" />
          标签蜂巢筛选
        </span>
        <span class="library-honeycomb-hint">点击六边形按标签或分类即时筛选，支持多选</span>
      </div>

      <div class="library-honeycomb-controls">
        <div class="library-sort-switch" role="group" aria-label="排序方式">
          <button
            type="button"
            class="library-sort-btn"
            :class="{ 'is-active': activeSort === 'latest' }"
            @click="emit('update:sort', 'latest')"
          >
            按时间
          </button>
          <button
            type="button"
            class="library-sort-btn"
            :class="{ 'is-active': activeSort === 'title' }"
            @click="emit('update:sort', 'title')"
          >
            按标题
          </button>
        </div>

        <button
          v-if="hasActiveFilter"
          type="button"
          class="library-head-action is-accent"
          @click="emit('reset')"
        >
          <RotateCcw :size="11.5" aria-hidden="true" />
          <span>重置</span>
        </button>

        <button
          type="button"
          class="library-head-action"
          aria-label="收起标签蜂巢筛选"
          @click="emit('close')"
        >
          <X :size="12" aria-hidden="true" />
          <span>收起</span>
        </button>
      </div>
    </div>

    <!-- 全宽渐隐六边形标签蜂巢舞台 -->
    <div class="library-honeycomb-stage">
      <span class="library-honeycomb-aura" aria-hidden="true" />

      <div class="library-honeycomb-hive" role="group" aria-label="标签与分类蜂巢选择器">
        <div
          v-for="(row, rowIdx) in honeycombRows"
          :key="rowIdx"
          class="library-honeycomb-row"
        >
          <template v-for="cell in row" :key="cell.id">
            <!-- 外围渐隐环境六边形 -->
            <div
              v-if="cell.kind === 'ambient'"
              class="lib-hex-cell is-ambient"
              aria-hidden="true"
            >
              <svg class="lib-hex-svg" viewBox="0 0 120 138">
                <path :d="HEX_PATH" class="lib-hex-outer" />
                <path
                  :d="HEX_PATH"
                  class="lib-hex-inner"
                  transform="translate(60 69) scale(0.915) translate(-60 -69)"
                />
              </svg>
            </div>

            <!-- 可交互六边形筛选节点（标签 / 分类 / 中心主控） -->
            <button
              v-else
              type="button"
              class="lib-hex-cell"
              :class="{
                'is-hub': cell.kind === 'hub',
                'is-selected': isCellSelected(cell)
              }"
              :aria-pressed="cell.kind === 'hub' ? undefined : isCellSelected(cell)"
              @click="handleCellClick(cell)"
            >
              <svg class="lib-hex-svg" viewBox="0 0 120 138" aria-hidden="true">
                <path :d="HEX_PATH" class="lib-hex-outer" />
                <path
                  :d="HEX_PATH"
                  class="lib-hex-inner"
                  transform="translate(60 69) scale(0.915) translate(-60 -69)"
                />
              </svg>

              <span class="lib-hex-body">
                <span class="lib-hex-icon" aria-hidden="true">
                  <Check v-if="isCellSelected(cell)" :size="12.5" :stroke-width="2.4" />
                  <component :is="cell.icon" v-else :size="12.5" :stroke-width="1.8" />
                </span>
                <span class="lib-hex-name">{{ cell.label }}</span>
                <span class="lib-hex-meta">{{ cell.meta }}</span>
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
