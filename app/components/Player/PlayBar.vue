<template>
  <div 
    v-if="hasQueue" 
    class="playbar-container fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border"
  >
    <div class="progress-container h-1 bg-muted cursor-pointer" @click="handleProgressClick">
      <div 
        class="progress-bar h-full bg-primary transition-all duration-300" 
        :style="{ width: progressPercentage + '%' }"
      />
    </div>

    <div class="playbar-content flex items-center gap-4 px-4 py-3">
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
            <!-- <span v-for="(artist, index) in currentSong.artists" :key="index">
              {{ artist.name + (index === currentSong.artists.length - 1 ? '' : ', ') }}
            </span> -->
          </p>
        </div>
      </div>

      <div class="player-controls flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0 hidden md:flex"
          :class="{ 'text-primary': playerState.shuffle }"
        >
          <Icon name="lucide:shuffle" size="16" />
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0"
          @click="previousSong"
          :disabled="!hasQueue"
        >
          <Icon name="lucide:skip-back" size="16" />
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          class="w-10 h-10 p-0 rounded-full"
          @click="togglePlayPause"
          :disabled="!currentSong"
        >
          <Icon 
            v-if="playerState.isLoading" 
            name="lucide:loader-2" 
            size="20" 
            class="animate-spin" 
          />
          <Icon 
            v-else-if="isPlaying" 
            name="lucide:pause" 
            size="20" 
          />
          <Icon 
            v-else 
            name="lucide:play" 
            size="20" 
          />
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0"
          @click="nextSong"
          :disabled="!hasQueue"
        >
          <Icon name="lucide:skip-forward" size="16" />
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0 hidden md:flex"
          :class="{ 'text-primary': playerState.repeat !== 'none' }"
        >
          <Icon 
            v-if="playerState.repeat === 'one'" 
            name="lucide:repeat-1" 
            size="16" 
          />
          <Icon 
            v-else 
            name="lucide:repeat" 
            size="16" 
          />
        </Button>
      </div>

      <div class="time-display hidden md:flex items-center gap-2 text-xs text-muted-foreground min-w-[100px]">
        <span>{{ formatTime(playerState.currentTime) }}</span>
        <span>/</span>
        <span>{{ formatTime(playerState.duration) }}</span>
      </div>

      <div class="right-controls flex items-center gap-2">
        <div class="volume-control hidden lg:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-8 h-8 p-0"
            @click="toggleMute"
          >
            <Icon 
              v-if="playerState.volume === 0" 
              name="lucide:volume-x" 
              size="16" 
            />
            <Icon 
              v-else-if="playerState.volume < 0.5" 
              name="lucide:volume-1" 
              size="16" 
            />
            <Icon 
              v-else 
              name="lucide:volume-2" 
              size="16" 
            />
          </Button>
          <div class="volume-slider w-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="playerState.volume"
              @input="handleVolumeChange"
              class="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          class="w-8 h-8 p-0"
          :class="{ 'text-primary': showQueue }"
          @click="toggleQueue"
        >
          <Icon name="lucide:list-music" size="16" />
        </Button>
      </div>
    </div>

    <div 
      v-if="showQueue" 
      class="queue-panel border-t border-border bg-background/95 backdrop-blur max-h-80 overflow-hidden"
    >
      <div class="queue-header flex items-center justify-between p-3 border-b border-border">
        <!-- <h3 class="text-sm font-medium">Queue ({{ queue.length }} songs)</h3> -->
        <Button 
          variant="ghost" 
          size="sm"
          @click="clearQueue"
          class="text-xs"
        >
          Clear all
        </Button>
      </div>
      
      <div class="queue-list overflow-y-auto max-h-60">
        <div 
          v-for="(song, index) in queue" 
          :key="song._id"
          class="queue-item flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
          :class="{ 'bg-primary/10': index === currentIndex }"
          @click="playQueueSong(index)"
        >
          <div class="queue-index w-6 text-xs text-muted-foreground text-center">
            <Icon 
              v-if="index === currentIndex && isPlaying" 
              name="lucide:play" 
              size="12" 
              class="text-primary" 
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          
          <Picture 
            v-if="song.song.album?.coverUrl" 
            :src="song.song.album.coverUrl" 
            class="w-8 h-8 rounded overflow-hidden flex-shrink-0"
            :modifiers="{resize: {s: 64}}" 
            :alt="song.song.name"
            :img-attrs="{class: 'w-full h-full object-cover'}"
          />
          <div v-else class="w-8 h-8 bg-muted rounded flex-shrink-0" />
          
          <div class="song-info min-w-0 flex-1">
            <p class="text-sm truncate" :class="{ 'text-primary': index === currentIndex }">
              {{ song.song.name }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              <!-- <span v-for="(artist, artistIndex) in song.song.artists" :key="artistIndex">
                {{ artist.name + (artistIndex === song.song.artists.length - 1 ? '' : ', ') }}
              </span> -->
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
            @click.stop="removeFromQueue(song._id)"
          >
            <Icon name="lucide:x" size="12" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const { 
  playerState, 
  currentSong, 
  isPlaying, 
  togglePlayPause,
  nextSong,
  previousSong,
  seek,
  removeFromQueue,
  clearQueue,
  playQueueIndex,
  setVolume
} = usePlayer()

const { hasQueue, queue, currentIndex } = useQueue()

const showQueue = ref(false)

// Volume before muting
const volumeBeforeMute = ref(0.8)

// Progress percentage
const progressPercentage = computed(() => {
  if (playerState.value.duration === 0) return 0
  return (playerState.value.currentTime / playerState.value.duration) * 100
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
  if (playerState.value.duration === 0) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const newTime = percentage * playerState.value.duration
  
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
  if (playerState.value.volume === 0) {
    setVolume(volumeBeforeMute.value)
  } else {
    volumeBeforeMute.value = playerState.value.volume
    setVolume(0)
  }
}

// Toggle shuffle
// const toggleShuffle = () => {
//   playerState.value.shuffle = !playerState.value.shuffle
//   // TODO: Implement shuffle logic
// }

// // Toggle shuffle
// const toggleShuffle = () => {
//   playerState.value.shuffle = !playerState.value.shuffle
//   // TODO: Implement shuffle logic
// }

// Toggle repeat
// const toggleRepeat = () => {
//   const modes = ['none', 'all', 'one'] as const
//   const currentIndex = modes.indexOf(playerState.value.repeat)
//   const nextIndex = (currentIndex + 1) % modes.length
//   playerState.value.repeat = modes[nextIndex]
// }

// Toggle queue visibility
const toggleQueue = () => {
  showQueue.value = !showQueue.value
}

// Play specific song from queue
const playQueueSong = async (index: number) => {
  await playQueueIndex(index)
}

// Close queue when clicking outside (optional)
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.playbar-container') && showQueue.value) {
      showQueue.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
@reference '../../assets/css/tailwind.css';
.playbar-container {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
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

.queue-item:hover .opacity-0 {
  @apply opacity-100;
}

/* Ensure playbar doesn't interfere with page content */
body {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>