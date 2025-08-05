<template>
  <NuxtImg
    v-slot="{ isLoaded, imgAttrs }"
    :src="processedSrc"
    :alt="alt"
    :custom="true"
    v-bind="$attrs"
    :provider="provider"
  >
    <img
      v-if="isLoaded"
      v-bind="imgAttrs"
    >
    <Skeleton v-else-if="showSkeleton" v-bind="imgAttrs" />
    <slot v-else name="placeholder" v-bind="imgAttrs" />
  </NuxtImg>
</template>

<script setup lang="ts">
import { useImageProxy } from '~/lib/useImageProxy'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  showSkeleton: {
    type: Boolean,
    required: false,
    default: true,
  },
})

const { processedSrc, provider } = useImageProxy(props.src)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
