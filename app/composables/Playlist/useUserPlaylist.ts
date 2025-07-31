import type { InternalApi } from 'nitropack';

export const useUserPlaylist = () => {
  const playlists = useNuxtData<InternalApi['/api/user/playlists']['get']>('userPlaylists');
  
  const createPlaylist = async (name: string, description: string, isPublic: boolean, coverFile: File | null) => {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('isPublic', isPublic.toString());
      
      // Add image file if selected
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      // Submit to API
      const response = await $fetch<InternalApi['/api/playlist']['post']>('/api/playlist', {
        method: 'POST',
        body: formData,
        onRequest: () => {
          playlists.data.value?.createdPlaylists.push({
            _id: '',
            name,
            coverUrl: '', // Will be updated when response comes back
            isPublic,
          })
        },
        onResponse: () => {
          refreshNuxtData('userPlaylists')
        }
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(`Failed to create playlist: ${response.data || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      console.error('Failed to create playlist:', err);
      throw err;
    }
  };

  const deletePlaylist = async (id: string) => {
    
    try {
      // Call the delete API endpoint
      const response = await $fetch<{success: boolean, message: string}>(`/api/playlist/${id}/delete`, {
        method: 'POST',
        onRequest: () => {
          if (playlists.data.value?.createdPlaylists) {
            playlists.data.value.createdPlaylists = playlists.data.value.createdPlaylists.filter(playlist => playlist._id !== id)
          }
        },
        onResponse: () => {
          refreshNuxtData('userPlaylists')
        }
      });
  
      if (response.success) {
        // Navigate back to playlists page
        await navigateTo('/playlists');
      } else {
        throw new Error('Failed to delete playlist');
      }
    } catch (err: unknown) {
      console.error('Failed to delete playlist:', err);
      throw err;
    }
  };

  return {
    playlists,
    createPlaylist,
    deletePlaylist
  };
}; 