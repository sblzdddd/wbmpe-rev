<template>
  <div v-bind="$attrs">
    <div class="flex justify-between" :class="mobileMode?'mb-1':''">
      <p class="duration_start">
        {{ currentLen }}
      </p>
      <p v-if="mobileMode" class="duration_end">
        {{ remainLen }}
      </p>
    </div>
    <div class="progress-container">

      <!-- Buffered progress -->
      <input v-model="bufferedValue" type="range" :class="`appkit-slider-buffered`" min="0" max="100">

      <!-- Actual slider for current progress -->
      <input 
        ref="progress" 
        v-model="progressValue"
        type="range"
        min="0" 
        max="1000" 
        class="w-full appkit-slider"
        @input="onProgressChange"
        @touchstart="onProgressMouse(true)"
        @touchmove="onProgressChange"
        @touchend="onProgressMouse(false)"
        @mousedown="onProgressMouse(true)" 
        @mouseup="onProgressMouse(false)"
      >
    </div>

    <p v-if="!mobileMode" class="duration_end">
      {{ remainLen }}
    </p>
  </div>
</template>
<script setup lang="ts">

defineProps({
  mobileMode: Boolean
})

// Utility function to format seconds to mm:ss
function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Use composables for reactive data
const { currentTime, duration, bufferedTime, isUserSeeking, seekPreviewTime, startSeeking, updateSeekPreview, stopSeeking } = useAudio()

const progressValue = ref(0);
const bufferedValue = ref(0);

// Computed values for time display
const currentLen = computed(() => {
  const time = isUserSeeking.value ? seekPreviewTime.value : currentTime.value
  return formatSeconds(time)
})

const remainLen = computed(() => {
  const time = isUserSeeking.value ? seekPreviewTime.value : currentTime.value
  const remaining = duration.value - time
  return formatSeconds(remaining)
})

// Watch for time updates and update progress values
watch([currentTime, duration], ([current, total]) => {
  if (!isUserSeeking.value && total > 0) {
    progressValue.value = 1000 * current / total
  }
})

// Watch for buffered time updates
watch([bufferedTime, duration], ([buffered, total]) => {
  if (!isUserSeeking.value && total > 0) {
    bufferedValue.value = 100 * buffered / total
  }
})


function onProgressMouse(isDown: boolean) {
  if (isDown) {
    startSeeking()
  } else {
    const seekToTime = Math.max(0.1, duration.value * (progressValue.value / 1000))
    stopSeeking(seekToTime)
  }
}

function onProgressChange() {
  if (isUserSeeking.value) {
    const previewTime = duration.value * (progressValue.value / 1000)
    updateSeekPreview(previewTime)
  }
}
</script>
<style scoped>
@reference "../../assets/css/tailwind.css";

.progress-container {
  @apply relative w-full opacity-[0.9] hover:opacity-100 h-2 flex items-center;
}

.appkit-slider-buffered {
  @apply absolute w-full rounded-full z-[1] bg-black/10 dark:bg-white/10 overflow-hidden h-full inset-0;
  appearance: none;
  pointer-events: none;
}

.appkit-slider {
  @apply w-full rounded-full z-[2] bg-transparent overflow-hidden h-full;
  appearance: none;
  cursor: pointer;
  outline: none;
}

.appkit-slider::-webkit-slider-thumb, .appkit-slider-buffered::-webkit-slider-thumb {
  
  -webkit-appearance: none;
  appearance: none;
  height: 0;
  width: 0;
  background-color: transparent;
  border-radius: 50%;
  box-shadow: -400px 0 0 400px black;
}
.dark .appkit-slider::-webkit-slider-thumb {
  box-shadow: -400px 0 0 400px white;
}
.dark .appkit-slider-buffered::-webkit-slider-thumb {
  box-shadow: -400px 0 0 400px #fff3;
}
.appkit-slider-buffered::-webkit-slider-thumb {
  box-shadow: -400px 0 0 400px #0003;
}

.duration_start, .duration_end {
  @apply text-xs hidden lg:block;
}

.duration_start {
  @apply text-start;
}

.duration_end {
  @apply text-end
}


</style>