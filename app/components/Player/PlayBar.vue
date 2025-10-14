<template>
  <div 
    v-if="hasQueue" 
    class="playbar-container"
  >

    <div class="playbar-content flex md:grid grid-cols-3 gap-1 md:gap-4 py-1 px-1">
      <div @click="isFullscreen = true" class="flex truncate">
      <div @click="isFullscreen = true" :class="SongInfoClass">
        <Picture 
          v-if="currentSong?.album?.coverUrl" 
          :src="currentSong.album.coverUrl" 
          class="w-12 h-12 rounded-md overflow-hidden flex-shrink-0"
          :modifiers="{resize: {s: 100}}" 
          :alt="currentSong.name"
          :img-attrs="{class: 'w-full h-full object-cover'}"
        />
        <div v-else class="w-12 h-12 bg-muted rounded-md flex-shrink-0" />
        
        <div class="song-details min-w-0">
          <p class="song-title text-sm font-medium truncate">
            {{ currentSong?.name || 'No song selected' }}
          </p>
          <p v-if="currentSong?.artists" class="song-artist text-xs text-muted-foreground truncate">
            <span v-for="(artist, index) in currentSong.artists" :key="index">
              {{ artist.name + (index === currentSong.artists.length - 1 ? '' : ', ') }}
            </span>
          </p>
        </div>
      </div>
      </div>
      
      <div class="flex flex-col md:w-full gap-1 justify-center items-center">
        <div class="player-controls flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0 hidden md:flex"
            :class="{ '!text-red-500': isFavorite(currentSong?._id ?? '') }"
            @click="toggleFavorite(currentSong?._id ?? '')"
          >
            <Icon :name="isFavorite(currentSong?._id ?? '') ? 'lucide:heart' : 'lucide:heart'" size="16" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0 hidden md:flex"
            :disabled="!hasQueue"
            @click="previousSong"
          >
            <Icon name="lucide:skip-back" size="16" />
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            class="w-12 h-7 p-0 rounded-full"
            :disabled="!currentSong"
            @click="handlePlayPause"
          >
            <Icon
              v-if="playerState.isLoading" 
              name="lucide:loader-2" 
              size="20" 
              class="animate-spin" 
            />
            <Icon 
              v-else
              :name="isPlaying ? 'material-symbols-light:pause-rounded' : 'material-symbols:play-arrow-rounded'"
              class="!w-6 !h-6"
            />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0 hidden md:flex"
            :disabled="!hasQueue"
            @click="nextSong"
          >
            <Icon name="lucide:skip-forward" size="16" />
          </Button>

          <Tooltip>
            <TooltipTrigger>
              <Button 
                variant="ghost" 
                size="sm" 
                class="w-8 h-8 p-0 hidden md:flex"
                :class="{ 'text-primary': playerState.playMode !== 'queue' }"
                :title="`Current mode: ${playerState.playMode}. Click to switch to ${getNextPlayMode()}`"
                @click="togglePlayMode"
              >
                <Icon 
                  v-if="playerState.playMode === 'queue'" 
                  name="lucide:list-ordered" 
                  size="16" 
                />
                <Icon 
                  v-else-if="playerState.playMode === 'repeat'" 
                  name="lucide:repeat" 
                  size="16" 
                />
                <Icon 
                  v-else-if="playerState.playMode === 'repeat-one'" 
                  name="lucide:repeat-1" 
                  size="16" 
                />
                <Icon 
                  v-else-if="playerState.playMode === 'random'" 
                  name="lucide:shuffle" 
                  size="16" 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current mode: {{ playerState.playMode }}. Click to switch to {{ getNextPlayMode() }}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div class="w-full hidden md:flex items-center gap-2">
          <ProgressSlider class="w-full flex gap-2 items-center" />
        </div>
      </div>

      <div class="right-controls flex items-center gap-2 justify-end pr-2">
        <div class="volume-control hidden lg:flex items-center gap-2">

        <Tooltip>
          <TooltipTrigger>
            <Button 
              variant="ghost" 
              size="sm" 
              class="w-8 h-8 p-0"
              @click="toggleMute"
            >
              <Icon :name="volume < 0.5 ? volume === 0 ? 'lucide:volume-x' : 'lucide:volume-1' : 'lucide:volume-2'" size="16" />
            </Button>
          </TooltipTrigger>
          <TooltipContent class="flex flex-col items-center gap-1 px-1 py-3">
            <div class="volume-slider h-24">
              <input
                orientation="vertical"
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="volume"
                class="slider"
                @input="handleVolumeChange" 
              >
            </div>
            <span class="text-[10px] w-6 text-center text-muted-foreground">{{ Math.round((volume || 0) * 100) }}%</span>
          </TooltipContent>
        </Tooltip>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          class="size-8 p-0"
          :class="{ 'text-primary': open.queue }"
          @click="openDialog?.(DialogType.QUEUE);"
        >
          <Icon name="lucide:list-music" size="16" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DialogType } from '@/composables/UI/useDialog';
