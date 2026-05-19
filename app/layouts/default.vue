<template>
  <div class="min-h-screen bg-linear-to-b from-bg-soft to-bg text-foreground">
    <header class="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-2xl">
      <div class="mx-auto flex min-h-20 w-full max-w-[1480px] items-center gap-4 px-5 py-3 sm:px-8">
        <NuxtLink to="/" class="flex min-w-48 items-center gap-3">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-strong to-secondary text-white shadow-lg shadow-primary/25"
          >
            <Palette :size="22" />
          </span>
          <span class="min-w-0">
            <span class="block truncate text-xl font-black tracking-tight">Kertoriy</span>
            <span class="block truncate text-xs font-semibold text-muted">文章 / 文库 / 资源</span>
          </span>
        </NuxtLink>

        <div
          class="hidden w-full max-w-md items-center gap-3 rounded-full border border-border bg-surface-strong px-5 py-3 shadow-sm md:flex"
        >
          <Search :size="18" class="text-muted" />
          <input
            class="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted"
            placeholder="搜索标题、标签、链接..."
          />
        </div>

        <nav class="hidden flex-1 items-center justify-center gap-1 xl:flex">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition hover:bg-white"
            :class="
              route.path === item.to
                ? 'bg-primary/10 text-primary-strong ring-1 ring-inset ring-primary/15'
                : 'text-muted'
            "
          >
            <component :is="item.icon" :size="16" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="grid size-10 place-items-center rounded-full border border-border bg-white text-sm transition hover:bg-primary/5"
            type="button"
            @click="toggleTheme"
          >
            <SunMedium v-if="theme === 'anime'" :size="16" />
            <Moon v-else :size="16" />
          </button>
          <NuxtLink
            to="/admin"
            class="grid size-10 place-items-center rounded-full border border-border bg-white transition hover:bg-primary/5"
            aria-label="后台"
          >
            <ShieldCheck :size="18" />
          </NuxtLink>
        </div>
      </div>

      <nav class="mx-auto flex max-w-[1480px] gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"
          :class="
            route.path === item.to
              ? 'bg-white text-primary-strong'
              : 'bg-white/45 text-muted'
          "
        >
          <component :is="item.icon" :size="15" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-[1480px] px-5 py-8 sm:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  Archive,
  BookOpen,
  Compass,
  Feather,
  HeartHandshake,
  House,
  Moon,
  Palette,
  Search,
  ShieldCheck,
  SunMedium
} from 'lucide-vue-next'

const navItems = [
  { label: '首页', to: '/', icon: House },
  { label: '文库', to: '/library', icon: BookOpen },
  { label: '常用网站', to: '/sites', icon: Compass },
  { label: '归档', to: '/archive', icon: Archive },
  { label: '友链', to: '/friends', icon: HeartHandshake },
  { label: '关于', to: '/about', icon: Feather }
]

const route = useRoute()
const { theme, toggleTheme } = useTheme()
</script>
