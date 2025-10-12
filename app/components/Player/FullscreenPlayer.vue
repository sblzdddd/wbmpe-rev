<script setup lang="ts">
import ProgressSlider from '@/components/Player/ProgressSlider.vue'
import emblaCarouselVue from 'embla-carousel-vue'

const emit = defineEmits<{ (e: 'exit'): void }>()

const { 
  playerState, 
  nextSong,
  previousSong,
  currentSong: audioCurrentSong,
  playSong,
  togglePlayMode
} = usePlayer()

const { volume, togglePlayPause, setVolume, isPlaying } = useAudio()
const { currentSong, hasQueue, queue, currentIndex } = useQueue()
const { isFavorite, toggleFavorite } = useFavorites()

const handlePlayPause = () => {
  if (audioCurrentSong.value?.src === currentSong.value?.src) {
    togglePlayPause()
  } else if (currentSong.value) {
    playSong(currentSong.value as SongType)
  }
}

const artistsText = computed(() => {
  const artists = currentSong.value?.artists?.map(a => a.name).join(', ')
  return artists || ''
})

const albumText = computed(() => currentSong.value?.album?.name || '')
const titleText = computed(() => currentSong.value?.name || 'No song selected')

// Optional volume quick mute
const volumeBeforeMute = ref(0.8)
const toggleMute = () => {
  if (volume.value === 0) {
    setVolume(volumeBeforeMute.value)
  } else {
    volumeBeforeMute.value = volume.value
    setVolume(0)
  }
}

// Embla carousel setup for album art (prev/current/next)
const emblaOptions = {
  loop: true,
  draggable: false, // disable direct dragging
  align: 'center' as const
}
const [emblaRef, emblaApi] = emblaCarouselVue(emblaOptions)

// Whether queue visually wraps (repeat mode)
const visualLoop = computed(() => playerState.value.playMode === 'repeat')

const canGoPrev = computed(() => {
  const len = queue.value.length
  if (len <= 1) return false
  return visualLoop.value ? true : (currentIndex.value > 0)
})
const canGoNext = computed(() => {
  const len = queue.value.length
  if (len <= 1) return false
  return visualLoop.value ? true : (currentIndex.value < len - 1)
})

onMounted(() => {
  // Start centered on the current item
  nextTick(() => {
    emblaApi.value?.scrollTo(currentIndex.value)
  })
})

// Buttons should animate the carousel as well
const onPrevClick = () => {
  if (!canGoPrev.value) return
  previousSong()
}

const onNextClick = () => {
  if (!canGoNext.value) return
  nextSong()
}

// Keep centered when queue position changes externally
watch(() => currentIndex.value, (newValue, oldValue) => {
  // If song switched by other sources (end playing, buttons elsewhere), keep centered
  emblaApi.value?.scrollTo(newValue, false)
})

// Swipe overlay logic
const SWIPE_THRESHOLD = 48
const swipeState = reactive({ startX: 0, startY: 0, active: false })
const onSwipeStart = (e: PointerEvent) => {
  swipeState.active = true
  swipeState.startX = e.clientX
  swipeState.startY = e.clientY
}
const onSwipeMove = (_e: PointerEvent) => {
  // no-op; we only need start and end to infer direction
}
const onSwipeEnd = (e: PointerEvent) => {
  if (!swipeState.active) return
  const dx = e.clientX - swipeState.startX
  const dy = e.clientY - swipeState.startY
  swipeState.active = false
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx < 0) onNextClick()
    else onPrevClick()
  }
}

// const needPreload = computed(() => {
//   return 
// })
</script>

