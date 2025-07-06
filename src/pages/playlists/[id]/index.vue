<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-16 mx-16">
      <div class="flex gap-7 mb-12">
        <Image v-if="playlist?.data?.coverUrl" :src="playlist?.data?.coverUrl" img-class="w-40 h-40 rounded-sm" :alt="`Playlist ${id}`" />
        <div v-else class="w-40 h-40 rounded-sm bg-gray overflow-hidden">
          <div class="w-full h-full flex items-start flex-col justify-start gap-[2px] rotate-z-[-24deg] translate-y-[-56px] translate-x-[20px]">
            <div class="w-full h-40 flex items-center justify-center gap-[2px]">
              <img v-if="BackgroundImages[0]" :src="BackgroundImages[0]" class="w-40 h-40 object-cover shadow-xs" :alt="`Playlist ${id}`" >
              <img v-if="BackgroundImages[1]" :src="BackgroundImages[1]" class="w-40 h-40 object-cover shadow-xs" :alt="`Playlist ${id}`" >
            </div>
            <div class="w-full h-20 flex items-center justify-center gap-[2px]">
              <img v-if="BackgroundImages[2]" :src="BackgroundImages[2]" class="w-20 h-20 object-cover shadow-xs" :alt="`Playlist ${id}`" >
              <img v-if="BackgroundImages[3]" :src="BackgroundImages[3]" class="w-20 h-20 object-cover shadow-xs" :alt="`Playlist ${id}`" >
              <img v-if="BackgroundImages[4]" :src="BackgroundImages[4]" class="w-20 h-20 object-cover shadow-xs" :alt="`Playlist ${id}`" >
              <div class="!min-w-20 !min-h-20 bg-muted-foreground rounded-sm" />
            </div>
          </div>
        </div>
        <div class="flex flex-col grow gap-2">
          <h1 class="text-2xl font-bold">{{ playlist?.data?.name }}</h1>
          <div class="flex gap-2 text-sm text-muted-foreground">
            <p>{{ playlist?.data?.songList.length }} songs</p>
            <p>created in {{ new Date(playlist?.data?.createdAt).toLocaleDateString() }}</p>
          </div>
          <p class="text-sm text-muted-foreground">{{ playlist?.data?.description }}</p>
          <div class="grow" />
          <div class="flex items-start justify-start gap-2">
            <Button variant="default"><Icon name="lucide:play" class="w-4 h-4" /> Play All</Button>
            <Button variant="outline"><Icon name="lucide:plus" class="w-4 h-4" /> Add to queue</Button>
            <Button variant="outline"><Icon name="lucide:edit" class="w-4 h-4" /> Edit</Button>
          </div>
        </div>
      </div>
      <div class="w-full flex gap-2 mb-6">
        <NuxtLink to="?tab=songs">
          <Button size="sm" variant="secondary" :class="{'tab-active': $route.query.tab === 'songs' || $route.query.tab === undefined}">
            {{ playlist?.data?.songList.length }} Songs
          </Button>
        </NuxtLink>
        <NuxtLink to="?tab=comments">
          <Button size="sm" variant="secondary" :class="{'tab-active': $route.query.tab === 'comments'}">
            Comments
          </Button>
        </NuxtLink>
        <NuxtLink to="?tab=subscribers">
          <Button size="sm" variant="secondary" :class="{'tab-active': $route.query.tab === 'subscribers'}">
            Subscribers
          </Button>
        </NuxtLink>
      </div>
      <Transition name="page" mode="out-in">
        <div v-if="$route.query.tab === 'songs' || $route.query.tab === undefined">
          <div class="list-header">
            <Tooltip>
              <TooltipTrigger>
                <div class="sort-item" @click="sortMode = 'index'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">No.</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sort by time {{ sortOrder === 'asc' ? 'descending' : 'ascending' }}</p>
              </TooltipContent>
            </Tooltip>
            <div :class="{'active': sortMode === 'title', 'asc': sortOrder === 'asc'}" @click="sortMode = 'title'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Title <Icon v-if="sortMode === 'title'" name="lucide:chevron-down" /></div>
            <div :class="{'active': sortMode === 'album', 'asc': sortOrder === 'asc'}" @click="sortMode = 'album'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Album <Icon v-if="sortMode === 'album'" name="lucide:chevron-down" /></div>
            <div :class="{'active': sortMode === 'like', 'asc': sortOrder === 'asc'}" @click="sortMode = 'like'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Like <Icon v-if="sortMode === 'like'" name="lucide:chevron-down" /></div>
            <div :class="{'active': sortMode === 'duration', 'asc': sortOrder === 'asc'}" @click="sortMode = 'duration'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Duration <Icon v-if="sortMode === 'duration'" name="lucide:chevron-down" /></div>
          </div>
          <div v-if="playlist?.data?.songList.songs.length > 0" class="flex flex-col gap-1">
            <SongItem
              v-for="(song, index) in playlist?.data?.songList.songs"
              :id="index"
              :key="song._id"
              :song="song.song"
              :index="index"
            />
          </div>
        </div>
        <div v-else-if="$route.query.tab === 'comments'" class="flex flex-col gap-2">
          <p>Comments</p>
        </div>
        <div v-else-if="$route.query.tab === 'subscribers'" class="flex flex-col gap-2">
          <p>Subscribers</p>
        </div>
        <div v-else class="flex flex-col gap-2">
          <p>Error tab</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import Image from '@/components/Widget/Image.vue';
import { Button } from '@/components/ui/button';
import type { PlaylistResponse } from '@/types/Playlist/index';
import SongItem from '@/components/Widget/SongItem.vue';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const route = useRoute();
const id = route.params.id;

const { paddingClass } = useContentPadding();
const { setBackground } = useBackground();

const sortMode = ref<'index' | 'title' | 'album' | 'duration' | 'like'>('index');
const sortOrder = ref<'asc' | 'desc'>('asc');

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
}, {deep: true, immediate: true})

const { data: playlist, error } = await useFetch<PlaylistResponse>(`/api/playlist/${id}`, {
  default: () => ({
    data: {
      _id: "",
      name: "Loading...",
      description: "Loading...",
      createdAt: "1999-01-01",
      updatedAt: "1999-01-01",
      coverUrl: "",
      owner: {
        _id: "",
        userName: "",
        nickName: "",
        avatarUrl: ""
      },
      songList: {
        length: 0,
        page: 0,
        max_page: 0,
        songs: []
      }
    }
  })
})

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

watch(() => playlist.value?.data, (newVal) => {
  if(newVal?.coverUrl) {
    setBackground(newVal.coverUrl, 0.55, 32, 40);
  } else if (newVal?.songList.songs.length > 0) {
    for(let i = 0; i < 6; i++) {
      BackgroundImages.value.push(playlist.value?.data?.songList.songs[i].song.album.coverUrl || "");
    }
    if(BackgroundImages.value.length > 0 && BackgroundImages.value[0] !== "") {
      setBackground(BackgroundImages.value[Math.floor(Math.random() * BackgroundImages.value.length)], 0.35, 32, 40);
    }
  }
}, {immediate: true})
</script>
<style scoped>
@reference '../../../assets/css/tailwind.css';
.tab-active {
  @apply bg-black text-white hover:bg-black/80 transition-[background-color,color] duration-300 ease-in-out;
  &:is(.dark *) {
    @apply bg-white text-black hover:bg-white/80;
  }
}
.list-header {
  @apply grid pl-4 text-xs h-8 items-center mb-4 border-b border-black/10 dark:border-white/10;
  grid-template-columns: [index] 38px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [var2] 40px [last] 60px;
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