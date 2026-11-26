export function useAppLoading() {
  // 默认不遮罩全屏，仅在明确需要全屏加载时手动调用 showFullScreenLoading()
  const fullScreenLoading = useState<boolean>('ker-fullscreen-loading', () => false)

  function showFullScreenLoading() {
    fullScreenLoading.value = true
  }

  function hideFullScreenLoading() {
    fullScreenLoading.value = false
  }

  return {
    fullScreenLoading: readonly(fullScreenLoading),
    showFullScreenLoading,
    hideFullScreenLoading
  }
}
