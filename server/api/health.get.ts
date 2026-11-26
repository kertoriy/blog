// 动画与课程设置在浏览器运行，此接口仅供检查 Nuxt 服务是否存活。
export default defineEventHandler(() => ({ ok: true, timestamp: new Date().toISOString() }))
