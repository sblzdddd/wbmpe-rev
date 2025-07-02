<script setup lang="ts">
import { ref } from "vue"
import type { Song } from "@/types/song"
import Image from "@/components/Widget/Image.vue"
import { Button } from "@/components/ui/button"

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  listType: {
    type: Number,
    required: false,
    default: 0
  },
  id: {
    type: Number,
    required: true
  },
  song: {
    type: Object as () => Song,
    required: true
  },
})

const isHovering = ref(false)

const playSong = () => {
  // TODO: Implement play functionality
  console.log('Playing song:', props.song.name)
}

const getImageSrc = () => {
  return props.song.album.coverUrl || "https://picsum.photos/100/100?random=" + props.song.album._id
}

const isPlaying = false // TODO: Connect to actual player state

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div
    class="songItem"
    :class="`${isPlaying ? 'active' : 'hover-highlight'}`"
    @dblclick="playSong()"
    @click="playSong()"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div class="flex justify-start w-full">
      <p v-if="!isHovering" class="songItem-index" :class="{ 'not_stored': false }">
        {{ index + 1 }}
      </p>
      <button v-else class="p-0 flex justify-center text-muted-foreground hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 active:opacity-80 cursor-pointer">
        <Icon name="material-symbols:play-arrow-rounded" size="24" />
      </button>
    </div>
    <div class="flex gap-2 items-center grow pr-6">
      <Image :src="getImageSrc()" img-class="w-9 h-9 rounded-sm" :alt="song.name" />
      <div class="grow pb-0.5 flex flex-col items-left h-full gap-1">
        <div class="flex justify-start">
          <a class="songItem-title">{{ song.name }}</a>
        </div>
        <p class="songItem-artist">
          <span v-for="(artist, index) in song.artists" :key="index">
            {{ artist.name + (index === song.artists.length - 1 ? '' : ', ') }}
          </span>
        </p>
      </div>
      <div v-if="isHovering" class="flex items-center justify-center">
        <Button variant="ghost" size="sm" class="size-7 p-0" @click.stop="">
          <Icon name="lucide:plus" size="16" />
        </Button>
        <Button variant="ghost" size="sm" class="size-7 p-0" @click.stop="">
          <Icon name="lucide:message-circle-more" size="16" />
        </Button>
        <Button variant="ghost" size="sm" class="size-7 p-0" @click.stop="">
          <Icon name="lucide:more-horizontal" size="16" />
        </Button>
      </div>
    </div>
    <div class="flex justify-start">
      <span class="songItem-album">{{ song.album.name }}</span>
    </div>
    
    <Button variant="ghost" size="sm" class="size-8 p-0" @click.stop="">
      <Icon name="lucide:heart" size="16" class="text-muted-foreground" />
    </Button>
    <div class="hidden lg:flex w-full items-center justify-end pr-1 text-muted-foreground">
      {{ formatDuration(song.duration) }}
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
.songItem {
  @apply flex lg:grid items-center text-left text-sm py-1.5 px-4 hover:bg-black/5 dark:hover:bg-white/10
  lg:rounded-md overflow-hidden relative;
  border-color: transparent;
  grid-template-columns: [index] 40px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [var2] 40px [last] 50px;
  transition: border 50ms ease;
}



.v-theme--wbmpe_light .hover-highlight {
  @apply hover:bg-black/10;
}

.songItem.active {
  @apply border-l-2;
  border-color: rgba(var(--v-theme-primary)) !important;
  color: rgba(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.songItem-title, .songItem-artist, .songItem-album {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  white-space: unset;
  word-break: break-all;
}

.songItem-album {
  @apply absolute lg:static lg:opacity-100 !w-auto text-black/80 dark:text-white/80 text-xs;
}

.songItem-title {
  @apply text-sm lg:text-[0.9rem]
}

.songItem-artist {
  @apply text-gray-400 text-[0.65rem];
}

.songItem-index {
  @apply text-left lg:!px-1.5 lg:ml-0 ml-1 px-1 font-mono;
}

.not_stored {
  @apply bg-gray-500 rounded-full;
}
</style>