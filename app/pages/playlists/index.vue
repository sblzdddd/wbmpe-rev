<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';
import type { ExploreResponse } from '#types/explore';
import { fallbackExplorePage } from '~/lib/fallback_data';

const { paddingClass } = useContentPadding();
const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Playlists'
seoData.value.description = 'Playlists'
seoData.value.ogTitle = 'Playlists'

const { playlists } = useUserPlaylist();
const route = useRoute();

// Fetch explore data for the main content area
const { data: exploreData } = await useFetch<ExploreResponse>('/api/explore', {
  key: 'explore-page',
  default: () => (fallbackExplorePage)
})

// Transform user playlists to Recom format
const userPlaylistsRow = computed(() => {
  if (!playlists.data.value?.createdPlaylists) return null;
  
  return {
    title: "Your Playlists",
    items: [
      {
        title: 'Favorites',
        link: `/playlists/${playlists.data.value.favorites?._id}`,
        image: 'https://picsum.photos/300/300',
        artist: 'Private'
      },
      {
        title: 'Recent',
        link: `/playlists/${playlists.data.value.recent?._id}`,
        image: 'https://picsum.photos/300/300',
        artist: 'Private'
      },
      ...playlists.data.value.createdPlaylists.map(playlist => ({
        title: playlist.name,
        link: `/playlists/${playlist._id}`,
        image: playlist.coverUrl || 'https://picsum.photos/300/300',
        artist: playlist.isPublic ? 'Public' : 'Private'
      }))
    ]
  };
});
</script>

<template>
  <div :class="paddingClass">
    <div class="flex flex-col gap-4 pb-8 mt-4">
      
      <!-- User Playlists Row -->
      <div v-if="userPlaylistsRow && userPlaylistsRow.items.length > 0" class="recom-item w-full grid grid-cols-1">
        <Home-Recommend-Row :data="userPlaylistsRow" />
      </div>

      <!-- Create Playlist Button if no playlists -->
      <div v-else class="px-3 md:px-0 mb-8">
        <div class="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30">
          <h3 class="text-lg font-medium mb-2">No playlists yet</h3>
          <p class="text-muted-foreground mb-4">Create your first playlist to get started</p>
          <NuxtLink to="/playlists/create">
            <Button>
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Explore Rows -->
      <div v-for="item in exploreData?.data?.items" :key="item.title" class="recom-item w-full grid grid-cols-1">
        <Home-Recommend-Row :data="item" />
      </div>
    </div>
  </div>
</template>
