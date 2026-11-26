<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Copy, Plus, X } from 'lucide-vue-next'
import { friends, siteConfig, type FriendItem } from '~/utils/content'
import '~/assets/css/blog-friends.css'

useSeoMeta({
  title: '友链 · kertoriy 的研发空间',
  description: '朋友、独立开发者与长期维护的个人博客站点。'
})

const baseURL = useRuntimeConfig().app.baseURL
const failedAvatars = ref<Record<string, boolean>>({})
const copiedKey = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | undefined

// 申请友链两步式弹窗状态：form -> preview
const applyOpen = ref(false)
const applyStep = ref<'form' | 'preview'>('form')
const applyError = ref('')
const previewAvatarBroken = ref(false)

const applyForm = reactive({
  name: '',
  url: '',
  avatar: '',
  tag: '个人博客',
  group: '技术与折腾',
  desc: ''
})

const groupOptions = computed(() => Array.from(new Set(friends.map(item => item.group))))

const groupedFriends = computed(() => {
  const map = new Map<string, FriendItem[]>()
  for (const item of friends) {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
})

const selfAvatarSrc = computed(() => `${baseURL}${siteConfig.avatar.replace(/^\//, '')}`)
const fanGroupQrSrc = computed(() =>
  /^https?:\/\//.test(siteConfig.fanGroupQr)
    ? siteConfig.fanGroupQr
    : `${baseURL}${siteConfig.fanGroupQr.replace(/^\//, '')}`
)

const selfFields = computed(() => [
  { key: 'name', label: '站点名称', value: siteConfig.brand },
  { key: 'desc', label: '站点简介', value: siteConfig.subtitle },
  { key: 'url', label: '站点地址', value: siteConfig.siteUrl },
  { key: 'avatar', label: '站点头像', value: `${siteConfig.siteUrl}/${siteConfig.avatar}` }
])

const selfJsonPayload = computed(() => {
  return JSON.stringify(
    {
      name: siteConfig.brand,
      desc: siteConfig.subtitle,
      url: siteConfig.siteUrl,
      avatar: `${siteConfig.siteUrl}/${siteConfig.avatar}`
    },
    null,
    2
  )
})

const formattedApplication = computed(() => {
  return JSON.stringify(
    {
      name: applyForm.name.trim(),
      url: applyForm.url.trim(),
      avatar: applyForm.avatar.trim() || '(待补充)',
      group: applyForm.group,
      tag: applyForm.tag.trim() || '个人博客',
      desc: applyForm.desc.trim()
    },
    null,
    2
  )
})

watch(() => applyForm.avatar, () => {
  previewAvatarBroken.value = false
})

function resolveAvatar(avatar: string) {
  if (!avatar) return ''
  return /^https?:\/\//.test(avatar) ? avatar : `${baseURL}${avatar.replace(/^\//, '')}`
}

function handleAvatarError(key: string) {
  failedAvatars.value = { ...failedAvatars.value, [key]: true }
}

async function copyText(key: string, text: string) {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 1800)
  }
  catch {
    // 静默忽略非安全上下文剪贴板权限拒绝
  }
}

async function copySelfJson() {
  await copyText('self-json', selfJsonPayload.value)
}

function openApplyModal() {
  applyError.value = ''
  applyStep.value = 'form'
  applyOpen.value = true
}

function closeApplyModal() {
  applyOpen.value = false
}

function backToFormStep() {
  applyError.value = ''
  applyStep.value = 'form'
}

