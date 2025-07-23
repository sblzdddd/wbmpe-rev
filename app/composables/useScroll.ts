const isOnTop = ref(true)

export const useScrollBar = () => {
  if(typeof window === 'undefined') return {isOnTop: true}
  window.addEventListener('scroll', () => {
    isOnTop.value = window.scrollY === 0
  })
  return {
    isOnTop,
  }
}
