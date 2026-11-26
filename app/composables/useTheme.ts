export type BlogTheme = 'light' | 'dark'

export const useTheme = () => {
  const theme = useState<BlogTheme>('ker-edit-theme', () => 'dark')

  const applyTheme = (nextTheme: BlogTheme) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.setAttribute('data-theme', nextTheme)
    root.classList.toggle('dark', nextTheme === 'dark')
    root.style.colorScheme = nextTheme
  }

  const setTheme = (nextTheme: BlogTheme) => {
    theme.value = nextTheme
    applyTheme(nextTheme)

    if (import.meta.client) {
      localStorage.setItem('ker-edit-theme', nextTheme)
    }
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    const saved = localStorage.getItem('ker-edit-theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    }
    else {
      applyTheme(theme.value)
    }
  })

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme
  }
}
