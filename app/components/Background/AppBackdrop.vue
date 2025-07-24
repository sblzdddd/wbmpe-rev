<script setup lang="ts">
const { src, opacity, blur, height, refreshKey } = useBackground()

// Cross-fade state management
const isTransitioning = ref(false)

let lastDominator = 'A'

// Initialize values based on current state
onMounted(() => {
  const current = document.getElementById(`backdrop-A`) as HTMLImageElement
  const next = document.getElementById(`backdrop-B`) as HTMLImageElement
  if(!current || !next) return
  current.style.height = `${height.value}%`
  next.style.height = `${height.value}%`
  current.style.opacity = "0"
  next.style.opacity = "0"
  current.src = src.value
  next.src = src.value
})

watch(src, (newSrc, oldSrc) => {
  const current = document.getElementById(`backdrop-${lastDominator}`) as HTMLImageElement
  const next = document.getElementById(`backdrop-${lastDominator === 'A' ? 'B' : 'A'}`) as HTMLImageElement
  if(!current || !next) return
  current.style.opacity = opacity.value.toString()
  next.style.opacity = '0'
  if(!oldSrc) {
    current.style.height = `100%`
    next.style.height = `100%`
  }
  if (newSrc && newSrc !== oldSrc) {
    // Start cross-fade transition
    isTransitioning.value = true
    // The new image will load in the background
    next.src = newSrc
  } else if (!newSrc) {
    // No image, reset everything
    animate(current, {
      opacity: 0,
      filter: 'blur(0px)',
      duration: 500,
      easing: 'ease-in-out'
    })
    animate(next, {
      opacity: 0,
      filter: 'blur(0px)',
      duration: 500,
      easing: 'ease-in-out'
    })
  }
})

const onNextImageLoad = async (dominator: string) => {
  if (isTransitioning.value) {
    if(lastDominator === dominator) return
    await nextTick()
    const current = document.getElementById(`backdrop-${lastDominator}`) as HTMLImageElement
    const next = document.getElementById(`backdrop-${lastDominator === 'A' ? 'B' : 'A'}`) as HTMLImageElement
    if(!current || !next) return
    const timeline = createTimeline({onComplete: () => {
      lastDominator = lastDominator === 'A' ? 'B' : 'A'
      isTransitioning.value = false
    }})

    timeline.add(current, {
      opacity: 0,
      height: `${height.value}%`,
      duration: 500,
      easing: 'ease-in-out'
    },0)

    timeline.add(next, {  
      opacity: opacity.value,
      height: `${height.value}%`,
      duration: 500,
      easing: 'ease-in-out'
    },0)
  }
}

async function waitForFlagToBeFalse(checkFn: () => boolean, interval = 100) {
  while (checkFn()) {
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

watch(refreshKey, async () => {
  await waitForFlagToBeFalse(() => isTransitioning.value)
  const current = document.getElementById(`backdrop-${lastDominator}`) as HTMLImageElement
  const next = document.getElementById(`backdrop-${lastDominator === 'A' ? 'B' : 'A'}`) as HTMLImageElement
  if(refreshKey.value > 0) {
    if(!current || !next) return
    animate(current, {
      opacity: opacity.value,
      filter: `blur(${blur.value}px)`,
      scale: blur.value > 0 ? blur.value/200+1 : 1,
      height: `${height.value}%`,
      duration: 500,
      easing: 'ease-in-out'
    })
  }
})
</script>

<template>
  <!-- Current/Main background image -->
  <img
    id="backdrop-A"
    class="left-0 absolute top-0 w-full z-[-1] mask object-cover object-center"
    :style="{
      opacity: 0,
      maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 100%)',
    }"
    alt="Background"
    @load="onNextImageLoad('A')"
  >
  
  <!-- Next background image (for cross-fade transition) -->
  <img
    id="backdrop-B"
    class="left-0 absolute top-0 w-full z-[-1] mask object-cover object-center"
    :style="{
      opacity: 0,
      maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 100%)',
    }"
    alt="Background"
    @load="onNextImageLoad('B')"
  >
</template>