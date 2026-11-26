<script setup lang="ts">
import { ArrowUp, Gauge, MemoryStick, PanelLeftOpen, Search, X } from 'lucide-vue-next'
import { articles } from '~/utils/articles'
import { siteConfig } from '~/utils/content'
import '~/assets/css/blog-shell.css'

const route = useRoute()
const router = useRouter()
const { theme, setTheme } = useTheme()
const { telemetry, hasTelemetry } = useBrowserMemory()

const drawer = useTemplateRef<HTMLDialogElement>('drawer')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const sheet = useTemplateRef<HTMLDivElement>('sheet')
const contentEl = useTemplateRef<HTMLElement>('contentEl')
const scrollTrack = useTemplateRef<HTMLDivElement>('scrollTrack')

const menuOpen = ref(false)
const sidebarCollapsed = ref(false)
const headerQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')

// 外置 1:1 自定义滚动条状态
const scrollTop = ref(0)
const scrollProgress = ref(0)
const canScroll = ref(false)
const thumbHeight = ref(0)
const thumbOffset = ref(0)
const isDragging = ref(false)

const RING_RADIUS = 18.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

let mobileScreen: MediaQueryList | undefined
let resizeObserver: ResizeObserver | undefined
let dragStartY = 0
let dragStartScrollTop = 0
let dragMaxThumbY = 1
let dragMaxScroll = 0

const routeTitles: Record<string, string> = {
  '/': '首页',
  '/library': '文库',
  '/notes': '碎碎念',
  '/archive': '归档',
  '/sites': '常用网站',
  '/friends': '友链',
  '/trash': '赛博情绪垃圾桶',
  '/about': '关于'
}

const breadcrumb = computed(() => {
  const normalizedPath = route.path.length > 1 ? route.path.replace(/\/+$/, '') : route.path
  if (normalizedPath.startsWith('/library/') && route.params.slug) {
    const found = articles.find(item => item.slug === route.params.slug)
    return {
      parent: { label: '文库', to: '/library' },
      current: found?.title ?? String(route.params.slug)
    }
  }

  return {
    parent: null,
    current: routeTitles[normalizedPath] ?? '页面'
  }
})

const isScrolled = computed(() => scrollTop.value > 32)
const scrollPercent = computed(() => Math.round(scrollProgress.value * 100))

const ringDashOffset = computed(() => {
  const ratio = canScroll.value ? scrollProgress.value : 0
  return RING_CIRCUMFERENCE * (1 - ratio)
})

const thumbStyle = computed(() => ({
  height: `${thumbHeight.value}px`,
  transform: `translateY(${thumbOffset.value}px)`
}))

const fillStyle = computed(() => ({
  height: `${canScroll.value ? Math.round(thumbOffset.value + thumbHeight.value * 0.5) : 0}px`
}))

function syncScrollbar() {
  const el = sheet.value
  const track = scrollTrack.value
  if (!el || !track) return

  const trackH = track.clientHeight
  const clientH = el.clientHeight
  const scrollH = el.scrollHeight
  const maxScroll = Math.max(0, scrollH - clientH)

  scrollTop.value = el.scrollTop
  canScroll.value = maxScroll > 2

  if (!canScroll.value || trackH <= 0) {
    scrollProgress.value = 0
    thumbHeight.value = Math.max(32, trackH)
    thumbOffset.value = 0
    return
  }

  const ratio = Math.max(0, Math.min(1, el.scrollTop / maxScroll))
  scrollProgress.value = ratio

  const nextThumbH = Math.max(40, Math.round((clientH / scrollH) * trackH))
  const maxThumbY = Math.max(1, trackH - nextThumbH)
  thumbHeight.value = nextThumbH
  thumbOffset.value = ratio * maxThumbY
}

