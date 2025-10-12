<template>
  <NuxtPicture
    v-slot="{ isLoaded, imgAttrs }"
    format="avif,webp"
    :src="processedSrc"
    :alt="alt"
    :custom="true"
    v-bind="$attrs"
    :provider="provider"
    :key="processedSrc"
  >
  <img
    v-if="isLoaded"
    v-bind="imgAttrs"
    :alt="alt"
    src=""
  >
  <Skeleton v-else-if="showSkeleton" v-bind="imgAttrs" />
  <slot v-else name="placeholder" v-bind="imgAttrs" />
  </NuxtPicture>
</template>

<script setup lang="ts">
import { useImageProxy } from '~/lib/useImageProxy'
import { toRef } from 'vue'
import { Skeleton } from '~/components/ui/skeleton'

const props = defineProps({
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

// Make src reactive so picture updates when src changes
const srcRef = toRef(props, 'src')
const { processedSrc, provider } = useImageProxy(srcRef)
</script>
