

export const useScrollBar = () => {
  const scrollbarState = useState('scrollbarState', () => ({
    isOnTop: false,
    scrollY: 0,
  }))
  if(typeof window === 'undefined') return {isOnTop: computed(() => scrollbarState.value.isOnTop), scrollY: computed(() => scrollbarState.value.scrollY)}
  window.addEventListener('scroll', () => {
    scrollbarState.value.isOnTop = window.scrollY === 0
    scrollbarState.value.scrollY = window.scrollY
  })
  if(import.meta.client) {
    onMounted(() => {
      scrollbarState.value.isOnTop = window.scrollY === 0
    })
  }
  return {
    isOnTop: computed(() => scrollbarState.value.isOnTop),
    scrollY: computed(() => scrollbarState.value.scrollY),
  }
}
