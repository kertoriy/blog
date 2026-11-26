<script setup lang="ts">
import type { Component } from 'vue'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Gamepad2,
  Globe2,
  Headphones,
  Keyboard,
  Laptop,
  List,
  Mail,
  MessageCircle,
  Mic,
  Monitor,
  Mouse,
  Server,
  Smartphone,
  Tv
} from 'lucide-vue-next'
import {
  aboutDeskImage,
  aboutDevices,
  aboutFutureStatus,
  aboutGames,
  aboutModels,
  aboutPersonality,
  aboutProfile,
  aboutSocials,
  aboutTechs,
  aboutTools,
  siteConfig
} from '~/utils/content'
import '~/assets/css/blog-about.css'

useSeoMeta({
  title: '关于 · kertoriy 的研发空间',
  description: '关于 Kertoriy：2002 年出生、2020 开始写代码，涵盖开发设备、喜欢的技术、喜欢的工具、钟爱的模型、喜欢的游戏、INTP 性格以及联系方式。'
})

const baseURL = useRuntimeConfig().app.baseURL

const aboutPageRef = ref<HTMLElement | null>(null)
const tocWrapRef = ref<HTMLElement | null>(null)
const tocOpen = ref(false)
const activeChapterId = ref('about-intro')

const aboutChapters = [
  { id: 'about-intro', index: '01', label: '个人档案' },
  { id: 'about-devices', index: '02', label: '开发 の 设备' },
  { id: 'about-tech', index: '03', label: '喜欢 の 技术' },
  { id: 'about-tools', index: '04', label: '喜欢 の 工具' },
  { id: 'about-models', index: '05', label: '钟爱 の 模型' },
  { id: 'about-games', index: '06', label: '喜欢 の 游戏' },
  { id: 'about-personality', index: '07', label: '性格 · INTP' },
  { id: 'about-future', index: '08', label: '成就 & 未来' },
  { id: 'about-social', index: '09', label: '联系方式' }
] as const

const activeChapter = computed(() =>
  aboutChapters.find(item => item.id === activeChapterId.value) ?? aboutChapters[0]
)

const copiedSocial = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | undefined
let sectionObserver: IntersectionObserver | undefined

const deviceIconMap: Record<string, Component> = {
  laptop: Laptop,
  server: Server,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  gamepad: Gamepad2,
  mic: Mic,
  headphones: Headphones,
  smartphone: Smartphone
}

const activeDeviceId = ref(aboutDevices[0]?.id ?? '')

const activeDevice = computed(() =>
  aboutDevices.find(item => item.id === activeDeviceId.value) ?? aboutDevices[0]
)

function selectDevice(id: string) {
  activeDeviceId.value = id
}

function stepDevice(delta: number) {
  const total = aboutDevices.length
  if (!total) return
  const currentIndex = aboutDevices.findIndex(item => item.id === activeDeviceId.value)
  const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + delta + total) % total
  const target = aboutDevices[nextIndex]
  if (target) selectDevice(target.id)
}

function getPinAlignClass(x: number) {
  if (x < 20) return 'is-left'
  if (x > 82) return 'is-right'
  return ''
}

const socialIconMap: Record<string, Component> = {
  mail: Mail,
  message: MessageCircle,
  tv: Tv,
  globe: Globe2
}

const portraitSrc = computed(() => `${baseURL}${siteConfig.heroImage.replace(/^\//, '')}`)
const logoSrc = computed(() => `${baseURL}logo.svg`)

function resolveAsset(path: string) {
  return /^https?:\/\//.test(path) ? path : `${baseURL}${path.replace(/^\//, '')}`
}