async function goToPreviewStep() {
  const name = applyForm.name.trim()
  const url = applyForm.url.trim()
  const desc = applyForm.desc.trim()

  if (!name || !url || !desc) {
    applyError.value = '请完整填写站点名称、站点地址与站点简介。'
    return
  }

  if (!/^https?:\/\/.+/.test(url)) {
    applyError.value = '站点地址请以 http:// 或 https:// 开头。'
    return
  }

  applyError.value = ''
  applyStep.value = 'preview'
  await copyText('apply-payload', formattedApplication.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && applyOpen.value) {
    closeApplyModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="friends-page">
    <!-- 友链分组卡片网格 -->
    <div class="friends-groups">
      <section
        v-for="section in groupedFriends"
        :key="section.group"
        class="friends-group"
        :aria-label="section.group"
      >
        <div class="friends-group-head">
          <h2 class="friends-group-pill">
            <i aria-hidden="true" />
            {{ section.group }}
          </h2>
        </div>

        <div class="friends-grid">
          <a
            v-for="friend in section.items"
            :key="friend.name"
            :href="friend.url"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-card"
          >
            <!-- 左侧虚线双环圆形头像 -->
            <span class="friend-avatar-ring" aria-hidden="true">
              <span class="friend-avatar-inner">
                <img
                  v-if="friend.avatar && !failedAvatars[friend.name]"
                  :src="resolveAvatar(friend.avatar)"
                  :alt="friend.name"
                  loading="lazy"
                  class="friend-avatar-img"
                  @error="handleAvatarError(friend.name)"
                >
                <span v-else class="friend-avatar-fallback">
                  {{ friend.name.slice(0, 1) }}
                </span>
              </span>
            </span>

            <!-- 右侧：昵称 + 轻标签 + 简介 -->
            <div class="friend-info">
              <div class="friend-head-row">
                <h3 class="friend-name">{{ friend.name }}</h3>
                <span class="friend-tag">{{ friend.tag }}</span>
              </div>
              <p class="friend-desc">{{ friend.desc }}</p>
            </div>
          </a>
        </div>
      </section>
    </div>

    <!-- 底部独立区块一：友链申请（居中极简：头像 → 站点名 → 申请/复制 JSON → 4 字段卡片） -->
    <section class="friends-group friend-apply-section" aria-label="友链申请">
      <div class="friends-group-head">
        <h2 class="friends-group-pill">
          <i aria-hidden="true" />
          友链申请
        </h2>
      </div>

      <div class="friend-apply-body">
        <div class="friend-apply-center">
          <span class="friend-avatar-ring friend-self-avatar" aria-hidden="true">
            <span class="friend-avatar-inner">
              <img :src="selfAvatarSrc" :alt="siteConfig.brand" class="friend-avatar-img" loading="lazy">
            </span>
          </span>

          <h3 class="friend-self-name">{{ siteConfig.brand }}</h3>

          <div class="friend-apply-actions">
            <button
              type="button"
              class="friend-action-btn-primary"
              @click="openApplyModal"
            >
              <Plus :size="14" :stroke-width="2.2" aria-hidden="true" />
              <span>申请友链</span>
            </button>
            <button
              type="button"
              class="friend-action-btn-secondary"
              :class="{ 'is-copied': copiedKey === 'self-json' }"
              @click="copySelfJson"
            >
              <Check v-if="copiedKey === 'self-json'" :size="13" aria-hidden="true" />
              <Copy v-else :size="13" aria-hidden="true" />
              <span>{{ copiedKey === 'self-json' ? '已复制 JSON' : '一键复制 JSON' }}</span>
            </button>
          </div>
        </div>

        <!-- 4 列自适应点击复制卡片 -->
        <div class="friend-meta-grid">
          <button
            v-for="field in selfFields"
            :key="field.key"
            type="button"
            class="friend-meta-item"
            :class="{ 'is-copied': copiedKey === field.key }"
            :title="`点击复制${field.label}`"
            @click="copyText(field.key, field.value)"
          >
            <span class="friend-meta-top">
              <span>{{ field.label }}</span>
              <span class="friend-meta-state">
                <Check v-if="copiedKey === field.key" :size="11.5" aria-hidden="true" />
                <Copy v-else :size="11.5" aria-hidden="true" />
                <span>{{ copiedKey === field.key ? '已复制' : '复制' }}</span>
              </span>
            </span>
            <span class="friend-meta-val">{{ field.value }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 底部独立区块二：研发空间交流群（仅展示居中二维码，零冗余描述） -->
    <section class="friends-group friend-community-section" aria-label="研发空间交流群">
      <div class="friends-group-head">
        <h2 class="friends-group-pill">
          <i aria-hidden="true" />
          研发空间交流群
        </h2>
      </div>

      <div class="friend-community-qr-only">
        <div class="friend-qr-frame">
          <img
            :src="fanGroupQrSrc"
            alt="研发空间交流群二维码"
            loading="lazy"
            class="friend-qr-img"
          >
        </div>
      </div>
    </section>

    <!-- 申请友链弹窗（两步式：第一步填表，下一步查看卡片预览并复制 JSON） -->
    <Teleport to="body">
      <Transition name="friend-modal-fade">
        <div
          v-if="applyOpen"
          class="friend-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-apply-title"
          @click.self="closeApplyModal"
        >
          <div class="friend-modal">
            <div class="friend-modal-head">
              <div>
                <h3 id="friend-apply-title" class="friend-modal-title">
                  {{ applyStep === 'form' ? '申请交换友链' : '预览友链效果' }}
                </h3>
                <p class="friend-modal-sub">
                  {{ applyStep === 'form' ? '填写你的站点信息，点击下一步即可预览卡片效果并生成 JSON 配置。' : '确认展示效果无误后，将下方 JSON 发到研发空间交流群即可。' }}
                </p>
              </div>
              <button
                type="button"
                class="friend-modal-close"
                aria-label="关闭申请弹窗"
                @click="closeApplyModal"
              >
                <X :size="15" aria-hidden="true" />
              </button>
            </div>

            <!-- 第一步：纯表单填写（不展示预览） -->
            <form v-if="applyStep === 'form'" class="friend-modal-form" @submit.prevent="goToPreviewStep">
              <div class="friend-form-row">
                <label class="friend-field">
                  <span class="friend-field-label">站点名称<span class="friend-field-req">*</span></span>
                  <input
                    v-model="applyForm.name"
                    type="text"
                    class="friend-input"
                    placeholder="例如：风物笔记"
                    maxlength="28"
                  >
                </label>

                <label class="friend-field">
                  <span class="friend-field-label">站点地址<span class="friend-field-req">*</span></span>
                  <input
                    v-model="applyForm.url"
                    type="url"
                    class="friend-input"
                    placeholder="https://example.com"
                  >
                </label>
              </div>

              <div class="friend-form-row">
                <label class="friend-field">
                  <span class="friend-field-label">站点头像链接</span>
                  <input
                    v-model="applyForm.avatar"
                    type="url"
                    class="friend-input"
                    placeholder="https://example.com/avatar.png"
                  >
                </label>

                <label class="friend-field">
                  <span class="friend-field-label">定位标签</span>
                  <input
                    v-model="applyForm.tag"
                    type="text"
                    class="friend-input"
                    placeholder="例如：前端工程 / 生活志"
                    maxlength="12"
                  >
                </label>
              </div>

              <label class="friend-field">
                <span class="friend-field-label">站点简介<span class="friend-field-req">*</span></span>
                <textarea
                  v-model="applyForm.desc"
                  class="friend-textarea"
                  placeholder="简单介绍一下你的博客内容方向（建议 35 字以内）"
                  maxlength="80"
                />
              </label>

              <p v-if="applyError" class="friend-form-error">{{ applyError }}</p>

              <div class="friend-modal-actions">
                <button type="button" class="friend-modal-cancel" @click="closeApplyModal">
                  取消
                </button>
                <button type="submit" class="friend-modal-submit">
                  <span>下一步：预览效果</span>
                  <ArrowRight :size="13.5" aria-hidden="true" />
                </button>
              </div>
            </form>

            <!-- 第二步：点击下一步后的卡片效果预览 + JSON 配置 -->
            <div v-else class="friend-result-box">
              <div class="friend-modal-preview">
                <span class="friend-modal-preview-label">友链卡片效果预览</span>
                <div class="friend-card">
                  <span class="friend-avatar-ring" aria-hidden="true">
                    <span class="friend-avatar-inner">
                      <img
                        v-if="applyForm.avatar.trim() && !previewAvatarBroken"
                        :src="applyForm.avatar.trim()"
                        :alt="applyForm.name || '预览头像'"
                        class="friend-avatar-img"
                        @error="previewAvatarBroken = true"
                      >
                      <span v-else class="friend-avatar-fallback">
                        {{ (applyForm.name.trim() || '友').slice(0, 1) }}
                      </span>
                    </span>
                  </span>
                  <div class="friend-info">
                    <div class="friend-head-row">
                      <span class="friend-name">{{ applyForm.name.trim() || '你的站点名称' }}</span>
                      <span class="friend-tag">{{ applyForm.tag.trim() || '个人博客' }}</span>
                    </div>
                    <p class="friend-desc">
                      {{ applyForm.desc.trim() || '一句话介绍你的博客、记录主题或数字花园风格。' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="friend-result-head">
                <Check :size="15" aria-hidden="true" />
                <span>JSON 配置已生成{{ copiedKey === 'apply-payload' ? '并复制到剪贴板' : '' }}</span>
              </div>
              <pre class="friend-result-pre">{{ formattedApplication }}</pre>

              <div class="friend-modal-actions">
                <button type="button" class="friend-modal-cancel" @click="backToFormStep">
                  <ArrowLeft :size="13" aria-hidden="true" />
                  <span>返回修改</span>
                </button>
                <button
                  type="button"
                  class="friend-modal-cancel"
                  @click="copyText('apply-payload', formattedApplication)"
                >
                  <Check v-if="copiedKey === 'apply-payload'" :size="13" aria-hidden="true" />
                  <Copy v-else :size="13" aria-hidden="true" />
                  <span>{{ copiedKey === 'apply-payload' ? '已复制 JSON' : '复制 JSON' }}</span>
                </button>
                <button type="button" class="friend-modal-submit" @click="closeApplyModal">
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
