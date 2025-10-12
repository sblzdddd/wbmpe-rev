<template>
  <div class="flex flex-col my-4 lg:my-16 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <div class="flex gap-4 md:gap-7 mb-6 px-4 md:px-0 items-center">
      <Picture 
        v-if="playlist.data.value?.data?.coverUrl" 
        :src="playlist.data.value?.data?.coverUrl" 
        class="min-w-30 h-30 md:min-w-40 md:h-40 rounded-sm overflow-hidden" 
        :modifiers="{resize: {s: 320}}" 
        :alt="`Playlist ${id}`"
        :img-attrs="{class: 'w-full h-full object-cover'}"
      />
      <Playlist-CoverImageTile v-else :background-images="BackgroundImages" />
      <div class="flex flex-col grow gap-2">
        <h1 class="text-base md:text-2xl font-bold">{{ playlist.data.value?.data?.name }}</h1>
        <div class="flex gap-2 text-xs md:text-sm text-muted-foreground">
          <p>{{ playlist.data.value?.data?.songList.length }} songs</p>
          <p>created in {{ new Date(playlist.data.value?.data?.createdAt || '').toLocaleDateString() }}</p>
        </div>
        <p class="text-xs md:text-sm text-muted-foreground">{{ playlist.data.value?.data?.description }}</p>
        <div class="grow" />
        <div class="hidden md:flex items-start justify-start gap-2">
          <Button variant="default" :disabled="!songs || songs.length === 0" @click="playAll">
            <Icon name="lucide:play" class="w-4 h-4" /> Play All
          </Button>
          <Button variant="outline" :disabled="!songs || songs.length === 0" @click="addAllToQueue">
            <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
          </Button>
          <NuxtLink v-if="canEdit" :to="`/playlists/${id}/edit`">
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
      <NuxtLink class="grow" :to="`/playlists/${id}/edit`">
        <Button variant="outline" class="w-full"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
      </NuxtLink>
    </div>
    
    <TabPages 
      :tabs="tabsConfig"
      class="mt-6 md:px-0"
      layout-id="playlist-tab-highlighter"
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
          <div :class="{'active': sortMode === 'album', 'asc': sortOrder === 'asc'}" @click="sortMode = 'album'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Album <Icon v-if="sortMode === 'album'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'like', 'asc': sortOrder === 'asc'}" @click="sortMode = 'like'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Like <Icon v-if="sortMode === 'like'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'duration', 'asc': sortOrder === 'asc'}" @click="sortMode = 'duration'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Duration <Icon v-if="sortMode === 'duration'" name="lucide:chevron-down" /></div>
        </div>
        <div v-if="songs && songs.length > 0" class="flex flex-col">
          <WindowVirtualizer v-slot="{ item, index }" :data="songs" :item-size="54" :overscan="10" :ssr-count="10">
            <SongItem
              :song="item"
              :index="index"
              @play="playSong"
            />
          </WindowVirtualizer>
        </div>
      </template>

      <template #comments>
        <div class="flex flex-col gap-2">
          <p>Comments</p>
        </div>
      </template>

      <template #subscribers>
        <div class="flex flex-col gap-2">
          <p>Subscribers</p>
        </div>
      </template>
    </TabPages>
  </div>
</template>

<script setup lang="ts">
import { BACKGROUND } from '@/lib/background_settings';
import type { SEOData } from '#types/Utils/SEO';
import type { RoutePath } from "#types/Utils/RoutePath"
import type { PlaylistResponse } from '#types/Playlist';
import { WindowVirtualizer } from '~/components/ui/Virtua';

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const id = route.params.id as string;

definePageMeta({
  validate: async (route) => {
    // Check if the id is a valid ObjectId (24-character hexadecimal string)
    return typeof route.params.id === 'string' && /^[0-9a-fA-F]{24}$/.test(route.params.id)
  },
});

const { open } = useSidebar()

const { setBackground, resetBackground } = useBackground();

const sortMode = ref<'index' | 'title' | 'album' | 'duration' | 'like'>('index');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Use the playlist page composable for common functionality
const { songs, playAll, addAllToQueue, playSong } = usePlaylistPage(id);

const { user } = useAuth()

const canEdit = computed(() => {
  return playlist.data.value?.data?.playlistType === 'playlist' && playlist.data.value?.data?.owner._id === user.data.value?._id
})

// Tab configuration
const tabsConfig = computed(() => [
  {
    key: 'songs',
    label: `${playlist.data.value?.data?.songList.length || 0} Songs`,
    to: '?tab=songs',
    slot: 'songs'
  },
  {
    key: 'comments',
    label: 'Comments',
    to: '?tab=comments',
    slot: 'comments'
  },
  {
    key: 'subscribers',
    label: 'Subscribers',
    to: '?tab=subscribers',
    slot: 'subscribers'
  }
]);

// Flag to prevent infinite loops
const isUpdatingFromRoute = ref(false);

watch([() => route.query.sort, () => route.query.order], ([sort, order]) => {
  if (isUpdatingFromRoute.value) return;
  
  if (sort) sortMode.value = sort as 'title' | 'album' | 'duration' | 'like';
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

const { error, refresh: refreshFetch } = await useFetch<InternalApi['/api/playlist/:id']['get']>(`/api/playlist/${id}`, {
  key: computed(() => `playlist-page-${id}`),
  onResponse({ response }) {
    // Set background during SSR when data is received
    if (response._data?.data?.coverUrl) {
      setBackground(response._data.data.coverUrl, BACKGROUND.playlist);
    }
    seoData.value.title = `${response._data?.data?.name || 'Playlist'}`
  },
  lazy: false
})

const playlist = useNuxtData<PlaylistResponse>(`playlist-page-${id}`);
const routePath = useState<RoutePath>('routePath', () => ({
  last: '',
  next: route.path
}))

// Watch for route changes to detect coming from edit page
watch(() => routePath.value.last, (newPath, oldPath) => {
  if (oldPath && oldPath.includes(`/playlists/${id}/edit`)) {
    // Refresh data when coming back from edit page
    refreshFetch();
  }
}, { immediate: false });

// Also check on mount as fallback for direct navigation
onMounted(() => {
  // Check if coming from edit page (client-side only)
  if (import.meta.client) {
    const referrer = document.referrer;
    if (referrer && referrer.includes(`/playlists/${id}/edit`)) {
      refreshFetch();
    }
  }
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
    })
  }
}

const BackgroundImages = ref<string[]>([]);

// Keep the watcher as fallback for client-side updates
watch(() => playlist.data.value, (newVal) => {
  seoData.value.title = `${newVal?.data?.name || 'Playlist'}`
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
.playlist-header {
  @apply sticky top-[65.17px] z-10 py-4;
  &:before {
    @apply content-[''] absolute inset-0 z-5;
  }
  &.float-top {
    &:before {
      @apply bg-background/50 backdrop-blur-sm;
    }
  }
}
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