<script setup lang="ts">
import type { ExploreResponse } from '~/types/explore'
import RecommendItem from '~/components/Home/RecommendRow.vue'

const { data: exploreData } = await useFetch<ExploreResponse>('/api/explore', {
  default: () => ({
    data: {
      categories: [],
      items: []
    }
  })
})

const { paddingClass } = useContentPadding()
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class=" my-4 xl:my-6 w-full flex gap-2" :class="paddingClass">
      <NuxtLink v-for="item in exploreData?.data?.categories" :key="item" :to="`?category=${item}`">
        <Button size="sm" variant="secondary" :class="{'bg-white text-black hover:bg-white/80': $route.query.category === item}">
          {{ item }}
        </Button>
      </NuxtLink>
    </div>
    <div v-for="item in exploreData?.data?.items" :key="item.title" class="recom-item w-full grid grid-cols-1">
      <RecommendItem :data="item" />
    </div>
  </div>
</template>
