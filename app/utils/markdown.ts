export interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

export interface ParsedFrontmatter {
  title: string
  slug: string
  date: string
  category: string
  tags: string[]
  readTime: string
  summary: string
  cover: string
}

export interface ParsedMarkdown {
  meta: ParsedFrontmatter
  body: string
  html: string
  headings: TocHeading[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInline(raw: string): string {
  let out = escapeHtml(raw)
  // 行内代码优先处理，避免内部符号被误解析
  const codeTokens: string[] = []
  out = out.replace(/`([^`]+)`/g, (_, code: string) => {
    const idx = codeTokens.length
    codeTokens.push(`<code class="md-inline-code">${code}</code>`)
    return `@@CODE_${idx}@@`
  })

  out = out
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')

  return out.replace(/@@CODE_(\d+)@@/g, (_, idx: string) => codeTokens[Number(idx)] ?? '')
}

function slugifyHeading(text: string, index: number): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
  return cleaned ? `${cleaned}-${index}` : `section-${index}`
}

export function parseFrontmatter(raw: string): { meta: ParsedFrontmatter, body: string } {
  const normalized = raw.replace(/\r\n/g, '\n').trimStart()
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  const data: Record<string, string | string[]> = {}
  let body = normalized

  if (match) {
    const front = match[1] ?? ''
    body = (match[2] ?? '').trim()

    for (const line of front.split('\n')) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (!key) continue

      if (value.startsWith('[') && value.endsWith(']')) {
        data[key] = value
          .slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      }
      else {
        data[key] = value.replace(/^['"]|['"]$/g, '')
      }
    }
  }

  const meta: ParsedFrontmatter = {
    title: typeof data.title === 'string' ? data.title : '未命名文章',
    slug: typeof data.slug === 'string' ? data.slug : 'untitled',
    date: typeof data.date === 'string' ? data.date : '',
    category: typeof data.category === 'string' ? data.category : '随笔',
    tags: Array.isArray(data.tags) ? data.tags : [],
    readTime: typeof data.readTime === 'string' ? data.readTime : '5 min',
    summary: typeof data.summary === 'string' ? data.summary : '',
    cover: typeof data.cover === 'string' ? data.cover : ''
  }

  return { meta, body }
}

export function renderMarkdown(markdown: string): { html: string, headings: TocHeading[] } {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  const headings: TocHeading[] = []

  let i = 0
  let headingIdx = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    if (!line.trim()) {
      i++
      continue
    }

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1] || 'text'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        codeLines.push(lines[i] ?? '')
        i++
      }
      i++ // skip closing ```
      blocks.push(
        `<pre class="md-pre" data-lang="${escapeHtml(lang)}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      )
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push('<hr class="md-hr" />')
      i++
      continue
    }

    // Headings
    const heading = line.match(/^(#{2,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1]!.length as 2 | 3
      const rawText = heading[2]!.trim()
      headingIdx++
      const id = slugifyHeading(rawText, headingIdx)
      headings.push({ id, text: rawText, level })
      blocks.push(`<h${level} id="${id}" class="md-h${level}">${renderInline(rawText)}</h${level}>`)
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i] ?? '').startsWith('>')) {
        quoteLines.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i++
      }
      blocks.push(`<blockquote class="md-quote">${quoteLines.map(renderInline).join('<br />')}</blockquote>`)
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        items.push(`<li>${renderInline((lines[i] ?? '').replace(/^[-*]\s+/, ''))}</li>`)
        i++
      }
      blocks.push(`<ul class="md-ul">${items.join('')}</ul>`)
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? '')) {
        items.push(`<li>${renderInline((lines[i] ?? '').replace(/^\d+\.\s+/, ''))}</li>`)
        i++
      }
      blocks.push(`<ol class="md-ol">${items.join('')}</ol>`)
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (
      i < lines.length
      && (lines[i] ?? '').trim()
      && !(lines[i] ?? '').startsWith('```')
      && !(lines[i] ?? '').startsWith('>')
      && !/^(#{2,3})\s+/.test(lines[i] ?? '')
      && !/^[-*]\s+/.test(lines[i] ?? '')
      && !/^\d+\.\s+/.test(lines[i] ?? '')
      && !/^---+$/.test((lines[i] ?? '').trim())
    ) {
      paraLines.push((lines[i] ?? '').trim())
      i++
    }
    blocks.push(`<p class="md-p">${renderInline(paraLines.join(' '))}</p>`)
  }

  return { html: blocks.join('\n'), headings }
}

export function parseMarkdownDocument(raw: string): ParsedMarkdown {
  const { meta, body } = parseFrontmatter(raw)
  const { html, headings } = renderMarkdown(body)
  return { meta, body, html, headings }
}
