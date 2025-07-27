<template>
  <div class="recom-item mb-4 md:mb-16">
    <div class="flex flex-row justify-between items-center mb-4">
      <div class="recom-item__title text-lbase md:text-3xl font-bold ml-3 md:ml-0">{{ data.title }}</div>
      <div class=" hidden md:flex flex-row gap-2">
        <Button variant="outline" class="rounded-full h-10 px-4 py-0">
          <Icon name="lucide:expand" size="16" /> View All
        </Button>
        <Button variant="outline" class="rounded-full h-10 w-10 p-0" @click="handlePrev">
          <Icon name="lucide:chevron-left" size="20" />
        </Button>
        <Button variant="outline" class="rounded-full h-10 w-10 p-0" @click="handleNext">
          <Icon name="lucide:chevron-right" size="20" />
        </Button>
      </div>
    </div>
    <section ref="carouselRef" class="carousel grow pr-3 md:py-3 overflow-hidden">
      <div class="carousel__container flex gap-2 md:gap-7 px-3">
        <NuxtLink v-for="item in data.items" :key="item.title" :to="item.link" :class="recom_item_class" class="carousel__slide">
          <Picture :src="item.image" :alt="item.title" :img-attrs="{class: 'w-full h-full aspect-square object-cover rounded-sm'}" :modifiers="{resize: {s: 256}}" />
          <div class="pt-0 pb-0 flex flex-col items-start">
            <CardTitle class="mb-1 text-sm md:text-base">{{ item.title }}</CardTitle>
            <CardDescription class="text-xs md:text-sm">{{ item.artist }}</CardDescription>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import type { Recom } from '#types/Home'


const recom_item_class= `
min-w-40 md:min-w-48 recom-item__item flex flex-col gap-3 py-0 relative cursor-pointer active:scale-[0.97] active:opacity-70 transition-all duration-100 ease-out
before:content-[''] before:absolute before:rounded-xl before:inset-0 before:z-[-1] before:bg-accent/70
before:scale-90 before:opacity-0 hover:before:scale-110 hover:before:opacity-100 before:transition-all before:duration-100 before:ease-out
`

const [carouselRef, emblaApi] = emblaCarouselVue({dragFree: true})

const handlePrev = () => {
  if(emblaApi.value) {
    emblaApi.value.scrollPrev()
    emblaApi.value.scrollPrev()
    emblaApi.value.scrollPrev()
  }
}

const handleNext = () => {
  if(emblaApi.value) {
    emblaApi.value.scrollNext()
    emblaApi.value.scrollNext()
    emblaApi.value.scrollNext()
  }
}

defineProps({
  data: {
    type: Object as PropType<Recom>,
    required: true,
  },
});
</script>
<style scoped>
/* @referece "../../assets/css/tailwind.css" */
</style>