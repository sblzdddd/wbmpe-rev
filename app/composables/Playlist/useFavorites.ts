import type { InternalApi } from 'nitropack';
import { useUserPlaylist } from './useUserPlaylist';

export const useFavorites = () => {
  const favorites = useNuxtData<InternalApi['/api/user/favorites']['get']>('userFavorites');
  const { playlists } = useUserPlaylist()
  const isFavorite = (songId: string) => {
    return favorites.data.value?.includes(songId) ?? false;
  }

  const toggleFavorite = async (songId: string) => {
    const originalState = isFavorite(songId);
    const response = await $fetch<InternalApi['/api/user/favorites']['put']>('/api/user/favorites', {
      method: 'PUT',
      body: { songId, set: !originalState },
      onRequest: () => {
        if (originalState) {
          favorites.data.value = favorites.data.value?.filter((id: string) => id !== songId) ?? [];
        } else {
          favorites.data.value = [...(favorites.data.value ?? []), songId];
        }
      },
      onResponse: () => {
        refreshNuxtData('userFavorites')
        if(playlists.data.value?.favorites?._id) {
          refreshNuxtData(`playlist-page-${playlists.data.value?.favorites?._id}`)
        }
      }
    })
    return response;
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite
  };
}; 