export type BlogTheme = 'anime' | 'classic'

const theme = ref<BlogTheme>('anime')

export const useTheme = () => {
  const setTheme = (nextTheme: BlogTheme) => {
    theme.value = nextTheme

    if (import.meta.client) {
      document.documentElement.dataset.theme = nextTheme
      localStorage.setItem('ker-edit-theme', nextTheme)
    }
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'anime' ? 'classic' : 'anime')
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('ker-edit-theme') as BlogTheme | null

    if (savedTheme === 'anime' || savedTheme === 'classic') {
      setTheme(savedTheme)
      return
    }

    setTheme(theme.value)
  })

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme
  }
}
