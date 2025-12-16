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


const { open, openDialog } = useDialog()

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

const emblaOptions = {
  loop: true,
  draggable: false,
  align: 'center' as const
}
const [_, emblaApi] = emblaCarouselVue(emblaOptions)

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
  nextTick(() => {
    emblaApi.value?.scrollTo(currentIndex.value, true)
  })
})

const onPrevClick = () => {
  if (!canGoPrev.value) return
  previousSong()
}

const onNextClick = () => {
  if (!canGoNext.value) return
  nextSong()
}

watch(() => currentIndex.value, (newValue, _) => {
  emblaApi.value?.scrollTo(newValue, false)
})

const SWIPE_THRESHOLD = 48
const swipeState = reactive({ startX: 0, startY: 0, active: false })
const onSwipeStart = (e: PointerEvent) => {
  swipeState.active = true
  swipeState.startX = e.clientX
  swipeState.startY = e.clientY
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
</script>

<template>
  <div class="fullscreen-player-container relative w-full h-full flex flex-col">
    <!-- Top bar with exit -->
    <div class="fixed top-0 w-full flex items-center gap-2 p-3">
      <div class="grow" />
      <Button variant="ghost" size="sm" class="size-12 p-0" @click="emit('exit')">
        <Icon name="lucide:shrink" size="24" />
      </Button>
    </div>

    <!-- Body -->
    <div class="flex items-center justify-center flex-1 overflow-auto">
      <div class="player-body-container">
        <div class="w-full overflow-hidden rounded-lg relative flex items-center justify-center">
          <div class="embla h-full" ref="emblaRef">
            <div class="embla__container">
              <div
                v-for="(song, i) in queue"
                :key="song?._id || `placeholder-${i}`"
                class="embla__slide h-full px-2"
                :inert="i !== currentIndex"
                :aria-hidden="i !== currentIndex"
                :tabindex="i !== currentIndex ? -1 : undefined"
              >
                <template v-if="(currentIndex-2 <= i && i <=currentIndex+2) || i === 0 || i === queue.length - 1">
                  <div class="w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      v-if="song?.album?.coverUrl"
                      :src="song.album.coverUrl"
                      :modifiers="{ resize: { s: 800 } }"
                      class="w-full h-full max-h-[50vh] object-cover"
                      :alt="song?.album?.name || 'Album cover'"
                    />
                    <div v-else class="w-full h-full grid place-items-center bg-muted/40 text-muted-foreground">
                      <Icon name="lucide:music" class="w-10 h-10" />
                    </div>
                  </div>
                  <div class="w-full flex mt-4">
                    <div class="truncate">
                      <h2 class="text-lg font-semibold truncate">{{ song?.name || 'Unknown' }}</h2>
                      <p class="text-sm text-white/70 truncate">
                        <span>{{ song?.artists.map(artist => artist.name).join(', ') }}</span>
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
                </template>
                <div v-else class="w-full h-full" />
              </div>
            </div>
          </div>
          <!-- Swipe overlay -->
          <div
            class="absolute inset-0 z-10 swipe-overlay"
            @pointerdown="onSwipeStart"
            @pointerup="onSwipeEnd"
            @pointercancel="onSwipeEnd"
          />
        </div>

        <div class="w-full flex flex-col items-center gap-3 px-2">
          <div class="w-full mb-2">
            <ProgressSlider class="w-full" mobile-mode />
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-center gap-4 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              class="size-8 p-0 mr-auto"
              :class="{ 'text-primary': playerState.playMode !== 'queue' }"
              :title="`Current mode: ${playerState.playMode}`"
              @click="togglePlayMode"
            >
              <Icon v-if="playerState.playMode === 'queue'" name="lucide:list-ordered" size="18" />
              <Icon v-else-if="playerState.playMode === 'repeat'" name="lucide:repeat" size="18" />
              <Icon v-else-if="playerState.playMode === 'repeat-one'" name="lucide:repeat-1" size="18" />
              <Icon v-else-if="playerState.playMode === 'random'" name="lucide:shuffle" size="18" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              class="size-10 p-0"
              :disabled="!hasQueue || !canGoPrev"
              @click="onPrevClick"
            >
              <Icon name="lucide:skip-back" size="22" />
            </Button>

            <Button 
              variant="ghost" 
              size="lg" 
              class="size-16 p-0 rounded-full"
              :disabled="!currentSong"
              @click="handlePlayPause"
            >
              <Icon
                v-if="playerState.isLoading" 
                name="lucide:loader-2" 
                size="40" 
                class="animate-spin" 
              />
              <Icon 
                v-else
                :name="isPlaying ? 'material-symbols-light:pause-rounded' : 'material-symbols:play-arrow-rounded'"
                size="60"
              />
            </Button>

            <Button 
              variant="ghost" 
              size="lg" 
              class="size-10 p-0"
              :disabled="!hasQueue || !canGoNext"
              @click="onNextClick"
            >
              <Icon name="lucide:skip-forward" size="22" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              class="size-8 p-0 ml-auto"
              :class="{ 'text-primary': open.queue }"
              @click="openDialog?.(DialogType.QUEUE);"
            >
              <Icon name="lucide:list-music" size="18" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/css/tailwind.css";
.embla {
  overflow: hidden;
}
.embla__container {
  display: flex;
}
.embla__slide {
  flex: 0 0 calc(100%);
  min-width: 0;
}
@media (min-width: 768px) {
  .embla__slide {
    flex-basis: calc(100%);
  }
}

.player-body-container {
  @apply max-w-[100vw] sm:max-w-[70vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[30vw] 
  mx-auto px-6 py-8 flex flex-col items-center gap-5 
  sm:bg-white/40 sm:dark:bg-white/10 rounded-3xl 
  overflow-hidden sm:backdrop-blur-xl 
  sm:border sm:border-t-[2px] sm:border-white/50 sm:dark:border-white/10
  shadow-xl/5 dark:shadow-none;
}
</style>
