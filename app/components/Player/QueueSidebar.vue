<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import Button from '../ui/button/Button.vue';
import { VList } from '../ui/Virtua';
import Picture from '../Picture.vue';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';

const { open, changeOpen } = useDialog()
const { clearQueue, playQueueIndex, removeFromQueue } = usePlayer()
const { queue, currentIndex, hasQueue } = useQueue()
const { isPlaying } = useAudio()

// Track items being removed for optimistic UI updates
const removingItems = ref<Set<string>>(new Set())
const pendingRemovals = ref<Set<string>>(new Set())

// Debounced removal function
const debouncedRemove = useDebounceFn(async () => {
  if (pendingRemovals.value.size === 0) return
  
  // Process all pending removals in a single batch
  const itemsToRemove = Array.from(pendingRemovals.value)
  pendingRemovals.value.clear()
  
  try {
    // Use the new batch removal function
    await removeFromQueue(itemsToRemove)
    
    // Clear all removing items on successful removal
    for (const itemId of itemsToRemove) {
      removingItems.value.delete(itemId)
    }
  } catch (error) {
    console.error('Failed to remove items from queue:', error)
    
    // Remove from removing items even on error to prevent permanent hidden state
    for (const itemId of itemsToRemove) {
      removingItems.value.delete(itemId)
    }
  }
}, 500) // 500ms debounce

// Optimistic removal handler
const handleRemoveFromQueue = (itemId: string) => {
  // Immediately hide the item in the UI
  removingItems.value.add(itemId)
  
  // Add to pending removals
  pendingRemovals.value.add(itemId)
  
  // Trigger debounced removal
  debouncedRemove()
}

// Filter queue to hide removing items
const filteredQueue = computed(() => {
  return queue.value.filter(item => item && !removingItems.value.has(item._id))
})

// Helper function to get original queue index from item ID
const getOriginalIndex = (itemId: string) => {
  return queue.value.findIndex(item => item._id === itemId)
}

// Helper function to check if an item in filtered queue is currently playing
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
</script>

<template>
  <Sheet v-model:open="open.queue" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.QUEUE, e)">
    <SheetContent>
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
          <div :class="{ 'bg-muted/40': index % 2 === 0 }" class="queue-item flex items-center gap-3 p-2 hover:bg-muted cursor-pointer" @click="playQueueIndex(getOriginalIndex(item._id))">
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