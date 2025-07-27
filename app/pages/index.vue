<script setup lang="ts">
import TopBanner from "~/components/Home/TopBannerCard.vue";
import TopRecommend from "~/components/Home/TopRecommendCard.vue";
import RecommendItem from '~/components/Home/RecommendRow.vue'
import type { HomeResponse } from '~~/types/Home'
import type { SEOData } from '#types/Utils/SEO';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Home - WBMPE Rev'
seoData.value.description = 'Home - WBMPE Rev'
seoData.value.ogTitle = 'Home - WBMPE Rev'

const { data: homeData } = await useFetch<HomeResponse>('/api/home', {
  key: 'home-page',
  default: () => ({
    data: {
      banner: [],
      card_recom: [],
      recom: [],
      categories: []
    }
  })
})

</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="flex gap-4 mt-6 mb-6 md:mb-16 justify-start h-44">
      <TopBanner :banner="homeData?.data?.banner" class="w-full max-w-md banner !rounded-xl shadow-sm overflow-hidden relative" />
      <TopRecommend :data="homeData?.data?.card_recom" class="hidden md:flex w-full max-w-md" />
    </div>
    <div v-for="item in homeData?.data?.recom" :key="item.title" class="recom-item w-full grid grid-cols-1">
      <RecommendItem :data="item" />
    </div>
  </div>
</template>