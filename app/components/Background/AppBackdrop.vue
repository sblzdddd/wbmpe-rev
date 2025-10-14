<script setup lang="ts">

const backgroundState = useState('background', () => ({
  src: "",
  opacity: 0,
  lightOpacity: 0,
  blur: 0,
  height: 0,
  isLoaded: false,
  maskOpacity: 1,
  refreshKey: 0
}))
// Cross-fade state management
const isTransitioning = ref(false)

const colorMode = useColorMode()

let lastDominator = 'A'

const getCurrentAndNextElements = () => {
  const current = document.getElementById(`backdrop-${lastDominator}`) as HTMLImageElement
  const next = document.getElementById(`backdrop-${lastDominator === 'A' ? 'B' : 'A'}`) as HTMLImageElement
  return { current, next }
}

// Initialize values based on current state
onMounted(() => {
  const { current, next } = getCurrentAndNextElements()
  if(!current || !next) return
  current.style.height = `${backgroundState.value.height}%`
  next.style.height = `${backgroundState.value.height}%`
  current.style.opacity = "0"
  next.style.opacity = "0"
  current.src = backgroundState.value.src
  next.src = backgroundState.value.src
})

watch(() => backgroundState.value.src, (newSrc, oldSrc) => {
  const { current, next } = getCurrentAndNextElements()
  if(!current || !next) return
  current.style.opacity = backgroundState.value.opacity.toString()
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
      easing: 'ease-out'
    })
    animate(next, {
      opacity: 0,
      filter: 'blur(0px)',
      duration: 500,
      easing: 'ease-out'
    })
  }
})

const onNextImageLoad = async (dominator: string) => {
  if (isTransitioning.value) {
    if(lastDominator === dominator) return
    await nextTick()
    const { current, next } = getCurrentAndNextElements()
    if(!current || !next) return
    const timeline = createTimeline({onComplete: () => {
      lastDominator = lastDominator === 'A' ? 'B' : 'A'
      isTransitioning.value = false
    }})

    timeline.add(current, {
      filter: `blur(${backgroundState.value.blur}px)`,
      opacity: 0,
      height: `${backgroundState.value.height}%`,
      scale: backgroundState.value.blur > 0 ? backgroundState.value.blur/200+1 : 1,
      duration: 500,
      easing: 'ease-out'
    },0)

    timeline.add(next, {
      filter: `blur(${backgroundState.value.blur}px)`,
      opacity: colorMode.value === 'light' && backgroundState.value.lightOpacity > 0 ? backgroundState.value.lightOpacity : backgroundState.value.opacity,
      height: `${backgroundState.value.height}%`,
      scale: backgroundState.value.blur > 0 ? backgroundState.value.blur/200+1 : 1,
      duration: 500,
      easing: 'ease-out'
    },0)
  }
}

async function waitForFlagToBeFalse(checkFn: () => boolean, interval = 100) {
  while (checkFn()) {
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

watch(() => backgroundState.value.refreshKey, async () => {
  await waitForFlagToBeFalse(() => isTransitioning.value)
  const { current, next } = getCurrentAndNextElements()
  if(backgroundState.value.refreshKey > 0) {
    if(!current || !next) return
    animate(current, {
      opacity: colorMode.value === 'light' && backgroundState.value.lightOpacity > 0 ? backgroundState.value.lightOpacity : backgroundState.value.opacity,
      filter: `blur(${backgroundState.value.blur}px)`,
      scale: backgroundState.value.blur > 0 ? backgroundState.value.blur/200+1 : 1,
      height: `${backgroundState.value.height}%`,
      duration: 500,
      easing: 'ease-out'
    })
  }
})
</script>

<template>
  <!-- Current/Main background image -->
  <img
    id="backdrop-A"
    class="left-0 fixed top-0 w-screen z-[-1] mask object-cover object-center"
    :style="{
      maskImage: `linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, ${1- backgroundState.maskOpacity}) 100%)`,
    }"
    alt="Background"
    @load="onNextImageLoad('A')"
  >
  
  <!-- Next background image (for cross-fade transition) -->
  <img
    id="backdrop-B"
    class="left-0 fixed top-0 w-screen z-[-1] mask object-cover object-center"
    :style="{
      maskImage: `linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, ${1-backgroundState.maskOpacity}) 100%)`,
    }"
    alt="Background"
    @load="onNextImageLoad('B')"
  >
</template>

<style>
#backdrop-0, #backdrop-1 {
  transition: none;
}
</style>
