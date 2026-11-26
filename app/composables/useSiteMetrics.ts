import { siteConfig } from '~/utils/content'

export interface UptimeSnapshot {
  days: number
  hours: number
  minutes: number
  seconds: number
}

let metricsTimer: ReturnType<typeof setInterval> | undefined
let viewsCounted = false

export function useSiteMetrics() {
  const uptime = useState<UptimeSnapshot>('ker-site-uptime', () => ({ days: 0, hours: 0, minutes: 0, seconds: 0 }))
  const views = useState<number>('ker-site-views', () => siteConfig.baseViews)
  const visitors = useState<number>('ker-site-visitors', () => siteConfig.baseVisitors)
  const ready = useState<boolean>('ker-site-metrics-ready', () => false)

  function updateUptime() {
    const start = new Date(siteConfig.launchedAt).getTime()
    const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000))
    const days = Math.floor(diffSec / 86400)
    const hours = Math.floor((diffSec % 86400) / 3600)
    const minutes = Math.floor((diffSec % 3600) / 60)
    const seconds = diffSec % 60
    uptime.value = { days, hours, minutes, seconds }
  }

  onMounted(() => {
    updateUptime()
    ready.value = true

    if (!viewsCounted) {
      viewsCounted = true
      try {
        const viewKey = 'ker-blog-local-views'
        const visitorKey = 'ker-blog-local-visitor'
        const prevViews = Number(localStorage.getItem(viewKey) || '0')
        const nextViews = prevViews + 1
        localStorage.setItem(viewKey, String(nextViews))
        views.value = siteConfig.baseViews + nextViews

        const isKnownVisitor = localStorage.getItem(visitorKey) === '1'
        if (!isKnownVisitor) {
          localStorage.setItem(visitorKey, '1')
        }
        visitors.value = siteConfig.baseVisitors + 1
      }
      catch {
        // 隐私模式下忽略本地计数
      }
    }

    if (!metricsTimer) {
      metricsTimer = setInterval(updateUptime, 1000)
    }
  })

  return {
    uptime: readonly(uptime),
    views: readonly(views),
    visitors: readonly(visitors),
    ready: readonly(ready)
  }
}
