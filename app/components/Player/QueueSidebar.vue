<script setup lang="ts">
import Button from '../ui/button/Button.vue';
import { VList } from '../ui/Virtua';
import Picture from '../Picture.vue';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';

const { open, changeOpen } = useDialog()
const { clearQueue, playQueueIndex, removeFromQueue } = usePlayer()
const { queue, currentIndex, hasQueue } = useQueue()
const { isPlaying } = useAudio()

const removingItems = ref<Set<string>>(new Set())
const pendingRemovals = ref<Set<string>>(new Set())

const debouncedRemove = useDebounceFn(async () => {
  if (pendingRemovals.value.size === 0) return
  
  const itemsToRemove = Array.from(pendingRemovals.value)
  pendingRemovals.value.clear()
  
  try {
    await removeFromQueue(itemsToRemove)
    
    for (const itemId of itemsToRemove) {
      removingItems.value.delete(itemId)
    }
  } catch (error) {
    console.error('Failed to remove items from queue:', error)
    
    for (const itemId of itemsToRemove) {
      removingItems.value.delete(itemId)
    }
  }
}, 500) // 500ms debounce

const handleRemoveFromQueue = (itemId: string) => {
  removingItems.value.add(itemId)
  pendingRemovals.value.add(itemId)
  debouncedRemove()
}

const filteredQueue = computed(() => {
  return queue.value.filter(item => item && !removingItems.value.has(item._id))
})

const getOriginalIndex = (itemId: string) => {
  return queue.value.findIndex(item => item._id === itemId)
}

const isCurrentlyPlaying = (item: SongType) => {
  const originalIndex = getOriginalIndex(item._id)
  return originalIndex === currentIndex.value && isPlaying.value
}

watch(() => hasQueue.value, (newVal) => {
  console.log('hasQueue', newVal)
  if (!newVal) {
    changeOpen(DialogType.QUEUE, false)
  }
})

const isFullscreen = useState('isFullscreen');
</script>

<template>
  <Sheet v-model:open="open.queue" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.QUEUE, e)">
    <SheetContent :class="`${isFullscreen ? 'bg-white/20 dark:bg-black/40' : ''} rounded-l-2xl`">
      <SheetHeader class="pt-3 pb-0 pr-10 gap-0 flex flex-row items-center justify-between">
        <div class="flex items-center gap-2">
          <SheetTitle>Queue </SheetTitle>
          <SheetDescription>({{ filteredQueue.length }} songs)</SheetDescription>
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
          v-slot="{ item, index } = {}"
          :data="filteredQueue"
        >
          <div :class="{ 'bg-muted/30': index % 2 === 0 }" class="queue-item flex items-center gap-3 p-2 hover:bg-muted cursor-pointer" @click="playQueueIndex(getOriginalIndex(item._id))">
            <div class="queue-index w-6 text-xs text-muted-foreground text-center">
              <Icon 
                v-if="isCurrentlyPlaying(item)" 
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
              <p class="text-sm truncate" :class="{ 'text-primary': getOriginalIndex(item._id) === currentIndex }">
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
              @click.stop="handleRemoveFromQueue(item._id)"
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