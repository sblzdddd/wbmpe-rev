<script setup lang="ts">
// import type { Song } from "#types/Song"
import type { Song } from "#types/Song"

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  song: {
    type: Object as () => Song,
    required: true
  },
  isHovering: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits({
  'play': (index:number, song: Song) => song
})

const { isPlaying, pause } = usePlayer()
const { currentSong } = useQueue()

const { isFavorite, toggleFavorite } = useFavorites()

const playSong = async () => {
  emit('play', props.index, props.song)
}

const pauseSong = async () => {
  await pause()
}

const isCurrentSong = computed(() => {
  return currentSong.value?._id === props.song._id
})

const isPlayingThis = computed(() => {
  return isCurrentSong.value && isPlaying.value
})

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div
    class="songItem"
    :class="`${isPlayingThis ? 'active' : 'hover-highlight'} ${index % 2 === 1 ? 'bg-black/3 dark:bg-white/3' : ''}`"
    @dblclick="playSong()"
  >
    <div class="hidden md:flex justify-start w-full">
      <p class="songItem-index" :class="{ 'not_stored': false }">
        {{ index + 1 }}
      </p>
      <button v-if="!isPlaying.value || !isPlayingThis" class="songItem-play" @click.stop="playSong()">
        <Icon name="material-symbols:play-arrow-rounded" size="24" />
      </button>
      <button v-else class="songItem-pause" @click.stop="pauseSong()">
        <Icon name="material-symbols:pause-rounded" size="24" />
      </button>
    </div>
    <div class="flex gap-2 items-center grow pr-6">
      <Picture :src="props.song.album.coverUrl" class="block size-9 min-w-9 min-h-9 rounded-sm" :img-attrs="{class: 'w-9 h-9 rounded-sm'}" :modifiers="{resize: {s: 100}}" :alt="song.name" />
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
      <div class="song-actions">
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
    <div class="hidden md:flex justify-start">
      <span class="songItem-album">{{ song.album.name }}</span>
    </div>
    
    <Button variant="ghost" size="sm" class="size-8 p-0" @click.stop="">
      <Icon 
        :name="isFavorite(song._id) ? 'material-symbols-light:favorite-rounded' : 'material-symbols-light:favorite-outline-rounded'" 
        size="18" :class="isFavorite(song._id) ? 'text-red-500' : 'text-muted-foreground'" 
        @click.stop="toggleFavorite(song._id)"
      />
    </Button>
    <div class="hidden md:flex w-full items-center justify-end pr-1 text-muted-foreground">
      {{ formatDuration(song.duration) }}
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
.songItem {
  @apply flex md:grid items-center text-left text-sm py-1.5 px-4 relative
  md:rounded-md;
  border-color: transparent;
  grid-template-columns: [index] 40px [first] minmax(120px, 4fr) [var1] minmax(120px, 3fr) [var2] 40px [last] 50px;
  .song-actions {
    @apply hidden items-center justify-center;
  }
  &.hover-highlight {
    @apply hover:bg-black/10 dark:hover:bg-white/15;
  }
  &:hover {
    .song-actions {
      @apply flex;
    }
    .songItem-play, .songItem-pause {
      @apply flex;
    }
    .songItem-index {
      @apply hidden;
    }
  }
  &.active {
    @apply md:border-l-2 border-primary bg-primary/20 text-primary transition-[background-color] duration-200;
    &:hover {
      @apply bg-primary/30;
    }
    .songItem-play, .songItem-pause {
      @apply flex text-primary;
    }
    .songItem-index {
      @apply hidden;
    }
  }

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
  @apply !w-auto text-black/80 dark:text-white/80 text-xs;
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

.songItem-play, .songItem-pause {
  @apply p-0 hidden justify-center text-muted-foreground hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 active:opacity-80 cursor-pointer;
}

.not_stored {
  @apply bg-gray-500 rounded-full;
}
</style>