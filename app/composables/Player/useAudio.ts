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
  bufferedTime: number
  isUserSeeking: boolean
  seekPreviewTime: number
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
    duration: 0,
    bufferedTime: 0,
    isUserSeeking: false,
    seekPreviewTime: 0
  }))

  const onSongEndCallback = ref<(() => void | Promise<void>) | null>(null)

  function ensureContext() {
    if (!audioState.value.audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioState.value.audioCtx = new AudioContext()
      audioState.value.gainNode = audioState.value.audioCtx.createGain()
      audioState.value.gainNode.connect(audioState.value.audioCtx.destination)
    }
  }

  function createAudioElement(): HTMLAudioElement {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    
    audio.addEventListener('ended', () => {
      audioState.value.isPlaying = false
      if (onSongEndCallback.value) {
        Promise.resolve(onSongEndCallback.value()).catch(console.error)
      }
    })
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', audio.error, e)
      audioState.value.isPlaying = false
    })

    audio.addEventListener('timeupdate', () => {
      if (!audioState.value.isUserSeeking) {
        audioState.value.currentTime = audio.currentTime
      }
      audioState.value.duration = audio.duration
    })

    audio.addEventListener('progress', () => {
      if (audio.buffered.length > 0) {
        audioState.value.bufferedTime = audio.buffered.end(audio.buffered.length - 1)
      }
    })

    return audio
  }

  function connectToWebAudio() {
    if (!audioState.value.audioElement || !audioState.value.audioCtx || !audioState.value.gainNode) return
    
    try {
      if (audioState.value.sourceNode) {
        audioState.value.sourceNode.disconnect()
      }
      
      audioState.value.sourceNode = audioState.value.audioCtx.createMediaElementSource(audioState.value.audioElement)
      audioState.value.sourceNode.connect(audioState.value.gainNode)
    } catch (error) {
      console.error('Web Audio API connection failed:', error)
    }
  }

  function cleanupAudioElement() {
    if (audioState.value.audioElement) {
      audioState.value.audioElement.pause()
      audioState.value.audioElement.src = ''
      audioState.value.audioElement.load()
      audioState.value.audioElement = null
    }
    
    if (audioState.value.sourceNode) {
      audioState.value.sourceNode.disconnect()
      audioState.value.sourceNode = null
    }
  }

  async function play(url: string, offset = 0) {
    ensureContext()
    
    if (audioState.value.audioCtx?.state === 'suspended') {
      await audioState.value.audioCtx.resume()
    }

    if (audioState.value.currentUrl !== url || !audioState.value.audioElement) {
      cleanupAudioElement()
      
      audioState.value.audioElement = createAudioElement()
      audioState.value.audioElement.src = url
      audioState.value.currentUrl = url
      
      connectToWebAudio()
    }

    try {
      if (offset > 0 && audioState.value.audioElement) {
        audioState.value.audioElement.currentTime = offset
      }

      await audioState.value.audioElement?.play()
      audioState.value.isPlaying = true
    } catch (error) {
      console.error('Failed to play audio:', error)
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
    const volume = Math.max(0, Math.min(1, v))
    audioState.value.volume = volume
    
    if (audioState.value.audioElement) {
      audioState.value.audioElement.volume = volume
    }
    if (audioState.value.gainNode) {
      audioState.value.gainNode.gain.value = volume
    }
  }

  function startSeeking() {
    audioState.value.isUserSeeking = true
    audioState.value.seekPreviewTime = audioState.value.currentTime
  }

  function updateSeekPreview(time: number) {
    if (audioState.value.isUserSeeking) {
      audioState.value.seekPreviewTime = time
    }
  }

  function stopSeeking(seekToTime?: number) {
    audioState.value.isUserSeeking = false
    if (seekToTime !== undefined) {
      seek(seekToTime)
    }
  }

  function togglePlayPause() {
    if (audioState.value.isPlaying) {
      pause()
    } else if (audioState.value.currentUrl) {
      play(audioState.value.currentUrl, audioState.value.currentTime)
    }
  }

  function cleanup() {
    cleanupAudioElement()
    
    if (audioState.value.audioCtx?.state !== 'closed') {
      audioState.value.audioCtx?.close()
    }
    
    audioState.value.audioCtx = null
    audioState.value.gainNode = null
    audioState.value.sourceNode = null
    audioState.value.currentUrl = ''
    audioState.value.isPlaying = false
  }

  if (import.meta.client) {
    window.addEventListener('beforeunload', cleanup)
  }

  return {
    isPlaying: computed({get: () => audioState.value.isPlaying, set: () => {}}),
    currentTime: computed({get: () => audioState.value.currentTime, set: (value) => seek(value)}),
    duration: computed(() => audioState.value.duration),
    volume: computed({get: () => audioState.value.volume, set: (value) => setVolume(value)}),
    bufferedTime: computed(() => audioState.value.bufferedTime),
    isUserSeeking: computed(() => audioState.value.isUserSeeking),
    seekPreviewTime: computed(() => audioState.value.seekPreviewTime),
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
    startSeeking,
    updateSeekPreview,
    stopSeeking,
    cleanup,
  }
}