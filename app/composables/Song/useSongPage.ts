import type { SongType } from '#types/Song';

export const useSongPage = (songId: string | string[] | undefined) => {
  if (!songId) {
    throw new Error('Song ID is required');
  }
  
  const { addSong } = usePlayer();
  
  // Get song data from Nuxt data cache
  const song = useNuxtData<{success: boolean; song: SongType}>(`song-page-${songId}`);
  
  // Function to refresh song data
  const refreshSong = async () => {
    await refreshCookie(`song-page-${songId}`);
  };
  
  // Play the song
  const playSong = async () => {
    if (song.data.value?.song) {
      await addSong(song.data.value.song);
    }
  };
  
  // Add song to queue without playing immediately
  const addToQueue = async () => {
    if (song.data.value?.song) {
      await addSong(song.data.value.song, false);
    }
  };
  
  return {
    song,
    playSong,
    addToQueue,
    refreshSong
  };
};
