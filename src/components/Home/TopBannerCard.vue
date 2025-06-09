<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div ref="bannerRef" class="banner relative overflow-hidden" v-bind="$attrs">
    <div class="banner__container">
      <Card v-for="item in banner" :key="item.title" :to="item.link"
            class="banner__slide h-full bg-cover bg-center mx-2 p-3 relative cursor-pointer"
            :style="`background-image: url(${item.image})`">
        <div class="banner__overlay absolute inset-0 hover:bg-black/50 transition-all duration-200 rounded-xl"/>
        <CardFooter class="px-1 mt-auto z-[10]">
          <CardTitle class="text-white">{{ item.title }}</CardTitle>
        </CardFooter>
      </Card>
    </div>
    <div
        class="banner__dots absolute bottom-1.5 right-2 flex justify-center px-3 py-2 gap-2 rounded-lg hover:bg-black/50 transition-all duration-200">
      <div v-for="item in banner" :key="item.title"
           class="banner__dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200 cursor-pointer" :class="{}"/>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Banner } from '@/types/home'
import emblaCarouselVue from 'embla-carousel-vue'
import type {EmblaCarouselType} from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'

defineProps({
  banner: {
    type: Array as PropType<Banner[]>,
    required: true,
  }
})

const [bannerRef, emblaApi] = emblaCarouselVue({loop: true}, [Autoplay({delay: 5000})])

const toggleDotBtnsActive = (emblaApi: EmblaCarouselType) => {
  const previous = emblaApi.previousScrollSnap()
  const selected = emblaApi.selectedScrollSnap()
  const dotNodes = document.querySelectorAll('.banner__dot')
  dotNodes[previous].classList.remove('!bg-white')
  dotNodes[selected].classList.add('!bg-white')
}

onMounted(() => {
  if (emblaApi.value) emblaApi.value
    .on('init', toggleDotBtnsActive)
    .on('reInit', toggleDotBtnsActive)
    .on('select', toggleDotBtnsActive)
  const dotNodes = Array.from(document.querySelectorAll('.banner__dot'))
  dotNodes.forEach((dotNode, index) => {
    dotNode.addEventListener('mouseover', () => emblaApi.value?.scrollTo(index), false)
  })
})
</script>
<style scoped>

.banner__container {
  display: flex;
  height: 100%;
}

.banner__slide {
  flex: 0 0 100%;
  min-width: 0;
}
</style>