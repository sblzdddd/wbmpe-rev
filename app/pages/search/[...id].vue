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
      <div v-if="data.results && data.results.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col">
          <WindowVirtualizer v-slot="{ item, index }" :data="data.results" :item-size="54" :overscan="10" :ssr-count="10">
            <SongItem
              :song="item"
              :index="index"
            />
          </WindowVirtualizer>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="(!data.results || data.results.length === 0)" class="flex items-center justify-center py-12">
        <div class="text-center">
          <h3 class="text-lg font-medium mb-2">No results found</h3>
          <p class="text-muted-foreground">Try searching with different keywords or platform</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InternalApi } from "nitropack"
import type { SEOData } from '#types/Utils/SEO'
import { WindowVirtualizer } from '~/components/ui/Virtua'

const route = useRoute()
const router = useRouter()

const { searchKeyword } = useSearch()

const routeParams = computed(() => {
  const params = Array.isArray(route.params.id) ? route.params.id : [route.params.id]
  return {
    keyword: params[0] || ''
  }
})

const { keyword } = toRefs(routeParams.value)

watch(keyword, (newKeyword) => {
  if (newKeyword && newKeyword !== searchKeyword.value) {
    searchKeyword.value = decodeURIComponent(newKeyword)
  }
}, { immediate: true })

const seoData = useState<SEOData>('seoData')
seoData.value.title = `Search "${keyword.value}" - WBMPE Rev`
seoData.value.description = `Search results for "${keyword.value}"`
seoData.value.ogTitle = `Search "${keyword.value}" - WBMPE Rev`

const hasKeyword = computed(() => keyword.value.length > 0)

const { data, pending, error } = await useFetch<InternalApi['/api/search/song']['get']>('/api/search/song', {
  key: computed(() => `search-results-${keyword.value}-1`),
  query: computed(() => ({
    keyword: keyword.value,
  })),
  server: true,
  watch: [keyword],
  default: () => ({
    totalPage: 1,
    results: []
  }),
  lazy: false
})

watch([hasKeyword], ([hasKw]) => {
  if (!hasKw) {
    router.push('/search')
  }
}, { immediate: true })

</script>