export type QueueState = {
  songs: SongType[],
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
  const qState = useState<{new: QueueState, old: QueueState}>('qState', () => ({
    new: queueState.value || defaultQueueState as QueueState, 
    old: queueState.value || defaultQueueState as QueueState
  }))

  // Update new and original queue state
  const updateQueueState = () => {
    if (!queueState.value) {
      console.error('Queue state not found')
      queueState.value = defaultQueueState as QueueState
    }
    qState.value.new = structuredClone(toRaw(queueState.value)) as QueueState
    qState.value.old = structuredClone(toRaw(queueState.value)) as QueueState
  }

  // Save queue to server
  const saveQueueToServer = async (): Promise<UpdateQueueResponse> => {
    
    // Helper function to compare song arrays
    const songsChanged = (newSongs: SongType[], oldSongs: SongType[]): boolean => {
      if (newSongs.length !== oldSongs.length) return true;
      return newSongs.some((song, index) => {
        const oldSong = oldSongs[index];
        return !oldSong || song._id !== oldSong._id;
      });
    };

    // Build request body with only changed fields
    const body: {
      songs?: { songId: string }[];
      currentIndex?: number;
      currentTime?: number;
    } = {};
    
    if (songsChanged(qState.value.new.songs, qState.value.old.songs)) {
      body.songs = qState.value.new.songs.map(song => ({songId: song._id}));
    }
    if (qState.value.new.currentIndex !== qState.value.old.currentIndex) body.currentIndex = qState.value.new.currentIndex;
    if (qState.value.new.currentTime !== qState.value.old.currentTime) body.currentTime = qState.value.new.currentTime;

    console.log('body', body)

    // If nothing changed, return early
    if (Object.keys(body).length === 0) {
      return { success: true, message: "No changes to save" };
    }
    
    const response = await $fetch<UpdateQueueResponse>('/api/user/queue', {
      method: 'PUT',
      body,
      onRequest: () => {queueState.value = qState.value.new},
      onResponse: () => refreshNuxtData('queue'),
      onResponseError: () => {queueState.value = qState.value.old}
    }).catch((err: ApiError) => {
      console.error('Failed to save queue:', err)
      return {success: false, message: 'Failed to save queue' + err}
    })
    return response
  }

  // Add song to queue
  const addToQueue = async (song: SongType, playImmediately = false): Promise<UpdateQueueResponse> => {
    console.log('addToQueue', song, playImmediately)
    updateQueueState()

    // Check if song already exists in queue
    const existingIndex = qState.value.new.songs.findIndex(queueSong => queueSong._id === song._id)
    console.log('existingIndex', existingIndex)
    if (existingIndex !== -1) {
      // Song already exists in queue
      if (playImmediately) {
        console.log('existing song found', existingIndex)
        // If playing immediately, move to the existing song
        qState.value.new.currentIndex = existingIndex
      } else {
        return { message: 'Song already in queue', success: true }
      }
    } else {
      if (playImmediately || qState.value.new.songs.length === 0) {
        qState.value.new.songs.unshift(song)
        qState.value.new.currentIndex = 0
      } else {
        qState.value.new.songs.push(song)
      }
    }
    console.log('qState.value.new', qState.value.new)
    const response = await saveQueueToServer()
    if(!response?.success) {
      console.error('Failed to save queue', response)
    }
    return response
  }

  // Add multiple songs to queue
  const addPlaylistToQueue = async (songs: SongType[], playImmediatelyId: string | null = null): Promise<UpdateQueueResponse> => {
    console.log('addPlaylistToQueue', songs, playImmediatelyId)
    updateQueueState()

    // Filter out songs that already exist in the queue
    const existingSongIds = new Set(qState.value.new.songs.map(queueSong => queueSong._id))
    const newSongs = songs.filter(song => !existingSongIds.has(song._id))
    
    // If no new songs to add, return early
    if (newSongs.length === 0) {
      console.log('all songs already in queue')
      if (playImmediatelyId) {
        const index = qState.value.new.songs.findIndex(song => song._id === playImmediatelyId)
        if (index !== -1) {
          qState.value.new.currentIndex = index
          return await saveQueueToServer()
        }
        console.error('Could not find song to play while all songs present')
        return { message: 'Could not find song to play while all songs present', success: false }
      }
      return { message: 'All songs already in queue', success: true }
    }

    if (playImmediatelyId !== null || qState.value.new.songs.length === 0) {
      qState.value.new.songs = [...newSongs, ...qState.value.new.songs]
      qState.value.new.currentIndex = playImmediatelyId ? qState.value.new.songs.findIndex(song => song._id === playImmediatelyId) : 0
      if (qState.value.new.currentIndex === -1) {
        qState.value.new.currentIndex = 0
      }
    } else {
      qState.value.new.songs.push(...newSongs)
    }

    return await saveQueueToServer()
  }

  // Jump to specific queue position
  const setCurrentIndex = async (index: number): Promise<UpdateQueueResponse> => {
    updateQueueState()

    if (index < 0 || index >= qState.value.new.songs.length) return { message: 'Index out of bounds', success: false }
    
    qState.value.new.currentIndex = index
    return await saveQueueToServer()
  }
  const getCurrentSong = () => queueState.value?.songs[queueState.value?.currentIndex || 0] || null

  // Get next song index
  const getNextIndex = (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false) => {
    if (!queueState.value) return
    if (queueState.value?.songs.length === 0) return -1

    if (isRandom) {
      // For random mode, pick a random index different from current
      const availableIndices = Array.from(
        { length: queueState.value.songs.length }, 
        (_, i) => i
      ).filter(i => i !== (queueState.value?.currentIndex ?? 0))
      
      if (availableIndices.length === 0) {
        // Only one song, stay on current
        return queueState.value?.currentIndex ?? 0
      }
      
      return availableIndices[Math.floor(Math.random() * availableIndices.length)]
    }

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
  const getPreviousIndex = (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false) => {
    if (!queueState.value) return
    if (queueState.value?.songs.length === 0) return -1

    if (isRandom) {
      // For random mode, pick a random index different from current
      const availableIndices = Array.from(
        { length: queueState.value.songs.length }, 
        (_, i) => i
      ).filter(i => i !== (queueState.value?.currentIndex ?? 0))
      
      if (availableIndices.length === 0) {
        // Only one song, stay on current
        return queueState.value?.currentIndex ?? 0
      }
      
      return availableIndices[Math.floor(Math.random() * availableIndices.length)]
    }

    let prevIndex = queueState.value.currentIndex - 1

    if (repeat === 'one') {
      prevIndex = queueState.value.currentIndex
    } else if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queueState.value.songs.length - 1
      } else {
        prevIndex = 0
      }
    }

    return prevIndex
  }

  // Move to next song in queue
  const moveToNext = async (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    const nextIndex = getNextIndex(repeat, isRandom)
    if (nextIndex === -1) return { message: 'No next song', success: false }

    updateQueueState()

    if (nextIndex === undefined) { throw new Error('Next index not found')}
    qState.value.new.currentIndex = nextIndex
    return await saveQueueToServer()
  }

  // Move to previous song in queue
  const moveToPrevious = async (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): Promise<UpdateQueueResponse> => {
    if (!queueState.value) throw new Error('Queue state not found')
    const prevIndex = getPreviousIndex(repeat, isRandom)
    if (prevIndex === -1) return { message: 'No previous song', success: false }

    updateQueueState()

    if (prevIndex === undefined) { throw new Error('Previous index not found')}
    qState.value.new.currentIndex = prevIndex
    return await saveQueueToServer()
  }

  // Remove songs from queue (supports single or multiple IDs)
  const removeFromQueue = async (queueIds: string | string[]): Promise<{ needsNewSong: boolean, newSong: SongType | null }> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    updateQueueState()

    // Normalize input to array
    const idsToRemove = Array.isArray(queueIds) ? queueIds : [queueIds]
    
    // Find all indices to remove, sorted in descending order for safe removal
    const indicesToRemove = idsToRemove
      .map(id => qState.value.new.songs.findIndex(song => song._id === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a) // Sort descending to remove from end first

    if (indicesToRemove.length === 0) {
      return { needsNewSong: false, newSong: null }
    }

    const originalCurrentIndex = qState.value.new.currentIndex
    let needsNewSong = false
    let newSong: SongType | null = null

    // Check if current song will be removed
    const currentSongWillBeRemoved = indicesToRemove.includes(originalCurrentIndex)

    // Remove songs from end to beginning to avoid index shifting issues
    for (const index of indicesToRemove) {
      qState.value.new.songs.splice(index, 1)
    }

    // Adjust current index based on how many songs were removed before it
    let indexAdjustment = 0
    for (const removedIndex of indicesToRemove) {
      if (removedIndex < originalCurrentIndex) {
        indexAdjustment++
      }
    }

    if (currentSongWillBeRemoved) {
      // Current song was removed, need to play next or stop
      needsNewSong = true
      
      if (qState.value.new.songs.length > 0) {
        // Try to stay at the same position, or go to beginning if at end
        let newCurrentIndex = originalCurrentIndex - indexAdjustment
        if (newCurrentIndex >= qState.value.new.songs.length) {
          newCurrentIndex = 0
        }
        qState.value.new.currentIndex = newCurrentIndex
        newSong = qState.value.new.songs[newCurrentIndex] || null
      } else {
        // No more songs in queue
        qState.value.new.currentIndex = -1
        newSong = null
      }
    } else {
      // Current song not removed, just adjust the index
      qState.value.new.currentIndex = originalCurrentIndex - indexAdjustment
    }

    await saveQueueToServer()
    
    return { needsNewSong, newSong }
  }

  // Clear queue
  const clearQueue = async (): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    updateQueueState()

    qState.value.new.songs = []
    qState.value.new.currentIndex = 0
    qState.value.new.currentTime = 0
    await saveQueueToServer()
    return { message: 'Queue cleared', success: true }
  }


  // Save queue with current time
  const saveQueueWithTime = async (currentTime: number): Promise<UpdateQueueResponse> => {
    if (!queueState.value) { throw new Error('Queue state not found')}
    if (import.meta.server) return { message: 'Queue state not found', success: false }

    updateQueueState()

    qState.value.new.currentTime = currentTime
    await saveQueueToServer()
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
        ? queueState.value?.songs[index] as SongType | null
        : null
    }),
    queue: computed(() => queueState.value?.songs || []),
    currentIndex: computed(() => queueState.value?.currentIndex || 0)
  }
}
