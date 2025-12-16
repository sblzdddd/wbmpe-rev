<template>
  <NuxtImg
    v-slot="{ isLoaded, imgAttrs }"
    :src="src"
    :alt="alt"
    :custom="true"
    v-bind="$attrs"
    :key="src"
  >
    <img
      v-if="isLoaded"
      v-bind="imgAttrs"
      :alt="alt"
      src=""
    >
    <Skeleton v-else-if="showSkeleton" v-bind="imgAttrs" />
    <slot v-else name="placeholder" v-bind="imgAttrs" />
  </NuxtImg>
</template>

<script setup lang="ts">
import {Skeleton} from "~/components/ui/skeleton";
import { toRef } from 'vue'

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
