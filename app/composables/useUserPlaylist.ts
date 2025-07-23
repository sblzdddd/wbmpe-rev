import type { InternalApi } from 'nitropack';

export const useUserPlaylist = () => {
  const playlists = useNuxtData<InternalApi['/api/user/playlists']['get']>('userPlaylists');

  return {
    playlists,
  };
}; 