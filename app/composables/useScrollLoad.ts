import type { MaybeRefOrGetter, Ref } from 'vue'

export interface UseScrollLoadOptions {
  /** 首屏默认渲染条数 */
  initialSize?: number
  /** 每次触底追加的条数 */
  step?: number
  /** 提前触发加载的边距 */
  rootMargin?: string
  /** 轻柔加载过渡时长（ms），避免列表瞬间跳变 */
  delayMs?: number
  /** 筛选或排序条件变化时用于自动重置已加载条数 */
  resetKey?: MaybeRefOrGetter<unknown>
}

export function useScrollLoad<T>(
  source: MaybeRefOrGetter<T[]>,
  sentinelRef: Ref<HTMLElement | null>,
  options: UseScrollLoadOptions = {}
) {
  const initialSize = Math.max(1, options.initialSize ?? 6)
  const step = Math.max(1, options.step ?? initialSize)
  const rootMargin = options.rootMargin ?? '140px 0px'
  const delayMs = options.delayMs ?? 180

  const visibleCount = ref(initialSize)
  const isLoadingMore = ref(false)

  const totalCount = computed(() => toValue(source).length)
  const visibleItems = computed(() => toValue(source).slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < totalCount.value)

  let observer: IntersectionObserver | undefined
  let activeScrollRoot: HTMLElement | null = null
  let mobileQuery: MediaQueryList | undefined
  let loadTimer: ReturnType<typeof setTimeout> | undefined
  let rafId = 0

  function clearPendingLoad() {
    if (loadTimer) {
      clearTimeout(loadTimer)
      loadTimer = undefined
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    isLoadingMore.value = false
  }

  function resolveScrollRoot(el: HTMLElement | null): HTMLElement | null {
    if (!el || !import.meta.client) return null
    const sheet = el.closest('.blog-sheet') as HTMLElement | null
    if (!sheet) return null
    const overflowY = window.getComputedStyle(sheet).overflowY
    return overflowY === 'auto' || overflowY === 'scroll' ? sheet : null
  }

  function isSentinelNearViewport(): boolean {
    const el = sentinelRef.value
    if (!el || !import.meta.client) return false
    const rect = el.getBoundingClientRect()
    const threshold = 140
    if (activeScrollRoot) {
      const rootRect = activeScrollRoot.getBoundingClientRect()
      return rect.top <= rootRect.bottom + threshold && rect.bottom >= rootRect.top - threshold
    }
    return rect.top <= window.innerHeight + threshold && rect.bottom >= -threshold
  }

  function loadMore() {
    if (!hasMore.value || isLoadingMore.value) return
    isLoadingMore.value = true

    const prefersReducedMotion = import.meta.client
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const wait = prefersReducedMotion ? 0 : delayMs

    loadTimer = setTimeout(async () => {
      loadTimer = undefined
      visibleCount.value = Math.min(totalCount.value, visibleCount.value + step)
      isLoadingMore.value = false

      await nextTick()
      if (hasMore.value && isSentinelNearViewport()) {
        rafId = requestAnimationFrame(() => {
          rafId = 0
          if (hasMore.value && isSentinelNearViewport()) {
            loadMore()
          }
        })
      }
    }, wait)
  }

  function handleScrollFallback() {
    if (!hasMore.value || isLoadingMore.value || rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (hasMore.value && isSentinelNearViewport()) {
        loadMore()
      }
    })
  }

  function teardownObserver() {
    observer?.disconnect()
    observer = undefined
    if (activeScrollRoot) {
      activeScrollRoot.removeEventListener('scroll', handleScrollFallback)
      activeScrollRoot = null
    }
    if (import.meta.client) {
      window.removeEventListener('scroll', handleScrollFallback)
    }
  }

  function setupObserver() {
    teardownObserver()
    const el = sentinelRef.value
    if (!el || !import.meta.client) return

    activeScrollRoot = resolveScrollRoot(el)

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some(entry => entry.isIntersecting)) {
            loadMore()
          }
        },
        {
          root: activeScrollRoot,
          rootMargin
        }
      )
      observer.observe(el)
    }

    if (activeScrollRoot) {
      activeScrollRoot.addEventListener('scroll', handleScrollFallback, { passive: true })
    }
    else {
      window.addEventListener('scroll', handleScrollFallback, { passive: true })
    }
  }

  function reset() {
    clearPendingLoad()
    visibleCount.value = initialSize
  }

  if (options.resetKey !== undefined) {
    watch(() => toValue(options.resetKey), () => {
      reset()
    })
  }

  watch(sentinelRef, () => {
    setupObserver()
  })

  watch(hasMore, async (more) => {
    if (more) {
      await nextTick()
      setupObserver()
    }
  })

  onMounted(() => {
    setupObserver()
    mobileQuery = window.matchMedia('(width < 52rem)')
    mobileQuery.addEventListener('change', setupObserver)
  })

  onBeforeUnmount(() => {
    clearPendingLoad()
    teardownObserver()
    mobileQuery?.removeEventListener('change', setupObserver)
  })

  return {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    isLoadingMore,
    loadMore,
    reset
  }
}
