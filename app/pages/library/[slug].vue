<script setup lang="ts">
import {
  CalendarDays,
  Check,
  Clock3,
  CornerDownRight,
  Eye,
  FileText,
  Headphones,
  ListTree,
  Pause,
  Play,
  Share2,
  X
} from 'lucide-vue-next'
import { siteConfig } from '~/utils/content'
import { getArticleBySlug, articles } from '~/utils/articles'
import '~/assets/css/article-reader.css'

const route = useRoute()
const baseURL = useRuntimeConfig().app.baseURL
const { getArticleReads, recordArticleRead } = useContentMetrics()

const article = computed(() => getArticleBySlug(String(route.params.slug ?? '')))
const currentIndex = computed(() => articles.findIndex(item => item.slug === article.value.slug))
const prevArticle = computed(() => (currentIndex.value > 0 ? articles[currentIndex.value - 1] ?? null : null))
const nextArticle = computed(() => (currentIndex.value >= 0 && currentIndex.value < articles.length - 1 ? articles[currentIndex.value + 1] ?? null : null))

const logoSrc = `${baseURL}logo.svg`
const coverSrc = computed(() => {
  const cover = article.value.cover
  if (!cover) return `${baseURL}blog-desk.webp`
  return /^https?:\/\//.test(cover) ? cover : `${baseURL}${cover.replace(/^\//, '')}`
})

// 文章实时累计阅读次数（每次打开正文自动累计并持久化）
const articleReads = computed(() => getArticleReads(article.value.slug))

const copied = ref(false)
const tocOpen = ref(false)
const isSpeaking = ref(false)
const pastHero = ref(false)
const heroEl = useTemplateRef<HTMLElement>('heroEl')

let scrollRootEl: Element | null = null

function updateHeroSticky() {
  const hero = heroEl.value
  if (!hero) return
  const rootTop = scrollRootEl ? scrollRootEl.getBoundingClientRect().top : 0
  pastHero.value = hero.getBoundingClientRect().bottom <= rootTop + 84
}

onMounted(() => {
  recordArticleRead(article.value.slug)
  if (!heroEl.value) return
  scrollRootEl = heroEl.value.closest('.blog-sheet')
  scrollRootEl?.addEventListener('scroll', updateHeroSticky, { passive: true })
  window.addEventListener('scroll', updateHeroSticky, { passive: true })
  updateHeroSticky()
})

onActivated(() => {
  updateHeroSticky()
})

onDeactivated(() => {
  tocOpen.value = false
  stopSpeech()
})

const waveBars = [
  { h: '5px', d: '0ms' },
  { h: '9px', d: '120ms' },
  { h: '12px', d: '240ms' },
  { h: '7px', d: '90ms' },
  { h: '13px', d: '180ms' },
  { h: '8px', d: '300ms' },
  { h: '11px', d: '60ms' },
  { h: '6px', d: '210ms' },
  { h: '10px', d: '150ms' }
]

async function shareArticle() {
  if (typeof window === 'undefined') return
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  }
  catch {
    copied.value = false
  }
}

function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
}

function toggleSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (isSpeaking.value) {
    stopSpeech()
    return
  }

  window.speechSynthesis.cancel()
  const plainText = `${article.value.title}。${article.value.summary}。${article.value.body.replace(/[#>*`[\]()\-]/g, ' ').replace(/\s+/g, ' ')}`
  const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 1200))
  utterance.lang = 'zh-CN'
  utterance.rate = 1.02
  utterance.onend = () => {
    isSpeaking.value = false
  }
  utterance.onerror = () => {
    isSpeaking.value = false
  }
  isSpeaking.value = true
  window.speechSynthesis.speak(utterance)
}

watch(() => route.params.slug, () => {
  tocOpen.value = false
  stopSpeech()
  recordArticleRead(article.value.slug)
})

onBeforeUnmount(() => {
  scrollRootEl?.removeEventListener('scroll', updateHeroSticky)
  window.removeEventListener('scroll', updateHeroSticky)
  stopSpeech()
})

useSeoMeta({
  title: () => `${article.value.title} · ${siteConfig.name}`,
  description: () => article.value.summary
})
</script>

<template>
  <article class="article-detail">
    <!-- 吸顶不随正文滚动的「目录」悬浮栏（零占位高度，随滚动自动适配明暗对比度） -->
    <div v-if="article.headings.length" class="article-sticky-nav" :class="{ 'is-stuck': pastHero }">
      <div class="article-hero-top">
        <button
          type="button"
          class="article-glass-nav"
          :aria-expanded="tocOpen"
          aria-label="切换文章目录"
          @click="tocOpen = !tocOpen"
        >
          <ListTree :size="13.5" aria-hidden="true" />
          目录
        </button>
      </div>

      <!-- 浮动目录抽屉（固定跟随悬浮栏，任意阅读位置均可展开） -->
      <nav v-if="tocOpen && article.headings.length" class="article-toc-popover" aria-label="文章目录">
        <div class="article-toc-title">
          <span>文章目录</span>
          <button
            type="button"
            class="grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-muted hover:bg-surface hover:text-ink"
            aria-label="关闭目录"
            @click="tocOpen = false"
          >
            <X :size="13" aria-hidden="true" />
          </button>
        </div>
        <ol class="article-toc-list">
          <li
            v-for="(heading, idx) in article.headings"
            :key="heading.id"
            :class="heading.level === 3 ? 'pl-4' : ''"
          >
            <a :href="`#${heading.id}`" class="article-toc-link" @click="tocOpen = false">
              <span class="font-mono text-[11px] text-ink-muted">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="truncate">{{ heading.text }}</span>
            </a>
          </li>
        </ol>
      </nav>
    </div>

    <!-- 全幅氛围暗幕封面头图（复刻居中标题 + 磨砂元信息胶囊 + 底部柔和弧形过渡） -->
    <header ref="heroEl" class="article-hero">
      <div class="article-hero-bg" aria-hidden="true">
        <img :src="coverSrc" :alt="article.title">
      </div>
      <div class="article-hero-scrim" aria-hidden="true" />

      <div class="article-hero-center">
        <h1 class="article-hero-title">
          {{ article.title }}
        </h1>

        <div class="article-hero-cats">
          <NuxtLink :to="{ path: '/library', query: { q: article.category } }" class="article-hero-cat-link">
            {{ article.category }}
          </NuxtLink>
          <template v-for="tag in article.tags" :key="tag">
            <span class="article-hero-cat-dot" aria-hidden="true">·</span>
            <NuxtLink :to="{ path: '/library', query: { q: tag } }" class="article-hero-cat-link">
              {{ tag }}
            </NuxtLink>
          </template>
        </div>

        <span class="article-hero-divider" aria-hidden="true">
          <CornerDownRight :size="13" :stroke-width="1.7" />
        </span>

        <p class="article-hero-summary">
          {{ article.summary }}
        </p>

        <!-- 底部悬浮暗色磨砂元信息胶囊条 -->
        <div class="article-hero-dock">
          <span class="article-meta-chip article-author-chip">
            <img :src="logoSrc" :alt="siteConfig.brand" class="article-author-avatar" width="20" height="20">
            <span>{{ siteConfig.brand }}</span>
          </span>

          <span class="article-meta-chip" title="发布日期">
            <CalendarDays :size="12.5" aria-hidden="true" />
            <time :datetime="article.date">{{ article.date }}</time>
          </span>

          <span class="article-meta-chip" title="累计阅读次数">
            <Eye :size="12.5" aria-hidden="true" />
            <span>{{ articleReads.toLocaleString() }} 阅读</span>
          </span>

          <span class="article-meta-chip" title="正文约计字数">
            <FileText :size="12.5" aria-hidden="true" />
            <span>{{ article.wordCount.toLocaleString() }} 字</span>
          </span>

          <span class="article-meta-chip" title="预计阅读时长">
            <Clock3 :size="12.5" aria-hidden="true" />
            <span>{{ article.readTime }}</span>
          </span>

          <button
            type="button"
            class="article-dock-btn"
            :title="copied ? '已复制文章链接' : '复制文章链接'"
            aria-label="分享文章链接"
            @click="shareArticle"
          >
            <Check v-if="copied" :size="13" aria-hidden="true" />
            <Share2 v-else :size="13" aria-hidden="true" />
          </button>

          <!-- 语音朗读迷你波形胶囊 -->
          <div class="article-tts-pill" :class="{ 'is-playing': isSpeaking }">
            <Headphones :size="12.5" class="shrink-0 text-white/65" aria-hidden="true" />
            <span class="article-tts-bars" aria-hidden="true">
              <span
                v-for="(bar, idx) in waveBars"
                :key="idx"
                :style="{ '--bar-h': bar.h, '--bar-d': bar.d }"
              />
            </span>
            <button
              type="button"
              class="article-tts-play"
              :title="isSpeaking ? '停止语音朗读' : '语音朗读文章'"
              :aria-label="isSpeaking ? '停止语音朗读' : '语音朗读文章'"
              @click="toggleSpeech"
            >
              <Pause v-if="isSpeaking" :size="12" aria-hidden="true" />
              <Play v-else :size="12" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <!-- 底部柔和上拱弧线，自然衔接正文画布 -->
      <svg class="article-hero-curve" viewBox="0 0 1440 36" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,36 L0,18 Q720,-10 1440,18 L1440,36 Z" />
      </svg>
    </header>

    <ArticleReader :article="article" :prev-article="prevArticle" :next-article="nextArticle" />
  </article>
</template>