import type { PlayMode } from '@/composables/Player/usePlayer';
import ProgressSlider from '@/components/Player/ProgressSlider.vue';

const SongInfoClass = `song-info flex items-center gap-3 p-2 pr-4 rounded-md 
relative active:scale-95 transition-all 
cursor-pointer
hover:text-accent-foreground
hover:before:scale-100
hover:before:shadow-xs
hover:before:opacity-100
active:before:shadow-none
before:absolute
before:content-[""]before:pointer-events-none
before:top-0
before:left-0
before:w-full
before:h-full
before:z-[0]
before:inset-0
before:rounded-md
before:bg-black/15 dark:before:bg-white/15
before:opacity-0
before:scale-80
before:transition-[opacity,scale]
before:ease-out
before:duration-200
active:before:duration-100
before:ease-in-out
truncate`


const { 
  playerState, 
  nextSong,
  previousSong,
  currentSong: audioCurrentSong,
  playSong,
  togglePlayMode
} = usePlayer()

const isFullscreen = useState('isFullscreen')

const { volume, togglePlayPause, setVolume, isPlaying } = useAudio()

const { hasQueue, currentSong } = useQueue()

const { open, openDialog } = useDialog()

const { isFavorite, toggleFavorite } = useFavorites()

// Volume before muting
const volumeBeforeMute = ref(0.8)

const playIconKey = ref(0)
const pauseIconKey = ref(0)
watch(isPlaying, () => {
  playIconKey.value++
  pauseIconKey.value++
})

// Progress functionality is now handled by ProgressSlider component

// Handle volume change
const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const volume = parseFloat(target.value)
  setVolume(volume)
}

// Toggle mute
const toggleMute = () => {
  if (volume.value === 0) {
    setVolume(volumeBeforeMute.value)
  } else {
    volumeBeforeMute.value = volume.value
    setVolume(0)
  }
}

// Get the next play mode for tooltip
const getNextPlayMode = () => {
  const modes: PlayMode[] = ['queue', 'repeat', 'repeat-one', 'random']
  const currentIndex = modes.indexOf(playerState.value.playMode)
  const nextIndex = (currentIndex + 1) % modes.length
  return modes[nextIndex]
}

const handlePlayPause = () => {
  if (audioCurrentSong.value?.src === currentSong.value?.src) {
    togglePlayPause()
  } else {
    playSong(currentSong.value as SongType)
  }
}
</script>

<style scoped>
@reference '../../assets/css/tailwind.css';
.playbar-container {
  @apply z-150 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-t border-border;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.slider {
  @apply w-2 h-full bg-background rounded-lg cursor-pointer;
  writing-mode: vertical-lr;
  direction: rtl;
  vertical-align: bottom;
}

/* Custom slider styles */
.slider::-webkit-slider-thumb {
  @apply appearance-none w-3 h-3 bg-primary rounded-full cursor-pointer;
}

.slider::-moz-range-thumb {
  @apply w-3 h-3 bg-primary rounded-full cursor-pointer border-0;
}

/* Ensure playbar doesn't interfere with page content */
body {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>