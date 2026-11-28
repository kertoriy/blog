<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { Check, Pencil } from 'lucide-vue-next'
import '~/assets/css/blog-trash.css'

useSeoMeta({
  title: '赛博情绪垃圾桶 · kertoriy 的研发空间',
  description: '使用标准指法键盘 ASDF JKL; 快速投掷 8 种情绪道具，畅快连击释放压力。'
})

interface WeaponItem {
  id: string
  name: string
  keyLabel: string
  keyCode: string
  keyAliases: string[]
  hand: 'left' | 'right'
  isHomeBump?: boolean
  image: string
  color: string
  secondaryColor: string
  spin: number
}

interface ActiveFlight {
  weapon: WeaponItem
  startX: number
  startY: number
  endX: number
  endY: number
  arcHeight: number
  duration: number
  startedAt: number
  direction: number
}

interface CanvasRing {
  x: number
  y: number
  color: string
  startedAt: number
  duration: number
}

interface CanvasParticle {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  color: string
  startedAt: number
  duration: number
}

interface CanvasDecal {
  x: number
  y: number
  color: string
  kind: 'splat' | 'star' | 'zap'
  startedAt: number
  duration: number
}

interface CanvasPopup {
  x: number
  y: number
  text: string
  color: string
  tiltRad: number
  startedAt: number
  duration: number
}

const baseURL = useRuntimeConfig().app.baseURL
const mascotSrc = `${baseURL}trash/ip-mascot.png?v=q-derpy-piggy`

const pleaLines = [
  '错了别打了!',
  '再也不敢了!',
  '疼疼疼!',
  '哎呀卧槽!',
  '别打脸啊!',
  '呜呜呜好痛!',
  '大哥饶命!'
]

const weapons: WeaponItem[] = [
  {
    id: 'brick',
    name: '板砖',
    keyLabel: 'A',
    keyCode: 'KeyA',
    keyAliases: ['a'],
    hand: 'left',
    image: `${baseURL}trash/brick.png`,
    color: '#e05a3a',
    secondaryColor: '#f59e0b',
    spin: 520
  },
  {
    id: 'tomato',
    name: '烂番茄',
    keyLabel: 'S',
    keyCode: 'KeyS',
    keyAliases: ['s'],
    hand: 'left',
    image: `${baseURL}trash/tomato.png`,
    color: '#ef4444',
    secondaryColor: '#fb7185',
    spin: -440
  },
  {
    id: 'slipper',
    name: '人字拖',
    keyLabel: 'D',
    keyCode: 'KeyD',
    keyAliases: ['d'],
    hand: 'left',
    image: `${baseURL}trash/slipper.png`,
    color: '#38bdf8',
    secondaryColor: '#60a5fa',
    spin: 640
  },
  {
    id: 'egg',
    name: '鸡蛋',
    keyLabel: 'F',
    keyCode: 'KeyF',
    keyAliases: ['f'],
    hand: 'left',
    isHomeBump: true,
    image: `${baseURL}trash/egg.png`,
    color: '#f59e0b',
    secondaryColor: '#fde047',
    spin: -380
  },
  {
    id: 'bomb',
    name: '小炸弹',
    keyLabel: 'J',
    keyCode: 'KeyJ',
    keyAliases: ['j'],
    hand: 'right',
    isHomeBump: true,
    image: `${baseURL}trash/bomb.png`,
    color: '#9147ff',
    secondaryColor: '#f97316',
    spin: 480
  },
  {
    id: 'lightning',
    name: '闪电',
    keyLabel: 'K',
    keyCode: 'KeyK',
    keyAliases: ['k'],
    hand: 'right',
    image: `${baseURL}trash/lightning.png`,
    color: '#eab308',
    secondaryColor: '#a855f7',
    spin: 260
  },
  {
    id: 'fish',
    name: '咸鱼',
    keyLabel: 'L',
    keyCode: 'KeyL',
    keyAliases: ['l'],
    hand: 'right',
    image: `${baseURL}trash/fish.png`,
    color: '#0ea5e9',
    secondaryColor: '#7dd3fc',
    spin: -520
  },
  {
    id: 'cactus',
    name: '仙人掌',
    keyLabel: ';',
    keyCode: 'Semicolon',
    keyAliases: [';', '；'],
    hand: 'right',
    image: `${baseURL}trash/cactus.png`,
    color: '#22c55e',
    secondaryColor: '#f472b6',
    spin: 420
  }
]

