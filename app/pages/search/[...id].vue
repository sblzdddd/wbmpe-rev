<template>
  <div class="w-full h-full flex flex-col gap-6 p-6">
    <!-- Search Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">Search Results</h1>
      <div class="text-muted-foreground">
        <span class="capitalize">"{{ keyword }}" • Page {{ page }}</span>
      </div>
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
          <SongItem
            v-for="(song, index) in data.stored_songs"
            :key="`stored-${song._id}`"
            :index="index"
            :song="song"
            @play="() => {}"
          />
        </div>
      </div>

      <!-- Platform Search Results -->
      <div v-if="data.results && data.results.length > 0" class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold">Online Results</h2>
        <div class="flex flex-col">
          <SongItem
            v-for="(song, index) in transformedSearchResults"
            :key="`search-${index}`"
            :index="index"
            :song="song"
            @play="() => {}"
          />
        </div>
        
        <!-- Pagination -->
        <div v-if="data.totalPage > 1" class="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            :disabled="page === 1"
            @click="goToPage(page - 1)"
          >
            Previous
          </Button>
          <span class="text-sm text-muted-foreground">
            Page {{ page }} of {{ data.totalPage }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= data.totalPage"
            @click="goToPage(page + 1)"
          >
            Next
          </Button>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="(!data.results || data.results.length === 0) && (!data.stored_songs || data.stored_songs.length === 0)" class="flex items-center justify-center py-12">
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
import type {InternalApi} from "nitropack";

const route = useRoute()
const router = useRouter()

// Parse route parameters: /search/platform/keyword/page
const routeParams = computed(() => {
  const params = Array.isArray(route.params.id) ? route.params.id : [route.params.id]
  return {
    keyword: params[0] || '',
    page: parseInt(params[1] || '1') || 1
  }
})

const { keyword, page } = toRefs(routeParams.value)

// SEO
const seoData = useState<SEOData>('seoData')
seoData.value.title = `Search "${keyword.value}" - WBMPE Rev`
seoData.value.description = `Search results for "${keyword.value}"`
seoData.value.ogTitle = `Search "${keyword.value}" - WBMPE Rev`

// Validate parameters
const hasKeyword = computed(() => keyword.value.length > 0)

// Fetch search results
const { data, pending, error } = await useFetch<InternalApi['/api/search/song']['get']>('/api/search/song', {
  query: {
    keyword: keyword.value,
    page: page.value
  },
  server: false,
  watch: [keyword, page],
  default: () => ({
    page: page.value,
    totalPage: 1,
    results: [],
    stored_songs: []
  })
})

// Transform UnparsedSong to Song format for SongItem component
const transformedSearchResults = computed(() => {
  if (!data.value?.results) return []
  
  return data.value.results.map((unparsedSong: UnparsedSongType): SongType => ({
    _id: unparsedSong._id,
    src: unparsedSong.src,
    name: unparsedSong.name,
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

// Navigation
const goToPage = (newPage: number) => {
  router.push(`/search/${keyword.value}/${newPage}`)
}

// Redirect if invalid parameters
watch([hasKeyword], ([hasKw]) => {
  if (!hasKw) {
    router.push('/search')
  }
}, { immediate: true })
</script>