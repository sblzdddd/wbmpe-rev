<template>
  <div class="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg group">
    <!-- Index -->
    <div class="w-8 text-center text-sm text-muted-foreground">
      {{ index + 1 }}
    </div>

    <!-- Song Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-3">
        <!-- Album Cover -->
        <div class="w-10 h-10 rounded overflow-hidden bg-muted/50 flex-shrink-0">
          <Picture 
            v-if="song.album?.coverUrl" 
            :src="song.album.coverUrl" 
            :alt="`${song.name} cover`"
            class="w-full h-full"
            :img-attrs="{class: 'w-full h-full object-cover'}"
            :modifiers="{resize: {s: 100}}"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon name="lucide:music" size="16" class="text-muted-foreground" />
          </div>
        </div>

        <!-- Song Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-sm truncate">{{ song.name }}</h4>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span v-if="song.artists && song.artists.length > 0">
              {{ song.artists.map(a => a.name).join(', ') }}
            </span>
            <span v-if="song.duration" class="ml-auto">
              {{ formatDuration(song.duration) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button 
        variant="ghost" 
        size="sm"
        @click="$emit('play', song, index)"
      >
        <Icon name="lucide:play" size="14" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        @click="addSongToQueue(song)"
      >
        <Icon name="lucide:plus" size="14" />
      </Button>

      <!-- More options menu could go here -->
      <Button 
        variant="ghost" 
        size="sm"
      >
        <Icon name="lucide:more-horizontal" size="14" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SongType } from '#types/Song';
import Picture from '../Picture.vue';
import Button from '../ui/button/Button.vue';


interface Props {
  song: SongType;
  index: number;
  id: string;
}

defineProps<Props>();

defineEmits<{
  play: [song: SongType, index: number];
}>();

const { addToQueue } = useQueue();

const addSongToQueue = (song: SongType) => {
  addToQueue(song);
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
</script>
