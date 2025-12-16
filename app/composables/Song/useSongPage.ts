import type { SongType } from '#types/Song';

export const useSongPage = (songId: string | string[] | undefined) => {
  if (!songId) {
    throw new Error('Song ID is required');
  }
  
  const { addSong } = usePlayer();
  
  const song = useNuxtData<{success: boolean; song: SongType}>(`song-page-${songId}`);
  
  const refreshSong = async () => {
    await refreshCookie(`song-page-${songId}`);
  };
  
  const playSong = async () => {
    if (song.data.value?.song) {
      await addSong(song.data.value.song);
    }
  };
  
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
