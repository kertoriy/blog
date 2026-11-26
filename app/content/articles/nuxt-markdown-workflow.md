---
title: Markdown 写作与静态化部署工作流
slug: nuxt-markdown-workflow
date: 2026-05-16
category: 工程实践
tags: [Nuxt, Markdown, 工作流]
readTime: 8 min
cover: covers/markdown-workflow.jpg
summary: 拆解本地撰写 Markdown、目录自动解析与推送部署的极简博客工作流，兼顾写作效率与阅读质感。
---

## 本地撰写，构建即发布

对于个人博客而言，最省心也最长久的维护方式，依然是以 Git 仓库管理 Markdown 文档。文章正文不依赖外部富文本数据库，任何编辑器都能直接打开修改。

1. 在本地用习惯的编辑器（VS Code、Typora 或 Obsidian）撰写标准 Markdown 文档。
2. 将 `.md` 文件保存到 `app/content/articles/` 目录，本地开发服务会即时热更新预览。
3. 推送到 GitHub 仓库后，GitHub Actions 自动执行静态构建并部署，首页、文库、归档与详情页同步更新。

## 为什么克制色彩更耐看

文档型博客的核心是文字层级，而不是花哨的装饰色。如果每张卡片都分配不同饱和度的彩虹底色，读者的注意力很快会被色块分散。

> 将页面 95% 以上的面积交还给纯净的灰白层级，只把单一强调色留给真正需要点击的焦点元素。

### 排版与可读性要点

- 正文行宽控制在 `680px ~ 740px`，行高保持在 `1.8` 左右，长时间阅读更舒适。
- 标题字重使用 `600 ~ 650`，避免过粗的黑体带来压迫感。
- 行内代码与标签采用低对比浅灰底胶囊，与正文字流自然融合。

```ts
// 自动加载目录中的所有 Markdown 文章
const rawArticles = import.meta.glob('../content/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})
```
