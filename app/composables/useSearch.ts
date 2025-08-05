export const useSearch = () => {
  // Global search state
  const searchKeyword = useState<string>('search.keyword', () => '')
  const searchSuggestions = useState<string[]>('search.suggestions', () => [])
  const showSuggestions = useState<boolean>('search.showSuggestions', () => false)
  const suggestionsPending = ref(false)

  // Debounced search functionality
  let debounceTimer: NodeJS.Timeout | null = null

  const fetchSuggestions = async (keyword: string) => {
    if (keyword.length < 2) {
      searchSuggestions.value = []
      showSuggestions.value = false
      return
    }

    suggestionsPending.value = true
    
    try {
      const data = await $fetch<{ suggestions: string[] }>('/api/search/suggestions', {
        query: { keyword }
      })
      
      if (data?.suggestions) {
        searchSuggestions.value = data.suggestions
        showSuggestions.value = true
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      searchSuggestions.value = []
      showSuggestions.value = false
    } finally {
      suggestionsPending.value = false
    }
  }

  // Watch for keyword changes and debounce
  watch(searchKeyword, (newKeyword) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!newKeyword || newKeyword.length < 2) {
      searchSuggestions.value = []
      showSuggestions.value = false
      return
    }
    
    debounceTimer = setTimeout(() => {
      fetchSuggestions(newKeyword)
    }, 300)
  })

  // Navigation functions
  const router = useRouter()

  const performSearch = (keyword?: string) => {
    const searchTerm = keyword || searchKeyword.value
    if (!searchTerm.trim()) return

    // Hide suggestions
    showSuggestions.value = false
    
    // Navigate to search results
    router.push(`/search/${encodeURIComponent(searchTerm.trim())}/1`)
  }

  const selectSuggestion = (suggestion: string) => {
    searchKeyword.value = suggestion
    performSearch(suggestion)
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchSuggestions.value = []
    showSuggestions.value = false
  }

  return {
    // State
    searchKeyword,
    searchSuggestions,
    showSuggestions,
    suggestionsPending,
    
    // Actions
    performSearch,
    selectSuggestion,
    clearSearch
  }
}