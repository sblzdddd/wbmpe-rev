export default defineNuxtPlugin(async () => {
  const playlistStore = usePlaylistStore()
  const { isAuthenticated } = useAuth()
  
  // On server-side, if user is authenticated, pre-fetch playlists
  if (isAuthenticated.value) {
    try {
      await playlistStore.fetchPlaylists()
    } catch (error) {
      // Fail silently on server to avoid blocking page load
      console.warn('Failed to pre-fetch playlists on server:', error)
    }
  }
}) 