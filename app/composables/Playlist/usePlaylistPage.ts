import type { PlaylistResponse } from '#types/Playlist';

export const usePlaylistPage = (playlistId: string | string[] | undefined) => {
  if (!playlistId) {
    throw new Error('Playlist ID is required');
  }
  const { addPlaylist } = usePlayer();
  
  const playlist = useNuxtData<PlaylistResponse>(`playlist-page-${playlistId}`);
  
  const refreshPlaylist = async () => {
    await refreshCookie(`playlist-page-${playlistId}`);
  };
  
  const songs = computed(() => 
    playlist.data.value?.data?.songList.songs.map((song, index) => ({
      ...song.song,
      id: song._id,
      index: index
    })) || []
  );
  
  const rawSongs = computed(() => 
    playlist.data.value?.data?.songList.songs.map(song => song.song) || []
  );
  
  const playAll = async () => {
    if (songs.value && songs.value.length > 0) {
      await addPlaylist(songs.value, songs.value[0]?._id || null); // Play immediately
    }
  };
  
  const addAllToQueue = async () => {
    if (songs.value && songs.value.length > 0) {
      await addPlaylist(songs.value, null); // Add to queue
    }
  };
  
  const playSong = async (index: number) => {
    if (rawSongs.value && rawSongs.value.length > 0 && index >= 0 && index < rawSongs.value.length) {
      await addPlaylist(rawSongs.value, rawSongs.value[index]?._id || null);
    }
  };
  
  const playSongById = async (songId: string) => {
    if (rawSongs.value && rawSongs.value.length > 0) {
      const targetSong = rawSongs.value.find(song => song._id === songId);
      if (targetSong) {
        await addPlaylist(rawSongs.value, songId);
      }
    }
  };
  
  return {
    playlist,
    songs,
    rawSongs,
    playAll,
    addAllToQueue,
    playSong,
    playSongById,
    refreshPlaylist
  };
};