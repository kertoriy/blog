import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

function getMarkdownArticleRoutes(): string[] {
  const articlesDir = join(process.cwd(), 'app/content/articles')
  try {
    return readdirSync(articlesDir)
      .filter(file => file.endsWith('.md'))
      .map((file) => {
        const raw = readFileSync(join(articlesDir, file), 'utf-8')
        const slugMatch = raw.match(/^---\r?\n[\s\S]*?^slug:\s*['"]?([^\r\n'"]+)['"]?[\s\S]*?^---/m)
        const slug = slugMatch?.[1]?.trim() || file.replace(/\.md$/, '')
        return `/library/${slug}`
      })
  }
  catch {
    return []
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: [
    '~/assets/css/main.css',
    '~/assets/css/blog-shell.css',
    '~/assets/css/blog-home.css',
    '~/assets/css/library-honeycomb.css',
    '~/assets/css/blog-archive.css',
    '~/assets/css/blog-notes.css',
    '~/assets/css/blog-sites.css',
    '~/assets/css/blog-friends.css',
    '~/assets/css/blog-trash.css',
    '~/assets/css/blog-about.css',
    '~/assets/css/article-reader.css'
  ],
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/library',
        '/notes',
        '/archive',
        '/sites',
        '/friends',
        '/trash',
        '/about',
        ...getMarkdownArticleRoutes()
      ]
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      include: ['lucide-vue-next', 'chart.js']
    }
  }
})
