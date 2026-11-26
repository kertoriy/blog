<script setup lang="ts">
const { fullScreenLoading } = useAppLoading()

useHead({
  htmlAttrs: { lang: 'zh-CN' },
  script: [
    {
      innerHTML: `(() => {
        try {
          const saved = localStorage.getItem('ker-edit-theme');
          const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
          const root = document.documentElement;
          root.setAttribute('data-theme', theme);
          root.classList.toggle('dark', theme === 'dark');
          root.style.colorScheme = theme;
        } catch {}
      })();`
    }
  ]
})
</script>

<template>
  <NuxtRouteAnnouncer />

  <!-- 全屏初始化/整页加载转圈圈遮罩 -->
  <Transition name="loader-fade">
    <div
      v-if="fullScreenLoading"
      class="app-fullscreen-loader"
      role="status"
      aria-label="页面加载中"
    >
      <span class="app-loader-ring is-lg" aria-hidden="true" />
    </div>
  </Transition>

  <NuxtLayout>
    <NuxtPage
      :keepalive="{ max: 10 }"
      :page-key="r => r.path"
      :transition="{ name: 'page-content', mode: 'out-in' }"
    />
  </NuxtLayout>
</template>
