<script setup lang="ts">
const backgroundStore = useBackgroundStore()
const colorMode = useColorMode()

</script>

<template>
  <img 
    class="left-0 absolute top-0 w-full z-[-1] mask transition-opacity duration-500 ease-in-out object-cover object-top"
    :style="{
      height: `${backgroundStore.imageHeight}%`,
      opacity: backgroundStore.opacity * (colorMode.value === 'dark' ? 1 : 0.5),
      scale: backgroundStore.imageBlur > 0 ? backgroundStore.imageBlur/200+1 : 1,
      maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 100%)', 
      filter: `blur(${backgroundStore.imageBlur}px)`,
    }"
    :src="backgroundStore.backgroundSrc" 
    alt="Background"
    @load="backgroundStore.onImageLoad"
  >
</template>