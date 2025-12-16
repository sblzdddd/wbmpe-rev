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

const defaultQueueState: QueueState = {
  songs: [],
  currentIndex: -1,
  currentTime: 0
}

export const useQueue = () => {
  const { data: queueState } = useNuxtData<InternalApi['/api/user/queue']['get']>('queue')
  const qState = useState<{new: QueueState, old: QueueState}>('qState', () => ({
    new: queueState.value || defaultQueueState, 
    old: queueState.value || defaultQueueState
  }))

  const updateQueueState = () => {
    if (!queueState.value) {
      queueState.value = defaultQueueState
    }
    qState.value.new = structuredClone(toRaw(queueState.value)) as QueueState
    qState.value.old = structuredClone(toRaw(queueState.value)) as QueueState
  }

  const saveQueueToServer = async (): Promise<UpdateQueueResponse> => {
    const body: any = {}
    
    // Simple diffing
    if (JSON.stringify(qState.value.new.songs) !== JSON.stringify(qState.value.old.songs)) {
      body.songs = qState.value.new.songs.map(song => ({songId: song._id}))
    }
    if (qState.value.new.currentIndex !== qState.value.old.currentIndex) {
      body.currentIndex = qState.value.new.currentIndex
    }
    if (qState.value.new.currentTime !== qState.value.old.currentTime) {
      body.currentTime = qState.value.new.currentTime
    }

    if (Object.keys(body).length === 0) return { success: true, message: "No changes" }
    
    return await $fetch<UpdateQueueResponse>('/api/user/queue', {
      method: 'PUT',
      body,
      onRequest: () => {queueState.value = qState.value.new},
      onResponse: () => refreshNuxtData('queue'),
      onResponseError: () => {queueState.value = qState.value.old}
    }).catch((err) => ({success: false, message: 'Failed to save queue: ' + err}))
  }

  const addToQueue = async (song: SongType, playImmediately = false): Promise<UpdateQueueResponse> => {
    updateQueueState()

    const existingIndex = qState.value.new.songs.findIndex(s => s._id === song._id)
    
    if (existingIndex !== -1) {
      if (playImmediately) {
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
    
    return await saveQueueToServer()
  }

  const addPlaylistToQueue = async (songs: SongType[], playImmediatelyId: string | null = null): Promise<UpdateQueueResponse> => {
    updateQueueState()

    const existingIds = new Set(qState.value.new.songs.map(s => s._id))
    const newSongs = songs.filter(s => !existingIds.has(s._id))
    
    if (newSongs.length === 0 && !playImmediatelyId) {
      return { message: 'All songs already in queue', success: true }
    }

    if (playImmediatelyId || qState.value.new.songs.length === 0) {
      qState.value.new.songs = [...newSongs, ...qState.value.new.songs]
      if (playImmediatelyId) {
        const idx = qState.value.new.songs.findIndex(s => s._id === playImmediatelyId)
        qState.value.new.currentIndex = idx !== -1 ? idx : 0
      } else {
        qState.value.new.currentIndex = 0
      }
    } else {
      qState.value.new.songs.push(...newSongs)
    }

    return await saveQueueToServer()
  }

  const setCurrentIndex = async (index: number): Promise<UpdateQueueResponse> => {
    updateQueueState()
    if (index < 0 || index >= qState.value.new.songs.length) return { message: 'Index out of bounds', success: false }
    
    qState.value.new.currentIndex = index
    return await saveQueueToServer()
  }

  const getCurrentSong = () => queueState.value?.songs[queueState.value?.currentIndex || 0] || null

  const getNextIndex = (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): number => {
    const state = queueState.value
    if (!state?.songs.length) return -1
    const current = state.currentIndex ?? 0

    if (isRandom) {
      const indices = Array.from({length: state.songs.length}, (_, i) => i).filter(i => i !== current)
      return indices.length ? indices[Math.floor(Math.random() * indices.length)]! : current
    }

    let next = current + 1
    if (repeat === 'one') next = current
    else if (next >= state.songs.length) {
      next = repeat === 'all' ? 0 : -1
    }
    return next
  }

  const getPreviousIndex = (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): number => {
    const state = queueState.value
    if (!state?.songs.length) return -1
    const current = state.currentIndex ?? 0

    if (isRandom) {
      const indices = Array.from({length: state.songs.length}, (_, i) => i).filter(i => i !== current)
      return indices.length ? indices[Math.floor(Math.random() * indices.length)]! : current
    }

    let prev = current - 1
    if (repeat === 'one') prev = current
    else if (prev < 0) {
      prev = repeat === 'all' ? state.songs.length - 1 : 0
    }
    return prev
  }

  const moveToNext = async (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): Promise<UpdateQueueResponse> => {
    const nextIndex = getNextIndex(repeat, isRandom)
    if (nextIndex === -1) return { message: 'No next song', success: false }
    return await setCurrentIndex(nextIndex)
  }

  const moveToPrevious = async (repeat: 'none' | 'one' | 'all' = 'none', isRandom = false): Promise<UpdateQueueResponse> => {
    const prevIndex = getPreviousIndex(repeat, isRandom)
    if (prevIndex === -1) return { message: 'No previous song', success: false }
    return await setCurrentIndex(prevIndex)
  }

  const removeFromQueue = async (queueIds: string | string[]): Promise<{ needsNewSong: boolean, newSong: SongType | null }> => {
    updateQueueState()
    const ids = Array.isArray(queueIds) ? queueIds : [queueIds]
    
    // Filter out songs to keep
    const originalSongs = qState.value.new.songs
    const originalIndex = qState.value.new.currentIndex
    const currentSongId = originalSongs[originalIndex]?._id

    qState.value.new.songs = originalSongs.filter(s => !ids.includes(s._id))
    
    let needsNewSong = false
    let newSong: SongType | null = null

    // If current song was removed
    if (currentSongId && ids.includes(currentSongId)) {
      needsNewSong = true
      // Try to keep index, or go to 0
      let newIdx = originalIndex
      if (newIdx >= qState.value.new.songs.length) newIdx = 0
      
      qState.value.new.currentIndex = qState.value.new.songs.length ? newIdx : -1
      newSong = qState.value.new.songs[newIdx] || null
    } else {
      // Adjust index if needed
      const removedBeforeCurrent = originalSongs.slice(0, originalIndex).filter(s => ids.includes(s._id)).length
      qState.value.new.currentIndex = Math.max(0, originalIndex - removedBeforeCurrent)
    }

    await saveQueueToServer()
    return { needsNewSong, newSong }
  }

  const clearQueue = async (): Promise<UpdateQueueResponse> => {
    updateQueueState()
    qState.value.new.songs = []
    qState.value.new.currentIndex = 0
    qState.value.new.currentTime = 0
    return await saveQueueToServer()
  }

  const saveQueueWithTime = async (currentTime: number): Promise<UpdateQueueResponse> => {
    if (import.meta.server) return { message: 'Server side', success: false }
    updateQueueState()
    qState.value.new.currentTime = currentTime
    return await saveQueueToServer()
  }

  return {
    queueState: readonly(queueState),
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
    hasQueue: computed(() => (queueState.value?.songs?.length ?? 0) > 0),
    currentSong: computed(() => {
      const idx = queueState.value?.currentIndex ?? 0
      return queueState.value?.songs?.[idx] || null
    }),
    queue: computed(() => queueState.value?.songs || []),
    currentIndex: computed(() => queueState.value?.currentIndex || 0)
  }
}
