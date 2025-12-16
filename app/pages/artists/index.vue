<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';
import type { SimpleArtist } from '#types/Artist/SimpleArtist';

const { paddingClass } = useContentPadding();
const seoData = useState<SEOData>('seoData');

seoData.value.title = 'Artists';
seoData.value.description = 'Browse all artists';
seoData.value.ogTitle = 'Artists';

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(50);

interface ArtistResponse {
  data: SimpleArtist[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Fetch artists data
const { data: artistsData, pending, error, refresh } = await useFetch<ArtistResponse>('/api/artist', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value
  })),
  key: computed(() => `artists-list-${currentPage.value}-${itemsPerPage.value}`)
});

const artists = computed(() => artistsData.value?.data || []);
const pagination = computed(() => artistsData.value?.pagination);

// Handle pagination
const goToPage = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-8 mb-16 mx-4 lg:mx-16">
      <h1 class="text-2xl font-bold mb-6">Artists</h1>
      
      <!-- Error state -->
      <div v-if="error" class="text-red-500 p-4 border border-red-300 rounded-lg mb-6">
        <p>Error loading artists: {{ error.statusMessage }}</p>
        <Button class="mt-2" @click="refresh">Retry</Button>
      </div>

      <!-- Loading state -->
      <div v-else-if="pending" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="i in 12" :key="i" class="animate-pulse">
          <div class="bg-muted/50 aspect-square rounded-full mb-2" />
          <div class="bg-muted/50 h-4 rounded mb-1 mx-auto w-3/4" />
        </div>
      </div>

      <!-- Artists grid -->
      <div v-else-if="artists.length > 0" class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink 
            v-for="artist in artists" 
            :key="artist._id" 
            :to="`/artist/${artist._id}`"
            class="group cursor-pointer text-center"
          >
            <div class="space-y-2">
              <div class="relative aspect-square rounded-full overflow-hidden bg-muted/50 mx-auto w-full max-w-[200px]">
                <Picture 
                  v-if="artist.avatarUrl" 
                  :src="artist.avatarUrl" 
                  :alt="`Artist ${artist.name}`"
                  class="w-full h-full"
                  :img-attrs="{class: 'w-full h-full object-cover transition-transform group-hover:scale-105'}"
                  :modifiers="{resize: {s: 300}}"
                />
                <div class="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Icon name="lucide:mic-2" size="32" />
                </div>
              </div>
              <div class="space-y-1">
                <h3 class="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {{ artist.name }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ artist.platform || 'Local' }}
                </p>
              </div>
            </div>
          </NuxtLink>
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
        <Icon name="lucide:mic-2" size="64" class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">No artists found</h3>
        <p class="text-muted-foreground">Artists will appear here when they are created.</p>
      </div>
    </div>
  </div>
</template>
