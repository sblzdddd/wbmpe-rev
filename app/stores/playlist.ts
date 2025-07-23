import { defineStore } from 'pinia'
import type { PlaylistMeta } from '~~/types/Playlist'

interface UserPlaylists {
  createdPlaylists: PlaylistMeta[]
  favorites: PlaylistMeta | null
  recent: PlaylistMeta | null
}

interface PlaylistsResponse {
  playlists: UserPlaylists
}

export const usePlaylistStore = defineStore('playlist', () => {
  // State
  const playlists = ref<UserPlaylists>({
    createdPlaylists: [],
    favorites: null,
    recent: null
  })
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Getters
  const createdPlaylists = computed(() => playlists.value.createdPlaylists)
  const favorites = computed(() => playlists.value.favorites)
  const recent = computed(() => playlists.value.recent)
  const hasPlaylists = computed(() => playlists.value.createdPlaylists.length > 0)

  // Actions
  const fetchPlaylists = async (force = false) => {
    const { isAuthenticated } = useAuth()
    
    if (!isAuthenticated.value) {
      clearPlaylists()
      return { success: false, error: 'Not authenticated' }
    }

    // Avoid duplicate fetches unless forced
    if (initialized.value && !force) {
      return { success: true, playlists: playlists.value }
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await useFetch<PlaylistsResponse>('/api/user/playlists', {
        key: 'user-playlists',
        // default: () => ({
        //   playlists: {
        //     createdPlaylists: [],
        //     favorites: null,
        //     recent: null
        //   }
        // }),
        server: true, // Enable SSR
        lazy: false   // Wait for data before rendering
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch playlists')
      }

      console.log(data.value)

      if (data.value) {
        playlists.value = data.value.playlists
        initialized.value = true
      }

      return { success: true, playlists: playlists.value }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlists'
      error.value = errorMessage
      clearPlaylists()
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const refreshPlaylists = async () => {
    return await fetchPlaylists(true)
  }

  const clearPlaylists = () => {
    playlists.value = {
      createdPlaylists: [],
      favorites: null,
      recent: null
    }
    error.value = null
    initialized.value = false
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize playlists when auth state changes
  const initializeWithAuth = async () => {
    const { isAuthenticated } = useAuth()
    
    if (isAuthenticated.value) {
      await fetchPlaylists()
    } else {
      clearPlaylists()
    }
  }

  // Add a playlist to the store (for real-time updates)
  const addPlaylist = (playlist: PlaylistMeta) => {
    playlists.value.createdPlaylists.push(playlist)
  }

  // Remove a playlist from the store (for real-time updates)
  const removePlaylist = (playlistId: string) => {
    playlists.value.createdPlaylists = playlists.value.createdPlaylists.filter(
      p => p._id !== playlistId
    )
  }

  // Update a playlist in the store (for real-time updates)
  const updatePlaylist = (playlistId: string, updates: Partial<PlaylistMeta>) => {
    const index = playlists.value.createdPlaylists.findIndex(p => p._id === playlistId)
    if (index !== -1 && playlists.value.createdPlaylists[index]) {
      const currentPlaylist = playlists.value.createdPlaylists[index]!
      playlists.value.createdPlaylists[index] = {
        _id: updates._id ?? currentPlaylist._id,
        name: updates.name ?? currentPlaylist.name,
        coverUrl: updates.coverUrl !== undefined ? updates.coverUrl : currentPlaylist.coverUrl
      }
    }
  }

  return {
    // State
    playlists,
    loading,
    error,
    initialized,
    
    // Getters
    createdPlaylists,
    favorites,
    recent,
    hasPlaylists,
    
    // Actions
    fetchPlaylists,
    refreshPlaylists,
    clearPlaylists,
    clearError,
    initializeWithAuth,
    addPlaylist,
    removePlaylist,
    updatePlaylist
  }
}) 