const leftHandWeapons = weapons.filter(item => item.hand === 'left')
const rightHandWeapons = weapons.filter(item => item.hand === 'right')
const weaponByCode = new Map(weapons.map(item => [item.keyCode, item]))
const weaponById = new Map(weapons.map(item => [item.id, item]))
const weaponSlotMap = new Map<string, HTMLElement>()
const weaponImageMap = new Map<string, HTMLImageElement>()

function setWeaponSlotRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) {
    weaponSlotMap.set(id, el)
  }
  else {
    weaponSlotMap.delete(id)
  }
}

const stageRef = useTemplateRef<HTMLElement>('stageRef')
const fxCanvasRef = useTemplateRef<HTMLCanvasElement>('fxCanvasRef')
const mascotRef = useTemplateRef<HTMLElement>('mascotRef')
const placardRef = useTemplateRef<HTMLElement>('placardRef')
const comboBadgeRef = useTemplateRef<HTMLElement>('comboBadgeRef')
const targetInputRef = useTemplateRef<HTMLInputElement>('targetInputRef')

const objectName = ref('线上 Bug')
const isEditingTarget = ref(false)
const combo = ref(0)

const displayObjectName = computed(() => objectName.value.trim() || '未命名对象')

// 性能上限常量：即使双手同时狂按 8 键也保证稳定高帧率
const MAX_FLIGHTS = 24
const MAX_RINGS = 14
const MAX_PARTICLES = 96
const MAX_DECALS = 8
const MAX_POPUPS = 8
const MIN_DOM_ANIM_GAP_MS = 95

const activeFlights: ActiveFlight[] = []
const activeRings: CanvasRing[] = []
const activeParticles: CanvasParticle[] = []
const activeDecals: CanvasDecal[] = []
const activePopups: CanvasPopup[] = []

let lastPleaIndex = -1
let lastDomAnimAt = 0
let rafId: number | null = null
let fxCtx: CanvasRenderingContext2D | null = null
let popupHaloColor = '#ffffff'

let comboTimer: ReturnType<typeof setTimeout> | undefined
let hitPoseTimer: ReturnType<typeof setTimeout> | undefined
let placardTimer: ReturnType<typeof setTimeout> | undefined
let comboBumpTimer: ReturnType<typeof setTimeout> | undefined
let layoutRafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
const pressTimers = new Map<string, ReturnType<typeof setTimeout>>()

// 缓存布局几何信息，连击期间零 getBoundingClientRect() 强制回流
const layoutCache = {
  stageWidth: 0,
  stageHeight: 0,
  mascotCenterX: 360,
  mascotCenterY: 220,
  mascotHeadTopY: 80,
  mascotWidth: 260,
  mascotHeight: 260,
  weaponOrigins: new Map<string, { x: number; y: number }>()
}

function syncThemeHaloColor() {
  if (!import.meta.client) return
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--ui-canvas').trim()
  popupHaloColor = raw || '#ffffff'
}

function syncLayoutCache() {
  const stage = stageRef.value
  if (!stage) return

  const stageRect = stage.getBoundingClientRect()
  layoutCache.stageWidth = stageRect.width
  layoutCache.stageHeight = stageRect.height

  const canvas = fxCanvasRef.value
  if (canvas && stageRect.width > 0 && stageRect.height > 0) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const targetW = Math.round(stageRect.width * dpr)
    const targetH = Math.round(stageRect.height * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }
    fxCtx = canvas.getContext('2d')
    if (fxCtx) {
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }

  const mascot = mascotRef.value
  if (mascot) {
    const mascotRect = mascot.getBoundingClientRect()
    layoutCache.mascotCenterX = mascotRect.left - stageRect.left + mascotRect.width / 2
    layoutCache.mascotCenterY = mascotRect.top - stageRect.top + mascotRect.height * 0.48
    layoutCache.mascotHeadTopY = mascotRect.top - stageRect.top
    layoutCache.mascotWidth = mascotRect.width
    layoutCache.mascotHeight = mascotRect.height
  }

  layoutCache.weaponOrigins.clear()
  weaponSlotMap.forEach((slot, id) => {
    const target = slot.querySelector<HTMLElement>('.trash-weapon-btn') ?? slot
    const btnRect = target.getBoundingClientRect()
    layoutCache.weaponOrigins.set(id, {
      x: btnRect.left - stageRect.left + btnRect.width / 2,
      y: Math.min(stageRect.height + 24, btnRect.top - stageRect.top + btnRect.height / 2)
    })
  })
}

