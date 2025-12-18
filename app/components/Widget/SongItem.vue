<script setup lang="ts">
import Button from '../ui/button/Button.vue';
import Picture from '../Picture.vue';

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  song: {
    type: Object as () => SongType,
    required: true
  },
  isHovering: {
    type: Boolean,
    required: false,
    default: false
  },
  isDeferredPlayback: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits({
  'play': (index:number, song: SongType) => song
})

const { isPlaying, pause } = usePlayer()
const { currentSong } = useQueue()
const router = useRouter()

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
    :class="`${isPlayingThis ? 'active' : isDeferredPlayback ? 'processing' : 'hover-highlight'} ${index % 2 === 0 ? 'bg-black/3 dark:bg-white/3' : ''}`"
    @dblclick="playSong()"
  >
    <div class="hidden md:flex justify-start w-full">
      <p class="songItem-index" :class="{ 'not_stored': false }">
        {{ index + 1 }}
      </p>
      <button v-if="isDeferredPlayback" class="songItem-processing" disabled>
        <Icon name="svg-spinners:ring-resize" size="20" class="text-blue-500" />
      </button>
      <button v-else-if="!isPlaying || !isPlayingThis" class="songItem-play" @click.stop="playSong()">
        <Icon name="material-symbols:play-arrow-rounded" size="24" />
      </button>
      <button v-else class="songItem-pause" @click.stop="pauseSong()">
        <Icon name="material-symbols:pause-rounded" size="24" />
      </button>
    </div>
    <div class="flex gap-2 items-center grow pr-6">
      <Picture :src="song.album.coverUrl" class="block size-9 min-w-9 min-h-9 rounded-[6px]" :img-attrs="{class: 'w-9 h-9 rounded-[6px]'}" :modifiers="{resize: {s: 100}}" :alt="song.name" />
      <div class="grow pb-0.5 flex flex-col items-left h-full gap-1">
        <div class="flex justify-start">
          <a class="songItem-title" @click.stop="router.push(`/songs/${song._id}`)">{{ song.name }}</a>
        </div>
        <p class="songItem-artist">
          <a v-for="(artist, index) in song.artists" :key="index" @click.stop="router.push(`/artists/${artist._id}`)">
            {{ artist.name + (index === song.artists.length - 1 ? '' : ', ') }}
          </a>
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
      <a class="songItem-album" @click.stop="router.push(`/albums/${song.album._id}`)">{{ song.album.name }}</a>
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
  &.processing {
    @apply md:border-l-2 border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300 transition-[background-color] duration-200;
    &:hover {
      @apply bg-blue-500/30;
    }
    .songItem-processing {
      @apply flex;
    }
    .songItem-index {
      @apply hidden;
    }
  }

}

.songItem-title, .songItem-artist, .songItem-album {
  @apply hover:underline;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
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

.songItem-processing {
  @apply p-0 hidden justify-center items-center cursor-not-allowed;
}

.not_stored {
  @apply bg-gray-500 rounded-full;
}
</style>