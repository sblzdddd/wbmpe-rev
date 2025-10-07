<template>
  <div class="flex flex-col my-4 lg:my-16 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <div class="flex gap-4 md:gap-7 mb-6 px-4 md:px-0 items-center">
      <Picture 
        v-if="album.data.value?.data?.coverUrl" 
        :src="album.data.value?.data?.coverUrl" 
        class="min-w-30 h-30 md:min-w-40 md:h-40 rounded-sm overflow-hidden" 
        :modifiers="{resize: {s: 320}}" 
        :alt="`Album ${id}`"
        :img-attrs="{class: 'w-full h-full object-cover'}"
      />
      <div v-else class="min-w-30 h-30 md:min-w-40 md:h-40 rounded-sm overflow-hidden bg-muted/50 flex items-center justify-center">
        <Icon name="lucide:music" size="32" class="text-muted-foreground" />
      </div>
      <div class="flex flex-col grow gap-2">
        <h1 class="text-base md:text-2xl font-bold">{{ album.data.value?.data?.name }}</h1>
        <div class="flex gap-2 text-xs md:text-sm text-muted-foreground">
          <p>{{ album.data.value?.data?.songList.length }} songs</p>
          <p v-if="album.data.value?.data?.platform">{{ album.data.value?.data?.platform }}</p>
          <p v-if="album.data.value?.data?.createdAt">created {{ new Date(album.data.value?.data?.createdAt || '').toLocaleDateString() }}</p>
        </div>
        <p v-if="album.data.value?.data?.description" class="text-xs md:text-sm text-muted-foreground">{{ album.data.value?.data?.description }}</p>
        <div class="grow" />
        <div class="hidden md:flex items-start justify-start gap-2">
          <Button variant="default" :disabled="!songs || songs.length === 0" @click="playAll">
            <Icon name="lucide:play" class="w-4 h-4" /> Play All
          </Button>
          <Button variant="outline" :disabled="!songs || songs.length === 0" @click="addAllToQueue">
            <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
          </Button>
          <NuxtLink :to="`/albums/${id}/edit`">
            <Button variant="outline"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="flex md:hidden items-start justify-start gap-2 px-4 w-full">
      <Button variant="default" class="grow" :disabled="!songs || songs.length === 0" @click="playAll">
        <Icon name="lucide:play" class="w-4 h-4" /> Play All
      </Button>
      <Button variant="outline" class="grow" :disabled="!songs || songs.length === 0" @click="addAllToQueue">
        <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
      </Button>
      <NuxtLink class="grow" :to="`/albums/${id}/edit`">
        <Button variant="outline" class="w-full"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
      </NuxtLink>
    </div>
    
    <TabPages 
      :tabs="tabsConfig"
      class="mt-6 md:px-0"
      layout-id="album-tab-highlighter"
      default-tab="songs"
      :tab-container-attrs="{class: 'px-4 md:px-0'}"
    >
      <template #songs>
        <div class="list-header">
          <p class="block md:hidden">Sort by: </p>
          <Tooltip>
            <TooltipTrigger class="h-full">
              <div class="sort-item" :class="{'active': sortMode === 'index', 'asc': sortOrder === 'asc'}" @click="sortMode = 'index'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">No. <Icon v-if="sortMode === 'index'" class="block md:hidden" name="lucide:chevron-down" /></div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sort by index {{ sortOrder === 'asc' ? 'descending' : 'ascending' }}</p>
            </TooltipContent>
          </Tooltip>
          <div :class="{'active': sortMode === 'title', 'asc': sortOrder === 'asc'}" @click="sortMode = 'title'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Title <Icon v-if="sortMode === 'title'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'artist', 'asc': sortOrder === 'asc'}" @click="sortMode = 'artist'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Artist <Icon v-if="sortMode === 'artist'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'like', 'asc': sortOrder === 'asc'}" @click="sortMode = 'like'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Like <Icon v-if="sortMode === 'like'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'duration', 'asc': sortOrder === 'asc'}" @click="sortMode = 'duration'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Duration <Icon v-if="sortMode === 'duration'" name="lucide:chevron-down" /></div>
        </div>
        <div v-if="songs && songs.length > 0" class="flex flex-col">
          <WindowVirtualizer v-slot="{ item, index }" :data="songs" :item-size="54" :overscan="10" :ssr-count="10">
            <SongItem
              :song="item"
              :index="index"
              @play="(index, song) => playSong(song, index)"
            />
          </WindowVirtualizer>
        </div>
      </template>

      <template #info>
        <div class="flex flex-col gap-4 p-4">
          <div v-if="album.data.value?.data?.description">
            <h3 class="font-medium mb-2">Description</h3>
            <p class="text-muted-foreground">{{ album.data.value?.data?.description }}</p>
          </div>
          <div v-if="album.data.value?.data?.artists && album.data.value?.data?.artists.length > 0">
            <h3 class="font-medium mb-2">Artists</h3>
            <div class="flex flex-wrap gap-2">
              <NuxtLink 
                v-for="artist in album.data.value?.data?.artists" 
                :key="artist._id" 
                :to="`/artists/${artist._id}`"
                class="text-primary hover:underline"
              >
                {{ artist.name }}
              </NuxtLink>
            </div>
          </div>
          <div v-if="album.data.value?.data?.platform">
            <h3 class="font-medium mb-2">Platform</h3>
            <p class="text-muted-foreground">{{ album.data.value?.data?.platform }}</p>
          </div>
        </div>
      </template>
    </TabPages>
  </div>
