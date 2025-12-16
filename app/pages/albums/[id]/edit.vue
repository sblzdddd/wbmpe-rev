<template>
  <div class="flex flex-col my-2 lg:my-12 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <h1 class="text-2xl font-bold mb-6 inline-flex items-center gap-2">
      <NuxtLink :to="`/albums/${id}`">
        <Button variant="ghost" size="icon">
          <Icon name="lucide:arrow-left" size="26" />
        </Button>
      </NuxtLink>
      Edit Album
      <NuxtLink :to="`/albums/${id}`" class="text-primary">
        {{ album.data.value?.data?.name || 'Unknown' }}
      </NuxtLink>
    </h1>
    
    <TabPages 
      :tabs="tabsConfig"
      layout-id="album-tab-highlighter"
      default-tab="general"
    >
      <template #general>
        <Album-EditForm />
      </template>

      <template #songs>
        <WindowVirtualizer v-if="album.data.value?.data?.songList.songs" v-slot="{ item, index }" :data="album.data.value?.data?.songList.songs" :item-size="44" :overscan="10" :ssr-count="10">
          <Album-SongItem
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
import { BACKGROUND } from '@/lib/background_settings';
import type { AlbumResponse } from '#types/Album';
import { WindowVirtualizer } from '~/components/ui/Virtua';

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

const { open } = useSidebar();

if (!rawId) {
  throw createError({
    statusCode: 404,
    statusMessage: "Album not found",
    message: "Invalid album ID",
    fatal: false
  })
}

const id = rawId as string;

const { setBackground } = useBackground();

const tabsConfig = [
  {
    key: 'general',
    label: 'General',
    to: '?tab=general',
    slot: 'general'
  },
  {
    key: 'songs',
    label: 'Songs',
    to: '?tab=songs',
    slot: 'songs'
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

const { error, refresh: refreshFetch } = await useFetch<InternalApi['/api/album/:id']['get']>(`/api/album/${id}`, {
  key: computed(() => `album-page-${id}`),
  onResponse({ response }) {
    // Set background during SSR when data is received
    if (response._data?.data?.coverUrl) {
      setBackground(response._data.data.coverUrl, BACKGROUND.playlist_edit);
    }
    seoData.value.title = `Edit Album ${response._data?.data?.name || 'Unknown'}`
  },
  lazy: false
})

if (error.value) {
  // Check if there's browser history to go back
  if (import.meta.client && window.history.length > 1) {
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

const album = useNuxtData<AlbumResponse>(`album-page-${rawId}`);

// Keep the watcher as fallback for client-side updates
watch(() => album.data.value, (value) => {
  const albumData = value?.data
  if(!albumData) {
    refreshFetch()
    return
  }
  
  seoData.value.title = `Edit Album ${albumData?.name || 'Unknown'}`
  if(albumData?.coverUrl) {
    setBackground(albumData.coverUrl, BACKGROUND.playlist_edit);
  }
  else if (albumData?.songList.songs && albumData?.songList.songs.length > 0) {
    setBackground(albumData?.songList.songs[0]?.song.album.coverUrl || "", BACKGROUND.playlist_edit);
  }
}, {immediate: true})

</script>
<style scoped>
@reference '../../../assets/css/tailwind.css';

</style>
