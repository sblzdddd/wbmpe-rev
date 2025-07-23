<template>
  <div class="recom-item mb-16">
    <div class="flex flex-row justify-between items-center mb-4" :class="paddingClass">
      <div class="recom-item__title text-3xl font-bold">{{ data.title }}</div>
      <div class="flex flex-row gap-2">
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
    <section ref="carouselRef" class="carousel grow overflow-hidden py-3" :class="open ?'mx-0 md:mx-1 lg:mx-4 xl:mx-7 px-3' : 'mx-0 md:mx-1 lg:mx-7 xl:mx-[100px] px-3'">
      <div class="carousel__container flex gap-7">
        <NuxtLink v-for="item in data.items" :key="item.title" :to="item.link" :class="recom_item_class" class="carousel__slide">
          <Image :src="item.image" :alt="item.title" img-class="w-full h-full aspect-square object-cover rounded-sm" />
          <div class="pt-0 pb-0 flex flex-col items-start">
            <CardTitle class="mb-1">{{ item.title }}</CardTitle>
            <CardDescription>{{ item.artist }}</CardDescription>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { useSidebar } from '#shadcn/sidebar'
import type { Recom } from '#types/Home'


const {open} = useSidebar()

const {paddingClass} = useContentPadding()

const recom_item_class= `
min-w-48 recom-item__item flex flex-col gap-3 py-0 relative cursor-pointer active:scale-[0.97] active:opacity-70 transition-all duration-100 ease-out
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