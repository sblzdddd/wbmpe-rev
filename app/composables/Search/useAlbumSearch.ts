export const useAlbumSearch = () => {
  const searchResults = ref<{_id: string; name: string; coverUrl?: string; platform?: string}[]>([]);
  const isSearching = ref(false);
  const searchQuery = ref('');

  const searchAlbums = async (query: string) => {
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    try {
      const { data } = await $fetch('/api/album/search', {
        query: { name: query }
      });
      searchResults.value = data;
    } catch (error) {
      console.error('Error searching albums:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const debouncedSearch = useDebounceFn(searchAlbums, 300);

  watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery);
  });

  const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
  };

  return {
    searchResults: readonly(searchResults),
    isSearching: readonly(isSearching),
    searchQuery,
    searchAlbums,
    clearSearch
  };
};
