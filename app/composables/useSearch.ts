export const useSearch = () => {
  // Global search state
  const searchState = useState('searchState', () => ({
    keyword: '',
    suggestions: [] as string[],
    showSuggestions: false,
    suggestionsPending: false
  }))

  // Debounced search functionality
  let debounceTimer: NodeJS.Timeout | null = null

  const fetchSuggestions = async (keyword: string) => {
    if (keyword.length < 2) {
      searchState.value.suggestions = []
      searchState.value.showSuggestions = false
      return
    }

    searchState.value.suggestionsPending = true
    
    try {
      const data = await $fetch<{ suggestions: string[] }>('/api/search/suggestions', {
        query: { keyword }
      })
      
      if (data?.suggestions) {
        searchState.value.suggestions = data.suggestions
        searchState.value.showSuggestions = true
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      searchState.value.suggestions = []
      searchState.value.showSuggestions = false
    } finally {
      searchState.value.suggestionsPending = false
    }
  }

  // Watch for keyword changes and debounce
  watch(() => searchState.value.keyword, (newKeyword) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!newKeyword || newKeyword.length < 2) {
      searchState.value.suggestions = []
      searchState.value.showSuggestions = false
      return
    }
    
    debounceTimer = setTimeout(() => {
      fetchSuggestions(newKeyword)
    }, 300)
  })

  // Navigation functions
  const router = useRouter()
  const route = useRoute()

  const performSearch = (keyword?: string) => {
    const searchTerm = keyword || searchState.value.keyword
    if (!searchTerm.trim()) return

    // Hide suggestions
    searchState.value.showSuggestions = false

    const newPath = `/search/${encodeURIComponent(searchTerm.trim())}`

    if(route.path.includes(newPath)) {
      router.go(0)
    } else {
      router.push(newPath)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    searchState.value.keyword = suggestion
    performSearch(suggestion)
  }

  const clearSearch = () => {
    searchState.value.keyword = ''
    searchState.value.suggestions = []
    searchState.value.showSuggestions = false
  }

  return {
    // State
    searchKeyword: computed({
      get: () => searchState.value.keyword,
      set: (value) => searchState.value.keyword = value
    }),
    searchSuggestions: computed({
      get: () => searchState.value.suggestions,
      set: (value) => searchState.value.suggestions = value
    }),
    showSuggestions: computed({
      get: () => searchState.value.showSuggestions,
      set: (value) => searchState.value.showSuggestions = value
    }),
    suggestionsPending: computed({
      get: () => searchState.value.suggestionsPending,
      set: (value) => searchState.value.suggestionsPending = value
    }),
    
    // Actions
    performSearch,
    selectSuggestion,
    clearSearch
  }
}