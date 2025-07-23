import { ref, computed } from 'vue'

const backgroundSrc = ref<string>("")
const isImageLoaded = ref(false)
const opacity = ref(0)
const isSmall = ref(false)
const isPlaylistPage = ref(false)
const imageBlur = ref(0)
const imageHeight = ref(0)
let loadedOpacity = 0.5
let loadedBlur = 0

const currentBackground = computed(() => backgroundSrc.value)

const setBackground = (src: string, setOpacity: number = 1, blur: number = 0, height: number = 50) => {
  console.log('set Background:', src)
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
  opacity.value = 0;
}

export function useBackground() {
  return {
    // State
    backgroundSrc,
    isImageLoaded,
    isSmall,
    opacity,
    currentBackground,
    isPlaylistPage,
    imageBlur,
    imageHeight,
    // Actions
    setBackground,
    onImageLoad,
    resetBackground
  }
} 