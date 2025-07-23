import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', () => {
  // State
  const backgroundSrc = ref<string>("")
  const isImageLoaded = ref(false)
  const opacity = ref(0)
  const isSmall = ref(false)
  const isPlaylistPage = ref(false)
  const imageBlur = ref(0)
  const imageHeight = ref(0)
  
  // Internal state for loaded values
  let loadedOpacity = 0.5
  let loadedBlur = 0

  // Getters
  const currentBackground = computed(() => backgroundSrc.value)

  // Actions
  const setBackground = (src: string, setOpacity: number = 1, blur: number = 0, height: number = 50) => {
    isImageLoaded.value = backgroundSrc.value === src
    backgroundSrc.value = src
    isSmall.value = false
    opacity.value = 0
    loadedOpacity = setOpacity
    loadedBlur = blur
    imageHeight.value = height
    
    if(isImageLoaded.value) {
      opacity.value = loadedOpacity
      imageBlur.value = loadedBlur
    }
  }

  const onImageLoad = (event: Event) => {
    const img = event.target as HTMLImageElement
    isSmall.value = img.naturalWidth < 1024
    isImageLoaded.value = true
    
    setTimeout(() => {
      opacity.value = loadedOpacity
      imageBlur.value = loadedBlur
    }, 50)
  }

  const resetBackground = () => {
    isImageLoaded.value = false
    isSmall.value = false
    opacity.value = 0
    backgroundSrc.value = ""
    imageBlur.value = 0
    imageHeight.value = 0
    loadedOpacity = 0.5
    loadedBlur = 0
  }

  return {
    // State
    backgroundSrc,
    isImageLoaded,
    isSmall,
    opacity,
    isPlaylistPage,
    imageBlur,
    imageHeight,
    
    // Getters
    currentBackground,
    
    // Actions
    setBackground,
    onImageLoad,
    resetBackground
  }
}) 