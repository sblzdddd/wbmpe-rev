import { usePlayer } from '../Player/usePlayer'
import { useQueue } from '../Player/useQueue'
import { useAudio } from '../Player/useAudio'
import type { SongType } from '#types/Song'

type WSPEvent = 
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK', time: number }
  | { type: 'CHANGE_SONG', song: SongType | null }
  | { type: 'UPDATE_QUEUE', songs: SongType[], currentIndex: number }
  | { type: 'SYNC_RESPONSE', state: PlayerSyncState }

interface PlayerSyncState {
  isPlaying: boolean
  currentTime: number
  currentSong: SongType | null
  queue: SongType[]
  queueIndex: number
}

// Module-level state (Singleton)
const connected = ref(false)
const lastEvent = ref<WSPEvent | null>(null)
const isRemoteUpdate = ref(false)
let eventSource: EventSource | null = null
let initialized = false

export const useWSP = () => {
  const player = usePlayer()
  const queue = useQueue()
  const audio = useAudio()
  const { loggedIn } = useUserSession()

  const sendAction = async (type: string, payload: any = {}) => {
    if (!loggedIn.value) return 
    try {
        await $fetch('/api/wsp/action', {
            method: 'POST',
            body: { type, payload }
        })
    } catch (e) {
        console.error('Failed to send WSP action', e)
    }
  }

  const handleMessage = async (event: WSPEvent) => {
    lastEvent.value = event
    isRemoteUpdate.value = true

    console.log('[WSP] Received event:', event.type)

    try {
      switch (event.type) {
        case 'PLAY':
          if (!audio.isPlaying.value) {
            audio.unPause()
          }
          break
        case 'PAUSE':
          if (audio.isPlaying.value) {
            audio.pause()
          }
          break
        case 'SEEK':
          if (Math.abs(audio.currentTime.value - event.time) > 0.5) {
            audio.seek(event.time)
          }
          break
        case 'CHANGE_SONG':
          if (player.currentSong.value?._id !== event.song?._id) {
            if (event.song) {
               await player.playSong(event.song)
            }
          }
          break
        case 'UPDATE_QUEUE':
           // Sync queue if it's different
           if (queue.queue.value.length !== event.songs.length || queue.queue.value[0]?._id !== event.songs[0]?._id) {
              if (event.songs.length > 0) {
                  await queue.clearQueue()
                  await queue.addPlaylistToQueue(event.songs)
              }
           }
           
           if (queue.currentIndex.value !== event.currentIndex) {
              await queue.setCurrentIndex(event.currentIndex)
           }
          break
        case 'SYNC_RESPONSE':
          // Apply full state
          if (event.state.queue && event.state.queue.length > 0) {
             const localQueue = queue.queue.value
             if (localQueue.length !== event.state.queue.length || localQueue[0]?._id !== event.state.queue[0]?._id) {
                 await queue.clearQueue()
                 await queue.addPlaylistToQueue(event.state.queue)
             }
             
             if (queue.currentIndex.value !== event.state.queueIndex) {
                 await queue.setCurrentIndex(event.state.queueIndex)
             }
          }

          if (event.state.currentSong && player.currentSong.value?._id !== event.state.currentSong._id) {
            await player.playSong(event.state.currentSong)
          }
          
          if (event.state.isPlaying && !audio.isPlaying.value) {
             try {
                audio.unPause()
             } catch (e) {
                console.warn('Autoplay prevented by browser policy', e)
            }
          } else if (!event.state.isPlaying && audio.isPlaying.value) {
            audio.pause()
          }
          
          if (event.state.currentTime && Math.abs(audio.currentTime.value - event.state.currentTime) > 1) {
            audio.seek(event.state.currentTime)
          }
          break
      }
    } finally {
      setTimeout(() => {
        isRemoteUpdate.value = false
      }, 300) // Small grace period
    }
  }

  const connect = () => {
    if (eventSource?.readyState === 1 || !loggedIn.value) return 

    eventSource = new EventSource('/api/wsp/connect')
    
    eventSource.onopen = () => {
        console.log('[WSP] Connected')
        connected.value = true
    }

    eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data)
        handleMessage(data)
    }

    eventSource.onerror = (e) => {
        console.error('[WSP] Error', e)
        connected.value = false
        eventSource?.close()
        // Retry logic could be added here
        setTimeout(connect, 5000)
    }
  }

  const init = () => {
    if (initialized || !import.meta.client) return
    initialized = true
    
    if (loggedIn.value) {
        connect()
    }
    
    watch(() => audio.isPlaying.value, (isPlaying) => {
      if (isRemoteUpdate.value) return
      sendAction(isPlaying ? 'PLAY' : 'PAUSE', { time: audio.currentTime.value })
    })
    
    // Explicit seek
    watch(() => audio.isUserSeeking.value, (isSeeking) => {
        if (!isSeeking && !isRemoteUpdate.value) {
            sendAction('SEEK', { time: audio.currentTime.value })
        }
    })

    // Song Change
    watch(() => player.currentSong.value?._id, (_newId) => {
      if (isRemoteUpdate.value) return
      const song = player.currentSong.value ? JSON.parse(JSON.stringify(player.currentSong.value)) : null
      sendAction('CHANGE_SONG', { song })
    })

    // Queue Change
    watch(() => queue.currentIndex.value, (newIndex) => {
      if (isRemoteUpdate.value) return
      const songs = JSON.parse(JSON.stringify(queue.queue.value))
      sendAction('UPDATE_QUEUE', { 
         songs,
         currentIndex: newIndex 
      })
    })

    // Watch login state to connect/disconnect
    watch(loggedIn, (isLoggedIn) => {
        if (isLoggedIn) {
            connect()
        } else {
            eventSource?.close()
            connected.value = false
            eventSource = null
        }
    })
  }

  // Auto-init if called in a client context
  if (import.meta.client) {
      init()
  }

  return {
    connected,
    lastEvent
  }
}
