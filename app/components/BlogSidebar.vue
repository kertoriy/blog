<script setup lang="ts">
import {
  Archive,
  BookOpen,
  Compass,
  Feather,
  HeartHandshake,
  House,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Trash2,
  X
} from 'lucide-vue-next'
import type { BlogTheme } from '~/composables/useTheme'
import { friends, notes, siteConfig, siteLinks } from '~/utils/content'
import { articles } from '~/utils/articles'

const props = defineProps<{ theme: BlogTheme, mobile?: boolean, collapsed?: boolean }>()
const emit = defineEmits<{ navigate: [], close: [], collapse: [], expand: [], 'set-theme': [theme: BlogTheme] }>()

const route = useRoute()
const baseURL = useRuntimeConfig().app.baseURL
const logoSrc = `${baseURL}logo.svg`

const isCollapsed = computed(() => Boolean(props.collapsed && !props.mobile))

function toggleThemeQuick() {
  emit('set-theme', props.theme === 'dark' ? 'light' : 'dark')
}

const latestYear = articles[0]?.date.slice(0, 4) ?? '2026'

const navItems = [
  { label: '首页', sub: 'Home', meta: '概览', to: '/', icon: House },
  { label: '文库', sub: 'Library', meta: `${articles.length} 篇`, to: '/library', icon: BookOpen },
  { label: '碎碎念', sub: 'Moments', meta: `${notes.length} 条`, to: '/notes', icon: NotebookPen },
  { label: '归档', sub: 'Archive', meta: latestYear, to: '/archive', icon: Archive },
  { label: '常用网站', sub: 'Sites', meta: `${siteLinks.length} 项`, to: '/sites', icon: Compass },
  { label: '友链', sub: 'Friends', meta: `${friends.length} 位`, to: '/friends', icon: HeartHandshake },
  { label: '赛博情绪垃圾桶', sub: 'Mood', meta: '宣泄', to: '/trash', icon: Trash2 },
  { label: '关于', sub: 'About', meta: '简介', to: '/about', icon: Feather }
]

function isActive(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))
}
</script>

<template>
  <div class="blog-sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 精致单行侧栏品牌头 -->
    <div class="blog-rail-header">
      <NuxtLink
        to="/"
        class="blog-brand"
        :title="isCollapsed ? `${siteConfig.brand} · 首页` : undefined"
        :aria-label="`${siteConfig.brand} 首页`"
        @click="$emit('navigate')"
      >
        <img :src="logoSrc" :alt="`${siteConfig.brand} Logo`" class="blog-brand-logo" width="30" height="30">
        <span class="blog-brand-name">{{ siteConfig.brand }}</span>
      </NuxtLink>

      <button
        v-if="!mobile"
        type="button"
        class="blog-icon-btn blog-collapse-btn"
        :title="isCollapsed ? '展开侧栏' : '收起侧栏'"
        :aria-label="isCollapsed ? '展开侧栏' : '收起侧栏'"
        @click="isCollapsed ? $emit('expand') : $emit('collapse')"
      >
        <PanelLeftOpen v-if="isCollapsed" :size="15" :stroke-width="1.75" aria-hidden="true" />
        <PanelLeftClose v-else :size="15" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        v-else
        type="button"
        class="blog-icon-btn"
        aria-label="关闭站点导航"
        autofocus
        @click="$emit('close')"
      >
        <X :size="17" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>

    <nav class="blog-nav-group" aria-label="站点导航">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="blog-nav-item"
        :class="{ 'is-active': isActive(item.to) }"
        :title="isCollapsed ? `${item.label} · ${item.meta}` : undefined"
        :aria-label="item.label"
        @click="$emit('navigate')"
      >
        <span class="blog-nav-icon" aria-hidden="true">
          <span class="blog-nav-icon-core">
            <component :is="item.icon" :size="13.5" :stroke-width="1.85" />
          </span>
        </span>
        <span class="blog-nav-copy">
          <span class="blog-nav-label">{{ item.label }}</span>
          <span class="blog-nav-divider" aria-hidden="true" />
          <span class="blog-nav-sub">
            <span>{{ item.sub }}</span>
            <span class="blog-nav-sub-sep" aria-hidden="true" />
            <span>{{ item.meta }}</span>
          </span>
        </span>
      </NuxtLink>
    </nav>

    <div class="blog-sidebar-footer">
      <!-- 收起时保留精简圆形主题切换按钮 -->
      <button
        v-if="isCollapsed"
        type="button"
        class="blog-theme-compact"
        :title="props.theme === 'dark' ? '切换至亮色模式' : '切换至暗色模式'"
        :aria-label="props.theme === 'dark' ? '切换至亮色模式' : '切换至暗色模式'"
        @click="toggleThemeQuick"
      >
        <Sun v-if="props.theme === 'light'" :size="13.5" :stroke-width="1.85" aria-hidden="true" />
        <Moon v-else :size="13.5" :stroke-width="1.85" aria-hidden="true" />
      </button>

      <!-- 展开时展示紧凑双段式亮/暗色开关 -->
      <div v-else class="blog-theme-segmented" role="group" aria-label="亮色暗色模式切换">
        <span
          class="blog-theme-thumb"
          :class="{ 'is-dark': props.theme === 'dark' }"
          aria-hidden="true"
        />
        <button
          type="button"
          class="blog-theme-option"
          :class="{ 'is-active': props.theme === 'light' }"
          :aria-pressed="props.theme === 'light'"
          @click="$emit('set-theme', 'light')"
        >
          <Sun :size="12" :stroke-width="1.85" aria-hidden="true" />
          <span>亮色</span>
        </button>
        <button
          type="button"
          class="blog-theme-option"
          :class="{ 'is-active': props.theme === 'dark' }"
          :aria-pressed="props.theme === 'dark'"
          @click="$emit('set-theme', 'dark')"
        >
          <Moon :size="12" :stroke-width="1.85" aria-hidden="true" />
          <span>暗色</span>
        </button>
      </div>

      <!-- 展开时展示版权与备案等次要信息，收起时平滑隐藏 -->
      <div class="blog-sidebar-meta" :aria-hidden="isCollapsed">
        <p class="blog-sidebar-sign">{{ siteConfig.copyright }}</p>
        <a
          :href="siteConfig.icpUrl"
          target="_blank"
          rel="noreferrer"
          class="blog-sidebar-icp"
          :tabindex="isCollapsed ? -1 : 0"
        >
          {{ siteConfig.icp }}
        </a>
      </div>
    </div>
  </div>
</template>
