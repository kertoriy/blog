interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number
}

export interface TelemetryItem {
  supported: boolean
  label: string
  detail: string
  value?: number
}

export interface BrowserTelemetry {
  fps: TelemetryItem
  memory: TelemetryItem
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function useBrowserMemory() {
  const telemetry = ref<BrowserTelemetry>({
    fps: { supported: false, label: '', detail: '', value: 60 },
    memory: { supported: false, label: '', detail: '' }
  })

  let rafId = 0
  let intervalId: ReturnType<typeof setInterval> | undefined

  function sampleMemory(): TelemetryItem {
    if (!import.meta.client) {
      return { supported: false, label: '', detail: '' }
    }

    const perf = performance as ExtendedPerformance
    const nav = navigator as ExtendedNavigator
    const heap = perf.memory
    const deviceRam = nav.deviceMemory

    if (heap && heap.usedJSHeapSize > 0) {
      const usedMB = heap.usedJSHeapSize / (1024 * 1024)
      const used = `${usedMB.toFixed(1)} MB`
      const total = formatMB(heap.totalJSHeapSize)
      const limitGB = (heap.jsHeapSizeLimit / (1024 * 1024 * 1024)).toFixed(1)
      const deviceText = deviceRam ? ` · 设备内存约 ${deviceRam} GB` : ''

      return {
        supported: true,
        label: used,
        value: Number(usedMB.toFixed(1)),
        detail: `页面 JS 堆内存：已用 ${used} / 已分配 ${total}，上限 ${limitGB} GB${deviceText}`
      }
    }

    return {
      supported: false,
      label: '',
      detail: '当前浏览器未开放 JS 堆内存数值接口'
    }
  }

  onMounted(() => {
    let frameCount = 0
    let windowStart = performance.now()
    let smoothFps = 60

    function tick() {
      frameCount++
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    const updateMetrics = () => {
      const now = performance.now()
      const elapsed = now - windowStart
      if (elapsed >= 250) {
        const rawFps = Math.min(240, (frameCount * 1000) / elapsed)
        smoothFps = Math.round(smoothFps * 0.35 + rawFps * 0.65)
        frameCount = 0
        windowStart = now
      }

      const fps = Math.max(1, smoothFps)
      const frameMs = (1000 / fps).toFixed(1)

      telemetry.value = {
        fps: {
          supported: true,
          label: `${fps} FPS`,
          value: fps,
          detail: `当前页面实时渲染帧率：${fps} FPS（约 ${frameMs} ms / 帧）`
        },
        memory: sampleMemory()
      }
    }

    telemetry.value = {
      fps: {
        supported: true,
        label: '60 FPS',
        value: 60,
        detail: '当前页面实时渲染帧率（采样中…）'
      },
      memory: sampleMemory()
    }

    intervalId = setInterval(updateMetrics, 700)
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    if (intervalId) clearInterval(intervalId)
  })

  const hasTelemetry = computed(() =>
    telemetry.value.fps.supported || telemetry.value.memory.supported
  )

  return {
    telemetry: readonly(telemetry),
    memory: computed(() => telemetry.value.memory),
    hasTelemetry
  }
}
