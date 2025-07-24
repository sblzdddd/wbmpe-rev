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
          {{ playlist.data.value?.data?.name || 'Unknown' }}
        </NuxtLink>
      </h1>
      
      <TabPages 
        :tabs="tabsConfig"
        layout-id="playlist-tab-highlighter"
        default-tab="general"
      >
        <template #general>
          <Playlist-EditForm />
        </template>

        <template #reorder>
          <div v-if="playlist.data.value?.data?.songList.songs && playlist.data.value?.data?.songList.songs.length > 0" class="flex flex-col">
            <Playlist-SortItem
              v-for="(song, index) in playlist.data.value?.data?.songList.songs"
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
import { TabPages } from '@/components/ui/tabs';
import { BACKGROUND } from '@/lib/background_settings';

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
const { setBackground } = useBackground();

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
      setBackground(response._data.data.coverUrl, BACKGROUND.playlist_edit);
    }
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

// Keep the watcher as fallback for client-side updates
watch(() => playlist.data.value, (newVal) => {
  if(newVal?.data?.coverUrl) {
    setBackground(newVal.data.coverUrl, BACKGROUND.playlist_edit);
  }
  else if (newVal?.data?.songList.songs && newVal?.data?.songList.songs.length > 0) {
    setBackground(newVal?.data?.songList.songs[0]?.song.album.coverUrl || "", BACKGROUND.playlist_edit);
  }
}, {immediate: true})

</script>
<style scoped>
@reference '../../../assets/css/tailwind.css';

</style>