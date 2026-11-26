<script setup lang="ts">
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import { articles, siteArticleStats } from '~/utils/articles'
import { friends, notes, noteTags } from '~/utils/content'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
)

const { theme } = useTheme()

const visitCanvas = useTemplateRef<HTMLCanvasElement>('visitCanvas')
const notesCanvas = useTemplateRef<HTMLCanvasElement>('notesCanvas')
const distCanvas = useTemplateRef<HTMLCanvasElement>('distCanvas')

const notesMode = ref<'tag' | 'date'>('tag')
const distMode = ref<'library' | 'friends' | 'words'>('library')

let visitChart: Chart | null = null
let notesChart: Chart | null = null
let distChart: Chart | null = null

const visitLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const visitValues = [312, 428, 386, 514, 492, 635, 588]

const noteTagDistribution = computed(() => {
  return noteTags
    .map(tag => ({
      name: tag,
      count: notes.filter(item => item.tag === tag).length
    }))
    .filter(item => item.count > 0)
})

const noteDateDistribution = computed(() => {
  const map = new Map<string, { count: number, words: number }>()
  for (const item of [...notes].reverse()) {
    const label = item.date.slice(5)
    const entry = map.get(label) ?? { count: 0, words: 0 }
    entry.count += 1
    entry.words += item.content.replace(/\s+/g, '').length
    map.set(label, entry)
  }
  return Array.from(map.entries()).map(([date, stats]) => ({
    date,
    count: stats.count,
    words: stats.words
  }))
})

const friendGroupDistribution = computed(() => {
  const map = new Map<string, number>()
  for (const item of friends) {
    map.set(item.group, (map.get(item.group) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})

const notesTitle = computed(() =>
  notesMode.value === 'tag' ? '碎碎念标签分布' : '碎碎念时间分布'
)

const distTitle = computed(() => {
  switch (distMode.value) {
    case 'library': return '文库分类分布'
    case 'friends': return '友链分组分布'
    case 'words': return '单篇字数分布'
  }
})

function getPalette() {
  const dark = theme.value === 'dark'
  return {
    accent: dark ? '#9147ff' : '#8238f5',
    accentSoft: dark ? 'rgba(145, 71, 255, 0.24)' : 'rgba(130, 56, 245, 0.16)',
    accentFade: dark ? 'rgba(145, 71, 255, 0.01)' : 'rgba(130, 56, 245, 0.01)',
    grid: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
    tick: dark ? '#928d9a' : '#756e82',
    tooltipBg: dark ? '#1f1b24' : '#ffffff',
    tooltipBorder: dark ? '#3a3344' : '#e5e1ee',
    tooltipTitle: dark ? '#fafafa' : '#141218',
    tooltipBody: dark ? '#c1bec6' : '#4a4554',
    series: dark
      ? ['#9147ff', '#b98eff', '#7c6fa0', '#544b68']
      : ['#8238f5', '#a979ff', '#7f788f', '#c2bcd0']
  }
}

function createDoughnutConfig(
  labels: string[],
  values: number[],
  unit: string,
  p: ReturnType<typeof getPalette>
): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, idx) => p.series[idx % p.series.length]!),
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: p.tick,
            boxWidth: 7,
            boxHeight: 7,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: p.tooltipBg,
          borderColor: p.tooltipBorder,
          borderWidth: 1,
          titleColor: p.tooltipTitle,
          bodyColor: p.tooltipBody,
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            label: item => ` ${item.label}：${item.formattedValue} ${unit}`
          }
        }
      }
    }
  }
}

function renderVisitChart() {
  const el = visitCanvas.value
  if (!el) return
  visitChart?.destroy()

  const p = getPalette()
  const ctx = el.getContext('2d')
  let gradient: CanvasGradient | string = p.accentSoft
  if (ctx) {
    gradient = ctx.createLinearGradient(0, 0, 0, 210)
    gradient.addColorStop(0, p.accentSoft)
    gradient.addColorStop(1, p.accentFade)
  }

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: visitLabels,
      datasets: [
        {
          label: '页面访问',
          data: visitValues,
          borderColor: p.accent,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 2.8,
          pointHoverRadius: 5,
          pointBackgroundColor: p.accent,
          pointBorderColor: p.tooltipBg,
          pointBorderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: p.tooltipBg,
          borderColor: p.tooltipBorder,
          borderWidth: 1,
          titleColor: p.tooltipTitle,
          bodyColor: p.tooltipBody,
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: item => `${item.formattedValue} 次浏览`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: p.tick, font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: p.grid },
          border: { display: false },
          ticks: { color: p.tick, maxTicksLimit: 4, font: { size: 11 } }
        }
      }
    }
  }

  visitChart = new Chart(el, config)
}

