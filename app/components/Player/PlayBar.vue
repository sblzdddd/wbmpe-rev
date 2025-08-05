<template>
  <div 
    v-if="hasQueue" 
    class="playbar-container fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border"
  >

    <div class="playbar-content flex md:grid grid-cols-3 gap-1 md:gap-4 px-3 py-2">
      <div class="song-info flex items-center gap-3 min-w-0 flex-1">
        <Picture 
          v-if="currentSong?.album?.coverUrl" 
          :src="currentSong.album.coverUrl" 
          class="w-12 h-12 rounded-md overflow-hidden flex-shrink-0"
          :modifiers="{resize: {s: 100}}" 
          :alt="currentSong.name"
          :img-attrs="{class: 'w-full h-full object-cover'}"
        />
        <div v-else class="w-12 h-12 bg-muted rounded-md flex-shrink-0" />
        
        <div class="song-details min-w-0 flex-1">
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
      
      <div class="flex flex-col md:w-full gap-1 justify-center items-center">
        <div class="player-controls flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0 hidden md:flex"
            :class="{ '!text-red-500': isFavorite(currentSong?._id ?? '') }"
            @click="toggleFavorite(currentSong?._id ?? '')"
          >
            <Icon :name="isFavorite(currentSong?._id ?? '') ? 'material-symbols-light:favorite-rounded' : 'material-symbols-light:favorite-outline-rounded'" size="17" />
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
            variant="default" 
            size="sm" 
            class="w-9 h-9 p-0 rounded-full"
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
        <div class="w-full hidden md:flex items-center gap-2 time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <div class="progress-container grow h-1 bg-muted cursor-pointer" @click="handleProgressClick">
            <div 
              class="progress-bar h-full bg-primary transition-all duration-300" 
              :style="{ width: progressPercentage + '%' }"
            />
          </div>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div class="right-controls flex items-center gap-2 justify-end">
        <div class="volume-control hidden lg:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0"
            @click="toggleMute"
          >
            <Icon :name="volume < 0.5 ? volume === 0 ? 'lucide:volume-x' : 'lucide:volume-1' : 'lucide:volume-2'" size="16" />
          </Button>
          <div class="volume-slider w-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="volume"
              class="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
              @input="handleVolumeChange"
            >
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0"
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

const { 
  playerState, 
  nextSong,
  previousSong,
  currentSong: audioCurrentSong,
  playSong,
  togglePlayMode
} = usePlayer()

const { currentTime, duration, volume, togglePlayPause, seek, setVolume, isPlaying } = useAudio()

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

// Progress percentage
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// Format time in MM:SS
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Handle progress bar click
const handleProgressClick = (event: MouseEvent) => {
  if (duration.value === 0) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const newTime = percentage * duration.value
  
  seek(newTime)
}

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
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.time-display {
  @apply text-xs text-muted-foreground;
}

.progress-container:hover .progress-bar {
  @apply bg-primary/80;
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