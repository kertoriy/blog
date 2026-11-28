<script setup lang="ts">
import {
  CalendarDays,
  Clock3,
  Eye,
  Hash,
  Search,
  SlidersHorizontal,
  Tag,
  X
} from 'lucide-vue-next'
import { articles } from '~/utils/articles'
import '~/assets/css/library-honeycomb.css'

useSeoMeta({
  title: '文库 · kertoriy 的研发空间',
  description: '浏览通过 Markdown 发布的全部文章、分类与标签索引。'
})

const route = useRoute()
const router = useRouter()
const baseURL = useRuntimeConfig().app.baseURL
const { getArticleReads } = useContentMetrics()

function parseQueryTags(val: unknown): string[] {
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

const pageRef = ref<HTMLElement | null>(null)
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef')
const loadMoreSentinel = ref<HTMLElement | null>(null)
const isToolbarStuck = ref(false)
let scrollHost: HTMLElement | null = null

const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const activeCategory = ref('全部内容')
const selectedTags = ref<string[]>(parseQueryTags(route.query.tag))
const activeSort = ref<'latest' | 'title'>('latest')
const filterOpen = ref(false)
const overlayReady = ref(false)

function focusSearchInput() {
  searchInputRef.value?.focus()
}

function tokenizeQuery(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(token => token.replace(/^#+/, ''))
    .filter(Boolean)
}

function resolveCover(cover: string) {
  if (!cover) return `${baseURL}blog-desk.webp`
  return /^https?:\/\//.test(cover) ? cover : `${baseURL}${cover.replace(/^\//, '')}`
}

watch(() => route.query.q, (val) => {
  searchQuery.value = typeof val === 'string' ? val : ''
  if (filterOpen.value) {
    filterOpen.value = false
  }
})

watch(() => route.query.tag, (val) => {
  selectedTags.value = parseQueryTags(val)
})

watch(() => route.path, (path) => {
  if (path !== '/library' && filterOpen.value) {
    filterOpen.value = false
  }
})

function clearSearch() {
  searchQuery.value = ''
  if (route.query.q) {
    const nextQuery = { ...route.query }
    delete nextQuery.q
    router.replace({ path: '/library', query: nextQuery })
  }
}

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(item => item !== tag)
  }
  else {
    selectedTags.value = [...selectedTags.value, tag]
  }
}

function toggleCategory(category: string) {
  activeCategory.value = activeCategory.value === category ? '全部内容' : category
}

function resetAllFilters() {
  clearSearch()
  activeCategory.value = '全部内容'
  selectedTags.value = []
  activeSort.value = 'latest'
  if (route.query.tag) {
    const nextQuery = { ...route.query }
    delete nextQuery.tag
    router.replace({ path: '/library', query: nextQuery })
  }
}

const hasActiveFilter = computed(() =>
  selectedTags.value.length > 0
  || activeCategory.value !== '全部内容'
  || activeSort.value !== 'latest'
)
const hasVisibleChips = computed(() => activeCategory.value !== '全部内容' || selectedTags.value.length > 0)

const filteredArticles = computed(() => {
  const tokens = tokenizeQuery(searchQuery.value)
  const list = articles.filter((item) => {
    const matchCategory = activeCategory.value === '全部内容' || item.category === activeCategory.value
    const matchTags = selectedTags.value.length === 0
      || selectedTags.value.some(tag => item.tags.includes(tag))
    if (!matchCategory || !matchTags) return false
    if (!tokens.length) return true

    const haystack = `${item.title} ${item.summary} ${item.category} ${item.date} ${item.tags.join(' ')} ${item.body}`.toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })

  if (activeSort.value === 'title') {
    return [...list].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  }
  return list
})

const {
  visibleItems: visibleArticles,
  hasMore,
  isLoadingMore,
  loadMore
} = useScrollLoad(filteredArticles, loadMoreSentinel, {
  initialSize: 9,
  step: 6,
  resetKey: () => `${activeCategory.value}|${selectedTags.value.join(',')}|${searchQuery.value.trim()}|${activeSort.value}`
})

function syncToolbarStuck() {
  if (!import.meta.client) return
  isToolbarStuck.value = scrollHost ? scrollHost.scrollTop > 8 : window.scrollY > 8
}

function toggleFilterDrawer() {
  filterOpen.value = !filterOpen.value
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && filterOpen.value) {
    filterOpen.value = false
  }
}

