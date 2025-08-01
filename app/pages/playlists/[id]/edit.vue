<template>
  <div class="flex flex-col my-2 lg:my-12 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
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

      <template #manage>
        <WindowVirtualizer v-if="playlist.data.value?.data?.songList.songs" v-slot="{ item, index }" :data="playlist.data.value?.data?.songList.songs" :item-size="44" :overscan="10" :ssr-count="10">
          <Playlist-SortItem
            :id="item.song._id"
            :song="item.song"
            :index="index"
          />
        </WindowVirtualizer>
      </template>
    </TabPages>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { TabPages } from '@/components/ui/tabs';
import { BACKGROUND } from '@/lib/background_settings';
import type { SEOData } from '#types/Utils/SEO';
import { WindowVirtualizer } from '~/components/ui/Virtua';
import { useSidebar } from '~/components/ui/sidebar';
import type { InternalApi } from 'nitropack';
import type { PlaylistResponse } from '#types/Playlist';

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

const { open } = useSidebar();

if (!rawId) {
  throw createError({
    statusCode: 404,
    statusMessage: "Playlist not found",
    message: "Invalid playlist ID",
    fatal: false
  })
}

const id = rawId as string;

const { setBackground, resetBackground } = useBackground();

const tabsConfig = [
  {
    key: 'general',
    label: 'General',
    to: '?tab=general',
    slot: 'general'
  },
  {
    key: 'manage',
    label: 'Manage Songs',
    to: '?tab=manage',
    slot: 'manage'
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

const { error, refresh: refreshFetch } = await useFetch(`/api/playlist/${id}`, {
  key: `playlist-page-${id}`,
  onResponse({ response }) {
    // Set background during SSR when data is received
    if (response._data?.data?.coverUrl) {
      setBackground(response._data.data.coverUrl, BACKGROUND.playlist_edit);
    }
    seoData.value.title = `Edit Playlist ${response._data.data.name || 'Unknown'}`
  }
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

const playlist = useNuxtData<PlaylistResponse>(`playlist-page-${rawId}`);
const user = useNuxtData<InternalApi['/api/user/me']['get']>('userInfo')

// Keep the watcher as fallback for client-side updates
watch(() => playlist.data.value, (value) => {
  const playlistData = value?.data
  if(!playlistData) {
    refreshFetch()
    return
  }
  if(playlistData?.playlistType !== 'playlist') {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "You are not allowed to edit system playlists",
      fatal: true
    })
  }
  console.log('not allowed to edit', playlistData?.owner._id, user.data.value?._id)
  if(playlistData?.owner._id !== user.data.value?._id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "You are not allowed to edit this playlist",
      fatal: true
    })
  }
  seoData.value.title = `Edit Playlist ${playlistData?.name || 'Unknown'}`
  if(playlistData?.coverUrl) {
    setBackground(playlistData.coverUrl, BACKGROUND.playlist_edit);
  }
  else if (playlistData?.songList.songs && playlistData?.songList.songs.length > 0) {
    setBackground(playlistData?.songList.songs[0]?.song.album.coverUrl || "", BACKGROUND.playlist_edit);
  } else {
    console.log('resetting background')
    resetBackground();  
  }
}, {immediate: true})

</script>
<style scoped>
@reference '../../../assets/css/tailwind.css';

</style>