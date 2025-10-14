import type { backgroundSettings } from "@/lib/background_settings"
import { useQueue } from "#imports"
import { BACKGROUND } from "@/lib/background_settings"

export function useBackground() {
  const isFullscreen = useState<boolean>('isFullscreen', () => false)
  const { currentSong } = useQueue()
  const route = useRoute()
  const router = useRouter()
  const { isPlaying } = useAudio()

  // Grouped background state
  const backgroundState = useState('background', () => ({
    src: "",
    opacity: 0,
    lightOpacity: 0,
    blur: 0,
    height: 0,
    isLoaded: false,
    maskOpacity: 1,
    refreshKey: 1,
    lastSpecialPageBGSrc: "",
  }))
  
  const img = useImage()

  const isInSpecialPage = computed(() => {
    return route.path.startsWith('/playlists/') || route.path.startsWith('/songs/') || route.path.startsWith('/albums/') || route.path.startsWith('/artists/');
  })

  watch(() => isPlaying.value, (newVal) => {
    if(!(currentSong.value && currentSong.value.album && currentSong.value.album.coverUrl)) return
    if(isInSpecialPage.value || isFullscreen.value) return;
    if(newVal) {
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.playlist);
    } else {
      resetBackground();
    }
    
  })

  watch(() => isFullscreen.value, () => {
    if(!(currentSong.value && currentSong.value.album && currentSong.value.album.coverUrl)) return
    if(isFullscreen.value) {
      if(isInSpecialPage.value) {
        console.log("Save last special page bg src:", backgroundState.value.src);
        backgroundState.value.lastSpecialPageBGSrc = backgroundState.value.src;
      }
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.fullscreen);
    } else if (!isInSpecialPage.value) {
      if(!isPlaying.value) {
        resetBackground();
        return;
      }
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.playlist);
    } 
    if(isInSpecialPage.value && !isFullscreen.value) {
      setBackground(backgroundState.value.lastSpecialPageBGSrc, BACKGROUND.playlist);
    }
  })

  watch(() => currentSong.value, () => {
    if(!(currentSong.value && currentSong.value.album && currentSong.value.album.coverUrl)) return
    if(isFullscreen.value) {
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.fullscreen);
    } else if (!isInSpecialPage.value) {
      if(!isPlaying.value) {
        resetBackground();
        return;
      }
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.playlist);
    }
  })

  router.beforeEach((to, _, next) => {
    const isInSpecialPage = to.path.startsWith('/playlists/') || to.path.startsWith('/songs/') || to.path.startsWith('/albums/') || to.path.startsWith('/artists/');
    if (!isInSpecialPage && currentSong.value && isPlaying.value) {
      setBackground(currentSong.value.album.coverUrl, BACKGROUND.playlist);
    } else if (!isInSpecialPage) {
      resetBackground();
    }
    next();
  });
  
  const setBackground = (src: string, settings: backgroundSettings) => {
    const { opacity: setOpacity, lightOpacity, blur, height, maskOpacity } = settings
    console.log('set Background:', backgroundState.value.src, settings)
    if (!src) {
      resetBackground()
      return
    }

    const updateState = (newSrc?: string) => {
      if (newSrc) backgroundState.value.src = newSrc
      backgroundState.value.opacity = setOpacity
      backgroundState.value.lightOpacity = lightOpacity ?? 0
      backgroundState.value.blur = blur
      backgroundState.value.height = height
      backgroundState.value.isLoaded = true
      backgroundState.value.maskOpacity = maskOpacity ?? 1
      backgroundState.value.refreshKey += 1
    }

    if(src === "original") {
      updateState()
      return
    }
    // Process the image URL consistently for both SSR and client
    const processedSrc = img(src.replace('cdn://', '/'), {size: 1000}, {provider: src.startsWith('cdn://') ? 'aliyun':'ipx'})

    if(backgroundState.value.src === processedSrc) {
      updateState()
      return
    }
    
    updateState(processedSrc)
  }
  
  const resetBackground = () => {
    console.log('resetBackground')
    backgroundState.value.opacity = 0
    backgroundState.value.blur = 0
    backgroundState.value.maskOpacity = 1
    backgroundState.value.refreshKey++
  }
  
  return {
    // State
    backgroundState,
    // Actions
    setBackground,
    resetBackground,
    isInSpecialPage
  }
} 