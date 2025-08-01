import { useAudio } from './useAudio'
import type { Song } from '#types/Song'
import { useQueue } from './useQueue'
import { useStream } from './useStream'

export type PlayMode = 'queue' | 'repeat' | 'repeat-one' | 'random'

export interface PlayerState {
  currentSong: Song | null
  isLoading: boolean
  playMode: PlayMode
}

export const usePlayer = () => {

  const playerState = useState<PlayerState>('player', () => ({
    currentSong: null,
    isLoading: false,
    playMode: 'queue'
  }))

  const audioSource = ref<string>('')

  // Use composables
  const { getStreamUrl } = useStream()
  const {
    setCurrentIndex,
    moveToNext,
    moveToPrevious,
    addPlaylistToQueue,
    addToQueue,
    removeFromQueue: queueRemoveFromQueue,
    clearQueue: queueClearQueue,
    getCurrentSong,
    hasQueue,
    queue,
  } = useQueue()

  const audio = useAudio()

  // Auto-play next song when current song ends
  const handleSongEnd = async () => {
    try {
      await nextSong()
    } catch {
      console.log('End of queue reached or no next song available')
      // End of queue reached, do nothing
    }
  }

  // Set up the song end handler for auto-play
  audio.onSongEnd.value = handleSongEnd

  // Add song to queue
  const addSong = async (song: Song, playImmediately = false) => {
    const queueSong = await addToQueue(song, playImmediately)
    if (!queueSong?.success) { 
      throw new Error(queueSong?.message || 'Failed to add song to queue')
    }
    
    if (playImmediately || !hasQueue.value) {
      await playSong(song)
    }
  }

  // Add playlist to queue
  // Add multiple songs to queue
  const addPlaylist = async (songs: Song[], playImmediatelyId: string | null = null) => {
    console.log('addPlaylist', songs, playImmediatelyId)
    const response = await addPlaylistToQueue(songs, playImmediatelyId)
    if (!response?.success) { 
      throw new Error(response?.message || 'Failed to add songs to queue')
    }
    const queueSongs = queue.value;
    console.log('queueSongs', queueSongs)
    if (playImmediatelyId !== null || queueSongs.length > 0) {
      const firstSong = queueSongs.find(song => song._id === playImmediatelyId)
      if (firstSong) {
        await playSong(firstSong)
      }
    }
  }

  const playSong = async (song: Song, restartIfSameSong = false) => {
    try {
      playerState.value.isLoading = true

      // Check if it's the same song - if so, just restart playback
      if (playerState.value.currentSong?._id === song._id && audioSource.value) {
        console.log('Same song detected, restarting playback from beginning')
        if(restartIfSameSong) {
          audio.seek(0) // Reset to beginning
          await audio.play(audioSource.value, 0) // Start playing from beginning
        } else {
          audio.unPause()
        }
        playerState.value.isLoading = false
        return
      }

      // Different song - load new stream
      playerState.value.currentSong = song

      const audioUrl = await getStreamUrl(song._id)
      if (!audioUrl) throw new Error('No audio stream available')

      audioSource.value = audioUrl
      await audio.play(audioUrl)

      playerState.value.isLoading = false
    } catch (err) {
      console.error('Failed to play song:', err)
      playerState.value.isLoading = false
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

  // Convert playMode to repeat mode for queue functions
  const getRepeatMode = (playMode: PlayMode): 'none' | 'one' | 'all' => {
    switch (playMode) {
      case 'queue': return 'none'
      case 'repeat': return 'all'
      case 'repeat-one': return 'one'
      case 'random': return 'none' // Random handles its own logic
      default: return 'none'
    }
  }

  // Next song
  const nextSong = async () => {
    const repeatMode = getRepeatMode(playerState.value.playMode)
    const result = await moveToNext(repeatMode, playerState.value.playMode === 'random')
    if (!result?.success) { throw new Error(result?.message || 'Next song not found')}
    const song = getCurrentSong()
    if (!song) { throw new Error('Next song not found')}
    await playSong(song, true)
  }

  // Previous song
  const previousSong = async () => {
    const repeatMode = getRepeatMode(playerState.value.playMode)
    const result = await moveToPrevious(repeatMode, playerState.value.playMode === 'random')
    if (!result?.success) { throw new Error(result?.message || 'Previous song not found')}
    const song = getCurrentSong()
    if (!song) { throw new Error('Previous song not found')}
    await playSong(song, true)
  }

  // Toggle play mode: queue -> repeat -> repeat-one -> random -> queue
  const togglePlayMode = () => {
    const modes: PlayMode[] = ['queue', 'repeat', 'repeat-one', 'random']
    const currentIndex = modes.indexOf(playerState.value.playMode)
    const nextIndex = (currentIndex + 1) % modes.length
    playerState.value.playMode = modes[nextIndex] ?? 'queue'
  }


  // Remove song from queue
  const removeFromQueue = async (queueIds: string[]) => {
    const { needsNewSong, newSong } = await queueRemoveFromQueue(queueIds)
    
    if (needsNewSong) {
      if (newSong) {
        await playSong(newSong)
      } else {
        // No more songs in queue
        playerState.value.currentSong = null
        audio.pause()
      }
    }
  }

  // Clear queue
  const clearQueue = async () => {
    const result = await queueClearQueue()
    if (!result?.success) { throw new Error(result?.message || 'Failed to clear queue')}
    
    playerState.value.currentSong = null
    audioSource.value = ''
    
    audio.pause()
  }

  const pause = async () => {
    await audio.pause()
  }

  return {
    playerState: readonly(playerState),
    audioSource: readonly(audioSource),

    playSong,
    playQueueIndex,
    nextSong,
    previousSong,
    removeFromQueue,
    clearQueue,
    addSong,
    addPlaylist,
    togglePlayMode,
    currentSong: computed(() => playerState.value.currentSong),
    isPlaying: computed(() => audio.isPlaying),
    pause,
  }
}