function scheduleLayoutSync() {
  if (layoutRafId !== null) return
  layoutRafId = requestAnimationFrame(() => {
    layoutRafId = null
    syncLayoutCache()
  })
}

function toggleEditTarget() {
  if (isEditingTarget.value) {
    finishEditTarget()
  }
  else {
    startEditTarget()
  }
}

function startEditTarget() {
  isEditingTarget.value = true
  nextTick(() => {
    const input = targetInputRef.value
    if (input) {
      input.focus()
      const len = input.value.length
      input.setSelectionRange(len, len)
    }
  })
}

function finishEditTarget() {
  objectName.value = objectName.value.trim()
  isEditingTarget.value = false
}

function pickPleaLine() {
  let idx = Math.floor(Math.random() * pleaLines.length)
  if (idx === lastPleaIndex && pleaLines.length > 1) {
    idx = (idx + 1 + Math.floor(Math.random() * (pleaLines.length - 1))) % pleaLines.length
  }
  lastPleaIndex = idx
  return pleaLines[idx] ?? '错了别打了!'
}

function triggerDomFeedback(weapon: WeaponItem, direction: number, nowMs: number) {
  if (nowMs - lastDomAnimAt < MIN_DOM_ANIM_GAP_MS) return
  lastDomAnimAt = nowMs

  const mascot = mascotRef.value
  const placard = placardRef.value
  const badge = comboBadgeRef.value

  const isHeavy = weapon.id === 'bomb' || weapon.id === 'lightning'
  const hitCls = isHeavy ? 'is-hit-heavy' : direction >= 0 ? 'is-hit-right' : 'is-hit-left'
  const swingCls = isHeavy ? 'is-swing-heavy' : direction >= 0 ? 'is-swing-right' : 'is-swing-left'

  if (mascot) {
    mascot.classList.remove('is-hit-left', 'is-hit-right', 'is-hit-heavy')
    requestAnimationFrame(() => mascot.classList.add(hitCls))
    clearTimeout(hitPoseTimer)
    hitPoseTimer = setTimeout(() => {
      mascot.classList.remove('is-hit-left', 'is-hit-right', 'is-hit-heavy')
    }, 260)
  }

  if (placard) {
    placard.classList.remove('is-swing-left', 'is-swing-right', 'is-swing-heavy')
    requestAnimationFrame(() => placard.classList.add(swingCls))
    clearTimeout(placardTimer)
    placardTimer = setTimeout(() => {
      placard.classList.remove('is-swing-left', 'is-swing-right', 'is-swing-heavy')
    }, 500)
  }

  if (badge) {
    badge.classList.remove('is-bump')
    requestAnimationFrame(() => badge.classList.add('is-bump'))
    clearTimeout(comboBumpTimer)
    comboBumpTimer = setTimeout(() => {
      badge.classList.remove('is-bump')
    }, 200)
  }
}

