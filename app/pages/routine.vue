<script setup lang="ts">
import { ArrowLeft, CalendarDays, ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { routineDailyLogs, routinePlans, type RoutineCheckStatus } from '~/utils/content'
import '~/assets/css/blog-routine.css'

useSeoMeta({
  title: '作息打卡 · kertoriy 的研发空间',
  description: '按事件对照每日作息，左侧是计划时间，中间是事件，右侧是实际时间。'
})

// 记录是 YYYY-MM-DD 的日历日期。用 UTC 做日期运算，避免跨时区或夏令时造成偏移。
function shiftDate(date: string, days: number) {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + days)
  return day.toISOString().slice(0, 10)
}

function startOfWeek(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return shiftDate(date, -((weekday + 6) % 7))
}

const sortedLogs = [...routineDailyLogs].sort((a, b) => b.date.localeCompare(a.date))
const logsByDate = new Map(sortedLogs.map(log => [log.date, log]))
const initialDate = useState('routine-initial-date', () => sortedLogs[0]?.date ??
  new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date()))
const selectedDate = ref(initialDate.value)

// 一次只展示一周。切换周时优先定位到该周最新的一天有记录的日期。
const latestDateByWeek = new Map<string, string>()
for (const { date } of sortedLogs) {
  const monday = startOfWeek(date)
  if (!latestDateByWeek.has(monday)) latestDateByWeek.set(monday, date)
}
const availableWeeks = [...latestDateByWeek.keys()]
const weekStart = computed(() => startOfWeek(selectedDate.value))
const earlierWeek = computed(() => availableWeeks.find(week => week < weekStart.value))
const laterWeek = computed(() => availableWeeks.findLast(week => week > weekStart.value))
const hasWeekNavigation = computed(() => Boolean(earlierWeek.value || laterWeek.value))
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const weekDates = computed(() => weekdays.map((weekday, index) => {
  const date = shiftDate(weekStart.value, index)
  return { date, weekday, label: date.slice(5), log: logsByDate.get(date) }
}))

function switchWeek(targetWeek?: string) {
  if (!targetWeek) return
  selectedDate.value = latestDateByWeek.get(targetWeek) ?? targetWeek
}

const dateDialog = useTemplateRef<HTMLDialogElement>('dateDialog')
const dateDraft = ref('')

function openDatePicker() {
  dateDraft.value = selectedDate.value
  dateDialog.value?.showModal()
}

// 确认后更新共用日期，作息和统计分别按该日期所在的周和统计范围更新。
function applyDate() {
  if (!dateDraft.value) return
  selectedDate.value = dateDraft.value
  dateDialog.value?.close()
}

const animateSchedule = ref(false)

// 首次进入直接展示排程。切换日期时重新渲染行，逐行播放入场效果。
watch(selectedDate, () => {
  animateSchedule.value = true
})

const activeLog = computed(() => logsByDate.get(selectedDate.value))

// 以计划事件的 ID 对齐当天记录。缺少记录时保留该事件和计划时间。
const pairedSchedule = computed(() => {
  const actualTimes = new Map<string, string>(activeLog.value?.items.map(item => [item.planId, item.actualTime]))

  return routinePlans.map(plan => ({
    plan,
    actualTime: actualTimes.get(plan.id) ?? '—'
  }))
})

const route = useRoute()
const router = useRouter()
const routinePage = useTemplateRef<HTMLDivElement>('routinePage')
const routineHeading = useTemplateRef<HTMLHeadingElement>('routineHeading')
const statsHeading = useTemplateRef<HTMLHeadingElement>('statsHeading')
const hydrated = ref(false)
const showStats = computed(() => hydrated.value && route.query.view === 'stats')

// 静态页面先按记录视图水合，再读取 URL；这样直达统计也不会产生水合差异。
onMounted(() => {
  hydrated.value = true
})

function toggleStatsView() {
  const query = { ...route.query }
  if (showStats.value) delete query.view
  else query.view = 'stats'
  return router.push({ query })
}

watch(showStats, async (showing) => {
  await nextTick()
  routinePage.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
  const heading = showing ? statsHeading.value : routineHeading.value
  heading?.focus({ preventScroll: true })
})

const completedStatuses = new Set<RoutineCheckStatus>(['on-time', 'early', 'delayed'])
const planIds = new Set(routinePlans.map(plan => plan.id))
const completedCounts = Array.from(logsByDate, ([date, log]) => {
  // 待打卡、进行中和跳过不计入完成数。同一天的同一个事件只计一次。
  const checkedIds = new Set(log.items.filter(item => planIds.has(item.planId) && completedStatuses.has(item.status)).map(item => item.planId))
  return { date, count: checkedIds.size }
})

