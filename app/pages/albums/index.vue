<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const { paddingClass } = useContentPadding();
const seoData = useState<SEOData>('seoData');

seoData.value.title = 'Albums';
seoData.value.description = 'Browse all albums';
seoData.value.ogTitle = 'Albums';

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(50);

// Fetch albums data
const { data: albumsData, pending, error, refresh } = await useFetch('/api/album', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value
  })),
  key: computed(() => `albums-list-${currentPage.value}-${itemsPerPage.value}`)
});

const albums = computed(() => albumsData.value?.data || []);
const pagination = computed(() => albumsData.value?.pagination);

// Handle pagination
const goToPage = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-8 mb-16 mx-4 lg:mx-16">
      <h1 class="text-2xl font-bold mb-6">Albums</h1>
      
      <!-- Error state -->
      <div v-if="error" class="text-red-500 p-4 border border-red-300 rounded-lg mb-6">
        <p>Error loading albums: {{ error.statusMessage }}</p>
        <Button class="mt-2" @click="refresh">Retry</Button>
      </div>

      <!-- Loading state -->
      <div v-else-if="pending" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="i in 12" :key="i" class="animate-pulse">
          <div class="bg-muted/50 aspect-square rounded-lg mb-2" />
          <div class="bg-muted/50 h-4 rounded mb-1" />
          <div class="bg-muted/50 h-3 rounded w-3/4" />
        </div>
      </div>

      <!-- Albums grid -->
      <div v-else-if="albums.length > 0" class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <EntityCard v-for="album in albums" :image="album.coverUrl" :href="`/albums/${album._id}`" :title="album.name" :sub-title="album.platform" img-class="!w-full" />
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center mt-8">
          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage"
              @click="goToPage(currentPage - 1)"
            >
              Previous
            </Button>
            
            <span class="text-sm text-muted-foreground">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <Icon name="lucide:music" size="64" class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">No albums found</h3>
        <p class="text-muted-foreground">Albums will appear here when they are created.</p>
      </div>
    </div>
  </div>
</template>
