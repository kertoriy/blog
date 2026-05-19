/** 纯数据 mock，不引入图标或重型依赖，避免被布局/首页连带加载 */

export const articles = [
  {
    id: 'a1',
    title: '把博客做成自己的知识庭院',
    slug: 'knowledge-garden',
    summary: '从文章、专题、标签到关系图，让内容不再只是时间线，而是能被反复进入的知识体系。',
    cover: 'linear-gradient(135deg, #8bbcff, #ffb3d8)',
    category: '产品设计',
    tags: ['知识库', '博客系统'],
    readTime: '8 min',
    date: '2026-05-17',
    tone: '#4f8df7'
  },
  {
    id: 'a2',
    title: 'Nuxt 与 Tiptap 的前后台一体编辑模式',
    slug: 'nuxt-tiptap-editing',
    summary: '后台不再是另一个管理平台，而是在前台体验上叠加编辑、发布与关系维护。',
    cover: 'linear-gradient(135deg, #b7a1ed, #e8c2d5)',
    category: '工程实践',
    tags: ['Nuxt', 'Tiptap'],
    readTime: '11 min',
    date: '2026-05-16',
    tone: '#8b72dc'
  },
  {
    id: 'a3',
    title: '用 Vue Flow 表达文章之间的脉络',
    slug: 'vue-flow-relations',
    summary: '把引用、前置知识和延伸阅读变成可视化节点，让读者可以沿着关系继续探索。',
    cover: 'linear-gradient(135deg, #89dbe8, #9fa7d8)',
    category: '可视化',
    tags: ['Vue Flow', '知识图谱'],
    readTime: '6 min',
    date: '2026-05-15',
    tone: '#48b7b2'
  }
]

export const siteLinks = [
  { title: 'Nuxt Docs', desc: 'Nuxt 官方文档与 API 查询', category: '开发', url: 'https://nuxt.com', icon: 'code2' },
  { title: 'Vue Flow', desc: '知识关系图和节点编排', category: '可视化', url: 'https://vueflow.dev', icon: 'network' },
  { title: 'Tiptap', desc: '可扩展富文本编辑器内核', category: '编辑器', url: 'https://tiptap.dev', icon: 'pen-line' },
  { title: '腾讯云 COS', desc: '图片和静态资源对象存储', category: '云服务', url: 'https://cloud.tencent.com/product/cos', icon: 'globe' },
  { title: 'Lucide', desc: '干净统一的图标系统', category: '设计', url: 'https://lucide.dev', icon: 'brush' },
  { title: 'Tailwind CSS', desc: '快速构建设计变量和界面', category: '样式', url: 'https://tailwindcss.com', icon: 'type' }
]

export const archiveGroups = [
  { year: '2026', months: [{ name: '五月', count: 12 }, { name: '四月', count: 18 }, { name: '三月', count: 9 }] },
  { year: '2025', months: [{ name: '十二月', count: 16 }, { name: '十一月', count: 14 }, { name: '十月', count: 11 }] }
]

export const friends = [
  { name: '风物笔记', desc: '记录前端、设计和一点生活观察。', url: '#', tone: 'from-blue-300 to-pink-300' },
  { name: '紫藤书房', desc: '偏古风审美的个人知识库。', url: '#', tone: 'from-purple-300 to-rose-200' },
  { name: '半糖实验室', desc: '工程实践、效率工具和折腾记录。', url: '#', tone: 'from-cyan-300 to-violet-300' }
]

export const graphNodes = [
  { id: '1', type: 'input', position: { x: 40, y: 80 }, data: { label: '个人博客知识库' } },
  { id: '2', position: { x: 310, y: 20 }, data: { label: 'Tiptap 编辑体验' } },
  { id: '3', position: { x: 320, y: 170 }, data: { label: 'Vue Flow 关系图' } },
  { id: '4', position: { x: 610, y: 96 }, data: { label: '文章系列' } },
  { id: '5', type: 'output', position: { x: 840, y: 96 }, data: { label: '公开阅读路径' } }
]

export const graphEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '编辑' },
  { id: 'e1-3', source: '1', target: '3', label: '关联' },
  { id: 'e2-4', source: '2', target: '4', label: '沉淀' },
  { id: 'e3-4', source: '3', target: '4', label: '组织' },
  { id: 'e4-5', source: '4', target: '5', label: '导览' }
]
