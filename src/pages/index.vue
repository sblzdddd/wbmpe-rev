<script setup lang="ts">
import {Card, CardTitle} from '@/components/ui/card'
import TopBanner from "~/components/Home/TopBannerCard.vue";
import TopRecommend from "~/components/Home/TopRecommendCard.vue";
import RecommendItem from '~/components/Home/RecommendRow.vue'
import { useContentPadding } from '~/composables/useContentPadding'
import type { HomeResponse } from '~/types/home'

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
    <div class="grid grid-cols-5 gap-4 mt-6 mb-16" :class="paddingClass">
      <TopBanner :banner="homeData?.data?.banner" class="h-full col-span-5 xl:col-span-2 banner !rounded-xl shadow-sm overflow-hidden relative" />
      <TopRecommend :data="homeData?.data?.card_recom" class="h-44 col-span-5 lg:col-span-3 xl:col-span-2" />
      <Card class="bg-white/70 dark:bg-muted/70 rounded-xl hidden lg:block lg:col-span-2 xl:col-span-1 p-4">
        <CardHeader class="px-0">
          <CardTitle>Total Time:</CardTitle>
        </CardHeader>
        <CardContent class="grow px-0 pb-10 h-full flex items-center justify-center">
          <h1 class="text-4xl font-bold">20h</h1>
        </CardContent>
      </Card>
    </div>
    <div v-for="item in homeData?.data?.recom" :key="item.title" class="recom-item w-full grid grid-cols-1">
      <RecommendItem :data="item" />
    </div>
  </div>
</template>