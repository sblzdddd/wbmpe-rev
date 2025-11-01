import type { AlbumResponse } from '#types/Album';
import type { SongType } from '#types/Song';

export const useAlbumPage = (albumId: string | string[]) => {
  const id = Array.isArray(albumId) ? albumId[0] : albumId;
  const { addPlaylistToQueue } = useQueue();
  
  const album = useNuxtData<AlbumResponse>(`album-page-${id}`);
  
  const songs = computed(() => {
    return album.data.value?.data?.songList?.songs || [];
  });

  const playAll = () => {
    if (songs.value.length === 0) return;
    
    const songList = songs.value.map(item => item.song);
    addPlaylistToQueue(songList, songList[0]?._id || null);
  };

  const addAllToQueue = () => {
    if (songs.value.length === 0) return;
    
    const songList = songs.value.map(item => item.song);
    addPlaylistToQueue(songList);
  };

  const playSong = (song: SongType, index: number) => {
    const songList = songs.value.map(item => item.song);
    addPlaylistToQueue(songList, songList[index]?._id || null);
  };

  return {
    songs,
    album,
    playAll,
    addAllToQueue,
    playSong
  };
};
