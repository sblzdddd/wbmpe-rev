<script lang="ts" setup>
import Image from '~/components/Widget/Image.vue';


defineOptions({
  name: "FullscreenLayout",
});

const colorMode = useColorMode()
</script>
<template>
  <div class="fullscreen-layout">
    <img 
      class="absolute top-0 left-0 w-full h-full z-[-2] transition-opacity duration-500 ease-in-out object-cover opacity-10 dark:opacity-60"
      :style="{ maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 75%)' }"
      src="/images/bg.jpg"
    >
    <div class="absolute top-0 left-[20vh] w-[100vh] opacity-20 z-[-1] rotate-90" style="transform-origin: top left;">
      <Image v-if="colorMode.value === 'dark'" src="/images/logo/logo-dark_1024.png" img-class="w-full" alt="logo" />
      <Image v-else src="/images/logo/logo-light_1024.png" img-class="w-full" alt="logo" />
    </div>
    <slot />
  </div>
</template>
<style lang="postcss">
.fullscreen-layout {
  width: 100%;
  height: 100%;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.15s ease-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.page-enter-from {
  transform: translateX(30px);
}

.page-wrapper {
  width: 100%;
  height: 100%;
}
</style>
