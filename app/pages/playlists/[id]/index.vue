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
          <Button variant="default" @click="playAll" :disabled="!songs || songs.length === 0">
            <Icon name="lucide:play" class="w-4 h-4" /> Play All
          </Button>
          <Button variant="outline" @click="addAllToQueue" :disabled="!songs || songs.length === 0">
            <Icon name="lucide:plus" class="w-4 h-4" /> Add to queue
          </Button>
          <NuxtLink :to="`/playlists/${id}/edit`">
            <Button variant="outline"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="flex md:hidden items-start justify-start gap-2 px-4 w-full">
      <Button variant="default" class="grow" @click="playAll" :disabled="!songs || songs.length === 0">
        <Icon name="lucide:play" class="w-4 h-4" /> Play All
      </Button>
      <Button variant="outline" class="grow" @click="addAllToQueue" :disabled="!songs || songs.length === 0">
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
              <div class="sort-item" :class="{'active': sortMode === 'index', 'asc': sortOrder === 'asc'}" @click="sortMode = 'index'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">No. <Icon class="block md:hidden" v-if="sortMode === 'index'" name="lucide:chevron-down" /></div>
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
import { Button } from '@/components/ui/button';
import type { PlaylistResponse } from '#types/Playlist';
import SongItem from '@/components/Widget/SongItem.vue';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TabPages } from '@/components/ui/tabs';
import { BACKGROUND } from '@/lib/background_settings';
import type { SEOData } from '#types/Utils/SEO';
import { useSidebar } from '~/components/ui/sidebar';
import { WindowVirtualizer } from '~/components/ui/Virtua/'

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const id = route.params.id;

const { open } = useSidebar()

const { setBackground, resetBackground } = useBackground(); 

const sortMode = ref<'index' | 'title' | 'album' | 'duration' | 'like'>('index');
const sortOrder = ref<'asc' | 'desc'>('asc');

const songs = computed(() => playlist.data.value?.data?.songList.songs.map((song, index) => ({
  ...song.song,
  id: song._id,
  index: index
})) || []);

// Player functionality
const { addPlaylistToQueue } = usePlayer()

const playAll = async () => {
  if (songs.value && songs.value.length > 0) {
    await addPlaylistToQueue(songs.value, true) // Play immediately
  }
}

const addAllToQueue = async () => {
  if (songs.value && songs.value.length > 0) {
    await addPlaylistToQueue(songs.value, false) // Add to queue
  }
}


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

const { error } = await useFetch(`/api/playlist/${id}`, {
  key: `playlist-page-${id}`,
  default: () => ({
    data: {
      _id: "",
      playlistType: "playlist" as const,
      coverUrl: "",
      name: "",
      description: "",
      createdAt: "",
      updatedAt: "",
      isPublic: false,
      owner: {
        _id: "",
        userName: "",
        nickName: "",
        avatarUrl: "",
        bio: ""
      },
      songList: {
        length: 0,
        page: 0,
        max_page: 0,
        songs: []
      }
    }
  }),
  onResponse({ response }) {
    // Set background during SSR when data is received
    if (response._data?.data?.coverUrl) {
      setBackground(response._data.data.coverUrl, BACKGROUND.playlist);
    }
    seoData.value.title = `${response._data.data.name || 'Playlist'}`
  }
})

const playlist = useNuxtData<PlaylistResponse>(`playlist-page-${id}`);

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