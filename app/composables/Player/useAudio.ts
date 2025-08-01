
interface AudioState {
  audioCtx: AudioContext | null
  gainNode: GainNode | null
  sourceNode: MediaElementAudioSourceNode | null
  audioElement: HTMLAudioElement | null
  isPlaying: boolean
  currentUrl: string
  volume: number
  currentTime: number
  duration: number
}

export const useAudio = () => {
  const audioState = useState<AudioState>('audioState', () => ({
    audioCtx: null,
    gainNode: null,
    sourceNode: null,
    audioElement: null,
    isPlaying: false,
    currentUrl: '',
    volume: 0.8,
    currentTime: 0,
    duration: 0
  }))

  // Store song end callback separately to avoid serialization issues
  const onSongEndCallback = ref<(() => void | Promise<void>) | null>(null)


  function ensureContext() {
    if (!audioState.value.audioCtx) {
      audioState.value.audioCtx = new AudioContext()
      audioState.value.gainNode = audioState.value.audioCtx.createGain()
      audioState.value.gainNode.connect(audioState.value.audioCtx.destination)
    }
  }

  function createAudioElement(): HTMLAudioElement {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    
    // Set up event listeners
    audio.addEventListener('ended', () => {
      audioState.value.isPlaying = false
      // Call the song end handler if it's set
      if (onSongEndCallback.value) {
        const result = onSongEndCallback.value()
        // Handle if the callback returns a promise
        if (result instanceof Promise) {
          result.catch(error => console.error('Error in song end handler:', error))
        }
      }
    })
    
    audio.addEventListener('error', (e) => {
      // Get detailed error information
      const audioError = audio.error
      let errorMessage = 'Unknown audio error'
      let errorDetails = ''
      let isRetryableError = false
      
      if (audioError) {
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted'
            errorDetails = 'The user canceled the audio playback'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading audio'
            errorDetails = 'Check your internet connection and the audio URL'
            isRetryableError = true
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decoding error'
            errorDetails = 'The audio file may be corrupted or in an unsupported format'
            isRetryableError = true
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported'
            errorDetails = 'The audio format or URL is not supported by this browser'
            isRetryableError = true
            break
          default:
            errorMessage = `Audio error (code: ${audioError.code})`
            errorDetails = audioError.message || 'No additional details available'
        }
      }
      
      // Use different log levels based on whether this is likely part of retry flow
      if (isRetryableError) {
        console.warn('Audio playback failed, retry may be attempted:', {
          message: errorMessage,
          details: errorDetails,
          errorCode: audioError?.code,
          currentSrc: audio.currentSrc,
          note: 'This may be part of normal retry flow'
        })
      } else {
        console.error('Audio Error Details:', {
          message: errorMessage,
          details: errorDetails,
          errorCode: audioError?.code,
          currentSrc: audio.currentSrc,
          networkState: audio.networkState,
          readyState: audio.readyState,
          event: e
        })
      }
      
      audioState.value.isPlaying = false
    })

    audio.addEventListener('loadstart', () => {
      console.log('Audio loading started for:', audio.currentSrc)
    })

    audio.addEventListener('canplay', () => {
      console.log('Audio can start playing')
    })

    audio.addEventListener('loadeddata', () => {
      console.log('Audio data loaded')
    })

    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded - Duration:', audio.duration)
    })

    // Add network state monitoring
    audio.addEventListener('stalled', () => {
      console.warn('Audio loading stalled - possible network issue')
    })

    audio.addEventListener('suspend', () => {
      console.log('Audio loading suspended')
    })

    audio.addEventListener('waiting', () => {
      console.log('Audio buffering...')
    })

    // Add timeupdate event listener for reactive currentTime
    audio.addEventListener('timeupdate', () => {
      audioState.value.currentTime = audio.currentTime
      audioState.value.duration = audio.duration
    })

    return audio
  }

  function connectToWebAudio() {
    if (!audioState.value.audioElement || !audioState.value.audioCtx) return
    
    try {
      // Disconnect and clean up previous source node if it exists
      if (audioState.value.sourceNode) {
        audioState.value.sourceNode.disconnect()
        audioState.value.sourceNode = null
      }
      
      // Create new source node for the current audio element
      audioState.value.sourceNode = audioState.value.audioCtx.createMediaElementSource(audioState.value.audioElement)
      audioState.value.sourceNode.connect(audioState.value.gainNode!)
    } catch (error) {
      console.error('Failed to connect audio to Web Audio API:', error)
    }
  }

  function validateStreamUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      // Check if it's a valid HTTP/HTTPS URL
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function testStreamUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors'
      })
      return response.ok
    } catch (error) {
      console.warn('Stream URL test failed:', error)
      return false
    }
  }

  function cleanupAudioElement() {
    if (audioState.value.audioElement) {
      audioState.value.audioElement.pause()
      audioState.value.audioElement.src = ''
      audioState.value.audioElement.load()
      // Remove all event listeners by cloning the element
      const newAudio = audioState.value.audioElement.cloneNode(false) as HTMLAudioElement
      audioState.value.audioElement.replaceWith(newAudio)
    }
    
    if (audioState.value.sourceNode) {
      audioState.value.sourceNode.disconnect()
      audioState.value.sourceNode = null
    }
  }

  async function play(url: string, offset = 0) {
    ensureContext()
    
    // Validate URL format first
    if (!validateStreamUrl(url)) {
      const error = new Error(`Invalid stream URL format: ${url}`)
      console.error('Audio Error:', error.message)
      audioState.value.isPlaying = false
      throw error
    }

    console.log('Attempting to play audio from:', url)
    
    // Resume AudioContext if suspended
    if (audioState.value.audioCtx?.state === 'suspended') {
      await audioState.value.audioCtx.resume()
    }

    // Always create new audio element when URL changes to avoid Web Audio API conflicts
    if (audioState.value.currentUrl !== url) {
      cleanupAudioElement()
      
      audioState.value.audioElement = createAudioElement()
      audioState.value.audioElement.src = url
      audioState.value.currentUrl = url
      
      connectToWebAudio()
    }

    // If we don't have an audio element yet, create one
    if (!audioState.value.audioElement) {
      audioState.value.audioElement = createAudioElement()
      audioState.value.audioElement.src = url
      audioState.value.currentUrl = url
      connectToWebAudio()
    }

    try {
      // Set the current time if offset is provided
      if (offset > 0) {
        audioState.value.audioElement.currentTime = offset
      }

      await audioState.value.audioElement.play()
      audioState.value.isPlaying = true
    } catch (error) {
      console.error('Failed to play audio:', error)
      
      // For network errors, optionally test the URL accessibility
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.warn('Audio play was not allowed - user interaction may be required')
      } else {
        // Test if the URL is accessible for debugging
        const isAccessible = await testStreamUrl(url)
        console.log('Stream URL accessibility test:', isAccessible ? 'PASSED' : 'FAILED')
      }
      
      audioState.value.isPlaying = false
      throw error
    }
  }

  function pause() {
    if (audioState.value.audioElement && audioState.value.isPlaying) {
      audioState.value.audioElement.pause()
      audioState.value.isPlaying = false
    }
  }

  function unPause() {
    if (audioState.value.audioElement && !audioState.value.isPlaying) {
      audioState.value.audioElement.play()
      audioState.value.isPlaying = true
    }
  }

  function seek(time: number) {
    if (audioState.value.audioElement) {
      audioState.value.audioElement.currentTime = time
    }
  }

  function setVolume(v: number) {
    v = Math.max(0, Math.min(1, v))
    audioState.value.volume = v
    // Set volume on both HTML5 audio and Web Audio API
    if (audioState.value.audioElement) {
      audioState.value.audioElement.volume = audioState.value.volume
    }
    if (audioState.value.gainNode) {
      audioState.value.gainNode.gain.value = audioState.value.volume
    }
  }

  function togglePlayPause() {
    if (audioState.value.isPlaying) {
      pause()
    } else if (audioState.value.currentUrl) {
      // Only try to play if we have a current URL
      play(audioState.value.currentUrl, audioState.value.currentTime)
    }
  }

  // Cleanup function - now only called explicitly
  function cleanup() {
    cleanupAudioElement()
    
    if (audioState.value.audioCtx?.state !== 'closed') {
      audioState.value.audioCtx?.close()
    }
    
    // Reset state
    audioState.value.audioCtx = null
    audioState.value.gainNode = null
    audioState.value.sourceNode = null
    audioState.value.audioElement = null
    audioState.value.currentUrl = ''
    audioState.value.isPlaying = false
  }

  // Handle page visibility changes to pause/resume audio
  if (import.meta.client) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && audioState.value.isPlaying) {
        // Optionally pause when tab becomes hidden
        // pause()
      }
    })

    // Cleanup only when the window is actually being closed
    window.addEventListener('beforeunload', () => {
      cleanup()
    })
  }

  return {
    isPlaying: computed({get: () => audioState.value.isPlaying, set: () => {}}),
    currentTime: computed({get: () => audioState.value.currentTime, set: (value) => seek(value)}),
    duration: computed(() => audioState.value.duration),
    volume: computed({get: () => audioState.value.volume, set: (value) => setVolume(value)}),
    onSongEnd: computed({
      get: () => onSongEndCallback.value, 
      set: (callback) => { onSongEndCallback.value = callback }
    }),
    play,
    pause,
    togglePlayPause,
    unPause,
    seek,
    setVolume,
    cleanup,
  }
}