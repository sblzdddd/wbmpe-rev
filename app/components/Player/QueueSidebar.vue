<script setup lang="ts">
import { VList } from '~/components/ui/Virtua'

const { open, changeOpen } = useDialog()
const { clearQueue, playQueueIndex, removeFromQueue } = usePlayer()
const { queue, currentIndex, hasQueue } = useQueue()
const { isPlaying } = useAudio()

watch(() => hasQueue.value, (newVal) => {
  console.log('hasQueue', newVal)
  if (!newVal) {
    changeOpen(DialogType.QUEUE, false)
  }
})
</script>

<template>
  <Sheet v-model:open="open.queue" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.QUEUE, e)">
    <SheetContent>
      <SheetHeader class="pt-3 pb-0 pr-10 gap-0 flex flex-row items-center justify-between">
        <div class="flex items-center gap-2">
          <SheetTitle>Queue </SheetTitle>
          <SheetDescription>({{ queue.length }} songs)</SheetDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          class="text-xs size-6 rounded-full"
          @click="clearQueue"
        >
          <Icon name="lucide:trash" size="14" />
        </Button>
      </SheetHeader>
      <div class="queue-list overflow-y-auto h-full">
        <VList 
          v-slot="{ item, index }"
          :data="queue"
        >
          <div :class="{ 'bg-muted/40': index % 2 === 0 }" class="queue-item flex items-center gap-3 p-2 hover:bg-muted cursor-pointer" @click="playQueueIndex(index)">
            <div class="queue-index w-6 text-xs text-muted-foreground text-center">
              <Icon 
                v-if="index === currentIndex && isPlaying" 
                name="lucide:play" 
                size="12" 
                class="text-primary" 
              />
              <span v-else>{{ index + 1 }}</span>
            </div>
            
            <Picture 
              v-if="item.album?.coverUrl" 
              :src="item.album.coverUrl" 
              class="w-8 h-8 rounded overflow-hidden flex-shrink-0"
              :modifiers="{resize: {s: 64}}" 
              :alt="item.name"
              :img-attrs="{class: 'w-full h-full object-cover'}"
            />
            <div v-else class="w-8 h-8 bg-muted rounded flex-shrink-0" />
            
            <div class="song-info min-w-0 flex-1">
              <p class="text-sm truncate" :class="{ 'text-primary': index === currentIndex }">
                {{ item.name }}
              </p>
              <p class="text-xs text-muted-foreground truncate">
                <span v-for="(artist, artistIndex) in item.artists" :key="artistIndex">
                  {{ artist.name + (artistIndex === item.artists.length - 1 ? '' : ', ') }}
                </span>
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              class="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
              @click.stop="removeFromQueue(item._id)"
            >
              <Icon name="lucide:x" size="12" />
            </Button>
          </div>
        </VList>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
.queue-item:hover .opacity-0 {
  @apply opacity-100;
}
</style>