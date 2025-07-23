<script setup lang="ts">
import TopBanner from "~/components/Home/TopBannerCard.vue";
import TopRecommend from "~/components/Home/TopRecommendCard.vue";
import RecommendItem from '~/components/Home/RecommendRow.vue'
import { useContentPadding } from '~/composables/useContentPadding'
import type { HomeResponse } from '~~/types/Home'

const { data: homeData } = await useFetch<HomeResponse>('/api/home', {
  default: () => ({
    data: {
      banner: [],
      card_recom: [],
      recom: [],
      categories: []
    }
  })
})
const { paddingClass } = useContentPadding()

</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="flex gap-4 mt-6 mb-16 justify-start" :class="paddingClass">
      <TopBanner :banner="homeData?.data?.banner" class="h-full w-full max-w-md banner !rounded-xl shadow-sm overflow-hidden relative" />
      <TopRecommend :data="homeData?.data?.card_recom" class="h-44 w-full max-w-md" />
    </div>
    <div v-for="item in homeData?.data?.recom" :key="item.title" class="recom-item w-full grid grid-cols-1">
      <RecommendItem :data="item" />
    </div>
  </div>
</template>