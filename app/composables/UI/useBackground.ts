import type { backgroundSettings } from "@/lib/background_settings"

export function useBackground() {
  // Grouped background state
  const backgroundState = useState('background', () => ({
    src: "",
    opacity: 0,
    blur: 0,
    height: 0,
    isLoaded: false,
    refreshKey: 0
  }))
  
  const img = useImage()

  
  const setBackground = (src: string, settings: backgroundSettings) => {
    const { opacity: setOpacity, blur, height } = settings
    if (!src) {
      resetBackground()
      return
    }

    if(src == "original") {
      backgroundState.value.opacity = setOpacity
      backgroundState.value.blur = blur
      backgroundState.value.height = height
      backgroundState.value.isLoaded = true
      backgroundState.value.refreshKey++
      return
    }
    // Process the image URL consistently for both SSR and client
    const processedSrc = img(src.replace('cdn://', '/'), {}, {provider: src.startsWith('cdn://') ? 'aliyun':'ipx'})

    if(backgroundState.value.src == processedSrc) {
      backgroundState.value.opacity = setOpacity
      backgroundState.value.blur = blur
      backgroundState.value.height = height
      backgroundState.value.isLoaded = true
      backgroundState.value.refreshKey++
      return
    }
    
    backgroundState.value.src = processedSrc
    
    console.log('set Background:', backgroundState.value.src)
    backgroundState.value.opacity = setOpacity
    backgroundState.value.blur = blur
    backgroundState.value.height = height
  }
  
  const resetBackground = () => {
    backgroundState.value.opacity = 0
    backgroundState.value.blur = 0
    backgroundState.value.refreshKey++
  }
  
  return {
    // State
    src: computed(() => backgroundState.value.src),
    opacity: computed(() => backgroundState.value.opacity),
    blur: computed(() => backgroundState.value.blur),
    height: computed(() => backgroundState.value.height),
    isLoaded: computed(() => backgroundState.value.isLoaded),
    refreshKey: computed(() => backgroundState.value.refreshKey),
    // Actions
    setBackground,
    resetBackground
  }
} 