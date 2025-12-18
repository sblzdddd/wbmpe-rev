<template>
  <div class="recom-item mb-4 md:mb-16">
    <div class="flex flex-row justify-between items-center mb-4">
      <div class="recom-item__title text-lbase md:text-3xl font-bold ml-3 md:ml-0">{{ data.title }}</div>
      <div class=" hidden md:flex flex-row gap-2">
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
        <EntityCard v-for="item in data.items" :image="item.image" :href="item.link" :title="item.title" :sub-title="item.artist" />
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import Button from '../ui/button/Button.vue'
import EntityCard from "~/components/Widget/EntityCard.vue";


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