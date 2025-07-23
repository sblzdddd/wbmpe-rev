export default defineNuxtPlugin(async () => {
  const playlistStore = usePlaylistStore()
  const { isAuthenticated } = useAuth()
  
  // Watch auth state changes and manage playlist state accordingly
  watch(isAuthenticated, async (newValue) => {
    if (newValue) {
      // User just logged in, fetch playlists
      await playlistStore.initializeWithAuth()
    } else {
      // User logged out, clear playlists
      playlistStore.clearPlaylists()
    }
  }, { immediate: true })
}) 