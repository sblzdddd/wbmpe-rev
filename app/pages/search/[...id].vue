<template>
  <div class="w-full h-full flex flex-col gap-6 px-2 my-10">
    <!-- Search Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">Search Results</h1>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="text-muted-foreground">Loading search results...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-12">
      <div class="text-red-500">{{ error.message }}</div>
    </div>

    <!-- Results -->
    <div v-else-if="data" class="flex flex-col gap-8">
      <!-- Stored Songs Results -->
      <div v-if="data.stored_songs && data.stored_songs.length > 0" class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold">From Your Library</h2>
        <div class="flex flex-col">
          <WindowVirtualizer v-slot="{ item, index }" :data="data.stored_songs" :item-size="54" :overscan="10" :ssr-count="10">
            <SongItem
              :song="item"
              :index="index"
              @play="() => {}"
            />
          </WindowVirtualizer>
        </div>
      </div>

      <!-- Platform Search Results -->
      <div v-if="transformedSearchResults && transformedSearchResults.length > 0" class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold">Online Results</h2>
        <div class="flex flex-col">
          <WindowVirtualizer v-slot="{ item, index }" :data="transformedSearchResults" :item-size="54" :overscan="10" :ssr-count="10">
            <SongItem
              :song="item"
              :index="index"
              @play="() => {}"
            />
          </WindowVirtualizer>
        </div>
        
        <!-- Loading Skeletons for Infinite Scroll -->
        <div v-if="showSkeletons" ref="skeletonRef" class="flex flex-col gap-2">
          <div v-for="i in 6" :key="i" class="flex items-center px-4 space-x-2 w-full">
            <Skeleton class="h-4 w-7" />
            <Skeleton class="h-12 w-12 rounded-full" />
            <div class="space-y-2 grow">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-8/10" />
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="(!transformedSearchResults || transformedSearchResults.length === 0) && (!data.stored_songs || data.stored_songs.length === 0)" class="flex items-center justify-center py-12">
        <div class="text-center">
          <h3 class="text-lg font-medium mb-2">No results found</h3>
          <p class="text-muted-foreground">Try searching with different keywords or platform</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SongItem from '~/components/Widget/SongItem.vue'
import type { InternalApi } from "nitropack"
import type { UnparsedSongType } from '#types/Search/UnparsedSongs'
import type { SongType } from '#types/Song'
import type { SEOData } from '#types/Utils/SEO'

const route = useRoute()
const router = useRouter()

// Use the search composable
const { searchKeyword } = useSearch()

// Parse route parameters: /search/keyword (remove page from URL)
const routeParams = computed(() => {
  const params = Array.isArray(route.params.id) ? route.params.id : [route.params.id]
  return {
    keyword: params[0] || ''
  }
})

const { keyword } = toRefs(routeParams.value)

// Infinite scroll state - only for additional pages beyond the first
const additionalResults = ref<UnparsedSongType[]>([])
const currentPage = ref(1)
const isLoadingMore = ref(false)

// Sync the route keyword with the global search state
watch(keyword, (newKeyword) => {
  if (newKeyword && newKeyword !== searchKeyword.value) {
    searchKeyword.value = decodeURIComponent(newKeyword)
  }
}, { immediate: true })

// SEO
const seoData = useState<SEOData>('seoData')
seoData.value.title = `Search "${keyword.value}" - WBMPE Rev`
seoData.value.description = `Search results for "${keyword.value}"`
seoData.value.ogTitle = `Search "${keyword.value}" - WBMPE Rev`

// Validate parameters
const hasKeyword = computed(() => keyword.value.length > 0)

// Reset additional results when keyword changes
watch(keyword, () => {
  currentPage.value = 1
  additionalResults.value = []
  isLoadingMore.value = false
}, { immediate: true })

// Initial fetch for first page
const { data, pending, error } = await useFetch<InternalApi['/api/search/song']['get']>('/api/search/song', {
  key: computed(() => `search-results-${keyword.value}-1`),
  query: computed(() => ({
    keyword: keyword.value,
    page: 1
  })),
  server: true,
  watch: [keyword],
  default: () => ({
    page: 1,
    totalPage: 1,
    results: [],
    stored_songs: []
  }),
  lazy: false
})

// Function to load next page
const loadNextPage = async () => {
  if (isLoadingMore.value || !data.value || currentPage.value >= data.value.totalPage) return
  
  isLoadingMore.value = true
  const nextPage = currentPage.value + 1
  
  try {
    const nextPageData = await $fetch<InternalApi['/api/search/song']['get']>('/api/search/song', {
      query: {
        keyword: keyword.value,
        page: nextPage
      }
    })
    
    if (nextPageData?.results) {
      // Append new results to additional results
      additionalResults.value = [...additionalResults.value, ...nextPageData.results]
      currentPage.value = nextPage
    }
  } catch (err) {
    console.error('Error loading next page:', err)
  } finally {
    isLoadingMore.value = false
  }
}

// Combine initial results with additional paginated results
const allResults = computed(() => {
  const initialResults = data.value?.results || []
  return [...initialResults, ...additionalResults.value]
})

// Transform all accumulated results
const transformedSearchResults = computed(() => {
  if (!allResults.value.length) return []
  
  return allResults.value.map((unparsedSong: UnparsedSongType): SongType => ({
    _id: unparsedSong._id,
    src: unparsedSong.src,
    name: unparsedSong.name.replace('<em class="keyword">', '').replace('</em>', ''),
    duration: unparsedSong.duration,
    artists: unparsedSong.artists.map(artist => ({
      _id: artist.id,
      name: artist.name
    })),
    album: {
      _id: unparsedSong.album.id,
      name: unparsedSong.album.name,
      coverUrl: unparsedSong.album.coverUrl
    }
  }))
})

// Intersection observer for infinite scroll
const skeletonRef = ref<HTMLElement>()

onMounted(() => {
  if (!skeletonRef.value) return
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMorePages.value && !isLoadingMore.value) {
          loadNextPage()
        }
      })
    },
    {
      rootMargin: '100px' // Start loading 100px before the skeleton is visible
    }
  )
  
  observer.observe(skeletonRef.value)
  
  onUnmounted(() => {
    observer.disconnect()
  })
})

// Computed properties for UI state
const hasMorePages = computed(() => data.value && currentPage.value < data.value.totalPage)
const showSkeletons = computed(() => hasMorePages.value || isLoadingMore.value)

// Redirect if invalid parameters
watch([hasKeyword], ([hasKw]) => {
  if (!hasKw) {
    router.push('/search')
  }
}, { immediate: true })
</script>