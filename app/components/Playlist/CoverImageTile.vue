<script setup lang="ts">
import type { PlaylistResponse } from '#types/Playlist';

const id = useRoute().params.id as string;
const backgroundImages = ref<string[]>([]);
const { data: playlist } = useNuxtData<PlaylistResponse>(`playlist-page-${id}`)

watch(() => playlist.value?.data, (newVal) => {
  if (newVal?.songList.songs && newVal?.songList.songs.length > 0) {
    for(let i = 0; i < 6; i++) {
      const coverUrl = newVal?.songList.songs[i]?.song.album.coverUrl
      if (coverUrl) {
        backgroundImages.value.push(coverUrl);
      }
    }
  }
}, {immediate: true})
</script>

<template>
  <div class="size-40 min-w-40 min-h-40 rounded-sm bg-gray overflow-hidden">
    <div v-if="backgroundImages.length > 4" class="w-full h-full flex items-start flex-col justify-start gap-[2px] rotate-z-[-24deg] translate-y-[-56px] translate-x-[20px]">
      <div class="w-full h-40 flex items-center justify-center gap-[2px]">
        <Picture v-if="backgroundImages[0]" :src="backgroundImages[0]" class="block size-40 min-w-40 min-h-40 shadow-xs" :img-attrs="{class: 'w-40 h-40 object-cover rounded-none'}" :modifiers="{resize: {s: 256}}" :alt="`Playlist`" />
        <Picture v-if="backgroundImages[1]" :src="backgroundImages[1]" class="block size-40 min-w-40 min-h-40 shadow-xs" :img-attrs="{class: 'w-40 h-40 object-cover rounded-none'}" :modifiers="{resize: {s: 256}}" :alt="`Playlist`" />
      </div>
      <div class="w-full h-20 flex items-center justify-center gap-[2px]">
        <Picture v-if="backgroundImages[2]" :src="backgroundImages[2]" class="block size-20 min-w-20 min-h-20 shadow-xs" :img-attrs="{class: 'w-20 h-20 object-cover rounded-none'}" :modifiers="{resize: {s: 128}}" :alt="`Playlist`" />
        <Picture v-if="backgroundImages[3]" :src="backgroundImages[3]" class="block size-20 min-w-20 min-h-20 shadow-xs" :img-attrs="{class: 'w-20 h-20 object-cover rounded-none'}" :modifiers="{resize: {s: 128}}" :alt="`Playlist`" />
        <Picture v-if="backgroundImages[4]" :src="backgroundImages[4]" class="block size-20 min-w-20 min-h-20 shadow-xs" :img-attrs="{class: 'w-20 h-20 object-cover rounded-none'}" :modifiers="{resize: {s: 128}}" :alt="`Playlist`" />
        <div class="!min-w-20 !min-h-20 bg-muted-foreground rounded-sm" />
      </div>
    </div>
    <div v-else class="w-full h-full flex items-center justify-center bg-muted/50 rounded-sm">
      <Icon name="lucide:list-music" size="64" class="text-muted-foreground" />
    </div>
  </div>
</template>