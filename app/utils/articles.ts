import { parseMarkdownDocument, type TocHeading } from './markdown'

export interface BlogArticle {
  id: string
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  readTime: string
  wordCount: number
  summary: string
  cover: string
  body: string
  html: string
  headings: TocHeading[]
}

const rawModules = import.meta.glob<string>('../content/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

function extractSummary(body: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s+.+$/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 110 ? `${plain.slice(0, 110)}…` : plain
}

function countBodyWords(body: string): number {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[#>*_\-[\]()]/g, ' ')
    .replace(/\s+/g, '')
  return cleaned.length
}

function estimateReadTime(wordCount: number): string {
  return `${Math.max(1, Math.ceil(wordCount / 300))} min`
}

export const articles: BlogArticle[] = Object.entries(rawModules)
  .map(([path, raw], index) => {
    const fileSlug = path.split('/').pop()?.replace(/\.md$/, '') ?? `article-${index + 1}`
    const parsed = parseMarkdownDocument(raw)
    const slug = parsed.meta.slug && parsed.meta.slug !== 'untitled' ? parsed.meta.slug : fileSlug
    const hasExplicitReadTime = /^readTime\s*:/m.test(raw)
    const wordCount = countBodyWords(parsed.body)

    return {
      id: slug,
      slug,
      title: parsed.meta.title,
      date: parsed.meta.date,
      category: parsed.meta.category,
      tags: parsed.meta.tags,
      readTime: hasExplicitReadTime ? parsed.meta.readTime : estimateReadTime(wordCount),
      wordCount,
      summary: parsed.meta.summary || extractSummary(parsed.body),
      cover: parsed.meta.cover,
      body: parsed.body,
      html: parsed.html,
      headings: parsed.headings
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

export const siteArticleStats = (() => {
  const totalArticles = articles.length
  const totalWords = articles.reduce((sum, article) => sum + article.wordCount, 0)
  const totalTags = new Set(articles.flatMap(article => article.tags)).size
  const categoryMap = new Map<string, number>()

  for (const article of articles) {
    categoryMap.set(article.category, (categoryMap.get(article.category) ?? 0) + 1)
  }

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: totalArticles ? Math.round((count / totalArticles) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalArticles,
    totalWords,
    avgWords: totalArticles ? Math.round(totalWords / totalArticles) : 0,
    totalTags,
    totalCategories: categories.length,
    categories,
    latestDate: articles[0]?.date ?? '—'
  }
})()

export function getArticleBySlug(slug: string): BlogArticle {
  return articles.find(item => item.slug === slug) ?? articles[0]!
}

export function getArchiveGroups() {
  const map = new Map<string, Map<string, BlogArticle[]>>()
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  for (const article of articles) {
    const [year = '未知', monthStr = '01'] = article.date.split('-')
    const monthName = monthNames[Math.max(0, Number(monthStr) - 1)] ?? monthStr

    if (!map.has(year)) map.set(year, new Map())
    const yearMap = map.get(year)!
    if (!yearMap.has(monthName)) yearMap.set(monthName, [])
    yearMap.get(monthName)!.push(article)
  }

  return Array.from(map.entries()).map(([year, months]) => ({
    year,
    months: Array.from(months.entries()).map(([name, items]) => ({
      name,
      count: items.length,
      items
    }))
  }))
}