function scrollToTop() {
  sheet.value?.scrollTo({ top: 0, behavior: 'smooth' })
  if (typeof window !== 'undefined' && window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function onTrackPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement | null)?.closest('.blog-scroll-thumb')) return
  const el = sheet.value
  const track = scrollTrack.value
  if (!el || !track || !canScroll.value) return

  const rect = track.getBoundingClientRect()
  const maxThumbY = Math.max(1, rect.height - thumbHeight.value)
  const clickY = event.clientY - rect.top - thumbHeight.value / 2
  const ratio = Math.max(0, Math.min(1, clickY / maxThumbY))
  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
  el.scrollTo({ top: ratio * maxScroll, behavior: 'smooth' })
}

function onThumbPointerDown(event: PointerEvent) {
  const el = sheet.value
  const track = scrollTrack.value
  if (!el || !track || !canScroll.value) return

  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  isDragging.value = true
  dragStartY = event.clientY
  dragStartScrollTop = el.scrollTop
  dragMaxThumbY = Math.max(1, track.clientHeight - thumbHeight.value)
  dragMaxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
}

function onThumbPointerMove(event: PointerEvent) {
  if (!isDragging.value || !sheet.value) return
  const deltaY = event.clientY - dragStartY
  const nextTop = dragStartScrollTop + (deltaY / dragMaxThumbY) * dragMaxScroll
  sheet.value.scrollTop = Math.max(0, Math.min(dragMaxScroll, nextTop))
}