function jumpToChapter(id: string) {
  tocOpen.value = false
  if (!import.meta.client) return
  activeChapterId.value = id
  const target = document.getElementById(id)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleDocumentClick(event: MouseEvent) {
  if (!tocOpen.value) return
  const target = event.target as Node | null
  if (target && tocWrapRef.value && !tocWrapRef.value.contains(target)) {
    tocOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && tocOpen.value) {
    tocOpen.value = false
  }
}

async function copySocialValue(key: string, value: string) {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(value)
    copiedSocial.value = key
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      if (copiedSocial.value === key) copiedSocial.value = null
    }, 1800)
  }
  catch {
    // 忽略剪贴板权限拒绝
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleKeydown)

  const pageEl = aboutPageRef.value
  if (pageEl && 'IntersectionObserver' in window) {
    const scrollRoot = pageEl.closest('.blog-sheet') as HTMLElement | null
    sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            activeChapterId.value = entry.target.id
          }
        }
      },
      { root: scrollRoot, threshold: 0.55 }
    )
    pageEl.querySelectorAll<HTMLElement>('section[id]').forEach(sec => sectionObserver?.observe(sec))
  }
})

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
  sectionObserver?.disconnect()
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="aboutPageRef" class="about-page">
    <!-- 零占位吸顶章节目录胶囊（随时查看当前章节并一键直达任意一屏） -->
    <div class="about-sticky-toc" aria-label="关于页面目录">
      <div ref="tocWrapRef" class="about-toc-inner">
        <button
          type="button"
          class="about-toc-trigger"
          :class="{ 'is-open': tocOpen }"
          :aria-expanded="tocOpen"
          aria-controls="about-toc-menu"
          @click="tocOpen = !tocOpen"
        >
          <i class="about-toc-dot" aria-hidden="true" />
          <span class="about-toc-current">{{ activeChapter.label }}</span>
          <span class="about-toc-sep" aria-hidden="true" />
          <List :size="13.5" :stroke-width="1.9" aria-hidden="true" />
          <span>目录</span>
        </button>

        <Transition name="about-toc-fade">
          <nav
            v-if="tocOpen"
            id="about-toc-menu"
            class="about-toc-popover"
            aria-label="章节跳转"
          >
            <button
              v-for="chapter in aboutChapters"
              :key="chapter.id"
              type="button"
              class="about-toc-item"
              :class="{ 'is-active': activeChapterId === chapter.id }"
              @click="jumpToChapter(chapter.id)"
            >
              <span class="about-toc-index">{{ chapter.index }}</span>
              <span class="about-toc-label">{{ chapter.label }}</span>
            </button>
          </nav>
        </Transition>
      </div>
    </div>

    <!-- Scene 0：关于页沉浸开场（去背景图，自上而下居中对称排布） -->
    <section id="about-intro" class="about-scene about-scene-intro" aria-label="关于博主">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-dots" />
        <span class="about-scene-watermark">KERTORIY</span>
      </div>

      <div class="about-hero-body">
        <div class="about-hero-avatar">
          <img :src="portraitSrc" :alt="siteConfig.brand" loading="lazy">
          <span class="about-hero-seal" aria-hidden="true">
            <img :src="logoSrc" alt="">
          </span>
        </div>

        <span class="about-hero-eyebrow">
          <i aria-hidden="true" />
          ABOUT ME · 个人档案
        </span>

        <h1 class="about-hero-heading">{{ aboutProfile.greeting }}</h1>

        <p class="about-hero-lead">{{ aboutProfile.tagline }}</p>

        <div class="about-hero-metrics" aria-label="个人信息">
          <div class="about-hero-metric">
            <strong>{{ aboutProfile.birthYear }}</strong>
            <span>年出生</span>
          </div>
          <div class="about-hero-metric">
            <strong>{{ aboutProfile.codingSince }}</strong>
            <span>开始写代码</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Scene 1：开发 の 设备（交互式桌面全览 + 实时设备详情 + 8 设备快捷切换） -->
    <section id="about-devices" class="about-scene" aria-labelledby="about-devices-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-dots" />
        <span class="about-scene-watermark">DEVICES</span>
      </div>

      <div class="about-devices-stage">
        <div class="about-devices-header">
          <h2 id="about-devices-title" class="about-editorial-title">开发 の 设备</h2>
          <p class="about-devices-sub">
            双主机与双屏桌搭全览，点击桌面标记查看对应配置与分工。
          </p>
        </div>

        <div class="about-desk-stage">
          <!-- 左侧：可交互研发桌面图 + 设备坐标热点 -->
          <div class="about-desk-canvas">
            <img
              :src="resolveAsset(aboutDeskImage)"
              alt="Kertoriy 研发桌面全览"
              class="about-desk-photo"
              loading="lazy"
            >

            <button
              v-for="item in aboutDevices"
              :key="item.id"
              type="button"
              class="about-desk-pin"
              :class="[
                { 'is-active': activeDeviceId === item.id },
                getPinAlignClass(item.deskPos.x)
              ]"
              :style="{ left: `${item.deskPos.x}%`, top: `${item.deskPos.y}%` }"
              :aria-label="`查看 ${item.name}`"
              :aria-pressed="activeDeviceId === item.id"
              @click="selectDevice(item.id)"
            >
              <span class="about-desk-pin-dot">
                <component :is="deviceIconMap[item.icon]" :size="13" :stroke-width="2" aria-hidden="true" />
              </span>
              <span class="about-desk-pin-label">{{ item.shortName }}</span>
            </button>
          </div>

          <!-- 右侧：当前选中设备的棚拍图与纯文字描述 -->
          <div class="about-desk-inspector" aria-live="polite">
            <Transition name="about-device-swap" mode="out-in">
              <article v-if="activeDevice" :key="activeDevice.id" class="about-device-spotlight">
                <div class="about-device-media">
                  <img :src="resolveAsset(activeDevice.image)" :alt="activeDevice.name" loading="lazy">
                </div>

                <div class="about-device-body">
                  <div class="about-device-title-row">
                    <h3 class="about-device-name">{{ activeDevice.name }}</h3>
                    <span class="about-device-role">
                      <component :is="deviceIconMap[activeDevice.icon]" :size="12" :stroke-width="1.8" aria-hidden="true" />
                      {{ activeDevice.role }}
                    </span>
                  </div>

                  <p class="about-device-desc">{{ activeDevice.desc }}</p>
                </div>
              </article>
            </Transition>
          </div>
        </div>

        <!-- 底部：极简圆点轮播指示器 + 左右切换箭头 -->
        <div class="about-desk-carousel" role="region" aria-label="切换桌面设备">
          <button
            type="button"
            class="about-carousel-nav"
            aria-label="上一个设备"
            @click="stepDevice(-1)"
          >
            <ChevronLeft :size="15" :stroke-width="2" aria-hidden="true" />
          </button>

          <div class="about-carousel-dots" role="tablist" aria-label="设备切换指示点">
            <button
              v-for="item in aboutDevices"
              :key="item.id"
              type="button"
              role="tab"
              class="about-carousel-dot"
              :class="{ 'is-active': activeDeviceId === item.id }"
              :aria-label="item.name"
              :aria-selected="activeDeviceId === item.id"
              @click="selectDevice(item.id)"
            >
              <span class="about-carousel-dot-pill" aria-hidden="true" />
              <span class="about-carousel-dot-tip" aria-hidden="true">{{ item.shortName }}</span>
            </button>
          </div>

          <button
            type="button"
            class="about-carousel-nav"
            aria-label="下一个设备"
            @click="stepDevice(1)"
          >
            <ChevronRight :size="15" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <!-- Scene 2：喜欢 の 技术（自上而下居中 + 11 项 4+4+3 对称矩阵，数据库拆分独立展示） -->
    <section id="about-tech" class="about-scene" aria-labelledby="about-tech-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-watermark">STACK</span>
      </div>

      <div class="about-tech-stage">
        <div class="about-devices-header">
          <h2 id="about-tech-title" class="about-editorial-title">喜欢 の 技术</h2>
          <p class="about-devices-sub">
            从后端业务、前端界面到移动端、数据库中间件与容器运维，都是日常真正写得顺手的工具。
          </p>
        </div>

        <div class="about-tech-grid">
          <article v-for="tech in aboutTechs" :key="tech.name" class="about-tech-item">
            <span class="about-tech-logo" aria-hidden="true">
              <img
                :src="resolveAsset(tech.logo)"
                :alt="tech.name"
                loading="lazy"
                :class="{ 'is-invert-dark': tech.invertDark }"
              >
            </span>
            <div class="about-tech-info">
              <h3 class="about-tech-name">{{ tech.name }}</h3>
              <p class="about-tech-note">{{ tech.note }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Scene 3：喜欢 の 工具（Codex / ClaudeCode / Cursor / Antigravity / VsCode） -->
    <section id="about-tools" class="about-scene" aria-labelledby="about-tools-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-dots" />
        <span class="about-scene-watermark">TOOLS</span>
      </div>

      <div class="about-tech-stage">
        <div class="about-devices-header">
          <h2 id="about-tools-title" class="about-editorial-title">喜欢 の 工具</h2>
          <p class="about-devices-sub">
            顺手的编辑器与 AI 编程智能体协同工作，把重复劳动交给工具，把时间留给架构与细节。
          </p>
        </div>

        <div class="about-tech-grid is-tools">
          <article v-for="tool in aboutTools" :key="tool.name" class="about-tech-item">
            <span class="about-tech-logo" aria-hidden="true">
              <img
                :src="resolveAsset(tool.logo)"
                :alt="tool.name"
                loading="lazy"
                :class="{ 'is-invert-dark': tool.invertDark }"
              >
            </span>
            <div class="about-tech-info">
              <h3 class="about-tech-name">{{ tool.name }}</h3>
              <p class="about-tech-note">{{ tool.note }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Scene 4：钟爱 の 模型（Claude / Gemini / ChatGPT / DeepSeek） -->
    <section id="about-models" class="about-scene" aria-labelledby="about-models-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-watermark">MODELS</span>
      </div>

      <div class="about-tech-stage">
        <div class="about-devices-header">
          <h2 id="about-models-title" class="about-editorial-title">钟爱 の 模型</h2>
          <p class="about-devices-sub">
            不同模型各有锋芒——写代码、看设计、理思路、聊创意，按场景切换最合拍的思考伙伴。
          </p>
        </div>

        <div class="about-tech-grid is-models">
          <article v-for="model in aboutModels" :key="model.name" class="about-tech-item">
            <span class="about-tech-logo" aria-hidden="true">
              <img
                :src="resolveAsset(model.logo)"
                :alt="model.name"
                loading="lazy"
                :class="{ 'is-invert-dark': model.invertDark }"
              >
            </span>
            <div class="about-tech-info">
              <h3 class="about-tech-name">{{ model.name }}</h3>
              <p class="about-tech-note">{{ model.note }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Scene 5：喜欢 の 游戏（自上而下居中 + 无框场景展陈） -->
    <section id="about-games" class="about-scene" aria-labelledby="about-games-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-dots" />
        <span class="about-scene-watermark">GAMES</span>
      </div>

      <div class="about-devices-stage">
        <div class="about-devices-header">
          <h2 id="about-games-title" class="about-editorial-title">喜欢 の 游戏</h2>
          <p class="about-devices-sub">
            写代码之余的放松片刻——漫步提瓦特的山水与灯火，在原声里慢下来。
          </p>
        </div>

        <div class="about-games-grid">
          <article v-for="game in aboutGames" :key="game.name" class="about-game-item">
            <div class="about-game-media">
              <img :src="resolveAsset(game.image)" :alt="game.name" loading="lazy">
            </div>

            <div class="about-device-body">
              <div class="about-device-title-row">
                <h3 class="about-device-name">{{ game.name }}</h3>
                <span class="about-device-role">
                  <Gamepad2 :size="12" :stroke-width="1.8" aria-hidden="true" />
                  {{ game.genre }}
                </span>
              </div>
              <p class="about-device-desc">{{ game.desc }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Scene 6：性格 · INTP（左 INTP 逻辑学家小人 + 右极简四行拆解） -->
    <section id="about-personality" class="about-scene" aria-labelledby="about-personality-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-left" />
        <span class="about-scene-dots" />
        <span class="about-scene-watermark">INTP</span>
      </div>

      <div class="about-intp-stage">
        <div class="about-intp-mascot-wrap">
          <img
            :src="resolveAsset(aboutPersonality.mascot)"
            alt="INTP 逻辑学家小人"
            loading="lazy"
            class="about-intp-mascot"
          >
        </div>

        <div class="about-intp-content">
          <div class="about-intp-title-row">
            <h2 id="about-personality-title" class="about-mbti-big">{{ aboutPersonality.mbti }}</h2>
            <span class="about-mbti-archetype">{{ aboutPersonality.archetype }}</span>
          </div>

          <p class="about-intp-summary">{{ aboutPersonality.summary }}</p>

          <ul class="about-intp-list">
            <li v-for="dim in aboutPersonality.dimensions" :key="dim.letter" class="about-intp-row">
              <span class="about-intp-letter">{{ dim.letter }}</span>
              <span class="about-intp-title">{{ dim.title }}</span>
              <span class="about-intp-desc">{{ dim.desc }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Scene 7：成就 & 未来（极简居中「咸鱼中」留白状态） -->
    <section id="about-future" class="about-scene" aria-labelledby="about-future-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-watermark">CHILLING</span>
      </div>

      <div class="about-chill-stage">
        <span class="about-hero-eyebrow">
          <i aria-hidden="true" />
          {{ aboutFutureStatus.badge }}
        </span>
        <h2 id="about-future-title" class="about-chill-title">{{ aboutFutureStatus.title }}</h2>
        <p class="about-chill-sub">{{ aboutFutureStatus.subtitle }}</p>
      </div>
    </section>

    <!-- Scene 8：联系方式（无卡片纯开放排布，点击任意项直接复制） -->
    <section id="about-social" class="about-scene" aria-labelledby="about-social-title">
      <div class="about-scene-bg" aria-hidden="true">
        <span class="about-scene-aura is-center" />
        <span class="about-scene-watermark">CONTACT</span>
      </div>

      <div class="about-finale-stage">
        <div class="flex flex-col items-center gap-2.5">
          <h2 id="about-social-title" class="about-finale-heading">联系方式</h2>
          <p class="about-finale-desc">
            点击任意一项即可快速复制账号或邮箱，欢迎交流技术、设计与折腾日常。
          </p>
        </div>

        <div class="about-contact-row">
          <button
            v-for="item in aboutSocials"
            :key="item.key"
            type="button"
            class="about-contact-item"
            :class="{ 'is-copied': copiedSocial === item.key }"
            @click="copySocialValue(item.key, item.handle)"
          >
            <span class="about-contact-icon" aria-hidden="true">
              <img
                v-if="item.logo"
                :src="resolveAsset(item.logo)"
                :alt="item.name"
                loading="lazy"
                :class="{ 'is-invert-dark': item.invertDark }"
              >
              <component
                :is="socialIconMap[item.icon ?? 'mail']"
                v-else
                :size="22"
                :stroke-width="1.8"
              />
            </span>

            <span class="about-contact-name">{{ item.name }}</span>
            <span class="about-contact-handle">{{ item.handle }}</span>
            <span class="about-contact-state">
              <Check v-if="copiedSocial === item.key" :size="11.5" aria-hidden="true" />
              <Copy v-else :size="11.5" aria-hidden="true" />
              <span>{{ copiedSocial === item.key ? '已复制' : '点击复制' }}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
