<script setup lang="ts">

defineProps({
  image: String,
  title: String,
  subTitle: String,
  href: String,
  imgClass: {
    type: String,
    default: "!size-50"
  }
})

const recom_item_class= `
recom-item__item flex flex-col gap-3 py-0 relative cursor-pointer active:scale-[0.97] active:opacity-70 transition-all duration-100 ease-out
before:content-[''] before:absolute before:rounded-xl before:inset-0 before:z-[-1] before:bg-accent/70
before:scale-90 before:opacity-0 hover:before:scale-110 hover:before:opacity-100 before:transition-all before:duration-100 before:ease-out
`
</script>

<template>
  <NuxtLink :key="title" :to="href" :class="recom_item_class"
            class="carousel__slide">
    <Picture v-if="image" :src="image" :alt="title"
             :class="imgClass" class="overflow-hidden rounded-sm"
             :img-attrs="{class: 'w-full h-full aspect-square object-cover'}"
             :modifiers="{resize: {s: 256}}"/>
             
    <div v-else :class="imgClass" class="w-full h-full aspect-square flex items-center justify-center text-muted-foreground">
      <Icon name="lucide:music" size="32" />
    </div>
    <div class="pt-0 pb-0 flex flex-col items-start">
      <CardTitle class="mb-1 text-sm md:text-base clamp-2">{{ title }}</CardTitle>
      <CardDescription class="text-xs md:text-sm clamp-2">{{ subTitle }}</CardDescription>
    </div>
  </NuxtLink>
</template>

<style scoped>
.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>