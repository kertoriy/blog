<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { noteTags, notes, type NoteItem, type NoteTag } from '~/utils/content'
import '~/assets/css/blog-notes.css'

useSeoMeta({
  title: '碎碎念 · kertoriy 的研发空间',
  description: '居中轻盈排布的日常碎碎念与随手想法。'
})

const pageRef = ref<HTMLElement | null>(null)
const tabsWrapRef = ref<HTMLElement | null>(null)
const tabBtnRefs = ref<Record<string, HTMLButtonElement | null>>({})
const loadMoreSentinel = ref<HTMLElement | null>(null)
const isToolbarStuck = ref(false)

const activeTag = ref<'全部' | NoteTag>('全部')
const hoveredTag = ref<'全部' | NoteTag | null>(null)

const gliderReady = ref(false)
const gliderAnimated = ref(false)
const gliderRect = ref({ x: 0, y: 0, width: 0, height: 0 })

let scrollHost: HTMLElement | null = null
let tabsResizeObserver: ResizeObserver | undefined

function setTabBtnRef(tab: string, el: Element | ComponentPublicInstance | null) {
  tabBtnRefs.value[tab] = el instanceof HTMLButtonElement ? el : null
}

function updateTabGlider(instant = false) {
  if (!import.meta.client) return
  const targetTab = hoveredTag.value ?? activeTag.value
  const el = tabBtnRefs.value[targetTab]
  if (!el) return

  if (instant) {
    gliderAnimated.value = false
  }
  gliderRect.value = {
    x: el.offsetLeft,
    y: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight
  }
  gliderReady.value = true

  if (instant) {
    requestAnimationFrame(() => {
      gliderAnimated.value = true
    })
  }
}

const tabGliderStyle = computed(() => ({
  width: `${gliderRect.value.width}px`,
  height: `${gliderRect.value.height}px`,
  transform: `translate3d(${gliderRect.value.x}px, ${gliderRect.value.y}px, 0)`
}))

function syncToolbarStuck() {
  if (!import.meta.client) return
  isToolbarStuck.value = scrollHost ? scrollHost.scrollTop > 8 : window.scrollY > 8
}

onMounted(() => {
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

  nextTick(() => {
    updateTabGlider(true)
    if (tabsWrapRef.value && 'ResizeObserver' in window) {
      tabsResizeObserver = new ResizeObserver(() => updateTabGlider(true))
      tabsResizeObserver.observe(tabsWrapRef.value)
    }
  })
})

onActivated(() => {
  syncToolbarStuck()
  nextTick(() => updateTabGlider(true))
})

onBeforeUnmount(() => {
  scrollHost?.removeEventListener('scroll', syncToolbarStuck)
  tabsResizeObserver?.disconnect()
  if (import.meta.client) {
    window.removeEventListener('scroll', syncToolbarStuck)
  }
})

watch([activeTag, hoveredTag], () => {
  nextTick(() => updateTabGlider(false))
})

const tagTabs = computed<Array<'全部' | NoteTag>>(() => ['全部', ...noteTags])

const tagToneClass: Record<NoteTag, string> = {
  随想: 'is-tag-thought',
  折腾: 'is-tag-tinker',
  灵感: 'is-tag-idea',
  日常: 'is-tag-daily'
}

const displayNotes = computed<NoteItem[]>(() => {
  const filtered = activeTag.value === '全部'
    ? notes
    : notes.filter(item => item.tag === activeTag.value)

  return [...filtered].sort((a, b) => b.date.localeCompare(a.date))
})

const {
  visibleItems: visibleNotes,
  hasMore,
  isLoadingMore,
  loadMore
} = useScrollLoad(displayNotes, loadMoreSentinel, {
  initialSize: 5,
  step: 5,
  resetKey: () => activeTag.value
})

function getNoteParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
}
</script>

<template>
  <div ref="pageRef" class="notes-page">
    <!-- 吸顶居中标签筛选栏：悬停平滑跟随，滚动时固定于内容区顶部 -->
    <div class="notes-sticky-bar" :class="{ 'is-stuck': isToolbarStuck }">
      <div class="notes-toolbar">
        <div
          ref="tabsWrapRef"
          class="notes-tabs"
          :class="{ 'has-glider': gliderReady }"
          role="tablist"
          aria-label="碎碎念标签筛选"
          @mouseleave="hoveredTag = null"
        >
          <span
            v-if="gliderReady"
            class="notes-tab-glider"
            :class="{ 'is-animated': gliderAnimated }"
            :style="tabGliderStyle"
            aria-hidden="true"
          />
          <button
            v-for="tab in tagTabs"
            :key="tab"
            :ref="el => setTabBtnRef(tab, el)"
            type="button"
            role="tab"
            class="notes-tab"
            :class="{ 'is-active': activeTag === tab, 'is-hovered': hoveredTag === tab }"
            :aria-selected="activeTag === tab"
            @mouseenter="hoveredTag = tab"
            @focus="hoveredTag = tab"
            @blur="hoveredTag = null"
            @click="activeTag = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <!-- 居中极简碎碎念流：单独居中时间胶囊 + 标签融入卡片右下角排版水印 -->
    <template v-if="displayNotes.length">
      <ol class="chat-feed" aria-label="碎碎念消息流">
        <li v-for="note in visibleNotes" :key="note.id" class="chat-entry">
          <div class="chat-meta-row">
            <time class="chat-time-pill" :datetime="note.date">{{ note.date }}</time>
          </div>

          <article class="chat-bubble" :class="tagToneClass[note.tag]">
            <!-- 标签低透明大字背景水印（呼应首页/关于页水印语言） -->
            <span class="chat-tag-watermark" aria-hidden="true">
              <span class="chat-tag-watermark-hash">#</span>{{ note.tag }}
            </span>

            <!-- 纯文本内容，按空行分段控制段距，不进行 Markdown 渲染 -->
            <div class="chat-body">
              <p
                v-for="(para, idx) in getNoteParagraphs(note.content)"
                :key="`${note.id}-p-${idx}`"
                class="chat-text"
              >
                {{ para }}
              </p>
            </div>
          </article>
        </li>
      </ol>

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

    <div v-else class="notes-empty">
      <p class="m-0 text-sm font-medium text-ink">当前标签下还没有碎碎念</p>
      <button v-if="activeTag !== '全部'" type="button" class="ui-btn mt-4" @click="activeTag = '全部'">
        查看全部
      </button>
    </div>
  </div>
</template>
