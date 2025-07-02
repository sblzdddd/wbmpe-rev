<script setup lang="ts">
import { useBackground } from '@/composables/useBackground'

const { backgroundSrc, opacity, onImageLoad, imageBlur, imageHeight } = useBackground()
const colorMode = useColorMode()

</script>

<template>
  <img 
    class="left-0 absolute top-0 w-full z-[-1] mask transition-opacity duration-500 ease-in-out object-cover object-top"
    :style="{
      height: `${imageHeight}%`,
      opacity: opacity * (colorMode.preference === 'dark' ? 1 : 0.5),
      scale: imageBlur > 0 ? imageBlur/200+1 : 1,
      maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 100%)', 
      filter: `blur(${imageBlur}px)`,
    }"
    :src="backgroundSrc" 
    alt="Background"
    @load="onImageLoad"
  >
</template>