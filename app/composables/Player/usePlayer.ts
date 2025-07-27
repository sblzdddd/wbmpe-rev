import type { Song } from '#types/Song'
import { useQueue } from './useQueue'

export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  volume: number
  currentTime: number
  duration: number
  repeat: 'none' | 'one' | 'all'
  shuffle: boolean
}

export const usePlayer = () => {
  // Global player state
  const playerState = useState<PlayerState>('player', () => ({
    currentSong: null,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    volume: 0.8,
    currentTime: 0,
    duration: 0,
    repeat: 'none',
    shuffle: false
  }))

  // Audio element ref (client-side only)
  const audioElement = ref<HTMLAudioElement | null>(null)
  const audioSource = ref<string>('')

  // Use composables
  const { getStreamUrl } = useStream()
  const {
    addToQueue: queueAddToQueue,
    addPlaylistToQueue: queueAddPlaylistToQueue,
    setCurrentIndex,
    moveToNext,
    moveToPrevious,
    removeFromQueue: queueRemoveFromQueue,
    clearQueue: queueClearQueue,
    saveQueueWithTime,
    hasQueue,
    getCurrentSong,
  } = useQueue()

  // Initialize audio element on client
  if (import.meta.client) {
    onMounted(() => {
      audioElement.value = new Audio()
      
      // Audio event listeners
      audioElement.value.addEventListener('loadstart', () => {
        playerState.value.isLoading = true
      })
      
      audioElement.value.addEventListener('canplay', () => {
        playerState.value.isLoading = false
        playerState.value.duration = audioElement.value?.duration || 0
      })
      
      audioElement.value.addEventListener('timeupdate', () => {
        playerState.value.currentTime = audioElement.value?.currentTime || 0
      })
      
      audioElement.value.addEventListener('ended', () => {
        handleSongEnd()
      })
      
      audioElement.value.addEventListener('error', (e) => {
        console.error('Audio error:', e)
        playerState.value.isLoading = false
        playerState.value.isPlaying = false
      })

      // Set initial volume
      audioElement.value.volume = playerState.value.volume
    })

    // Cleanup on unmount
    onUnmounted(() => {
      if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value = null
      }
    })
  }

  // Add song to queue
  const addToQueue = async (song: Song, playImmediately = false) => {
    console.log('addToQueue', song, playImmediately)
    const queueSong = await queueAddToQueue(song, playImmediately)
    if (!queueSong?.success) { throw new Error(queueSong?.message || 'Queue song not found')}
    
    if (playImmediately || !hasQueue.value) {
      await playSong(song)
    }
  }

  // Add multiple songs to queue
  const addPlaylistToQueue = async (songs: Song[], playImmediately = false) => {
    console.log('addPlaylistToQueue', songs, playImmediately)
    const queueSongs = await queueAddPlaylistToQueue(songs, playImmediately)
    if (!queueSongs?.success) { throw new Error(queueSongs?.message || 'Queue songs not found')}
    
    if (playImmediately || !hasQueue.value) {
      const firstSong = songs[0]
      if (firstSong) {
        await playSong(firstSong)
      }
    }
  }

  // Play specific song
  const playSong = async (song: Song) => {
    if (!audioElement.value) return

    try {
      playerState.value.isLoading = true
      playerState.value.currentSong = song

      // Fetch audio stream URL using stream composable
      const audioUrl = await getStreamUrl(song._id)
      if (!audioUrl) {
        throw new Error('No audio stream available')
      }

      audioSource.value = audioUrl
      audioElement.value.src = audioUrl
      
      await audioElement.value.play()
      playerState.value.isPlaying = true
      playerState.value.isPaused = false
    } catch (error) {
      console.error('Failed to play song:', error)
      playerState.value.isLoading = false
      playerState.value.isPlaying = false
    }
  }

  // Jump to specific queue position
  const playQueueIndex = async (index: number) => {
    const result = await setCurrentIndex(index)
    if (!result?.success) { throw new Error(result?.message || 'Song not found')}
    const song = getCurrentSong()
    if (!song) { throw new Error('Song not found')}
    await playSong(song)
  }

  // Play/pause toggle
  const togglePlayPause = async () => {
    if (!audioElement.value || !playerState.value.currentSong) return

    if (playerState.value.isPlaying) {
      audioElement.value.pause()
      playerState.value.isPlaying = false
      playerState.value.isPaused = true
    } else {
      await audioElement.value.play()
      playerState.value.isPlaying = true
      playerState.value.isPaused = false
    }
  }

  // Next song
  const nextSong = async () => {
    const result = await moveToNext(playerState.value.repeat)
    if (!result?.success) { throw new Error(result?.message || 'Next song not found')}
    const song = getCurrentSong()
    if (!song) { throw new Error('Next song not found')}
    await playSong(song)
  }

  // Previous song
  const previousSong = async () => {
    const result = await moveToPrevious(playerState.value.repeat)
    if (!result?.success) { throw new Error(result?.message || 'Previous song not found')}
    const song = getCurrentSong()
    if (!song) { throw new Error('Previous song not found')}
    await playSong(song)
  }

  // Handle song end
  const handleSongEnd = () => {
    if (playerState.value.repeat === 'one') {
      audioElement.value?.play()
    } else {
      nextSong()
    }
  }

  // Seek to position
  const seek = (time: number) => {
    if (audioElement.value) {
      audioElement.value.currentTime = time
      playerState.value.currentTime = time
    }
  }

  // Set volume
  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    playerState.value.volume = clampedVolume
    if (audioElement.value) {
      audioElement.value.volume = clampedVolume
    }
  }

  // Remove song from queue
  const removeFromQueue = async (queueId: string) => {
    const { needsNewSong, newSong } = await queueRemoveFromQueue(queueId)
    
    if (needsNewSong) {
      if (newSong) {
        await playSong(newSong)
      } else {
        // No more songs in queue
        playerState.value.currentSong = null
        playerState.value.isPlaying = false
        if (audioElement.value) {
          audioElement.value.pause()
        }
      }
    }
  }

  // Clear queue
  const clearQueue = async () => {
    await queueClearQueue()
    
    playerState.value.currentSong = null
    playerState.value.isPlaying = false
    
    if (audioElement.value) {
      audioElement.value.pause()
    }
  }

  // Initialize on client
  if (import.meta.client) {
    // Auto-save queue periodically
    // watch(() => playerState.value.currentTime, (newTime) => {
    //   if (Math.floor(newTime) % 10 === 0) { // Save every 10 seconds
    //     saveQueueWithTime(newTime)
    //   }
    // })
  }

  return {
    // State
    playerState: readonly(playerState),
    audioSource: readonly(audioSource),
    
    // Actions
    addToQueue,
    addPlaylistToQueue,
    playSong,
    playQueueIndex,
    togglePlayPause,
    nextSong,
    previousSong,
    seek,
    setVolume,
    removeFromQueue,
    clearQueue,

    // Computed
    currentSong: computed(() => playerState.value.currentSong),
    isPlaying: computed(() => playerState.value.isPlaying),
  }
} 