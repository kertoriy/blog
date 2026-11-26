const ARTICLE_READS_KEY = 'ker-blog-article-reads'
const SITE_VISITS_KEY = 'ker-blog-site-visits'

function hashString(input: string): number {
  let acc = 0
  for (let i = 0; i < input.length; i++) {
    acc = (acc * 31 + input.charCodeAt(i)) % 1000003
  }
  return acc
}

function getBaseArticleReads(slug: string): number {
  const seed = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return 1180 + (seed % 920)
}

function getBaseSiteVisits(url: string): number {
  return 68 + (hashString(url) % 240)
}

function readStoredMap(key: string): Record<string, number> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const result: Record<string, number> = {}
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
          result[k] = Math.floor(v)
        }
      }
      return result
    }
  }
  catch {
    // 隐私模式或存储受限时静默回退
  }
  return {}
}

function writeStoredMap(key: string, data: Record<string, number>) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  }
  catch {
    // 忽略本地写入受限
  }
}

let hydrated = false

export function useContentMetrics() {
  const articleDeltas = useState<Record<string, number>>('ker-article-read-deltas', () => ({}))
  const siteDeltas = useState<Record<string, number>>('ker-site-visit-deltas', () => ({}))

  function ensureHydrated() {
    if (!import.meta.client || hydrated) return
    hydrated = true
    articleDeltas.value = readStoredMap(ARTICLE_READS_KEY)
    siteDeltas.value = readStoredMap(SITE_VISITS_KEY)
  }

  onMounted(() => {
    ensureHydrated()
  })

  function getArticleReads(slug: string): number {
    return getBaseArticleReads(slug) + (articleDeltas.value[slug] ?? 0)
  }

  function recordArticleRead(slug: string) {
    if (!slug || !import.meta.client) return
    ensureHydrated()
    const next = {
      ...articleDeltas.value,
      [slug]: (articleDeltas.value[slug] ?? 0) + 1
    }
    articleDeltas.value = next
    writeStoredMap(ARTICLE_READS_KEY, next)
  }

  function getSiteVisits(url: string): number {
    return getBaseSiteVisits(url) + (siteDeltas.value[url] ?? 0)
  }

  function recordSiteVisit(url: string) {
    if (!url || !import.meta.client) return
    ensureHydrated()
    const next = {
      ...siteDeltas.value,
      [url]: (siteDeltas.value[url] ?? 0) + 1
    }
    siteDeltas.value = next
    writeStoredMap(SITE_VISITS_KEY, next)
  }

  return {
    getArticleReads,
    recordArticleRead,
    getSiteVisits,
    recordSiteVisit
  }
}