const statsPeriods = {
  week: { label: '本周', chartTitle: '每日打卡' },
  month: { label: '本月', chartTitle: '每周打卡' },
  quarter: { label: '本季度', chartTitle: '每月打卡' },
  year: { label: '本年', chartTitle: '每月打卡' }
} as const
const statsPeriod = ref<keyof typeof statsPeriods>('week')

type StatsBucket = { start: string, end: string, label: string }

function endOfMonth(monthStart: string) {
  const date = new Date(`${monthStart}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + 1, 0)
  return date.toISOString().slice(0, 10)
}

const statsBuckets = computed<StatsBucket[]>(() => {
  if (statsPeriod.value === 'week') {
    return weekDates.value.map(day => ({ start: day.date, end: day.date, label: day.weekday }))
  }

  const year = selectedDate.value.slice(0, 4)
  const month = Number(selectedDate.value.slice(5, 7))
  const monthStartFor = (value: number) => `${year}-${String(value).padStart(2, '0')}-01`

  // 月视图按周一到周日分组，首尾周只统计落在当月的日期。
  if (statsPeriod.value === 'month') {
    const monthStart = monthStartFor(month)
    const lastDay = Number(endOfMonth(monthStart).slice(8))
    const firstSunday = Number(shiftDate(startOfWeek(monthStart), 6).slice(8))
    const buckets: StatsBucket[] = []
    for (let first = 1, sunday = firstSunday; first <= lastDay; first = sunday + 1, sunday += 7) {
      const last = Math.min(sunday, lastDay)
      buckets.push({
        start: shiftDate(monthStart, first - 1),
        end: shiftDate(monthStart, last - 1),
        label: first === last ? `${first}日` : `${first}–${last}日`
      })
    }
    return buckets
  }

  // 季度和全年都按自然月汇总，图表最多保留十二列。
  const isYear = statsPeriod.value === 'year'
  const firstMonth = isYear ? 1 : Math.floor((month - 1) / 3) * 3 + 1
  return Array.from({ length: isYear ? 12 : 3 }, (_, index) => {
    const columnMonth = firstMonth + index
    const start = monthStartFor(columnMonth)
    return { start, end: endOfMonth(start), label: `${columnMonth}月` }
  })
})

function formatDateRange(start: string, end: string) {
  if (start === end) return start
  const endLabel = start.slice(0, 4) === end.slice(0, 4) ? end.slice(5) : end
  return `${start} — ${endLabel}`
}

const statsDateRange = computed(() => {
  const first = statsBuckets.value[0]
  const last = statsBuckets.value.at(-1)
  return first && last ? formatDateRange(first.start, last.end) : ''
})

const statsSeries = computed(() => statsBuckets.value.map(bucket => {
  const records = completedCounts.filter(record => record.date >= bucket.start && record.date <= bucket.end)
  // 无记录用空值表示，保留有记录但完成数为零的情况。
  const count = records.length ? records.reduce((total, record) => total + record.count, 0) : null
  return { ...bucket, count }
}))
const statsScaleMax = computed(() => Math.max(1, statsPeriod.value === 'week' ? planIds.size : 0,
  ...statsSeries.value.map(bucket => bucket.count ?? 0)))
</script>

<template>
  <div ref="routinePage" class="routine-page">
    <h1 ref="routineHeading" tabindex="-1" class="sr-only">作息打卡</h1>
    <div class="routine-axis-stage" :role="showStats ? undefined : 'table'" :aria-label="showStats ? undefined : '作息时间对照'">
      <!-- 两行共用吸顶容器，日期标签换行时表头会随之调整。 -->
      <div class="routine-sticky-head" :role="showStats ? undefined : 'rowgroup'">
        <div :role="showStats ? undefined : 'row'">
          <div class="routine-topbar" :role="showStats ? undefined : 'cell'" :aria-colspan="showStats ? undefined : 3">
            <button type="button" class="routine-stats-button" @click="toggleStatsView">
              <ArrowLeft v-if="showStats" :size="14" aria-hidden="true" />
              <ChartNoAxesColumnIncreasing v-else :size="14" aria-hidden="true" />
              {{ showStats ? '返回作息' : '统计' }}
            </button>

            <div v-if="showStats" class="routine-week-picker routine-period-picker" role="group" aria-label="统计范围">
              <div class="routine-date-tabs routine-period-tabs">
                <label v-for="(period, key) in statsPeriods" :key="key" class="routine-date-tab">
                  <input v-model="statsPeriod" class="sr-only" type="radio" name="routine-stats-period" :value="key">
                  {{ period.label }}
                </label>
              </div>
            </div>

            <div v-else class="routine-week-picker" :class="{ 'has-week-navigation': hasWeekNavigation }" role="group" aria-label="切换打卡日期">
              <button v-if="hasWeekNavigation" type="button" class="routine-week-button" :disabled="!earlierWeek" aria-label="上一周记录" @click="switchWeek(earlierWeek)">
                <ChevronLeft :size="16" aria-hidden="true" />
              </button>
              <div class="routine-date-tabs">
                <label v-for="entry in weekDates" :key="entry.date" class="routine-date-tab">
                  <input v-model="selectedDate" class="sr-only" type="radio" name="routine-date" :value="entry.date" :aria-label="`${entry.weekday}，${entry.date}${entry.log ? '' : '，暂无记录'}`">
                  <span class="routine-tab-weekday">{{ entry.weekday }}</span>
                  <time :datetime="entry.date">{{ entry.label }}</time>
                </label>
              </div>
              <button v-if="hasWeekNavigation" type="button" class="routine-week-button" :disabled="!laterWeek" aria-label="下一周记录" @click="switchWeek(laterWeek)">
                <ChevronRight :size="16" aria-hidden="true" />
              </button>
            </div>

            <button type="button" class="routine-date-picker-button" aria-haspopup="dialog" @click="openDatePicker">
              <CalendarDays :size="14" aria-hidden="true" />
              选择日期
            </button>
          </div>
        </div>

        <div v-if="!showStats" class="routine-axis-header" role="row">
          <span class="routine-column-plan" role="columnheader">计划时间</span>
          <span class="routine-column-event" role="columnheader">作息事件</span>
          <span class="routine-column-actual" role="columnheader">实际时间</span>
        </div>
      </div>

      <section v-if="showStats" class="routine-stats-view" aria-labelledby="routine-stats-title">
        <h2 id="routine-stats-title" ref="statsHeading" class="sr-only" tabindex="-1">作息统计</h2>
        <header class="routine-stats-panel-header">
          <h3 class="blog-stats-panel-title">{{ statsPeriods[statsPeriod].chartTitle }}</h3>
          <span class="routine-stats-date-range">{{ statsDateRange }}</span>
        </header>
        <ul
          class="routine-stats-chart"
          :class="{ 'is-dense': statsPeriod === 'month' || statsPeriod === 'year' }"
          :style="{ '--routine-chart-columns': statsSeries.length }"
          role="list"
        >
          <li
            v-for="bucket in statsSeries"
            :key="bucket.start"
            :style="{ '--routine-bar-height': `${((bucket.count ?? 0) / statsScaleMax) * 100}%` }"
          >
            <div class="routine-stats-bar-slot" aria-hidden="true">
              <span v-if="bucket.count" class="routine-stats-bar" />
              <span class="routine-stats-bar-value">{{ bucket.count ?? '—' }}</span>
            </div>
            <span class="routine-stats-chart-label" aria-hidden="true">{{ bucket.label }}</span>
            <span class="sr-only">{{ formatDateRange(bucket.start, bucket.end) }}，{{ bucket.count === null ? '暂无记录' : `完成 ${bucket.count} 项` }}</span>
          </li>
        </ul>
      </section>

      <div v-else :key="selectedDate" class="routine-axis-body" :class="{ 'is-entering': animateSchedule }" role="rowgroup">
        <div
          v-for="(pair, index) in pairedSchedule"
          :key="pair.plan.id"
          class="routine-axis-row"
          :style="{ '--routine-row-delay': `${Math.min(index * 26, 320)}ms` }"
          role="row"
        >
          <div class="routine-time-cell routine-column-plan" role="cell">
            <div class="routine-time routine-row-label">{{ pair.plan.time }}</div>
          </div>

          <div class="routine-event-cell routine-column-event" role="cell">
            <div class="routine-event routine-row-label">{{ pair.plan.title }}</div>
          </div>

          <div class="routine-time-cell routine-column-actual" role="cell">
            <div class="routine-time routine-row-label">{{ pair.actualTime }}</div>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="dateDialog" class="routine-dialog routine-date-dialog" aria-labelledby="routine-date-picker-title">
      <form class="routine-date-form" @submit.prevent="applyDate">
        <h2 id="routine-date-picker-title">选择日期</h2>
        <label for="routine-picker-date" class="sr-only">作息日期</label>
        <input id="routine-picker-date" v-model="dateDraft" class="routine-picker-input" type="date" min="0001-01-01" max="9999-12-26" required autofocus>
        <div class="routine-picker-actions">
          <button type="button" class="ui-btn" @click="dateDialog?.close()">取消</button>
          <button type="submit" class="ui-btn-primary">查看当天</button>
        </div>
      </form>
    </dialog>
  </div>
</template>