<template>
  <div class="fullscreen-player-container relative w-full h-full flex flex-col">
    <!-- Top bar with exit -->
    <div class="fixed top-0 flex items-center gap-2 p-3">
      <Button variant="ghost" size="sm" class="w-8 h-8 p-0" @click="emit('exit')">
        <Icon name="lucide:chevron-left" size="18" />
      </Button>
    </div>

    <!-- Body -->
    <div class="flex items-center justify-center flex-1 overflow-auto">
      <div class="max-w-[100vw] lg:max-w-[35vw] xl:max-w-[30vw] mx-auto p-6 flex flex-col items-center gap-5">
        <div class="w-full overflow-hidden rounded-lg relative flex items-center justify-center">
          <div class="embla h-full max-h-[50vh] aspect-square" ref="emblaRef">
            <div class="embla__container h-full">
              <div v-for="(song, i) in queue" :key="song?._id || `placeholder-${i}`" class="embla__slide h-full aspect-square px-2">
                <div v-if="(currentIndex-2 <= i && i <=currentIndex+2) || i === 0 || i === queue.length - 1" class="w-full h-full rounded-2xl overflow-hidden">
                  <Image
                    v-if="song?.album?.coverUrl"
                    :src="song.album.coverUrl"
                    :modifiers="{ resize: { s: 800 } }"
                    class="w-full h-full object-cover"
                    :alt="song?.album?.name || 'Album cover'"
                  />
                  <div v-else class="w-full h-full grid place-items-center bg-muted/40 text-muted-foreground">
                    <Icon name="lucide:music" class="w-10 h-10" />
                  </div>
                </div>
                <div v-else class="w-full h-full" />
              </div>
            </div>
          </div>
          <!-- Swipe overlay: detect horizontal swipes, prevent direct drag -->
          <div
            class="absolute inset-0 z-10 swipe-overlay"
            @pointerdown="onSwipeStart"
            @pointermove="onSwipeMove"
            @pointerup="onSwipeEnd"
            @pointercancel="onSwipeEnd"
          />
        </div>

        <div class="w-full flex px-2">
          <div class="truncate">
            <h2 class="text-lg font-semibold truncate">{{ titleText }}</h2>
            <p class="text-sm text-muted-foreground truncate">
              <span>{{ artistsText }}</span>
            </p>
          </div>
          <div class="grow"></div>
          <Button
            v-if="currentSong" 
            variant="ghost" size="sm" class="w-8 h-8 p-0"
            :class="{ '!text-red-500': isFavorite(currentSong?._id ?? '') }"
            @click="toggleFavorite(currentSong?._id ?? '')"
          >
            <Icon :name="isFavorite(currentSong?._id ?? '') ? 'lucide:heart' : 'lucide:heart'" size="20" />
          </Button>
        </div>

        <div class="w-full flex flex-col items-center gap-3 px-2">
          <!-- Progress slider (desktop-like), optional on mobile as well -->
          <div class="w-full">
            <ProgressSlider class="w-full" mobile-mode />
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-center gap-4 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              class="w-8 h-8 p-0 mr-auto"
              :class="{ 'text-primary': playerState.playMode !== 'queue' }"
              :title="`Current mode: ${playerState.playMode}`"
              @click="togglePlayMode"
            >
              <Icon v-if="playerState.playMode === 'queue'" name="lucide:list-ordered" size="16" />
              <Icon v-else-if="playerState.playMode === 'repeat'" name="lucide:repeat" size="16" />
              <Icon v-else-if="playerState.playMode === 'repeat-one'" name="lucide:repeat-1" size="16" />
              <Icon v-else-if="playerState.playMode === 'random'" name="lucide:shuffle" size="16" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              class="w-10 h-10 p-0"
              :disabled="!hasQueue || !canGoPrev"
              @click="onPrevClick"
            >
              <Icon name="lucide:skip-back" size="18" />
            </Button>

            <Button 
              variant="ghost" 
              size="lg" 
              class="w-12 h-12 p-0 rounded-full"
              :disabled="!currentSong"
              @click="handlePlayPause"
            >
              <Icon
                v-if="playerState.isLoading" 
                name="lucide:loader-2" 
                size="48" 
                class="animate-spin" 
              />
              <Icon 
                v-else
                :name="isPlaying ? 'material-symbols-light:pause-rounded' : 'material-symbols:play-arrow-rounded'"
                size="48"
              />
            </Button>

            <Button 
              variant="ghost" 
              size="lg" 
              class="w-10 h-10 p-0"
              :disabled="!hasQueue || !canGoNext"
              @click="onNextClick"
            >
              <Icon name="lucide:skip-forward" size="18" />
            </Button>

            <Button variant="ghost" size="sm" class="w-8 h-8 p-0 ml-auto" @click="toggleMute">
              <Icon :name="volume < 0.5 ? volume === 0 ? 'lucide:volume-x' : 'lucide:volume-1' : 'lucide:volume-2'" size="16" />
            </Button>
          </div>

          <!-- Secondary controls row -->
          <div class="flex items-center justify-center gap-2 mt-1">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal Embla styles using utility classes */
.embla {
  overflow: hidden;
}
.embla__container {
  display: flex;
}
.embla__slide {
  /* subtract horizontal gap (approx) so snaps align with gap */
  flex: 0 0 calc(100%);
  min-width: 0;
}
@media (min-width: 768px) {
  .embla__slide {
    flex-basis: calc(100%);
  }
}
</style>
