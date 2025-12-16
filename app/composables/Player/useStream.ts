export interface StreamData {
  audio: {
    normal?: string
    high?: string
    lossless?: string
  }
}

export interface CachedStream {
  url: string
  timestamp: number
}

export const useStream = () => {
  const streamCache = ref<Map<string, CachedStream>>(new Map())
  const CACHE_TTL = 5 * 60 * 1000

  const getStreamUrl = async (songId: string): Promise<string | null> => {
    try {
      if (import.meta.client) {
        const cached = streamCache.value.get(songId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.url
        }
      }

      const { data } = await $fetch<{ data: StreamData }>(`/api/song/${songId}/stream`)
      
      const audioUrl = data.audio.high || data.audio.normal || data.audio.lossless
      if (!audioUrl) {
        throw new Error('No audio stream available')
      }

      if (import.meta.client) {
        streamCache.value.set(songId, {
          url: audioUrl,
          timestamp: Date.now()
        })
      }

      return audioUrl
    } catch (error) {
      console.error('Failed to get stream URL:', error)
      return null
    }
  }

  const getStreamUrlWithQuality = async (songId: string, preferredQuality: 'lossless' | 'high' | 'normal' = 'high'): Promise<string | null> => {
    try {
      if (import.meta.client) {
        const cached = streamCache.value.get(songId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.url
        }
      }

      const { data } = await $fetch<{ data: StreamData }>(`/api/song/${songId}/stream`)
      
      let audioUrl: string | undefined

      switch (preferredQuality) {
        case 'lossless':
          audioUrl = data.audio.lossless || data.audio.high || data.audio.normal
          break
        case 'high':
          audioUrl = data.audio.high || data.audio.normal || data.audio.lossless
          break
        case 'normal':
          audioUrl = data.audio.normal || data.audio.high || data.audio.lossless
          break
      }

      if (!audioUrl) {
        throw new Error('No audio stream available')
      }

      if (import.meta.client) {
        streamCache.value.set(songId, {
          url: audioUrl,
          timestamp: Date.now()
        })
      }

      return audioUrl
    } catch (error) {
      console.error('Failed to get stream URL:', error)
      return null
    }
  }

  const preloadStream = async (songId: string): Promise<void> => {
    await getStreamUrl(songId)
  }

  const clearExpiredCache = () => {
    if (import.meta.client) {
      const now = Date.now()
      for (const [songId, cached] of streamCache.value.entries()) {
        if (now - cached.timestamp >= CACHE_TTL) {
          streamCache.value.delete(songId)
        }
      }
    }
  }

  const clearCache = () => {
    if (import.meta.client) {
      streamCache.value.clear()
    }
  }

  if (import.meta.client) {
    const cleanupInterval = setInterval(clearExpiredCache, 60000)
    
    onUnmounted(() => {
      clearInterval(cleanupInterval)
    })
  }

  return {
    getStreamUrl,
    getStreamUrlWithQuality,
    preloadStream,
    clearExpiredCache,
    clearCache
  }
} 