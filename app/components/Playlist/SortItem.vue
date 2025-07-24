<script setup lang="ts">
import type { Song } from "#types/Song"

defineProps({
  index: {
    type: Number,
    required: true
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


</script>

<template>
  <div class="songItem">
    <p class="songItem-index" :class="{ 'not_stored': false }">
      {{ index + 1 }}
    </p>
    <span class="songItem-title">{{ song.name }}</span>
    <div class="flex justify-start">
      <span v-for="(artist, index) in song.artists" :key="index">
        {{ artist.name + (index === song.artists.length - 1 ? '' : ', ') }}
      </span>
    </div>
    <div class="hidden lg:flex w-full items-center justify-end pr-1 text-muted-foreground">
      <Button variant="ghost" size="sm" class="size-8 p-0" @click.stop="">
        <Icon name="lucide:arrow-up" size="16" class="text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="sm" class="size-8 p-0" @click.stop="">
        <Icon name="lucide:arrow-down" size="16" class="text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="sm" class="size-8 p-0" @click.stop="">
        <Icon name="lucide:trash" size="16" class="text-muted-foreground" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
.songItem {
  @apply flex lg:grid items-center text-left text-sm py-1.5 px-4 relative hover:bg-black/5 dark:hover:bg-white/15
  lg:rounded-md;
  border-color: transparent;
  grid-template-columns: [index] 40px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [last] 100px;
  .song-actions {
    @apply hidden items-center justify-center;
  }
  &:hover {
    .song-actions {
      @apply flex;
    }
  }
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