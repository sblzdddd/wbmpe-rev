<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-8 mb-16 mx-16">
      <h1 class="text-2xl font-bold mb-6 inline-flex items-center gap-2">
        <NuxtLink :to="`/playlists/${id}`">
          <Button variant="ghost" size="icon">
            <Icon name="lucide:arrow-left" size="26" />
          </Button>
        </NuxtLink>
        Edit Playlist
        <NuxtLink :to="`/playlists/${id}`" class="text-primary">
          {{ playlist?.data?.name || 'Unknown' }}
        </NuxtLink>
      </h1>
      
      <TabPages 
        :tabs="tabsConfig"
        layout-id="playlist-tab-highlighter"
        default-tab="general"
      >
        <template #general>
          <Forms-PlaylistEdit />
        </template>

        <template #reorder>
          <div v-if="playlist?.data?.songList.songs && playlist?.data?.songList.songs.length > 0" class="flex flex-col">
            <SongItem
              v-for="(song, index) in playlist?.data?.songList.songs"
              :id="index"
              :key="song._id"
              :song="song.song"
              :index="index"
              :is-hovering="currentHoverIndex === index"
              @mouseenter="currentHoverIndex = index"
            />
          </div>
        </template>
      </TabPages>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import type { PlaylistResponse } from '#types/Playlist';
import SongItem from '@/components/Widget/SongItem.vue';
import { TabPages } from '@/components/ui/tabs';

const route = useRoute();
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

if (!rawId) {
  throw createError({
    statusCode: 404,
    statusMessage: "Playlist not found",
    message: "Invalid playlist ID",
    fatal: false
  })
}

const id = rawId as string;

const { paddingClass } = useContentPadding();

const currentHoverIndex = ref<number>(-1);

const tabsConfig = [
  {
    key: 'general',
    label: 'General',
    to: '?tab=general',
    slot: 'general'
  },
  {
    key: 'reorder',
    label: 'Reorder Songs',
    to: '?tab=reorder',
    slot: 'reorder'
  }
]

// Flag to prevent infinite loops
const isUpdatingFromRoute = ref(false);

watch([() => route.query.tab], async ([newTab]) => {
  // Only update if values are different from current route query
  if (route.query.tab === newTab) return;
  
  isUpdatingFromRoute.value = true;
  await navigateTo({
    query: {
      ...route.query,
      tab: newTab
    }
  }, { replace: true });
  isUpdatingFromRoute.value = false;
}, {deep: true, immediate: true})

await useFetch<PlaylistResponse>(`/api/playlist/${id}`, {
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
  })
})

const { data: playlist } = useNuxtData<PlaylistResponse>(`playlist-page-${id}`)

</script>
<style scoped>
@reference '../../../assets/css/tailwind.css';
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