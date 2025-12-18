
import type { SongType } from '#types/Song';

export const useArtistPage = (artistId: string) => {
  const { addPlaylistToQueue } = useQueue();

  const { data: artist, refresh, error } = useFetch<any>(`/api/artist/${artistId}`, {
    key: `artist-page-${artistId}`,
  });

  const songs = computed(() => {
    return artist.value?.data?.songs || [];
  });

  const albums = computed(() => {
    return artist.value?.data?.albums || [];
  });

  const playAll = () => {
    if (songs.value.length === 0) return;
    // songs in artist API is Array<SongType>
    addPlaylistToQueue(songs.value, songs.value[0]?._id || null);
  };
  
  const playSong = (song: SongType, index: number) => {
    addPlaylistToQueue(songs.value, songs.value[index]?._id || null);
  }

  const addAllToQueue = () => {
     if (songs.value.length > 0) {
        addPlaylistToQueue(songs.value);
     }
  }

  return {
    artist,
    songs,
    albums,
    playAll,
    playSong,
    addAllToQueue,
    refresh,
    error
  };
};
