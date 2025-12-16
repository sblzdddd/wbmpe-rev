export const useSearch = () => {
  // Global search state
  const searchState = useState('searchState', () => ({
    keyword: '',
  }))

  // Navigation functions
  const router = useRouter()
  const route = useRoute()

  const performSearch = (keyword?: string) => {
    const searchTerm = keyword || searchState.value.keyword
    if (!searchTerm.trim()) return

    const newPath = `/search/${encodeURIComponent(searchTerm.trim())}`

    if(route.path.includes(newPath)) {
      router.go(0)
    } else {
      router.push(newPath)
    }
  }

  const clearSearch = () => {
    searchState.value.keyword = ''
  }

  return {
    // State
    searchKeyword: computed({
      get: () => searchState.value.keyword,
      set: (value) => searchState.value.keyword = value
    }),
    
    // Actions
    performSearch,
    clearSearch
  }
}