function triggerImpact(flight: ActiveFlight, now: number) {
  const { weapon, endX, endY, direction } = flight
  combo.value += 1

  // 连击在最后一次命中后计时，连续命中会延长计数的保留时间。
  clearTimeout(comboTimer)
  comboTimer = setTimeout(() => {
    combo.value = 0
  }, 2200)

  triggerDomFeedback(weapon, direction, now)

  // 1. 冲击波圆环（带数量上限）
  if (activeRings.length >= MAX_RINGS) activeRings.shift()
  activeRings.push({
    x: endX,
    y: endY,
    color: weapon.color,
    startedAt: now,
    duration: 400
  })

  // 2. 粒子爆裂（带总数池上限，极速狂按不爆内存）
  const burstCount = weapon.id === 'bomb' ? 9 : 6
  for (let i = 0; i < burstCount; i++) {
    if (activeParticles.length >= MAX_PARTICLES) activeParticles.shift()
    const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.45
    const dist = 34 + Math.random() * (weapon.id === 'bomb' ? 58 : 42)
    activeParticles.push({
      x: endX,
      y: endY,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 14,
      size: 3.5 + Math.random() * 3.5,
      color: i % 2 === 0 ? weapon.color : weapon.secondaryColor,
      startedAt: now,
      duration: 480
    })
  }

  // 3. 受击短时漫画痕迹
  const decalKind: CanvasDecal['kind'] = weapon.id === 'tomato' || weapon.id === 'egg'
    ? 'splat'
    : weapon.id === 'lightning'
      ? 'zap'
      : 'star'
  if (activeDecals.length >= MAX_DECALS) activeDecals.shift()
  activeDecals.push({
    x: endX,
    y: endY,
    color: weapon.color,
    kind: decalKind,
    startedAt: now,
    duration: 950
  })

  // 4. 小猪头顶上方求饶飘字（不遮挡表情、上限 8 条防刷屏卡顿）
  if (activePopups.length >= MAX_POPUPS) activePopups.shift()
  activePopups.push({
    x: layoutCache.mascotCenterX + (Math.random() - 0.5) * 124,
    y: Math.max(46, layoutCache.mascotHeadTopY - 10 - Math.random() * 14),
    text: pickPleaLine(),
    color: weapon.color,
    tiltRad: ((Math.random() - 0.5) * 12 * Math.PI) / 180,
    startedAt: now,
    duration: 820
  })
}

