<template>
  <div class="flex flex-col my-4 lg:my-16 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <div class="flex gap-4 md:gap-7 mb-6 px-4 md:px-0 items-center">
      <div class="flex flex-col grow gap-2">
        
          <NuxtLink 
            v-if="song.data.value?.song?.album"
            :to="song.data.value?.song?.src"
            class="hover:text-primary transition-colors"
          >
            <h1 class="text-base md:text-2xl lg:text-3xl font-bold">{{ song.data.value?.song?.name }}</h1>
          </NuxtLink>
        <div class="flex gap-2 text-xs md:text-sm text-muted-foreground">
          <NuxtLink 
            v-for="artist in song.data.value?.song?.artists"
            :key="artist._id"
            :to="`/artists/${artist._id}`"
            class="hover:text-primary transition-colors"
          >
            <Picture 
              v-if="artist.avatarUrl"
              :src="artist.avatarUrl" 
              class="w-2 h-2 rounded-full overflow-hidden inline-block" 
              :modifiers="{resize: {s: 80}}" 
              :alt="artist.name"
              :img-attrs="{class: 'w-full h-full object-cover'}"
            />
            {{ artist.name }}
          </NuxtLink>
        </div>
        <div class="flex gap-2 text-xs md:text-sm text-muted-foreground">
          <NuxtLink 
            v-if="song.data.value?.song?.album"
            :to="`/albums/${song.data.value?.song?.album._id}`"
            class="hover:text-primary transition-colors"
          >
            {{ song.data.value?.song?.album.name }}
          </NuxtLink>
        </div>
        <div class="grow" />
        <div class="hidden md:flex items-start justify-start gap-2">
          <Button variant="default" @click="playSong">
            <Icon name="lucide:play" class="w-4 h-4" /> Play
          </Button>
          <Button variant="outline" @click="addToQueue">
            <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
          </Button>
          <NuxtLink v-if="canEdit" :to="`/songs/${id}/edit`">
            <Button variant="outline"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="flex md:hidden items-start justify-start gap-2 px-4 w-full">
      <Button variant="default" class="grow" @click="playSong">
        <Icon name="lucide:play" class="w-4 h-4" /> Play
      </Button>
      <Button variant="outline" class="grow" @click="addToQueue">
        <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
      </Button>
      <NuxtLink v-if="canEdit" class="grow" :to="`/songs/${id}/edit`">
        <Button variant="outline" class="w-full"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
      </NuxtLink>
    </div>
    
    <TabPages
      :tabs="tabsConfig"
      class="mt-6 md:px-0"
      layout-id="song-tab-highlighter"
      default-tab="comments"
      :tab-container-attrs="{class: 'px-4 md:px-0'}"
    >
      <template #comments>
        <Comments :entity-id="route.params.id as string ?? ''" />
      </template>

      <template #lyrics>
        <div class="flex flex-col gap-2 px-4 md:px-0">
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-2">Lyrics</h3>
            <p class="text-muted-foreground">Lyrics feature coming soon...</p>
          </div>
        </div>
      </template>
    </TabPages>
  </div>
</template>

<script setup lang="ts">
import { BACKGROUND } from '@/lib/background_settings';

const seoData = useState<SEOData>('seoData');
const route = useRoute();
const id = route.params.id;

const { open } = useSidebar();
const { setBackground } = useBackground();

// Use the song page composable for common functionality
const { song, playSong, addToQueue } = useSongPage(id);

const canEdit = computed(() => {
  return true;
});

// Tab configuration
const tabsConfig = computed(() => [
  {
    key: 'comments',
    label: 'Comments',
    to: '?tab=comments',
    slot: 'comments'
  },
  {
    key: 'lyrics',
    label: 'Lyrics',
    to: '?tab=lyrics',
    slot: 'lyrics'
  }
]);

const { error, refresh: refreshFetch } = await useFetch<InternalApi['/api/song/:id']['default']>(`/api/song/${id}`, {
  key: computed(() => `song-page-${id}`),
  onResponse({ response }) {
    const song = response._data?.song;
    if(!song) return;
    // Set background during SSR when data is received
    if (song.album?.coverUrl) {
      setBackground(song.album.coverUrl, BACKGROUND.playlist);
    }
    seoData.value.title = `${song.name || 'Song'}`;
    seoData.value.description = `${song.name} by ${song.artists?.map((a: SimpleArtist) => a.name).join(', ') || 'Unknown Artist'}`;
  },
  lazy: false
});

if (error.value) {
  // Check if there's browser history to go back
  if (import.meta.client && window.history.length > 1) {
    // Go back to the previous page
    window.history.back();
  } else {
    throw createError({
      statusCode: error.value.statusCode || 500,
      statusMessage: error.value.statusMessage || "Internal Server Error",
      message: error.value.message || "An unknown error occurred",
      fatal: false
    });
  }
}

const routePath = useState<RoutePath>('routePath', () => ({
  last: '',
  next: route.path
}));

// Watch for route changes to detect coming from edit page
watch(() => routePath.value.last, (newPath, oldPath) => {
  if (oldPath && oldPath.includes(`/songs/${id}/edit`)) {
    // Refresh data when coming back from edit page
    refreshFetch();
  }
}, { immediate: false });

// Also check on mount as fallback for direct navigation
onMounted(() => {
  // Check if coming from edit page (client-side only)
  if (import.meta.client) {
    const referrer = document.referrer;
    if (referrer && referrer.includes(`/songs/${id}/edit`)) {
      refreshFetch();
    }
  }
});

// Keep the watcher as fallback for client-side updates
watch(() => song.data.value, (newVal) => {
  if (newVal?.song) {
    seoData.value.title = `${newVal.song.name || 'Song'}`;
    seoData.value.description = `${newVal.song.name} by ${newVal.song.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}`;
    
    if (newVal.song.album?.coverUrl) {
      setBackground(newVal.song.album.coverUrl, BACKGROUND.playlist);
    }
  }
}, { immediate: true });
</script>

<style scoped>
</style>
