

export function useBackground() {
  const backgroundSrc = useState<string>("backdropSrc", () => "")
  const opacity = useState<number>("backdropOpacity", () => 0)
  const imageBlur = useState<number>("backdropBlur", () => 0)
  const imageHeight = useState<number>("backdropHeight", () => 0)
  const isImageLoaded = useState('isBackdropLoaded', () => false)
  const refreshKey = useState('backdropRefreshKey', () => 0)
  
  const img = useImage()

  const currentBackground = computed(() => backgroundSrc.value)
  
  const setBackground = (src: string, setOpacity: number = 1, blur: number = 0, height: number = 50) => {
    if (!src) {
      resetBackground()
      return
    }

    if(src == "original") {
      opacity.value = setOpacity
      imageBlur.value = blur
      imageHeight.value = height
      isImageLoaded.value = true
      refreshKey.value++
      return
    }
    // Process the image URL consistently for both SSR and client
    const processedSrc = img(src.replace('cdn://', '/'), {}, {provider: src.startsWith('cdn://') ? 'aliyun':'ipx'})

    if(backgroundSrc.value == processedSrc) {
      opacity.value = setOpacity
      imageBlur.value = blur
      imageHeight.value = height
      isImageLoaded.value = true
      refreshKey.value++
      return
    }
    
    backgroundSrc.value = processedSrc
    
    console.log('set Background:', backgroundSrc.value)
    opacity.value = setOpacity
    imageBlur.value = blur
    imageHeight.value = height
  }
  
  const resetBackground = () => {
    opacity.value = 0
    imageBlur.value = 0
    refreshKey.value++
  }
  
  return {
    // State
    backgroundSrc,
    opacity,
    currentBackground,
    imageBlur,
    imageHeight,
    refreshKey,
    // Actions
    setBackground,
    resetBackground
  }
} 