function renderFxFrame(now: number) {
  const ctx = fxCtx
  const w = layoutCache.stageWidth
  const h = layoutCache.stageHeight

  if (ctx && w > 0 && h > 0) {
    ctx.clearRect(0, 0, w, h)
  }

  // 1. 更新抛射物飞行轨迹
  for (let i = activeFlights.length - 1; i >= 0; i--) {
    const f = activeFlights[i]!
    const t = Math.min(1, (now - f.startedAt) / f.duration)

    if (t >= 1) {
      activeFlights.splice(i, 1)
      triggerImpact(f, now)
      continue
    }

    if (!ctx) continue
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const x = f.startX + (f.endX - f.startX) * ease
    const y = f.startY + (f.endY - f.startY) * ease - 4 * f.arcHeight * t * (1 - t)
    const scale = 0.84 + Math.sin(t * Math.PI) * 0.34
    const rad = (f.weapon.spin * t * (f.direction >= 0 ? 1 : -1) * Math.PI) / 180
    const img = weaponImageMap.get(f.weapon.id)

    if (img && img.complete && img.naturalWidth > 0) {
      const size = 54 * scale
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rad)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  if (ctx) {
    // 2. 绘制短时受击漫画痕迹
    for (let i = activeDecals.length - 1; i >= 0; i--) {
      const d = activeDecals[i]!
      const t = (now - d.startedAt) / d.duration
      if (t >= 1) {
        activeDecals.splice(i, 1)
        continue
      }
      const alpha = t < 0.18 ? (t / 0.18) * 0.85 : 0.85 * (1 - (t - 0.18) / 0.82)
      const scale = t < 0.18 ? 0.5 + (t / 0.18) * 0.55 : 1.05 - (t - 0.18) * 0.1
      ctx.save()
      ctx.globalAlpha = Math.max(0, alpha)
      ctx.translate(d.x, d.y)
      ctx.scale(scale, scale)
      if (d.kind === 'splat') {
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.arc(0, 0, 11, 0, Math.PI * 2)
        ctx.fill()
      }
      else if (d.kind === 'zap') {
        ctx.rotate(0.22)
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.roundRect(-3.5, -11, 7, 22, 4)
        ctx.fill()
      }
      else {
        ctx.strokeStyle = d.color
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.arc(0, 0, 10, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    // 3. 绘制冲击波圆环
    for (let i = activeRings.length - 1; i >= 0; i--) {
      const r = activeRings[i]!
      const t = (now - r.startedAt) / r.duration
      if (t >= 1) {
        activeRings.splice(i, 1)
        continue
      }
      const easeOut = 1 - Math.pow(1 - t, 3)
      ctx.save()
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.88)
      ctx.strokeStyle = r.color
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.arc(r.x, r.y, 10 + easeOut * 36, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // 4. 绘制放射状粒子
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i]!
      const t = (now - p.startedAt) / p.duration
      if (t >= 1) {
        activeParticles.splice(i, 1)
        continue
      }
      const easeOut = 1 - Math.pow(1 - t, 2.4)
      const px = p.x + p.dx * easeOut
      const py = p.y + p.dy * easeOut + 24 * t * t
      const radius = Math.max(0.8, p.size * (1 - t * 0.72))
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - t)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 5. 绘制小猪头顶求饶漫画飘字
    ctx.font = '800 15.5px "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = activePopups.length - 1; i >= 0; i--) {
      const pop = activePopups[i]!
      const t = (now - pop.startedAt) / pop.duration
      if (t >= 1) {
        activePopups.splice(i, 1)
        continue
      }
      const easeOut = 1 - Math.pow(1 - t, 2.5)
      const alpha = t < 0.14 ? t / 0.14 : t > 0.68 ? Math.max(0, 1 - (t - 0.68) / 0.32) : 1
      const scale = t < 0.16 ? 0.76 + (t / 0.16) * 0.3 : 1.06 - (t - 0.16) * 0.1
      const py = pop.y - easeOut * 38

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(pop.x, py)
      ctx.rotate(pop.tiltRad)
      ctx.scale(scale, scale)
      ctx.lineWidth = 4
      ctx.lineJoin = 'round'
      ctx.strokeStyle = popupHaloColor
      ctx.strokeText(pop.text, 0, 0)
      ctx.fillStyle = pop.color
      ctx.fillText(pop.text, 0, 0)
      ctx.restore()
    }
  }

  const hasMore =
    activeFlights.length > 0
    || activeRings.length > 0
    || activeParticles.length > 0
    || activeDecals.length > 0
    || activePopups.length > 0

  if (hasMore) {
    rafId = requestAnimationFrame(renderFxFrame)
  }
  else {
    rafId = null
  }
}

function ensureFxLoop() {
  if (rafId === null) {
    rafId = requestAnimationFrame(renderFxFrame)
  }
}

function flashWeaponButton(weaponId: string) {
  const slot = weaponSlotMap.get(weaponId)
  if (!slot) return
  slot.classList.add('is-pressed')
  const existing = pressTimers.get(weaponId)
  if (existing) clearTimeout(existing)
  pressTimers.set(
    weaponId,
    setTimeout(() => {
      slot.classList.remove('is-pressed')
      pressTimers.delete(weaponId)
    }, 135)
  )
}

function throwWeapon(weaponId: string) {
  if (isEditingTarget.value) {
    finishEditTarget()
  }

  const weapon = weaponById.get(weaponId) ?? weapons[0]!
  flashWeaponButton(weapon.id)

  if (layoutCache.stageWidth <= 0) {
    syncLayoutCache()
  }

  const hitOffsetX = (Math.random() - 0.5) * Math.min(72, layoutCache.mascotWidth * 0.42)
  const hitOffsetY = (Math.random() - 0.5) * Math.min(64, layoutCache.mascotHeight * 0.34)
  const endX = layoutCache.mascotCenterX + hitOffsetX
  const endY = layoutCache.mascotCenterY + hitOffsetY

  const origin = layoutCache.weaponOrigins.get(weapon.id)
  const startX = origin ? origin.x : layoutCache.stageWidth / 2 + (Math.random() - 0.5) * 140
  const startY = origin ? origin.y : layoutCache.stageHeight - 12
  const direction = endX - startX >= 0 ? 1 : -1

  if (activeFlights.length >= MAX_FLIGHTS) {
    activeFlights.shift()
  }

  activeFlights.push({
    weapon,
    startX,
    startY,
    endX,
    endY,
    arcHeight: 82 + Math.random() * 42,
    duration: 270 + Math.random() * 45,
    startedAt: performance.now(),
    direction
  })

  ensureFxLoop()
}

function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
  if (isEditingTarget.value) return

  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return
  }

  let matched = weaponByCode.get(e.code)
  if (!matched) {
    const lowerKey = e.key.toLowerCase()
    matched = weapons.find(item => item.keyAliases.includes(lowerKey))
  }

  if (matched) {
    e.preventDefault()
    throwWeapon(matched.id)
  }
}