function renderNotesChart() {
  const el = notesCanvas.value
  if (!el) return
  notesChart?.destroy()

  const p = getPalette()

  if (notesMode.value === 'tag') {
    const items = noteTagDistribution.value
    notesChart = new Chart(
      el,
      createDoughnutConfig(items.map(i => i.name), items.map(i => i.count), '条', p)
    )
    return
  }

  const rows = noteDateDistribution.value
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: rows.map(item => item.date),
      datasets: [
        {
          label: '碎碎念字数',
          data: rows.map(item => item.words),
          backgroundColor: p.accent,
          borderRadius: 999,
          borderSkipped: false,
          maxBarThickness: 22
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: p.tooltipBg,
          borderColor: p.tooltipBorder,
          borderWidth: 1,
          titleColor: p.tooltipTitle,
          bodyColor: p.tooltipBody,
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: (item) => {
              const row = rows[item.dataIndex]
              return row ? `${row.count} 条 · ${row.words} 字` : `${item.formattedValue} 字`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: p.tick, font: { size: 10.5 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: p.grid },
          border: { display: false },
          ticks: { color: p.tick, maxTicksLimit: 4, font: { size: 10.5 } }
        }
      }
    }
  }

  notesChart = new Chart(el, config)
}

function renderDistChart() {
  const el = distCanvas.value
  if (!el) return
  distChart?.destroy()

  const p = getPalette()

  if (distMode.value === 'library' || distMode.value === 'friends') {
    const items = distMode.value === 'library'
      ? siteArticleStats.categories
      : friendGroupDistribution.value
    const unit = distMode.value === 'library' ? '篇' : '位'

    distChart = new Chart(
      el,
      createDoughnutConfig(items.map(i => i.name), items.map(i => i.count), unit, p)
    )
    return
  }

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: articles.map(item => item.title.length > 6 ? `${item.title.slice(0, 6)}…` : item.title),
      datasets: [
        {
          label: '正文字数',
          data: articles.map(item => item.wordCount),
          backgroundColor: p.accent,
          borderRadius: 999,
          borderSkipped: false,
          maxBarThickness: 24
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: p.tooltipBg,
          borderColor: p.tooltipBorder,
          borderWidth: 1,
          titleColor: p.tooltipTitle,
          bodyColor: p.tooltipBody,
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => articles[items[0]?.dataIndex ?? 0]?.title ?? '',
            label: item => `${item.formattedValue} 字`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: p.tick, font: { size: 10.5 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: p.grid },
          border: { display: false },
          ticks: { color: p.tick, maxTicksLimit: 4, font: { size: 10.5 } }
        }
      }
    }
  }
  distChart = new Chart(el, config)
}

onMounted(() => {
  renderVisitChart()
  renderNotesChart()
  renderDistChart()
})

watch(theme, () => {
  renderVisitChart()
  renderNotesChart()
  renderDistChart()
})

watch(notesMode, () => {
  renderNotesChart()
})

watch(distMode, () => {
  renderDistChart()
})

onBeforeUnmount(() => {
  visitChart?.destroy()
  notesChart?.destroy()
  distChart?.destroy()
})
</script>

<template>
  <div class="blog-stats-detail">
    <div class="blog-stats-panel">
      <div class="blog-stats-panel-header">
        <p class="blog-stats-panel-title">
          <span>近七日访问趋势</span>
        </p>
        <span class="blog-chart-badge">7D</span>
      </div>
      <div class="blog-chart-box">
        <canvas ref="visitCanvas" aria-label="近七日访问趋势折线图" />
      </div>
    </div>

    <div class="blog-stats-panel">
      <div class="blog-stats-panel-header">
        <p class="blog-stats-panel-title">
          <span>{{ notesTitle }}</span>
        </p>
        <div class="blog-chart-switch" role="group" aria-label="切换碎碎念分布维度">
          <button
            type="button"
            class="blog-chart-tab"
            :class="{ 'is-active': notesMode === 'tag' }"
            @click="notesMode = 'tag'"
          >
            标签
          </button>
          <button
            type="button"
            class="blog-chart-tab"
            :class="{ 'is-active': notesMode === 'date' }"
            @click="notesMode = 'date'"
          >
            时间
          </button>
        </div>
      </div>
      <div class="blog-chart-box">
        <canvas ref="notesCanvas" :aria-label="notesTitle" />
      </div>
    </div>

    <div class="blog-stats-panel">
      <div class="blog-stats-panel-header">
        <p class="blog-stats-panel-title">
          <span>{{ distTitle }}</span>
        </p>
        <div class="blog-chart-switch" role="group" aria-label="切换内容分布维度">
          <button
            type="button"
            class="blog-chart-tab"
            :class="{ 'is-active': distMode === 'library' }"
            @click="distMode = 'library'"
          >
            文库
          </button>
          <button
            type="button"
            class="blog-chart-tab"
            :class="{ 'is-active': distMode === 'friends' }"
            @click="distMode = 'friends'"
          >
            友链
          </button>
          <button
            type="button"
            class="blog-chart-tab"
            :class="{ 'is-active': distMode === 'words' }"
            @click="distMode = 'words'"
          >
            字数
          </button>
        </div>
      </div>
      <div class="blog-chart-box">
        <canvas ref="distCanvas" :aria-label="distTitle" />
      </div>
    </div>
  </div>
</template>
