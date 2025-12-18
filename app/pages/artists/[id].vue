<template>
  <div class="flex flex-col my-4 lg:my-16 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <div class="flex gap-4 md:gap-7 mb-6 px-4 md:px-0 items-center">
      <Picture 
        v-if="artist.data.value?.data?.avatarUrl" 
        :src="artist.data.value?.data?.avatarUrl" 
        class="min-w-30 h-30 md:min-w-40 md:h-40 rounded-full overflow-hidden" 
        :modifiers="{resize: {s: 320}}" 
        :alt="`Artist ${id}`"
        :img-attrs="{class: 'w-full h-full object-cover'}"
      />
      <div v-else class="min-w-30 h-30 md:min-w-40 md:h-40 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center">
        <Icon name="lucide:user" size="32" class="text-muted-foreground" />
      </div>
      <div class="flex flex-col grow gap-2">
        <h1 class="text-base md:text-2xl font-bold truncate">{{ artist.data.value?.data?.name }}</h1>
        <div class="flex gap-2 text-xs md:text-sm text-muted-foreground">
          <p>{{ songs.length }} songs</p>
          <p>{{ albums.length }} albums</p>
          <p v-if="artist.data.value?.data?.platform">{{ artist.data.value?.data?.platform }}</p>
        </div>
        <p v-if="artist.data.value?.data?.description" class="text-xs md:text-sm text-muted-foreground">{{ artist.data.value?.data?.description }}</p>
        <div class="grow" />
        <div class="hidden md:flex items-start justify-start gap-2">
          <Button variant="default" :disabled="!songs || songs.length === 0" @click="playAll">
            <Icon name="lucide:play" class="w-4 h-4" /> Play All
          </Button>
          <SubscribeButton type="artist" :id="id as string" :initial-subscribed="artist.data.value?.data?.isSubscribed" />
        </div>
      </div>
    </div>
    <div class="flex md:hidden items-start justify-start gap-2 px-4 w-full">
      <Button variant="default" class="grow" :disabled="!songs || songs.length === 0" @click="playAll">
        <Icon name="lucide:play" class="w-4 h-4" /> Play All
      </Button>
      <SubscribeButton type="artist" :id="id as string" :initial-subscribed="artist.data.value?.data?.isSubscribed" />
    </div>
    
    <TabPages 
      :tabs="tabsConfig"
      class="mt-6 md:px-0"
      layout-id="artist-tab-highlighter"
      default-tab="songs"
      :tab-container-attrs="{class: 'px-4 md:px-0'}"
    >
      <template #songs>
        <div class="list-header">
           <p class="block md:hidden">Sort by: </p>
          <div :class="{'active': sortMode === 'title', 'asc': sortOrder === 'asc'}" @click="sortMode = 'title'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Title <Icon v-if="sortMode === 'title'" name="lucide:chevron-down" /></div>
          <div :class="{'active': sortMode === 'album', 'asc': sortOrder === 'asc'}" @click="sortMode = 'album'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">Album <Icon v-if="sortMode === 'album'" name="lucide:chevron-down" /></div>
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

      <template #albums>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 md:px-0">
             <EntityCard v-for="album in albums" :key="album._id" :image="album.coverUrl" :href="`/albums/${album._id}`" :title="album.name" :sub-title="new Date(album.createdAt).getFullYear().toString()" />
        </div>
      </template>
    </TabPages>
  </div>
</template>

<script setup lang="ts">
import { BACKGROUND } from '@/lib/background_settings';
import type { SEOData } from '#types/Utils/SEO';
import { WindowVirtualizer } from '~/components/ui/Virtua';
import SubscribeButton from '~/components/Widget/SubscribeButton.vue';
import EntityCard from '~/components/Widget/EntityCard.vue';

const seoData = useState<SEOData>('seoData')
const route = useRoute();
const id = route.params.id;

const { open } = useSidebar()
const { setBackground } = useBackground();

const sortMode = ref<'title' | 'album' | 'duration'>('title');
const sortOrder = ref<'asc' | 'desc'>('asc');

const { artist, songs, albums, playAll, playSong } = useArtistPage(id as string);

const tabsConfig = computed(() => [
  {
    key: 'songs',
    label: ` Songs`,
    to: '?tab=songs',
    slot: 'songs'
  },
  {
    key: 'albums',
    label: 'Albums',
    to: '?tab=albums',
    slot: 'albums'
  }
]);

watch(() => artist.value, (newVal) => {
  seoData.value.title = `${newVal?.data?.name || 'Artist'}`
  // If artist has avatar, maybe set background? or use first album/song cover?
  // Use avatar for now or default
  if(newVal?.data?.avatarUrl) {
    // setBackground(newVal.data.avatarUrl, BACKGROUND.playlist); 
    // Maybe artists don't change background, or use a specific one?
    // Let's stick to default behavior or use avatar as blurred background if supported.
    // For now, let's try using avatar
     setBackground(newVal.data.avatarUrl, BACKGROUND.playlist);
  } else if (songs.value.length > 0 && songs.value[0].album?.coverUrl) {
     setBackground(songs.value[0].album.coverUrl, BACKGROUND.playlist);
  }
}, {immediate: true})

</script>

<style scoped>
@reference '../../assets/css/tailwind.css';
.list-header {
  @apply grid pl-4 text-xs h-8 items-center mb-4 border-b border-black/10 dark:border-white/10;
  grid-template-columns: [index] 38px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [last] 60px;
  @media (max-width: 768px) {
    grid-template-columns: [index] 1fr [first] 1fr [var1] 1fr [last] 1fr;
  }
}
.list-header > div:not(.not-sortable) {
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