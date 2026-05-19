import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    mysql: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || 'ker_edit_blog',
      user: process.env.MYSQL_USER || 'ker_blog',
      password: process.env.MYSQL_PASSWORD || ''
    },
    mongodb: {
      uri: process.env.MONGODB_URI || '',
      database: process.env.MONGODB_DATABASE || 'ker_edit_blog'
    },
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || ''
    },
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || ''
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      include: ['lucide-vue-next']
    }
  }
})