onMounted(() => {
  // 预加载全部 8 张情绪道具图片供 Canvas 零延迟绘制
  for (const w of weapons) {
    const img = new Image()
    img.src = w.image
    weaponImageMap.set(w.id, img)
  }

  syncThemeHaloColor()
  nextTick(syncLayoutCache)

  if (stageRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleLayoutSync)
    resizeObserver.observe(stageRef.value)
  }

  themeObserver = new MutationObserver(syncThemeHaloColor)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  })

  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', scheduleLayoutSync, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', scheduleLayoutSync)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (layoutRafId !== null) cancelAnimationFrame(layoutRafId)
  clearTimeout(comboTimer)
  clearTimeout(comboBumpTimer)
  clearTimeout(hitPoseTimer)
  clearTimeout(placardTimer)
  pressTimers.forEach(timer => clearTimeout(timer))
  pressTimers.clear()
})
</script>

<template>
  <div class="trash-page">
    <!-- 工具栏对齐正文边缘，放在舞台外以免按钮的焦点轮廓被裁切。 -->
    <div class="trash-toolbar">
      <!-- 左上角：常驻 COMBO 连击计数 -->
      <div
        ref="comboBadgeRef"
        class="trash-combo-badge"
        :class="{ 'is-active': combo > 0 }"
        aria-live="polite"
      >
        <span class="trash-combo-label">COMBO</span>
        <strong class="trash-combo-value">×{{ combo }}</strong>
      </div>

      <button
        type="button"
        class="trash-edit-btn"
        :class="{ 'is-active': isEditingTarget }"
        :title="isEditingTarget ? '完成编辑挂牌对象' : '编辑挂牌对象名称'"
        :aria-label="isEditingTarget ? '完成编辑挂牌对象' : '编辑挂牌对象名称'"
        @mousedown.prevent
        @click="toggleEditTarget"
      >
        <Check v-if="isEditingTarget" :size="13.5" aria-hidden="true" />
        <Pencil v-else :size="13" aria-hidden="true" />
        <span>{{ isEditingTarget ? '完成' : '编辑对象' }}</span>
      </button>
    </div>

    <!-- 中间互动舞台 -->
    <section
      ref="stageRef"
      class="trash-stage"
      aria-label="赛博情绪宣泄舞台"
    >
      <div class="trash-stage-bg" aria-hidden="true">
        <span class="trash-stage-aura" />
        <span class="trash-stage-dots" />
        <span class="trash-stage-watermark">VENT</span>
      </div>

      <!-- 中央 IP 形象 + 挂在脖子中间的囚犯牌（仅展示受击，不可直接点击） -->
      <div class="trash-mascot-zone">
        <div
          ref="mascotRef"
          class="trash-mascot-actor"
        >
          <img
            :src="mascotSrc"
            alt="赛博情绪受气包小猪 IP 形象"
            class="trash-mascot-img"
            draggable="false"
            @load="scheduleLayoutSync"
          >

          <!-- 紧贴 Q 版呆傻小猪脖颈的绕脖挂绳（落在圆润颈窝处，随身体形变而不脱离） -->
          <svg class="trash-neck-collar" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path
              d="M26.0 59.2 Q50 68.4 74.0 59.2"
              stroke="#533240"
              stroke-opacity="0.14"
              stroke-width="1.9"
              stroke-linecap="round"
            />
            <path
              d="M25.6 58.2 Q50 67.6 74.4 58.2"
              stroke="#533240"
              stroke-width="1.75"
              stroke-linecap="round"
            />
            <path
              d="M26.2 58.5 Q50 67.6 73.8 58.5"
              stroke="#ebd8bd"
              stroke-width="0.78"
              stroke-linecap="round"
            />
          </svg>

          <!-- 囚犯同款挂脖牌（双垂绳从绕脖绳垂落至牌孔，受击时绕颈部中心稳稳钟摆晃动） -->
          <div
            ref="placardRef"
            class="trash-placard"
            :class="{ 'is-editing': isEditingTarget }"
          >
            <svg class="trash-placard-rope" viewBox="0 0 120 26" fill="none" aria-hidden="true">
              <path
                d="M20.5 1.1 Q21.2 13 22 25.2"
                stroke="#533240"
                stroke-width="4.2"
                stroke-linecap="round"
              />
              <path
                d="M20.5 1.1 Q21.2 13 22 25.2"
                stroke="#ebd8bd"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M99.5 1.1 Q98.8 13 98 25.2"
                stroke="#533240"
                stroke-width="4.2"
                stroke-linecap="round"
              />
              <path
                d="M99.5 1.1 Q98.8 13 98 25.2"
                stroke="#ebd8bd"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <circle cx="20.5" cy="1.5" r="2.7" fill="#ebd8bd" stroke="#533240" stroke-width="1.4" />
              <circle cx="99.5" cy="1.5" r="2.7" fill="#ebd8bd" stroke="#533240" stroke-width="1.4" />
            </svg>

            <div class="trash-placard-board">
              <span class="trash-placard-eyelet is-left" aria-hidden="true" />
              <span class="trash-placard-eyelet is-right" aria-hidden="true" />

              <span class="trash-placard-text" :class="{ 'is-placeholder': !objectName.trim() }">
                {{ displayObjectName }}
              </span>
            </div>
          </div>
        </div>

        <span class="trash-mascot-shadow" aria-hidden="true" />

        <!-- IP 下方独立编辑台（右上角「编辑对象」触发，输入时实时同步至挂脖牌） -->
        <div class="trash-editor-slot">
          <div v-if="isEditingTarget" class="trash-editor-bar">
            <Pencil :size="13" class="trash-editor-icon" aria-hidden="true" />
            <input
              ref="targetInputRef"
              v-model="objectName"
              type="text"
              maxlength="14"
              class="trash-editor-input"
              placeholder="输入挂牌对象，实时同步…"
              aria-label="编辑宣泄对象名称"
              @blur="finishEditTarget"
              @keydown.enter.prevent="finishEditTarget"
              @keydown.esc.prevent="finishEditTarget"
            >
            <button
              type="button"
              class="trash-editor-confirm"
              @mousedown.prevent
              @click="finishEditTarget"
            >
              确定
            </button>
          </div>
          <p v-else class="trash-edit-hint">
            按键盘 A S D F / J K L ; 练习指法开砸 · 右上角按钮可编辑对象
          </p>
        </div>
      </div>

      <!-- 单层高性能 Canvas 特效画布：零 DOM 膨胀，双手同时狂按 8 键依然丝滑不卡顿 -->
      <canvas ref="fxCanvasRef" class="trash-fx-canvas" aria-hidden="true" />
    </section>

    <!-- 底部：8 键标准指法情绪 PNG 道具台（左手 A S D F · 右手 J K L ;，键帽标签居中置于卡片下方） -->
    <div class="trash-dock" role="group" aria-label="选择并投掷情绪道具（支持键盘 A S D F J K L ;）">
      <div class="trash-dock-hand" aria-label="左手基准键位 A S D F">
        <div
          v-for="weapon in leftHandWeapons"
          :key="weapon.id"
          :ref="(el) => setWeaponSlotRef(weapon.id, el)"
          class="trash-weapon-slot"
        >
          <button
            type="button"
            class="trash-weapon-btn"
            :title="`投掷 ${weapon.name}（快捷键 ${weapon.keyLabel}）`"
            @mousedown.prevent
            @click="throwWeapon(weapon.id)"
          >
            <img
              :src="weapon.image"
              :alt="weapon.name"
              class="trash-weapon-img"
              draggable="false"
            >
            <span class="trash-weapon-name">{{ weapon.name }}</span>
          </button>
          <kbd
            class="trash-weapon-key"
            :class="{ 'is-home': weapon.isHomeBump }"
            aria-hidden="true"
          >
            {{ weapon.keyLabel }}
          </kbd>
        </div>
      </div>

      <span class="trash-dock-split" aria-hidden="true" />

      <div class="trash-dock-hand" aria-label="右手基准键位 J K L ;">
        <div
          v-for="weapon in rightHandWeapons"
          :key="weapon.id"
          :ref="(el) => setWeaponSlotRef(weapon.id, el)"
          class="trash-weapon-slot"
        >
          <button
            type="button"
            class="trash-weapon-btn"
            :title="`投掷 ${weapon.name}（快捷键 ${weapon.keyLabel}）`"
            @mousedown.prevent
            @click="throwWeapon(weapon.id)"
          >
            <img
              :src="weapon.image"
              :alt="weapon.name"
              class="trash-weapon-img"
              draggable="false"
            >
            <span class="trash-weapon-name">{{ weapon.name }}</span>
          </button>
          <kbd
            class="trash-weapon-key"
            :class="{ 'is-home': weapon.isHomeBump }"
            aria-hidden="true"
          >
            {{ weapon.keyLabel }}
          </kbd>
        </div>
      </div>
    </div>
  </div>
</template>
