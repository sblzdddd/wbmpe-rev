<template>
  <NuxtPicture
    v-slot="{ isLoaded, imgAttrs }"
    format="avif,webp"
    :src="processedSrc"
    :alt="alt"
    :custom="true"
    v-bind="$attrs"
    :provider="provider"
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
import {Skeleton} from "~/components/ui/skeleton";

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

const { processedSrc, provider } = useImageProxy(props.src)
</script>
