<template>
  <NuxtPicture
    v-slot="{ isLoaded, imgAttrs }"
    format="avif,webp"
    :src="src.replace('cdn://', '/')"
    :alt="alt"
    :custom="true"
    v-bind="$attrs"
    :provider="src.startsWith('cdn://') ? 'aliyun':'ipx'"
  >
  <img
    v-if="isLoaded"
    v-bind="imgAttrs"
  >
  <Skeleton v-else-if="showSkeleton" v-bind="imgAttrs" />
  <slot v-else name="placeholder" v-bind="imgAttrs" />
  </NuxtPicture>
</template>

<script setup lang="ts">
defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: false,
    default: 'Picture',
  },
  showSkeleton: {
    type: Boolean,
    required: false,
    default: true,
  },
})
</script>