onMounted(() => {
  overlayReady.value = true
  const sheet = pageRef.value?.closest('.blog-sheet') as HTMLElement | null
  if (sheet) {
    const overflowY = window.getComputedStyle(sheet).overflowY
    scrollHost = overflowY === 'auto' || overflowY === 'scroll' ? sheet : null
  }
  if (scrollHost) {
    scrollHost.addEventListener('scroll', syncToolbarStuck, { passive: true })
  }
  window.addEventListener('scroll', syncToolbarStuck, { passive: true })
  syncToolbarStuck()
  window.addEventListener('keydown', onDocumentKeydown)
})

onDeactivated(() => {
  filterOpen.value = false
})

onBeforeUnmount(() => {
  filterOpen.value = false
  scrollHost?.removeEventListener('scroll', syncToolbarStuck)
  if (import.meta.client) {
    window.removeEventListener('scroll', syncToolbarStuck)
  }
  window.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div ref="pageRef" class="grid w-full gap-3 py-1">
    <!-- 吸顶搜索与筛选区：滚动时固定于内容区顶部 -->
    <div class="library-sticky-bar" :class="{ 'is-stuck': isToolbarStuck }">
      <!-- 单行检索栏：左侧搜索区域 + 右侧筛选按钮（展开标签蜂巢筛选面板） -->
      <div class="relative flex items-center gap-3">
        <div
          class="flex h-10 flex-1 cursor-text items-center gap-2.5 rounded-full border border-border bg-surface px-4 transition-[border-color,background-color,box-shadow] duration-200 focus-within:border-border-strong focus-within:bg-canvas focus-within:shadow-[0_0_0_3px_var(--ui-hover-ring-fill),0_0_0_4px_var(--ui-hover-ring-edge)]"
          @click="focusSearchInput"
        >
          <Search :size="15" :stroke-width="1.8" class="shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            class="library-search-input w-full min-w-0 border-0 bg-transparent text-[13.5px] leading-none text-ink outline-none placeholder:text-ink-muted"
            placeholder="搜索文章标题、标签、正文或日期…"
            aria-label="搜索文库文章"
            @keydown.esc="clearSearch"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="inline-grid size-5 shrink-0 cursor-pointer place-items-center rounded-full bg-surface-hover text-ink-muted transition hover:text-ink"
            aria-label="清空搜索"
            @click.stop="clearSearch"
          >
            <X :size="12" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          class="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-[background-color,border-color,color] duration-150"
          :class="filterOpen || hasActiveFilter
            ? 'border-border-strong bg-canvas text-ink'
            : 'border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink'"
          :aria-expanded="filterOpen"
          aria-label="展开标签蜂巢筛选"
          @click="toggleFilterDrawer"
        >
          <SlidersHorizontal :size="14" :stroke-width="1.8" aria-hidden="true" />
          <span>筛选</span>
        </button>
      </div>

      <!-- 已激活的分类/标签筛选条 -->
      <div v-if="hasVisibleChips" class="flex flex-wrap items-center gap-2">
        <span class="text-[11.5px] text-ink-muted">已筛选：</span>

        <button
          v-if="activeCategory !== '全部内容'"
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-medium text-accent-ink transition hover:border-accent/55"
          @click="activeCategory = '全部内容'"
        >
          <span>分类：{{ activeCategory }}</span>
          <X :size="11" aria-hidden="true" />
        </button>

        <button
          v-for="tag in selectedTags"
          :key="tag"
          type="button"
          class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-medium text-accent-ink transition hover:border-accent/55"
          @click="toggleTag(tag)"
        >
          <Hash :size="10.5" aria-hidden="true" />
          <span>{{ tag }}</span>
          <X :size="11" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="cursor-pointer border-0 bg-transparent px-1 text-[11.5px] text-ink-muted transition hover:text-ink"
          @click="resetAllFilters"
        >
          清空
        </button>
      </div>
    </div>

    <!-- 整张内容区雾化覆盖式标签蜂巢筛选（Teleport 脱离文档流，零排版干扰） -->
    <Teleport v-if="overlayReady" to="#blog-sheet-overlay">
      <Transition name="library-fog">
        <LibraryTagHoneycomb
          v-if="filterOpen"
          :active-category="activeCategory"
          :selected-tags="selectedTags"
          :active-sort="activeSort"
          :has-active-filter="hasActiveFilter"
          :matched-count="filteredArticles.length"
          :total-count="articles.length"
          @toggle-tag="toggleTag"
          @toggle-category="toggleCategory"
          @update:sort="activeSort = $event"
          @reset="resetAllFilters"
          @close="filterOpen = false"
        />
      </Transition>
    </Teleport>

    <!-- 自适应多列上下结构配图文章网格（支持触底滚动加载） -->
    <section aria-label="文章列表">
      <template v-if="filteredArticles.length">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-6">
          <NuxtLink
            v-for="card in visibleArticles"
            :key="card.id"
          :to="`/library/${card.slug}`"
          class="ui-card-subtle article-card-hover group flex h-full flex-col overflow-hidden"
        >
          <!-- 内嵌圆角画框封面：悬停不放大图片，保持画面沉稳清晰 -->
          <div class="p-2.5 pb-0">
            <div class="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-border/55 bg-surface">
              <img
                :src="resolveCover(card.cover)"
                :alt="card.title"
                loading="lazy"
                class="size-full object-cover"
              >
            </div>
          </div>

          <!-- 居中悬浮分类与标签胶囊（悬停卡片时外圈逐渐闭合描边） -->
          <div class="article-tag-pill">
            <Tag :size="11.5" aria-hidden="true" />
            <span class="flex items-center gap-1.5 truncate">
              <span>{{ card.category }}</span>
              <template v-for="tag in card.tags.slice(0, 2)" :key="tag">
                <span class="text-border-strong" aria-hidden="true">·</span>
                <span>{{ tag }}</span>
              </template>
            </span>
          </div>

          <div class="flex flex-1 flex-col px-4 pt-3 pb-4">
            <h2 class="m-0 text-[15.5px] font-semibold leading-[1.45] tracking-[-0.015em] text-ink transition-colors duration-150 group-hover:text-accent-ink">
              {{ card.title }}
            </h2>
            <p class="mt-2 line-clamp-2 text-[13px] leading-[1.68] text-ink-secondary">
              {{ card.summary }}
            </p>
            <div class="mt-auto pt-4">
              <div class="flex items-center justify-between gap-2 border-t border-dashed border-border/75 pt-3 text-[11.5px] tabular-nums text-ink-muted">
                <span class="inline-flex items-center gap-3 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5">
                    <Clock3 :size="12" class="shrink-0 opacity-80" aria-hidden="true" />
                    <span>{{ card.readTime }}</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5" :title="`累计阅读 ${getArticleReads(card.slug).toLocaleString()} 次`">
                    <Eye :size="12" class="shrink-0 opacity-80" aria-hidden="true" />
                    <span>{{ getArticleReads(card.slug).toLocaleString() }} 阅读</span>
                  </span>
                </span>
                <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <CalendarDays :size="12" class="shrink-0 opacity-80" aria-hidden="true" />
                  <time :datetime="card.date">{{ card.date }}</time>
                </span>
              </div>
            </div>
          </div>
          </NuxtLink>
        </div>

        <!-- 触底滚动加载哨兵 -->
        <div ref="loadMoreSentinel" class="scroll-load-sentinel" aria-live="polite">
          <span v-if="isLoadingMore" class="scroll-load-status">
            <span class="scroll-load-spinner" aria-hidden="true" />
            <span>正在加载更多…</span>
          </span>
          <button v-else-if="hasMore" type="button" class="scroll-load-trigger" @click="loadMore">
            继续加载更多
          </button>
          <span v-else class="scroll-load-end">已到底部</span>
        </div>
      </template>

      <div v-else class="py-14 text-center">
        <p class="text-sm font-medium text-ink">没有找到匹配的文章</p>
        <p class="mt-1 text-xs text-ink-muted">试试更换关键词或重置筛选条件。</p>
        <button type="button" class="ui-btn mt-4" @click="resetAllFilters">
          重置筛选
        </button>
      </div>
    </section>
  </div>
</template>
