<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { siteLinks, type SiteLinkItem } from '~/utils/content'
import '~/assets/css/blog-sites.css'

useSeoMeta({
  title: '常用网站 · kertoriy 的研发空间',
  description: '个人高频使用的 AI、开发与设计资源导航。'
})

const baseURL = useRuntimeConfig().app.baseURL
const { getSiteVisits, recordSiteVisit } = useContentMetrics()
const activeCategory = ref('全部')
const failedLogos = ref<Record<string, boolean>>({})

const categoryTabs = computed(() => {
  const categories = Array.from(new Set(siteLinks.map(item => item.category)))
  return ['全部', ...categories]
})

const filteredLinks = computed(() => {
  return siteLinks.filter(item => activeCategory.value === '全部' || item.category === activeCategory.value)
})

const groupedLinks = computed(() => {
  const map = new Map<string, SiteLinkItem[]>()
  for (const item of filteredLinks.value) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
})

function resolveLogo(logo: string) {
  if (!logo) return ''
  return /^https?:\/\//.test(logo) ? logo : `${baseURL}${logo.replace(/^\//, '')}`
}

function handleLogoError(url: string) {
  failedLogos.value = { ...failedLogos.value, [url]: true }
}
</script>

<template>
  <div class="sites-page">
    <!-- 顶部控制条：分类 Tab 居中排列 -->
    <div class="sites-toolbar">
      <div class="sites-tabs" role="tablist" aria-label="网站分类筛选">
        <button
          v-for="tab in categoryTabs"
          :key="tab"
          type="button"
          role="tab"
          class="sites-tab"
          :class="{ 'is-active': activeCategory === tab }"
          :aria-selected="activeCategory === tab"
          @click="activeCategory = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- 分组站点卡片列表：仅呈现 Logo + 网站名称 + 描述 -->
    <div v-if="groupedLinks.length" class="sites-groups">
      <section
        v-for="group in groupedLinks"
        :key="group.category"
        class="sites-group"
        :aria-label="group.category"
      >
        <div class="sites-group-head">
          <h2 class="sites-group-pill">
            <i aria-hidden="true" />
            {{ group.category }}
          </h2>
        </div>

        <div class="sites-grid">
          <a
            v-for="item in group.items"
            :key="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="site-card"
            @click="recordSiteVisit(item.url)"
            @auxclick="recordSiteVisit(item.url)"
          >
            <!-- 左侧真实品牌 Logo（支持本地 SVG 或在线图标 URL，失败回退首字母） -->
            <span class="site-logo-box" aria-hidden="true">
              <img
                v-if="item.logo && !failedLogos[item.url]"
                :src="resolveLogo(item.logo)"
                :alt="item.title"
                loading="lazy"
                class="site-logo-img"
                :class="{ 'is-invert-dark': item.invertDark }"
                @error="handleLogoError(item.url)"
              >
              <span v-else class="site-logo-fallback">
                {{ item.title.slice(0, 1).toUpperCase() }}
              </span>
            </span>

            <!-- 右侧：网站名称 + 访问次数 + 描述 -->
            <div class="site-content">
              <div class="site-head-row">
                <h3 class="site-name">{{ item.title }}</h3>
                <span class="site-visits" :title="`累计访问 ${getSiteVisits(item.url)} 次`">
                  <Eye :size="11" aria-hidden="true" />
                  <span>{{ getSiteVisits(item.url) }}</span>
                </span>
              </div>
              <p class="site-desc">{{ item.desc }}</p>
            </div>
          </a>
        </div>
      </section>
    </div>

    <!-- 无数据空状态 -->
    <div v-else class="sites-empty">
      <p class="m-0 text-sm font-medium text-ink">暂无常用网站</p>
      <p class="mt-1 mb-0 text-xs text-ink-muted">在 app/content/sites.json 中添加条目后会自动展示。</p>
    </div>
  </div>
</template>
