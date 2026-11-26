/**
 * 站点内容统一加载入口。
 *
 * 所有可维护数据都以文件形式存放在 `app/content/` 下，组件与页面只读取这里导出的结果：
 * - 文章正文：`app/content/articles/*.md`（由 `~/utils/articles` 解析）
 * - 站点配置：`app/content/site.json`
 * - 常用网站：`app/content/sites.json`
 * - 友链：`app/content/friends.json`
 * - 碎碎念：`app/content/notes/*.txt`（一条记录一个文件，文件名格式见下方注释）
 * - 关于页面：`app/content/about.json`
 *
 * 日常维护只需编辑上述数据文件，无需改动组件代码。
 */

import aboutFile from '~/content/about.json'
import friendsFile from '~/content/friends.json'
import siteFile from '~/content/site.json'
import sitesFile from '~/content/sites.json'

/* -------------------------------------------------------------------------- */
/* 站点基础配置                                                                */
/* -------------------------------------------------------------------------- */

export interface SiteConfig {
  brand: string
  /** 站点/系统全名，用于页面标题、面包屑与首页主标题 */
  name: string
  subtitle: string
  siteUrl: string
  avatar: string
  fanGroupQr: string
  fanGroupName: string
  fanGroupDesc: string
  fanGroupNote: string
  heroImage: string
  launchedAt: string
  baseViews: number
  baseVisitors: number
  copyright: string
  icp: string
  icpUrl: string
}

export const siteConfig = siteFile as SiteConfig

/* -------------------------------------------------------------------------- */
/* 常用网站                                                                    */
/* -------------------------------------------------------------------------- */

export interface SiteLinkItem {
  title: string
  desc: string
  category: string
  url: string
  /** 网站 Logo 路径（支持 public/sites/*.svg 本地路径或在线 favicon URL） */
  logo: string
  /** 深色模式下是否自动反色（适用于 ChatGPT、GitHub 等纯黑单色品牌图标） */
  invertDark?: boolean
}

export const siteLinks = (sitesFile as SiteLinkItem[]).map(item => ({
  ...item,
  invertDark: item.invertDark === true
}))

/* -------------------------------------------------------------------------- */
/* 友链                                                                        */
/* -------------------------------------------------------------------------- */

export interface FriendItem {
  name: string
  desc: string
  url: string
  /** 博主头像路径（支持 public/friends/*.svg 或在线图片 URL，加载失败回退首字母） */
  avatar: string
  group: string
  tag: string
}

export const friends = friendsFile as FriendItem[]

/* -------------------------------------------------------------------------- */
/* 碎碎念                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 一条碎碎念 = 一个纯文本文件，放在 `app/content/notes/` 下。
 * 文件名固定格式：`YYYY-MM-DD-标签.txt`，例如：
 *
 * - `2026-11-23-随想.txt` → 2026-11-23 / 随想
 * - `2026-11-22-折腾.txt` → 2026-11-22 / 折腾
 *
 * 同一天需要记多条时，在末尾追加序号区分：`2026-11-23-随想-2.txt`。
 * 文件正文即碎碎念内容，支持普通换行，空行分段，不做 Markdown 渲染。
 */

const NOTE_TAGS = ['随想', '折腾', '灵感', '日常'] as const

export type NoteTag = typeof NOTE_TAGS[number]

export const noteTags: NoteTag[] = [...NOTE_TAGS]

export interface NoteItem {
  id: string
  /** 发布日期，格式：YYYY-MM-DD */
  date: string
  /** 统一标签（与顶部筛选栏一一对应） */
  tag: NoteTag
  /** 纯文本内容，支持普通换行，不做 Markdown 渲染 */
  content: string
}

const noteFileModules = import.meta.glob<string>('../content/notes/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true
})

const NOTE_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})-([^\s-]+)(?:-(\d+))?$/

function parseNoteFile(baseName: string, raw: string): NoteItem | null {
  const matched = baseName.match(NOTE_FILE_PATTERN)
  const [, date, tag] = matched ?? []
  const month = date ? Number(date.slice(5, 7)) : 0
  const day = date ? Number(date.slice(8, 10)) : 0

  if (
    !matched
    || !date
    || !NOTE_TAGS.includes(tag as NoteTag)
    || month < 1
    || month > 12
    || day < 1
    || day > 31
  ) {
    if (import.meta.dev) {
      console.warn(
        `[碎碎念] 跳过无法解析的文件：${baseName}.txt，文件名应为 YYYY-MM-DD-标签.txt（标签限：${NOTE_TAGS.join(' / ')}）`
      )
    }
    return null
  }

  const content = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim()

  if (!content) {
    if (import.meta.dev) {
      console.warn(`[碎碎念] 跳过内容为空的文件：${baseName}.txt`)
    }
    return null
  }

  return {
    id: baseName,
    date,
    tag: tag as NoteTag,
    content
  }
}

export const notes: NoteItem[] = Object.entries(noteFileModules)
  .map(([path, raw]) => parseNoteFile(path.split('/').pop()?.replace(/\.txt$/, '') ?? '', raw))
  .filter((note): note is NoteItem => note !== null)
  .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))

/* -------------------------------------------------------------------------- */
/* 关于页面                                                                    */
/* -------------------------------------------------------------------------- */

export interface AboutProfile {
  greeting: string
  tagline: string
  birthYear: string
  codingSince: string
  badges: string[]
}

export type AboutDeviceIcon =
  | 'laptop'
  | 'server'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'gamepad'
  | 'mic'
  | 'headphones'
  | 'smartphone'

export interface AboutDevice {
  id: string
  role: string
  name: string
  shortName: string
  desc: string
  image: string
  icon: AboutDeviceIcon
  deskPos: {
    x: number
    y: number
  }
}

export interface AboutTech {
  name: string
  note: string
  logo: string
  invertDark?: boolean
}

export interface AboutGame {
  name: string
  genre: string
  desc: string
  image: string
}

export interface IntpDimension {
  letter: 'I' | 'N' | 'T' | 'P'
  title: string
  desc: string
}

export interface AboutPersonality {
  mbti: string
  archetype: string
  mascot: string
  summary: string
  dimensions: IntpDimension[]
}

export interface AboutFutureStatus {
  title: string
  badge: string
  subtitle: string
}

export interface AboutSocial {
  key: string
  name: string
  handle: string
  logo?: string
  invertDark?: boolean
  icon?: 'mail' | 'message' | 'tv' | 'globe'
}

export const aboutProfile = aboutFile.profile as AboutProfile
export const aboutDeskImage = aboutFile.deskImage as string
export const aboutDevices = aboutFile.devices as AboutDevice[]
export const aboutTechs = aboutFile.techs as AboutTech[]
export const aboutTools = aboutFile.tools as AboutTech[]
export const aboutModels = aboutFile.models as AboutTech[]
export const aboutGames = aboutFile.games as AboutGame[]
export const aboutPersonality = aboutFile.personality as AboutPersonality
export const aboutFutureStatus = aboutFile.futureStatus as AboutFutureStatus
export const aboutSocials = aboutFile.socials as AboutSocial[]
