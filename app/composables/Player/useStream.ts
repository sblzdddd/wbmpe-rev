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
  // Cache for stream URLs (client-side only)
  const streamCache = ref<Map<string, CachedStream>>(new Map())
  
  // Cache TTL (5 minutes)
  const CACHE_TTL = 5 * 60 * 1000

  // Get stream URL for a song
  const getStreamUrl = async (songId: string): Promise<string | null> => {
    try {
      // Check cache first (client-side only)
      if (import.meta.client) {
        const cached = streamCache.value.get(songId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.url
        }
      }

      // Fetch from API
      const { data } = await $fetch<{ data: StreamData }>(`/api/song/${songId}/stream`)
      
      const audioUrl = data.audio.high || data.audio.normal || data.audio.lossless
      if (!audioUrl) {
        throw new Error('No audio stream available')
      }

      // Cache the result (client-side only)
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

  // Get stream URL with preferred quality
  const getStreamUrlWithQuality = async (songId: string, preferredQuality: 'lossless' | 'high' | 'normal' = 'high'): Promise<string | null> => {
    try {
      // Check cache first (client-side only)
      if (import.meta.client) {
        const cached = streamCache.value.get(songId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.url
        }
      }

      // Fetch from API
      const { data } = await $fetch<{ data: StreamData }>(`/api/song/${songId}/stream`)
      
      let audioUrl: string | undefined

      // Try preferred quality first, then fallback
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

      // Cache the result (client-side only)
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

  // Preload stream for faster playback
  const preloadStream = async (songId: string): Promise<void> => {
    await getStreamUrl(songId)
  }

  // Clear expired cache entries
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

  // Clear all cache
  const clearCache = () => {
    if (import.meta.client) {
      streamCache.value.clear()
    }
  }

  // Auto-cleanup expired cache entries (client-side only)
  if (import.meta.client) {
    const cleanupInterval = setInterval(clearExpiredCache, 60000) // Every minute
    
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