<template>
  <NuxtImg
  v-slot="{ src, isLoaded, imgAttrs }"
  :src="src"
  :alt="alt"
  :custom="true"
  v-bind="$attrs"
  >
  <img
    v-if="isLoaded"
    v-bind="imgAttrs"
    :class="imgClass"
    :src="src"
  >
  <Skeleton v-else :class="imgClass" />
  </NuxtImg>
</template>

<script setup lang="ts">
defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  imgClass: {
    type: String,
    default: '',
  },
})
</script>