function onThumbPointerUp(event: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

function onRailWheel(event: WheelEvent) {
  const el = sheet.value
  if (!el || !canScroll.value || event.ctrlKey) return

  let deltaY = event.deltaY
  if (event.deltaMode === 1) {
    deltaY *= 32
  }
  else if (event.deltaMode === 2) {
    deltaY *= el.clientHeight
  }

  if (!deltaY) return
  event.preventDefault()
  el.scrollBy({ top: deltaY, behavior: 'instant' as ScrollBehavior })
}

function submitHeaderSearch() {
  const q = headerQuery.value.trim()
  router.push(q ? { path: '/library', query: { q } } : '/library')
}

function clearHeaderSearch() {
  headerQuery.value = ''
  if (route.path === '/library') {
    const nextQuery = { ...route.query }
    delete nextQuery.q
    router.replace({ path: '/library', query: nextQuery })
  }
}

watch(() => route.query.q, (val) => {
  headerQuery.value = typeof val === 'string' ? val : ''
})

function openMenu() {
  if (!drawer.value || drawer.value.open) return
  menuTrigger.value?.focus({ preventScroll: true })
  drawer.value.showModal()
  menuOpen.value = true
}

function closeMenu() {
  drawer.value?.close()
  menuOpen.value = false
}

function handleResize(event: MediaQueryListEvent) {
  if (!event.matches) closeMenu()
}

// 内容区专属居中转圈加载态（仅作用于 .blog-sheet 内部，不遮挡侧栏、顶栏与滚动条）
const contentLoading = ref(true)
let loadingStartedAt = 0
let loadingHideTimer: ReturnType<typeof setTimeout> | undefined
let removeBeforeEach: (() => void) | undefined
let removeAfterEach: (() => void) | undefined
let removeOnError: (() => void) | undefined

function startContentLoading() {
  if (loadingHideTimer) {
    clearTimeout(loadingHideTimer)
    loadingHideTimer = undefined
  }
  loadingStartedAt = performance.now()
  contentLoading.value = true
}

function finishContentLoading() {
  if (!contentLoading.value) return
  const elapsed = loadingStartedAt ? performance.now() - loadingStartedAt : 0
  const remaining = Math.max(0, 240 - elapsed)

  loadingHideTimer = setTimeout(() => {
    contentLoading.value = false
    loadingHideTimer = undefined
  }, remaining)
}

watch(() => route.path, async () => {
  closeMenu()
  if (sheet.value) {
    sheet.value.scrollTop = 0
  }
  await nextTick()
  syncScrollbar()
  window.setTimeout(syncScrollbar, 240)
})

onMounted(() => {
  mobileScreen = window.matchMedia('(width < 52rem)')
  mobileScreen.addEventListener('change', handleResize)

  // 首次加载时仅在内容区完成柔和转圈淡出，外框侧栏与顶栏立即可见
  loadingStartedAt = performance.now()
  requestAnimationFrame(() => {
    finishContentLoading()
  })

  // 每次站内路由切换均可靠触发内容区局部转圈加载（兼容 keepalive 缓存页）
  removeBeforeEach = router.beforeEach((to, from) => {
    if (to.path !== from.path) {
      startContentLoading()
    }
  })
  removeAfterEach = router.afterEach(() => {
    finishContentLoading()
  })
  removeOnError = router.onError(() => {
    finishContentLoading()
  })

  resizeObserver = new ResizeObserver(syncScrollbar)
  if (sheet.value) resizeObserver.observe(sheet.value)
  if (contentEl.value) resizeObserver.observe(contentEl.value)
  if (scrollTrack.value) resizeObserver.observe(scrollTrack.value)
  syncScrollbar()
})

onBeforeUnmount(() => {
  mobileScreen?.removeEventListener('change', handleResize)
  resizeObserver?.disconnect()
  removeBeforeEach?.()
  removeAfterEach?.()
  removeOnError?.()
  if (loadingHideTimer) clearTimeout(loadingHideTimer)
})
</script>

<template>
  <div class="blog-shell" :class="{ 'is-collapsed': sidebarCollapsed }">
    <a href="#blog-main" class="blog-skip">跳到正文</a>

    <aside class="blog-rail">
      <BlogSidebar
        :theme="theme"
        :collapsed="sidebarCollapsed"
        @set-theme="setTheme"
        @collapse="sidebarCollapsed = true"
        @expand="sidebarCollapsed = false"
      />
    </aside>

    <!-- 右侧 2×2 卡片网格：Header + 回到顶部按钮 / Content + 外置 1:1 自定义滚动条 -->
    <div class="blog-workspace">
      <header class="blog-topbar">
        <div class="blog-topbar-left">
          <button
            ref="menuTrigger"
            type="button"
            class="blog-icon-btn blog-mobile-trigger"
            aria-label="打开站点导航"
            aria-controls="blog-drawer"
            :aria-expanded="menuOpen"
            @click="openMenu"
          >
            <PanelLeftOpen :size="17" :stroke-width="1.75" aria-hidden="true" />
          </button>

          <nav class="blog-breadcrumb" aria-label="当前位置">
            <NuxtLink to="/" class="blog-breadcrumb-root">{{ siteConfig.name }}</NuxtLink>
            <span class="blog-breadcrumb-sep" aria-hidden="true">/</span>
            <template v-if="breadcrumb.parent">
              <NuxtLink :to="breadcrumb.parent.to" class="blog-breadcrumb-root">{{ breadcrumb.parent.label }}</NuxtLink>
              <span class="blog-breadcrumb-sep" aria-hidden="true">/</span>
            </template>
            <span class="blog-breadcrumb-current">{{ breadcrumb.current }}</span>
          </nav>
        </div>

        <div class="blog-topbar-right">
          <!-- 独立 FPS 实时帧率胶囊（配专属仪表盘图标） -->
          <div
            v-if="hasTelemetry && telemetry.fps.supported"
            class="blog-telemetry-pill blog-telemetry-fps"
            :title="telemetry.fps.detail"
            aria-label="页面实时帧率"
          >
            <Gauge
              :size="13"
              :stroke-width="1.8"
              class="blog-fps-icon"
              :class="{
                'is-warn': (telemetry.fps.value ?? 60) < 50 && (telemetry.fps.value ?? 60) >= 30,
                'is-low': (telemetry.fps.value ?? 60) < 30
              }"
              aria-hidden="true"
            />
            <strong class="blog-fps-num">{{ telemetry.fps.value ?? 60 }}</strong>
            <span class="blog-fps-unit">FPS</span>
          </div>

          <!-- 独立内存数值胶囊 -->
          <div
            v-if="hasTelemetry && telemetry.memory.supported"
            class="blog-telemetry-pill blog-telemetry-mem"
            :title="telemetry.memory.detail"
            aria-label="页面内存占用"
          >
            <MemoryStick :size="12.5" :stroke-width="1.75" aria-hidden="true" />
            <span>{{ telemetry.memory.label }}</span>
          </div>

          <form class="blog-header-search" role="search" aria-label="站内搜索" @submit.prevent="submitHeaderSearch">
            <Search :size="14" :stroke-width="1.75" class="blog-header-search-icon" aria-hidden="true" />
            <input
              v-model="headerQuery"
              type="search"
              placeholder="搜索文章、标签…"
              aria-label="搜索文章或标签"
            >
            <button
              v-if="headerQuery"
              type="button"
              class="blog-header-search-clear"
              aria-label="清空搜索"
              @click="clearHeaderSearch"
            >
              <X :size="13" aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      <!-- Header 右侧独立圆形「回到顶部」按钮卡片（带实时紫色阅读进度环） -->
      <button
        type="button"
        class="blog-top-btn"
        :class="{ 'is-scrolled': isScrolled }"
        :title="isScrolled ? `回到顶部（已阅读 ${scrollPercent}%）` : '回到顶部'"
        aria-label="回到顶部"
        @click="scrollToTop"
      >
        <svg class="blog-top-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="blog-top-ring-track" cx="22" cy="22" :r="RING_RADIUS" />
          <circle
            class="blog-top-ring-bar"
            cx="22"
            cy="22"
            :r="RING_RADIUS"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringDashOffset"
          />
        </svg>
        <ArrowUp :size="15.5" :stroke-width="1.9" class="blog-top-arrow" aria-hidden="true" />
      </button>

      <!-- 独立 Content 卡片（隐藏原生滚动条，由右侧外置轨道 1:1 映射） -->
      <div
        ref="sheet"
        class="blog-sheet"
        :class="{ 'is-dragging': isDragging }"
        @scroll.passive="syncScrollbar"
      >
        <!-- 仅作用于内容区域正中央的转圈加载遮罩（零布局占位） -->
        <div class="blog-sheet-spinner-anchor" aria-hidden="true">
          <Transition name="loader-fade">
            <div
              v-if="contentLoading"
              class="blog-sheet-spinner-overlay"
              role="status"
              aria-label="内容加载中"
            >
              <span class="app-loader-ring" />
            </div>
          </Transition>
        </div>

        <main id="blog-main" ref="contentEl" tabindex="-1" class="blog-content">
          <slot />
        </main>
      </div>

      <!-- Content 右侧独立 1:1 外置自定义滚动条卡片（支持滚轮与触控板滚动手势） -->
      <div
        class="blog-scroll-rail"
        :class="{ 'is-inactive': !canScroll, 'is-active-scroll': isScrolled || isDragging }"
        aria-hidden="true"
        @wheel="onRailWheel"
      >
        <div ref="scrollTrack" class="blog-scroll-track" @pointerdown="onTrackPointerDown">
          <div class="blog-scroll-guide">
            <div class="blog-scroll-fill" :style="fillStyle" />
          </div>
          <div
            class="blog-scroll-thumb"
            :class="{ 'is-dragging': isDragging }"
            :style="thumbStyle"
            @pointerdown="onThumbPointerDown"
            @pointermove="onThumbPointerMove"
            @pointerup="onThumbPointerUp"
            @pointercancel="onThumbPointerUp"
          >
            <span class="blog-scroll-grip" aria-hidden="true" />
          </div>
        </div>
        <span class="blog-scroll-percent">{{ canScroll ? `${scrollPercent}%` : '—' }}</span>
      </div>
    </div>

    <dialog id="blog-drawer" ref="drawer" class="blog-drawer" aria-label="站点侧栏" @click.self="closeMenu" @close="menuOpen = false">
      <BlogSidebar :theme="theme" mobile @set-theme="setTheme" @navigate="closeMenu" @close="closeMenu" />
    </dialog>
  </div>
</template>
