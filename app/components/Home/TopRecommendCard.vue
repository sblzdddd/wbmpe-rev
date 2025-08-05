<!-- eslint-disable vue/first-attribute-linebreak -->
<template>      
  <Card class="bg-white/70 dark:bg-muted/70 rounded-xl gap-1 pt-4 px-0 pb-3" v-bind="$attrs">
    <CardHeader class="flex justify-between items-center">
      <div>
        <CardTitle>Good afternoon, Bitch!</CardTitle>
        <CardDescription class="mt-0.5">Recover Last Session: </CardDescription>
      </div>
      <div class="flex flex-row items-center gap-2">
        <Button variant="ghost" size="icon" class="!rounded-full p-0" @click="handlePrev">
          <Icon name="lucide:chevron-left" size="20" />
        </Button>
        <Button variant="ghost" size="icon" class="!rounded-full p-0" @click="handleNext">
          <Icon name="lucide:chevron-right" size="20" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="grow px-0">
      <div ref="topRecomRef" class="top-recom relative h-full overflow-hidden mx-4 px-2">
        <div class="top-recom__container flex grow py-3 gap-4">
          <NuxtLink v-for="item in data" :key="item.title" :to="item.link"
                class="top-recom__slide" :class="itemClass"
                :style="`background-image: url(${item.image})`">
            <CardHeader class="p-2 w-full h-full relative">
              <span class="absolute top-0 left-0 w-full h-full bg-black/50" style="mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2) 100%);" />
              <CardTitle class="text-white text-xs z-10">{{ item.title }}</CardTitle>
              <Icon name="lucide:play" class="text-white mt-auto ml-auto" />
            </CardHeader>
          </NuxtLink>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'

const itemClass = `bg-cover bg-center min-w-20 h-20 relative
cursor-pointer hover:scale-120 active:scale-110 transition-all duration-200 rounded-sm p-0 overflow-hidden`

defineProps({
  data: {
    type: Array as PropType<CardRecom[]>,
    required: true,
  }
})

const [topRecomRef, emblaApi] = emblaCarouselVue({dragFree: true})

const handlePrev = () => {
  if(emblaApi.value) {
    emblaApi.value.scrollPrev()
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
    emblaApi.value.scrollNext()
  }
}
</script>
<style scoped>
.top-recom {
  overflow: hidden;
}
</style>