</template>

<script setup lang="ts">
import SongItem from '@/components/Widget/SongItem.vue';
import { BACKGROUND } from '@/lib/background_settings';
import type { SEOData } from '#types/Utils/SEO';
import type { AlbumResponse } from '#types/Album';
import Picture from '@/components/Picture.vue';
import Button from '@/components/ui/button/Button.vue';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import TabPages from '~/components/ui/tab-pages/TabPages.vue';
import { WindowVirtualizer } from '~/components/ui/Virtua';

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const id = route.params.id;

const { open } = useSidebar()

const { setBackground, resetBackground } = useBackground();

const sortMode = ref<'index' | 'title' | 'artist' | 'duration' | 'like'>('index');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Use the album page composable for common functionality
const { songs, playAll, addAllToQueue, playSong } = useAlbumPage(id as string);

// Tab configuration
const tabsConfig = computed(() => [
  {
    key: 'songs',
    label: `${album.data.value?.data?.songList.length || 0} Songs`,
    to: '?tab=songs',
    slot: 'songs'
  },
  {
    key: 'info',
    label: 'Info',
    to: '?tab=info',
    slot: 'info'
  }
]);

// Flag to prevent infinite loops
const isUpdatingFromRoute = ref(false);

watch([() => route.query.sort, () => route.query.order], ([sort, order]) => {
  if (isUpdatingFromRoute.value) return;
  
  if (sort) sortMode.value = sort as 'title' | 'artist' | 'duration' | 'like';
  if (order) sortOrder.value = order as 'asc' | 'desc';
}, {deep: true, immediate: true})

watch([() => sortMode.value, () => sortOrder.value], async ([newSortMode, newSortOrder]) => {
  // Only update if values are different from current route query
  if (route.query.sort === newSortMode && route.query.order === newSortOrder) return;
  
  isUpdatingFromRoute.value = true;
  await navigateTo({
    query: {
      ...route.query,
      sort: newSortMode,
      order: newSortOrder
    }
  }, { replace: true });
  isUpdatingFromRoute.value = false;
}, {deep: true})

const { error } = await useFetch<InternalApi['/api/album/:id']>(`/api/album/${id}`, {
  key: computed(() => `album-page-${id}`),
  onResponse({ response }) {
    // Set background during SSR when data is received
    if (response._data?.default?.data?.coverUrl) {
      setBackground(response._data.default.data.coverUrl, BACKGROUND.playlist);
    }
    seoData.value.title = `${response._data?.default.data.name || 'Album'}`
  },
  lazy: false
})

const album = useNuxtData<AlbumResponse>(`album-page-${id}`);

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
    })
  }
}

// Keep the watcher as fallback for client-side updates
watch(() => album.data.value, (newVal) => {
  seoData.value.title = `${newVal?.data?.name || 'Album'}`
  if(newVal?.data?.coverUrl) {
    setBackground(newVal.data.coverUrl, BACKGROUND.playlist);
  }
  else if (newVal?.data?.songList.songs && newVal?.data?.songList.songs.length > 0) {
    setBackground(newVal?.data?.songList.songs[0]?.song.album.coverUrl || "", BACKGROUND.playlist);
  } else {
    console.log('resetting background')
    resetBackground();
  }
}, {immediate: true})
</script>

<style scoped>
@reference '../../../assets/css/tailwind.css';
.list-header {
  @apply grid pl-4 text-xs h-8 items-center mb-4 border-b border-black/10 dark:border-white/10;
  grid-template-columns: [index] 38px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [var2] 40px [last] 60px;
  @media (max-width: 768px) {
    grid-template-columns: [index] 1fr [first] 1fr [var1] 1fr [var2] 1fr [var3] 1fr [last] 1fr;
  }
}
.list-header > div:not(.not-sortable), .sort-item {
  @apply flex items-center h-full gap-1 cursor-pointer 
  text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white border-b border-transparent;
  transition: color 0.3s ease-out;

  &.active {
    @apply text-primary border-primary;
    transition: border-color 0.3s ease-out;
    & span {
      @apply transition-transform duration-300 ease-in-out;
    }
    &.asc span {
      @apply rotate-180;
    }
  }
}
</style>