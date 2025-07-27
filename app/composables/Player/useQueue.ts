import type { Song } from '#types/Song'
import type { InternalApi } from 'nitropack'
import type { ApiError } from '#types/Utils/ApiError'
import type { CollectionSongItem } from '~~/server/models/CollectionSongItem'

export type QueueState = {
  songs: CollectionSongItem[],
  currentIndex: number,
  currentTime: number
}
export type UpdateQueueRequest = {
  songs: {
    songId: string
  }[]
  currentIndex: number
  currentTime: number
}
export type UpdateQueueResponse = InternalApi['/api/user/queue']['put']

const defaultQueueState: QueueState | UpdateQueueRequest = {
  songs: [],
  currentIndex: -1,
  currentTime: 0
}

export const useQueue = () => {
  const { data: queueState } = useNuxtData<InternalApi['/api/user/queue']['get']>('queue')

  // Save queue to server
  const saveQueueToServer = async (newState: QueueState, oldState: QueueState): Promise<UpdateQueueResponse> => {
    
    const response = await $fetch<UpdateQueueResponse>('/api/user/queue', {
      method: 'PUT',
      body: {
        songs: newState.songs.map(song => ({
          songId: song.song._id,
        })),
        currentIndex: newState.currentIndex,
        currentTime: newState.currentTime
      },
      onRequest: () => {
        queueState.value = newState;
      },
      onResponse: () => {
        refreshNuxtData('queue')
      },
      onResponseError: () => {
        queueState.value = oldState;
      }
    }).catch((err: ApiError) => {
      console.error('Failed to save queue:', err)
      return undefined
    }).finally(() => {
      queueState.value = oldState;
    });
    if (!response) {
      throw new Error('Failed to save queue')
    }
    return response
  }

  // Add song to queue
  const addToQueue = async (song: Song, playImmediately = false): Promise<UpdateQueueResponse> => {
    console.log('addToQueue', song, playImmediately)
    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState
    console.log('newQueueState', newQueueState, 'originalQueueState', originalQueueState)

    if (playImmediately || newQueueState.songs.length === 0) {
      newQueueState.songs.unshift({_id: song._id, song: song})
      newQueueState.currentIndex = 0
    } else {
      newQueueState.songs.push({_id: song._id, song: song})
    }
    console.log('newQueueState', newQueueState, 'originalQueueState', originalQueueState)
    return await saveQueueToServer(newQueueState, originalQueueState)
  }

  // Add multiple songs to queue
  const addPlaylistToQueue = async (songs: Song[], playImmediately = false): Promise<UpdateQueueResponse> => {
    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    if (playImmediately || newQueueState.songs.length === 0) {
      newQueueState.songs = [...songs.map(song => ({_id: song._id, song: song})), ...newQueueState.songs]
      newQueueState.currentIndex = 0
    } else {
      newQueueState.songs.push(...songs.map(song => ({_id: song._id, song: song})))
    }

    return await saveQueueToServer(newQueueState, originalQueueState)
  }

  // Jump to specific queue position
  const setCurrentIndex = async (index: number): Promise<UpdateQueueResponse> => {
    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    if (index < 0 || index >= newQueueState.songs.length) return { message: 'Index out of bounds', success: false }
    
    newQueueState.currentIndex = index
    return await saveQueueToServer(newQueueState, originalQueueState)
  }
  const getCurrentSong = () => {
    return queueState.value?.songs[queueState.value?.currentIndex || 0]?.song || null
  }

  // Get next song index
  const getNextIndex = (repeat: 'none' | 'one' | 'all' = 'none') => {
    if (!queueState.value) return
    if (queueState.value?.songs.length === 0) return -1

    let nextIndex = queueState.value.currentIndex + 1

    if (repeat === 'one') {
      nextIndex = queueState.value.currentIndex
    } else if (nextIndex >= queueState.value.songs.length) {
      if (repeat === 'all') {
        nextIndex = 0
      } else {
        return -1 // End of queue
      }
    }

    return nextIndex
  }

  // Get previous song index
  const getPreviousIndex = (repeat: 'none' | 'one' | 'all' = 'none') => {
    if (!queueState.value) return
    if (queueState.value?.songs.length === 0) return -1

    let prevIndex = queueState.value.currentIndex - 1

    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queueState.value.songs.length - 1
      } else {
        prevIndex = 0
      }
    }

    return prevIndex
  }

  // Move to next song in queue
  const moveToNext = async (repeat: 'none' | 'one' | 'all' = 'none'): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    const nextIndex = getNextIndex(repeat)
    if (nextIndex === -1) return { message: 'No next song', success: false }

    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    if (nextIndex === undefined) { throw new Error('Next index not found')}
    newQueueState.currentIndex = nextIndex
    return await saveQueueToServer(newQueueState, originalQueueState)
  }

  // Move to previous song in queue
  const moveToPrevious = async (repeat: 'none' | 'one' | 'all' = 'none'): Promise<UpdateQueueResponse> => {
    if (!queueState.value) throw new Error('Queue state not found')
    const prevIndex = getPreviousIndex(repeat)
    if (prevIndex === -1) return { message: 'No previous song', success: false }

    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    if (prevIndex === undefined) { throw new Error('Previous index not found')}
    newQueueState.currentIndex = prevIndex
    return await saveQueueToServer(newQueueState, originalQueueState)
  }

  // Remove song from queue
  const removeFromQueue = async (queueId: string): Promise<{ needsNewSong: boolean, newSong: Song | null }> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    const index = newQueueState.songs.findIndex(song => song._id === queueId)
    if (index === -1) return { needsNewSong: false, newSong: null }

    newQueueState.songs.splice(index, 1)

    const needsNewSong = false
    let newSong: Song | null = null

    // Adjust current index if necessary
    if (index < newQueueState.currentIndex) {
      newQueueState.currentIndex--
    } else if (index === newQueueState.currentIndex) {
      // Current song was removed, need to play next or stop
      console.log('needsNewSong', needsNewSong)
      
      if (newQueueState.songs.length > 0) {
        if (newQueueState.currentIndex >= newQueueState.songs.length) {
          newQueueState.currentIndex = 0
        }
        newSong = newQueueState.songs[newQueueState.currentIndex]?.song || null
      } else {
        // No more songs in queue
        newQueueState.currentIndex = -1
        newSong = null
      }
    }

    await saveQueueToServer(newQueueState, originalQueueState)
    
    return { needsNewSong, newSong: newSong as Song | null }
  }

  // Clear queue
  const clearQueue = async (): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    newQueueState.songs = []
    newQueueState.currentIndex = -1
    await saveQueueToServer(newQueueState, originalQueueState)
    return { message: 'Queue cleared', success: true }
  }


  // Save queue with current time
  const saveQueueWithTime = async (currentTime: number): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    if (import.meta.server) return { message: 'Queue state not found', success: false }

    const newQueueState = queueState.value || defaultQueueState as QueueState
    const originalQueueState = queueState.value || defaultQueueState as QueueState

    newQueueState.currentTime = currentTime
    await saveQueueToServer(newQueueState, originalQueueState)
    return { message: 'Queue saved', success: true }
  }


  return {
    // State
    queueState: readonly(queueState),
    
    // Actions
    addToQueue,
    addPlaylistToQueue,
    setCurrentIndex,
    getNextIndex,
    getPreviousIndex,
    moveToNext,
    moveToPrevious,
    removeFromQueue,
    clearQueue,
    saveQueueToServer,
    saveQueueWithTime,
    getCurrentSong,

    // Computed
    hasQueue: computed(() => (queueState.value?.songs?.length ?? 0) > 0),
    currentSong: computed(() => {
      const index = queueState.value?.currentIndex ?? 0
      return index >= 0 && index < (queueState.value?.songs?.length ?? 0) 
        ? queueState.value?.songs[index] 
        : null
    }),
    queue: computed(() => queueState.value?.songs || []),
    currentIndex: computed(() => queueState.value?.currentIndex || 0)
  }
}
