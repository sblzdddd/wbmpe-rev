<script lang="ts" setup>
import Image from '~/components/Image.vue';
import Button from '~/components/ui/button/Button.vue';
import ThemeSwitcher from '~/components/Widget/ThemeSwitcher.vue';


defineOptions({
  name: "FullscreenLayout",
});

const opacity = ref(0)

const colorMode = useColorMode()
const router = useRouter()

// Create a computed that safely handles SSR
const logoSrc = computed(() => {
  return colorMode.value === 'dark' 
    ? '/images/logo/logo-dark_1024.png' 
    : '/images/logo/logo-light_1024.png'
})
</script>
<template>
  <div class="fullscreen-layout">
    <img 
      class="absolute top-0 left-0 w-full h-full z-[-2] transition-opacity duration-500 ease-in-out object-cover opacity-10 dark:opacity-60"
      :style="{ maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 100%)' }"
      src="/images/bg.jpg"
      alt="background image"
    >
    <div :style="{ opacity: opacity }" class="absolute top-0 left-[20vh] w-[100vh] z-[-1] rotate-90 transition-opacity duration-1000 ease-in-out" style="transform-origin: top left;">
      <ClientOnly fallback-tag="div">
        <Image :src="logoSrc" img-class="w-full" alt="logo" @load="opacity = 0.2" />
        <template #fallback>
          <!-- Fallback for SSR - use a neutral logo -->
          <Image src="/images/logo/logo-light_1024.png" img-class="w-full" alt="logo" @load="opacity = 0.2" />
        </template>
      </ClientOnly>
    </div>
    <div class="absolute top-0 left-0 flex p-4 gap-2">
      <Button variant="ghost" size="icon" class="w-10 h-10" @click="router.push('/')">
        <Icon name="lucide:home" size="20" />
      </Button>
      <ThemeSwitcher icon-size="20" class="w-10 h-10" />
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

.layout-enter-active,
.layout-leave-active {
  transition: all 0.15s ease-out;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
