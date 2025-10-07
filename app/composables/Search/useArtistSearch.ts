export const useArtistSearch = () => {
  const searchResults = ref<{_id: string; name: string; avatarUrl?: string; platform?: string}[]>([]);
  const isSearching = ref(false);
  const searchQuery = ref('');

  const searchArtists = async (query: string) => {
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    try {
      const { data } = await $fetch('/api/artist/search', {
        query: { name: query }
      });
      searchResults.value = data;
    } catch (error) {
      console.error('Error searching artists:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const debouncedSearch = useDebounceFn(searchArtists, 300);

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
    searchArtists,
    clearSearch
  };
};
